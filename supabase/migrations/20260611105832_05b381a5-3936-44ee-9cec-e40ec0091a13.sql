
-- =============================================================
-- LM2.9 — League & Match Integrity Fix
-- =============================================================

-- 1. LEAGUE SLUG CANONICALIZATION ---------------------------------------------
-- Helper: derive a country suffix (iso2 lowercase) with UK-nation fallback
CREATE OR REPLACE FUNCTION public.fn_country_slug_suffix(p_country_id uuid)
RETURNS text LANGUAGE sql STABLE SET search_path=public AS $$
  SELECT COALESCE(
    NULLIF(lower(c.iso2),''),
    CASE c.name
      WHEN 'England' THEN 'eng'
      WHEN 'Scotland' THEN 'sct'
      WHEN 'Wales' THEN 'wal'
      WHEN 'Northern Ireland' THEN 'nir'
    END,
    lower(regexp_replace(c.name,'[^A-Za-z0-9]+','-','g'))
  )
  FROM public.countries c WHERE c.id = p_country_id
$$;

-- Rename duplicate slugs: append country suffix, keep old slug in aliases
WITH dups AS (
  SELECT slug FROM public.league_publication
   WHERE archived_at IS NULL AND slug IS NOT NULL
   GROUP BY slug HAVING count(*) > 1
),
renames AS (
  SELECT lp.id, lp.slug AS old_slug,
         lp.slug || '-' || public.fn_country_slug_suffix(lp.country_id) AS new_slug
  FROM public.league_publication lp
  JOIN dups d ON d.slug = lp.slug
  WHERE lp.archived_at IS NULL AND lp.slug <> '-'
)
UPDATE public.league_publication lp
SET slug = r.new_slug,
    aliases = (
      SELECT array_agg(DISTINCT x) FROM unnest(
        COALESCE(lp.aliases,'{}'::text[]) || ARRAY[r.old_slug]
      ) x WHERE NULLIF(btrim(x),'') IS NOT NULL
    ),
    updated_at = now()
FROM renames r
WHERE lp.id = r.id;

-- Placeholder "-" slugs: assign placeholder-{country}-{n}
WITH placeholders AS (
  SELECT id, country_id,
         'placeholder-' || COALESCE(public.fn_country_slug_suffix(country_id),'xx') ||
         '-' || row_number() OVER (PARTITION BY country_id ORDER BY created_at, id) AS new_slug
  FROM public.league_publication
  WHERE slug = '-' OR slug IS NULL
)
UPDATE public.league_publication lp
SET slug = p.new_slug, updated_at = now()
FROM placeholders p WHERE lp.id = p.id;

-- Enforce uniqueness on active league slugs
DROP INDEX IF EXISTS public.league_publication_slug_unique_active;
CREATE UNIQUE INDEX league_publication_slug_unique_active
  ON public.league_publication (slug)
  WHERE archived_at IS NULL;

-- 2. CLUB → LEAGUE RELINKING --------------------------------------------------
-- For clubs whose country differs from their league's country, find the
-- league with the same name in the club's country and switch.
WITH mismatched AS (
  SELECT c.id AS club_id, c.country_id AS club_country, lp.league_name
  FROM public.clubs c
  JOIN public.league_publication lp ON lp.id = c.primary_league_id
  WHERE c.archived_at IS NULL
    AND c.country_id IS NOT NULL
    AND lp.country_id IS NOT NULL
    AND c.country_id <> lp.country_id
),
fix AS (
  SELECT m.club_id,
         (SELECT lp2.id FROM public.league_publication lp2
           WHERE lp2.archived_at IS NULL
             AND lower(lp2.league_name) = lower(m.league_name)
             AND lp2.country_id = m.club_country
           ORDER BY lp2.created_at LIMIT 1) AS new_league_id
  FROM mismatched m
)
UPDATE public.clubs c
SET primary_league_id = f.new_league_id, updated_at = now()
FROM fix f WHERE c.id = f.club_id AND f.new_league_id IS NOT NULL;

-- 3. MATCHES: add canonical FK columns ---------------------------------------
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS home_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS away_club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS matches_home_club_id_idx ON public.matches(home_club_id);
CREATE INDEX IF NOT EXISTS matches_away_club_id_idx ON public.matches(away_club_id);

