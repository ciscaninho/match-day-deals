
-- ============================================================
-- LM3.1 — Admin Football Operations Fix
-- ============================================================

-- 1) Allow 'archived' and 'hidden' publication status on leagues
ALTER TABLE public.league_publication
  DROP CONSTRAINT IF EXISTS league_publication_publication_status_check;
ALTER TABLE public.league_publication
  ADD CONSTRAINT league_publication_publication_status_check
  CHECK (publication_status = ANY (ARRAY['draft','internal_review','verified','published','archived','hidden']));

-- 2) New columns
ALTER TABLE public.league_publication
  ADD COLUMN IF NOT EXISTS expected_club_count integer;
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS conference text;

-- 3) Backfill expected club counts
UPDATE public.league_publication SET expected_club_count = CASE lower(slug)
  WHEN 'premier-league'      THEN 20
  WHEN 'la-liga'             THEN 20
  WHEN 'serie-a'             THEN 20
  WHEN 'bundesliga-de'       THEN 18
  WHEN 'ligue-1'             THEN 18
  WHEN 'eredivisie'          THEN 18
  WHEN 'jupiler-pro-league'  THEN 16
  WHEN 'liga-portugal'       THEN 18
  WHEN 'mls-us'              THEN 30
  WHEN 'championship-eng'    THEN 24
  WHEN '2-bundesliga'        THEN 18
  WHEN 'ligue-2'             THEN 18
  WHEN 'serie-b'             THEN 20
  WHEN 'segunda-divisi-n'    THEN 22
  WHEN 's-per-lig'           THEN 18
  WHEN 'premiership'         THEN 12
  WHEN 'super-league-ch'     THEN 12
  WHEN 'super-league-gr'     THEN 14
  WHEN 'allsvenskan'         THEN 16
  WHEN 'eliteserien'         THEN 16
  WHEN 'superliga-dk'        THEN 12
  WHEN 'ekstraklasa'         THEN 18
  WHEN 'czech-first-league'  THEN 16
  WHEN 'nb-i'                THEN 12
  WHEN 'hnl'                 THEN 10
  WHEN 'saudi-pro-league'    THEN 18
  ELSE expected_club_count
END;

