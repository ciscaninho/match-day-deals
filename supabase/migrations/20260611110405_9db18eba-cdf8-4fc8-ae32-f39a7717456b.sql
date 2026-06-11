
DO $$ BEGIN
  CREATE TYPE public.season_club_status AS ENUM ('promoted','relegated','stayed','wildcard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.seasons (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id     uuid NOT NULL REFERENCES public.league_publication(id) ON DELETE CASCADE,
  season_name   text NOT NULL,
  season_slug   text NOT NULL,
  start_date    date,
  end_date      date,
  is_current    boolean NOT NULL DEFAULT false,
  is_published  boolean NOT NULL DEFAULT false,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, season_slug)
);

GRANT SELECT ON public.seasons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seasons TO authenticated;
GRANT ALL ON public.seasons TO service_role;

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published seasons" ON public.seasons;
CREATE POLICY "Public can view published seasons"
  ON public.seasons FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage seasons" ON public.seasons;
CREATE POLICY "Admins manage seasons"
  ON public.seasons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS seasons_league_id_idx ON public.seasons(league_id);
CREATE UNIQUE INDEX IF NOT EXISTS seasons_one_current_per_league
  ON public.seasons(league_id) WHERE is_current = true;

DROP TRIGGER IF EXISTS trg_seasons_updated_at ON public.seasons;
CREATE TRIGGER trg_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.league_season_clubs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id           uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  club_id             uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  status              public.season_club_status NOT NULL DEFAULT 'stayed',
  previous_league_id  uuid REFERENCES public.league_publication(id) ON DELETE SET NULL,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_id, club_id)
);

GRANT SELECT ON public.league_season_clubs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.league_season_clubs TO authenticated;
GRANT ALL ON public.league_season_clubs TO service_role;

ALTER TABLE public.league_season_clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view memberships of published seasons" ON public.league_season_clubs;
CREATE POLICY "Public can view memberships of published seasons"
  ON public.league_season_clubs FOR SELECT TO anon, authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.seasons s WHERE s.id = season_id AND s.is_published = true)
  );

DROP POLICY IF EXISTS "Admins manage league_season_clubs" ON public.league_season_clubs;
CREATE POLICY "Admins manage league_season_clubs"
  ON public.league_season_clubs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS lsc_season_idx ON public.league_season_clubs(season_id);
CREATE INDEX IF NOT EXISTS lsc_club_idx ON public.league_season_clubs(club_id);

DROP TRIGGER IF EXISTS trg_lsc_updated_at ON public.league_season_clubs;
CREATE TRIGGER trg_lsc_updated_at
  BEFORE UPDATE ON public.league_season_clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Duplicate season