-- Resolver: returns best canonical club id for a team string
CREATE OR REPLACE FUNCTION public.fn_resolve_club_id(p_team text, p_country text DEFAULT NULL)
RETURNS uuid LANGUAGE sql STABLE SET search_path=public AS $$
  WITH norm AS (SELECT public.fn_normalize_club_name(p_team) AS n)
  SELECT c.id FROM public.clubs c, norm
   WHERE c.archived_at IS NULL
     AND (
       lower(c.club_name) = lower(p_team)
       OR lower(c.short_name) = lower(p_team)
       OR public.fn_normalize_club_name(c.club_name) = norm.n
       OR EXISTS (SELECT 1 FROM unnest(c.aliases) a
                   WHERE lower(a) = lower(p_team)
                      OR public.fn_normalize_club_name(a) = norm.n)
     )
   ORDER BY
     (lower(c.club_name) = lower(p_team)) DESC,
     (public.fn_normalize_club_name(c.club_name) = norm.n) DESC,
     (c.club_type = 'club') DESC
   LIMIT 1
$$;

-- Backfill home_club_id / away_club_id
UPDATE public.matches m
SET home_club_id = public.fn_resolve_club_id(m.home_team, m.country)
WHERE m.archived_at IS NULL
  AND m.home_club_id IS NULL
  AND m.competition <> 'FIFA World Cup 2026'
  AND m.home_team IS NOT NULL
  AND m.home_team <> 'TBD';

UPDATE public.matches m
SET away_club_id = public.fn_resolve_club_id(m.away_team, m.country)
WHERE m.archived_at IS NULL
  AND m.away_club_id IS NULL
  AND m.competition <> 'FIFA World Cup 2026'
  AND m.away_team IS NOT NULL
  AND m.away_team <> 'TBD';

-- 4. MATCHES: backfill stadium_id --------------------------------------------
UPDATE public.matches m
SET stadium_id = s.id
FROM public.stadiums s
WHERE m.archived_at IS NULL
  AND m.stadium_id IS NULL
  AND m.stadium IS NOT NULL
  AND s.archived_at IS NULL
  AND lower(s.stadium_name) = lower(m.stadium);

-- Also try via home_club's home_stadium when stadium name was empty
UPDATE public.matches m
SET stadium_id = c.home_stadium_id
FROM public.clubs c
WHERE m.archived_at IS NULL
  AND m.stadium_id IS NULL
  AND m.home_club_id = c.id
  AND c.home_stadium_id IS NOT NULL;

-- 5. STADIUMS.league_slug re-sync (denormalized cache from canonical FK) ----
WITH stadium_league AS (
  SELECT cs.stadium_id, MIN(lp.slug) AS league_slug
  FROM public.club_stadiums cs
  JOIN public.clubs c ON c.id = cs.club_id AND c.archived_at IS NULL
  JOIN public.league_publication lp ON lp.id = c.primary_league_id AND lp.archived_at IS NULL
  GROUP BY cs.stadium_id
)
UPDATE public.stadiums s
SET league_slug = sl.league_slug, updated_at = now()
FROM stadium_league sl
WHERE s.id = sl.stadium_id
  AND s.archived_at IS NULL
  AND (s.league_slug IS DISTINCT FROM sl.league_slug);

-- 6. Audit report -------------------------------------------------------------
INSERT INTO public.app_config(key, value)
SELECT 'lm29_audit_report', jsonb_build_object(
  'generated_at', now(),
  'league_duplicate_slugs', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('slug',slug,'count',c)),'[]'::jsonb)
    FROM (SELECT slug, count(*) c FROM public.league_publication
          WHERE archived_at IS NULL GROUP BY slug HAVING count(*) > 1) x
  ),
  'leagues_total_active', (SELECT count(*) FROM public.league_publication WHERE archived_at IS NULL),
  'clubs_country_mismatch', (
    SELECT count(*) FROM public.clubs c
    JOIN public.league_publication lp ON lp.id = c.primary_league_id
    WHERE c.archived_at IS NULL AND c.country_id IS NOT NULL
      AND lp.country_id IS NOT NULL AND c.country_id <> lp.country_id
  ),
  'matches_total', (SELECT count(*) FROM public.matches WHERE archived_at IS NULL AND competition <> 'FIFA World Cup 2026'),
  'matches_home_resolved', (SELECT count(*) FROM public.matches WHERE archived_at IS NULL AND competition <> 'FIFA World Cup 2026' AND home_club_id IS NOT NULL),
  'matches_away_resolved', (SELECT count(*) FROM public.matches WHERE archived_at IS NULL AND competition <> 'FIFA World Cup 2026' AND away_club_id IS NOT NULL),
  'matches_stadium_resolved', (SELECT count(*) FROM public.matches WHERE archived_at IS NULL AND competition <> 'FIFA World Cup 2026' AND stadium_id IS NOT NULL),
  'stadiums_reachable_via_clubs', (
    SELECT count(DISTINCT cs.stadium_id) FROM public.club_stadiums cs
    JOIN public.clubs c ON c.id = cs.club_id AND c.archived_at IS NULL
  ),
  'stadiums_total_active', (SELECT count(*) FROM public.stadiums WHERE archived_at IS NULL)
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