-- 4) Repair fn_archive_league
CREATE OR REPLACE FUNCTION public.fn_archive_league(p_league_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE l public.league_publication%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  SELECT * INTO l FROM public.league_publication WHERE id = p_league_id;
  IF l.id IS NULL THEN RAISE EXCEPTION 'league_not_found'; END IF;
  UPDATE public.league_publication
     SET archived_at = COALESCE(archived_at, now()),
         archived_reason = COALESCE(NULLIF(btrim(p_reason),''), archived_reason, 'Archived from admin'),
         is_active = false, publication_status = 'archived', updated_at = now()
   WHERE id = p_league_id;
  RETURN jsonb_build_object('id', l.id, 'slug', l.slug, 'name', l.league_name, 'archived', true);
END;
$function$;

-- 5) Repair fn_merge_leagues — handle season slug collisions
CREATE OR REPLACE FUNCTION public.fn_merge_leagues(p_target_id uuid, p_source_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  tgt public.league_publication%ROWTYPE;
  src public.league_publication%ROWTYPE;
  clubs_moved int := 0;
  ticketing_moved int := 0;
  seasons_moved int := 0;
  seasons_dropped int := 0;
  merged_aliases text[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF p_target_id = p_source_id THEN RAISE EXCEPTION 'same_league'; END IF;

  SELECT * INTO tgt FROM public.league_publication WHERE id = p_target_id AND archived_at IS NULL;
  IF tgt.id IS NULL THEN RAISE EXCEPTION 'target_not_found_or_archived'; END IF;

  SELECT * INTO src FROM public.league_publication WHERE id = p_source_id;
  IF src.id IS NULL THEN RAISE EXCEPTION 'source_not_found'; END IF;
  IF src.archived_at IS NOT NULL THEN RAISE EXCEPTION 'source_already_archived'; END IF;

  UPDATE public.clubs SET primary_league_id = tgt.id, updated_at = now()
   WHERE primary_league_id = src.id;
  GET DIAGNOSTICS clubs_moved = ROW_COUNT;

  UPDATE public.club_ticketing_profiles SET league = tgt.league_name, updated_at = now()
   WHERE league = src.league_name;
  GET DIAGNOSTICS ticketing_moved = ROW_COUNT;

  -- Move memberships from source seasons into matching target seasons (by slug), then drop the colliding source season.
  WITH moved AS (
    UPDATE public.league_season_clubs lsc
       SET season_id = ts.id
      FROM public.seasons ss
      JOIN public.seasons ts ON ts.league_id = tgt.id AND ts.season_slug = ss.season_slug
     WHERE ss.league_id = src.id AND lsc.season_id = ss.id
    RETURNING lsc.id
  ) SELECT 0; -- materialize

  -- Delete source seasons that collide with an existing target season slug
  DELETE FROM public.seasons ss
   WHERE ss.league_id = src.id
     AND EXISTS (SELECT 1 FROM public.seasons ts WHERE ts.league_id = tgt.id AND ts.season_slug = ss.season_slug);
  GET DIAGNOSTICS seasons_dropped = ROW_COUNT;

  -- Re-point any remaining (non-colliding) source seasons to the target
  UPDATE public.seasons SET league_id = tgt.id, updated_at = now() WHERE league_id = src.id;
  GET DIAGNOSTICS seasons_moved = ROW_COUNT;

  SELECT COALESCE(array_agg(DISTINCT x), '{}'::text[]) INTO merged_aliases
    FROM unnest(COALESCE(tgt.aliases,'{}'::text[]) || COALESCE(src.aliases,'{}'::text[]) || ARRAY[src.league_name, src.slug]) x
   WHERE NULLIF(btrim(x),'') IS NOT NULL
     AND lower(btrim(x)) <> lower(btrim(tgt.league_name));

  UPDATE public.league_publication SET aliases = merged_aliases, updated_at = now() WHERE id = tgt.id;

  UPDATE public.league_publication
     SET archived_at = now(),
         archived_reason = COALESCE(NULLIF(btrim(p_reason),''), 'Merged into ' || tgt.slug),
         is_active = false, publication_status = 'archived', updated_at = now()
   WHERE id = src.id;

  RETURN jsonb_build_object(
    'target', jsonb_build_object('id', tgt.id, 'name', tgt.league_name, 'slug', tgt.slug),
    'source', jsonb_build_object('id', src.id, 'name', src.league_name, 'slug', src.slug),
    'clubs_moved', clubs_moved, 'ticketing_moved', ticketing_moved,
    'seasons_moved', seasons_moved, 'seasons_dropped', seasons_dropped,
    'aliases', to_jsonb(merged_aliases)
  );
END;
$function$;

-- 6) Eerste Divisie (NL div 2)
INSERT INTO public.league_publication
  (slug, league_name, country, country_id, continent, division_level, tier_level, gender, league_type, publication_status, is_active, expected_club_count)
SELECT 'eerste-divisie', 'Eerste Divisie', 'Netherlands',
       'fbfa7d59-0a4c-4efb-a64a-5d2d5ec610de'::uuid,
       'Europe', 2, 2, 'men', 'domestic_league', 'draft', true, 20
WHERE NOT EXISTS (SELECT 1 FROM public.league_publication WHERE slug='eerste-divisie');

WITH ed AS (SELECT id FROM public.league_publication WHERE slug='eerste-divisie')
UPDATE public.clubs c SET primary_league_id = (SELECT id FROM ed), updated_at = now()
 WHERE c.slug IN ('jong-ajax','jong-az','jong-fc-utrecht');

WITH ed AS (SELECT id FROM public.league_publication WHERE slug='eerste-divisie')
INSERT INTO public.clubs (slug, club_name, display_name, official_name, country_id, primary_league_id, club_type, publication_status)
SELECT 'jong-psv','Jong PSV','Jong PSV','Jong PSV',
       'fbfa7d59-0a4c-4efb-a64a-5d2d5ec610de'::uuid,
       (SELECT id FROM ed), 'identity_only', 'draft'
WHERE NOT EXISTS (SELECT 1 FROM public.clubs WHERE slug='jong-psv');

-- 7) Merge Primera Division (Spain) → La Liga
DO $$
DECLARE src uuid; tgt uuid; src_name text;
BEGIN
  SELECT id, league_name INTO src, src_name FROM public.league_publication WHERE slug='primera-division';
  SELECT id INTO tgt FROM public.league_publication WHERE slug='la-liga';
  IF src IS NOT NULL AND tgt IS NOT NULL AND src <> tgt THEN
    UPDATE public.clubs SET primary_league_id = tgt, updated_at = now() WHERE primary_league_id = src;
    UPDATE public.club_ticketing_profiles SET league = 'La Liga', updated_at = now() WHERE league = src_name;

    UPDATE public.league_season_clubs lsc
       SET season_id = ts.id
      FROM public.seasons ss
      JOIN public.seasons ts ON ts.league_id = tgt AND ts.season_slug = ss.season_slug
     WHERE ss.league_id = src AND lsc.season_id = ss.id;
    DELETE FROM public.seasons ss WHERE ss.league_id = src
      AND EXISTS (SELECT 1 FROM public.seasons ts WHERE ts.league_id = tgt AND ts.season_slug = ss.season_slug);
    UPDATE public.seasons SET league_id = tgt, updated_at = now() WHERE league_id = src;

    UPDATE public.league_publication
       SET aliases = COALESCE(aliases,'{}') || ARRAY['Primera Division','primera-division','La Liga Santander']
     WHERE id = tgt;
    UPDATE public.league_publication
       SET archived_at = now(), archived_reason = 'Merged into la-liga (LM3.1)',
           is_active = false, publication_status = 'archived', updated_at = now()
     WHERE id = src;
  END IF;