CREATE OR REPLACE FUNCTION public.fn_duplicate_season(
  p_source_season_id uuid,
  p_new_season_name text,
  p_new_season_slug text,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  src public.seasons%ROWTYPE;
  new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  SELECT * INTO src FROM public.seasons WHERE id = p_source_season_id;
  IF src.id IS NULL THEN RAISE EXCEPTION 'source_season_not_found'; END IF;

  INSERT INTO public.seasons (league_id, season_name, season_slug, start_date, end_date, is_current, is_published)
  VALUES (src.league_id, p_new_season_name, p_new_season_slug,
          COALESCE(p_start_date, src.start_date), COALESCE(p_end_date, src.end_date),
          false, false)
  RETURNING id INTO new_id;

  INSERT INTO public.league_season_clubs (season_id, club_id, status, previous_league_id, notes)
  SELECT new_id, club_id, 'stayed', src.league_id, notes
  FROM public.league_season_clubs WHERE season_id = src.id;

  RETURN new_id;
END $$;

-- Validation report
CREATE OR REPLACE FUNCTION public.fn_season_validation_report()
RETURNS jsonb
LANGUAGE sql STABLE SET search_path=public AS $$
WITH
  expected AS (
    SELECT id AS league_id, league_name,
      CASE lower(slug)
        WHEN 'premier-league' THEN 20
        WHEN 'ligue-1' THEN 18
        WHEN 'jupiler-pro-league' THEN 16
        WHEN 'eredivisie' THEN 18
        WHEN 'serie-a' THEN 20
        WHEN 'la-liga' THEN 20
        WHEN 'bundesliga-de' THEN 18
        WHEN 'mls-us' THEN 30
        ELSE NULL
      END AS expected_max
    FROM public.league_publication WHERE archived_at IS NULL
  ),
  empty_seasons AS (
    SELECT s.id, s.season_name, lp.league_name
    FROM public.seasons s
    JOIN public.league_publication lp ON lp.id = s.league_id
    LEFT JOIN public.league_season_clubs lsc ON lsc.season_id = s.id
    WHERE lp.archived_at IS NULL
    GROUP BY s.id, s.season_name, lp.league_name
    HAVING count(lsc.id) = 0
  ),
  leagues_without_current AS (
    SELECT lp.id, lp.league_name
    FROM public.league_publication lp
    WHERE lp.archived_at IS NULL AND lp.is_active = true
      AND NOT EXISTS (SELECT 1 FROM public.seasons s WHERE s.league_id = lp.id AND s.is_current = true)
  ),
  oversize AS (
    SELECT s.id AS season_id, s.season_name, lp.league_name, count(lsc.id) AS club_count, e.expected_max
    FROM public.seasons s
    JOIN public.league_publication lp ON lp.id = s.league_id
    JOIN expected e ON e.league_id = lp.id
    LEFT JOIN public.league_season_clubs lsc ON lsc.season_id = s.id
    WHERE e.expected_max IS NOT NULL
    GROUP BY s.id, s.season_name, lp.league_name, e.expected_max
    HAVING count(lsc.id) > e.expected_max
  )
SELECT jsonb_build_object(
  'generated_at', now(),
  'empty_seasons', COALESCE((SELECT jsonb_agg(jsonb_build_object('season_id',id,'season_name',season_name,'league_name',league_name)) FROM empty_seasons),'[]'::jsonb),
  'leagues_without_current_season', COALESCE((SELECT jsonb_agg(jsonb_build_object('league_id',id,'league_name',league_name)) FROM leagues_without_current),'[]'::jsonb),
  'oversize_seasons', COALESCE((SELECT jsonb_agg(jsonb_build_object('season_id',season_id,'season_name',season_name,'league_name',league_name,'club_count',club_count,'expected_max',expected_max)) FROM oversize),'[]'::jsonb),
  'total_seasons', (SELECT count(*) FROM public.seasons),
  'total_memberships', (SELECT count(*) FROM public.league_season_clubs)
);
$$;

-- Backfill 2025-26
WITH created AS (
  INSERT INTO public.seasons (league_id, season_name, season_slug, start_date, end_date, is_current, is_published)
  SELECT lp.id, lp.league_name || ' 2025-26', '2025-26',
         DATE '2025-08-01', DATE '2026-05-31', true, true
  FROM public.league_publication lp
  WHERE lp.archived_at IS NULL AND lp.is_active = true AND lp.publication_status = 'published'
  ON CONFLICT (league_id, season_slug) DO NOTHING
  RETURNING id AS season_id, league_id
)
INSERT INTO public.league_season_clubs (season_id, club_id, status)
SELECT cr.season_id, cl.id, 'stayed'
FROM created cr
JOIN public.clubs cl ON cl.primary_league_id = cr.league_id AND cl.archived_at IS NULL
ON CONFLICT (season_id, club_id) DO NOTHING;

INSERT INTO public.app_config(key, value)
SELECT 'lm3_seasons_report', jsonb_build_object(
  'generated_at', now(),
  'total_seasons', (SELECT count(*) FROM public.seasons),
  'total_memberships', (SELECT count(*) FROM public.league_season_clubs),
  'leagues_active', (SELECT count(*) FROM public.league_publication WHERE archived_at IS NULL AND is_active = true),
  'leagues_without_seasons', (
    SELECT count(*) FROM public.league_publication lp
    WHERE lp.archived_at IS NULL AND lp.is_active = true
      AND NOT EXISTS (SELECT 1 FROM public.seasons s WHERE s.league_id = lp.id)
  ),
  'validation', public.fn_season_validation_report()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
