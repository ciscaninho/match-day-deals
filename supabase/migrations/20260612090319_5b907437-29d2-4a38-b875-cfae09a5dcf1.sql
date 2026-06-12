
-- LM3.5: Add display_name / official_name to clubs, plus league merge / archive helpers

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS official_name text;

-- Backfill so existing data has both fields populated
UPDATE public.clubs
   SET display_name  = COALESCE(display_name, club_name),
       official_name = COALESCE(official_name, club_name)
 WHERE display_name IS NULL OR official_name IS NULL;

-- Merge league: move all clubs from source league into target, archive source
CREATE OR REPLACE FUNCTION public.fn_merge_leagues(
  p_target_id uuid,
  p_source_id uuid,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  tgt public.league_publication%ROWTYPE;
  src public.league_publication%ROWTYPE;
  clubs_moved int := 0;
  ticketing_moved int := 0;
  seasons_moved int := 0;
  merged_aliases text[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF p_target_id = p_source_id THEN RAISE EXCEPTION 'same_league'; END IF;

  SELECT * INTO tgt FROM public.league_publication WHERE id = p_target_id AND archived_at IS NULL;
  IF tgt.id IS NULL THEN RAISE EXCEPTION 'target_not_found'; END IF;

  SELECT * INTO src FROM public.league_publication WHERE id = p_source_id;
  IF src.id IS NULL THEN RAISE EXCEPTION 'source_not_found'; END IF;
  IF src.archived_at IS NOT NULL THEN RAISE EXCEPTION 'source_already_archived'; END IF;

  UPDATE public.clubs
     SET primary_league_id = tgt.id, updated_at = now()
   WHERE primary_league_id = src.id;
  GET DIAGNOSTICS clubs_moved = ROW_COUNT;

  UPDATE public.club_ticketing_profiles
     SET league = tgt.league_name, updated_at = now()
   WHERE league = src.league_name;
  GET DIAGNOSTICS ticketing_moved = ROW_COUNT;

  UPDATE public.seasons
     SET league_id = tgt.id, updated_at = now()
   WHERE league_id = src.id;
  GET DIAGNOSTICS seasons_moved = ROW_COUNT;

  SELECT COALESCE(array_agg(DISTINCT x), '{}'::text[]) INTO merged_aliases
    FROM unnest(
      COALESCE(tgt.aliases, '{}'::text[])
      || COALESCE(src.aliases, '{}'::text[])
      || ARRAY[src.league_name, src.slug]
    ) x
   WHERE NULLIF(btrim(x), '') IS NOT NULL
     AND lower(btrim(x)) <> lower(btrim(tgt.league_name));

  UPDATE public.league_publication
     SET aliases = merged_aliases, updated_at = now()
   WHERE id = tgt.id;

  UPDATE public.league_publication
     SET archived_at = now(),
         archived_reason = COALESCE(NULLIF(btrim(p_reason), ''), 'Merged into ' || tgt.slug),
         is_active = false,
         publication_status = 'archived',
         updated_at = now()
   WHERE id = src.id;

  RETURN jsonb_build_object(
    'target', jsonb_build_object('id', tgt.id, 'name', tgt.league_name, 'slug', tgt.slug),
    'source', jsonb_build_object('id', src.id, 'name', src.league_name, 'slug', src.slug),
    'clubs_moved', clubs_moved,
    'ticketing_moved', ticketing_moved,
    'seasons_moved', seasons_moved,
    'aliases', to_jsonb(merged_aliases)
  );
END;
$fn$;

-- Archive a league (no deletion)
CREATE OR REPLACE FUNCTION public.fn_archive_league(
  p_league_id uuid,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  l public.league_publication%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  SELECT * INTO l FROM public.league_publication WHERE id = p_league_id;
  IF l.id IS NULL THEN RAISE EXCEPTION 'league_not_found'; END IF;

  UPDATE public.league_publication
     SET archived_at = COALESCE(archived_at, now()),
         archived_reason = COALESCE(NULLIF(btrim(p_reason),''), archived_reason, 'Archived from admin'),
         is_active = false,
         publication_status = 'archived',
         updated_at = now()
   WHERE id = p_league_id;

  RETURN jsonb_build_object('id', l.id, 'slug', l.slug, 'name', l.league_name, 'archived', true);
END;
$fn$;

-- Unarchive (safety net)
CREATE OR REPLACE FUNCTION public.fn_unarchive_league(p_league_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  UPDATE public.league_publication
     SET archived_at = NULL, archived_reason = NULL,
         is_active = true, publication_status = 'draft', updated_at = now()
   WHERE id = p_league_id;
  RETURN jsonb_build_object('id', p_league_id, 'archived', false);
END;
$fn$;