END $$;

-- 8) Merge MLS-CA → MLS-US
DO $$
DECLARE src uuid; tgt uuid;
BEGIN
  SELECT id INTO src FROM public.league_publication WHERE slug='mls-ca';
  SELECT id INTO tgt FROM public.league_publication WHERE slug='mls-us';
  IF src IS NOT NULL AND tgt IS NOT NULL THEN
    UPDATE public.clubs SET primary_league_id = tgt, updated_at = now() WHERE primary_league_id = src;
    UPDATE public.league_season_clubs lsc
       SET season_id = ts.id
      FROM public.seasons ss
      JOIN public.seasons ts ON ts.league_id = tgt AND ts.season_slug = ss.season_slug
     WHERE ss.league_id = src AND lsc.season_id = ss.id;
    DELETE FROM public.seasons ss WHERE ss.league_id = src
      AND EXISTS (SELECT 1 FROM public.seasons ts WHERE ts.league_id = tgt AND ts.season_slug = ss.season_slug);
    UPDATE public.seasons SET league_id = tgt, updated_at = now() WHERE league_id = src;
    UPDATE public.league_publication
       SET archived_at = now(), archived_reason = 'Merged into mls-us (LM3.1)',
           is_active = false, publication_status = 'archived', updated_at = now()
     WHERE id = src;
  END IF;
END $$;

UPDATE public.league_publication
   SET aliases = COALESCE(aliases,'{}') || ARRAY['Major League Soccer','mls-us','mls-ca']
 WHERE slug='mls-us';

-- 9) Add missing MLS club: Portland Timbers
INSERT INTO public.clubs
  (slug, club_name, display_name, official_name, country_id, primary_league_id, club_type, publication_status, conference)
SELECT 'portland-timbers','Portland Timbers','Portland Timbers','Portland Timbers',
       '2699a4fa-a3e9-493d-ab98-ccfa3d6be25e'::uuid,
       (SELECT id FROM public.league_publication WHERE slug='mls-us'),
       'identity_only','draft','West'
WHERE NOT EXISTS (SELECT 1 FROM public.clubs WHERE slug='portland-timbers');

-- 10) Archive NFL, UCL, placeholders
UPDATE public.league_publication
   SET archived_at = COALESCE(archived_at, now()),
       archived_reason = COALESCE(archived_reason, 'Archived in LM3.1 cleanup'),
       is_active = false, publication_status = 'archived', updated_at = now()
 WHERE archived_at IS NULL
   AND (slug = 'nfl' OR slug = 'uefa-champions-league' OR slug LIKE 'placeholder-%');

-- 11) MLS conferences
UPDATE public.clubs SET conference='West', updated_at=now()
 WHERE slug IN ('austin-fc','colorado-rapids','fc-dallas','houston-dynamo','la-galaxy','lafc',
                'minnesota-united','portland-timbers','real-salt-lake','san-diego-fc',
                'san-jose-earthquakes','seattle-sounders','sporting-kansas-city',
                'st-louis-city-sc','vancouver-whitecaps')
   AND conference IS NULL;

UPDATE public.clubs SET conference='East', updated_at=now()
 WHERE slug IN ('atlanta-united','cf-montreal','charlotte-fc','chicago-fire-fc','columbus-crew',
                'd-c-united','fc-cincinnati','inter-miami','nashville-sc','new-england-revolution',
                'new-york-red-bulls','nycfc','orlando-city-sc','philadelphia-union','toronto-fc')
   AND conference IS NULL;
