-- =====================================================================
-- Sprint League Management 2 — Clubs Master
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------
-- Helper: slugify
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.slugify(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT NULLIF(
    regexp_replace(
      regexp_replace(lower(unaccent(coalesce(p,''))), '[^a-z0-9]+', '-', 'g'),
      '(^-+|-+$)', '', 'g'
    ),
    ''
  );
$$;

-- ---------------------------------------------------------------------
-- 1. CLUBS master table
-- ---------------------------------------------------------------------
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  club_name TEXT NOT NULL,
  short_name TEXT,
  aliases TEXT[] NOT NULL DEFAULT '{}'::text[],
  country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL,
  primary_league_id UUID REFERENCES public.league_publication(id) ON DELETE SET NULL,
  home_stadium_id UUID REFERENCES public.stadiums(id) ON DELETE SET NULL,
  founded_year INTEGER,
  crest_url TEXT,
  hero_image_url TEXT,
  official_website TEXT,
  gender TEXT NOT NULL DEFAULT 'men',
  club_type TEXT NOT NULL DEFAULT 'club', -- club | national_team | identity_only
  seo_title TEXT,
  seo_description TEXT,
  publication_status TEXT NOT NULL DEFAULT 'draft', -- draft | published | hidden
  archived_at TIMESTAMPTZ,
  archived_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clubs_country ON public.clubs(country_id);
CREATE INDEX idx_clubs_league ON public.clubs(primary_league_id);
CREATE INDEX idx_clubs_home_stadium ON public.clubs(home_stadium_id);
CREATE INDEX idx_clubs_publication ON public.clubs(publication_status) WHERE archived_at IS NULL;

GRANT SELECT ON public.clubs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs TO authenticated;
GRANT ALL ON public.clubs TO service_role;

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View clubs (published for all, others for admins)"
  ON public.clubs FOR SELECT
  USING (
    (archived_at IS NULL AND publication_status = 'published')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins insert clubs"
  ON public.clubs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update clubs"
  ON public.clubs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete clubs"
  ON public.clubs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_clubs_touch
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 2. CLUB_STADIUMS junction
-- ---------------------------------------------------------------------
CREATE TABLE public.club_stadiums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  stadium_id UUID NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'home', -- home | secondary | historical
  from_date DATE,
  to_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, stadium_id, role)
);

CREATE INDEX idx_club_stadiums_club ON public.club_stadiums(club_id);
CREATE INDEX idx_club_stadiums_stadium ON public.club_stadiums(stadium_id);

GRANT SELECT ON public.club_stadiums TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_stadiums TO authenticated;
GRANT ALL ON public.club_stadiums TO service_role;

ALTER TABLE public.club_stadiums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View club_stadiums (all)"
  ON public.club_stadiums FOR SELECT USING (true);

CREATE POLICY "Admins insert club_stadiums"
  ON public.club_stadiums FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update club_stadiums"
  ON public.club_stadiums FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete club_stadiums"
  ON public.club_stadiums FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_club_stadiums_touch
  BEFORE UPDATE ON public.club_stadiums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- 3. Link club_ticketing_profiles → clubs (1:1)
-- ---------------------------------------------------------------------
ALTER TABLE public.club_ticketing_profiles
  ADD COLUMN club_id UUID UNIQUE REFERENCES public.clubs(id) ON DELETE SET NULL;

CREATE INDEX idx_ctp_club ON public.club_ticketing_profiles(club_id);

-- ---------------------------------------------------------------------
-- 4. stadiums.country_id + relax NOT NULL on league
-- ---------------------------------------------------------------------
ALTER TABLE public.stadiums
  ADD COLUMN country_id UUID REFERENCES public.countries(id) ON DELETE SET NULL;

CREATE INDEX idx_stadiums_country ON public.stadiums(country_id);

UPDATE public.stadiums
SET country_id = public.fn_resolve_country_id(country)
WHERE country_id IS NULL;

ALTER TABLE public.stadiums ALTER COLUMN league DROP NOT NULL;

-- ---------------------------------------------------------------------
-- 5. BACKFILL: clubs from club_ticketing_profiles (active rows)
-- ---------------------------------------------------------------------
INSERT INTO public.clubs (
  slug, club_name, short_name, aliases,
  country_id, primary_league_id, home_stadium_id,
  crest_url, hero_image_url, official_website,
  seo_title, seo_description, publication_status, club_type
)
SELECT
  ctp.slug,
  ctp.club_name,
  ctp.short_name,
  COALESCE(ctp.aliases, '{}'::text[]),
  public.fn_resolve_country_id(ctp.country),
  (SELECT id FROM public.league_publication
     WHERE lower(league_name) = lower(ctp.league) LIMIT 1),
  (SELECT id FROM public.stadiums
     WHERE slug = ctp.stadium_slug LIMIT 1),
  ctp.logo_url, ctp.hero_image_url, ctp.official_website,
  ctp.seo_title, ctp.seo_description,
  ctp.publication_status,
  'club'
FROM public.club_ticketing_profiles ctp
WHERE ctp.archived_at IS NULL
ON CONFLICT (slug) DO NOTHING;

-- Link ticketing profiles back to clubs
UPDATE public.club_ticketing_profiles ctp
SET club_id = c.id
FROM public.clubs c
WHERE c.slug = ctp.slug AND ctp.club_id IS NULL;

-- ---------------------------------------------------------------------
-- 6. BACKFILL: identity-only clubs from stadiums.clubs[]
-- ---------------------------------------------------------------------
WITH tenant_names AS (
  SELECT
    btrim(name) AS raw_name,
    s.id        AS stadium_id,
    s.country   AS stadium_country,
    s.league    AS stadium_league
  FROM public.stadiums s
  CROSS JOIN LATERAL unnest(s.clubs) AS name
  WHERE s.archived_at IS NULL
    AND btrim(name) <> ''
    AND name NOT ILIKE '%(alt)%'
),
ranked AS (
  -- Pick first stadium per tenant name as provisional home
  SELECT DISTINCT ON (lower(raw_name))
    raw_name, stadium_id, stadium_country, stadium_league
  FROM tenant_names
  ORDER BY lower(raw_name), stadium_id
),
new_tenants AS (
  SELECT r.*
  FROM ranked r
  WHERE NOT EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE lower(c.club_name) = lower(r.raw_name)
       OR lower(r.raw_name) = ANY(SELECT lower(a) FROM unnest(c.aliases) a)
  )
)
INSERT INTO public.clubs (
  slug, club_name, country_id, primary_league_id, home_stadium_id,
  publication_status, club_type
)
SELECT
  COALESCE(public.slugify(raw_name), 'club-' || substr(md5(raw_name), 1, 8)) AS slug,
  raw_name,
  public.fn_resolve_country_id(stadium_country),
  (SELECT id FROM public.league_publication
     WHERE lower(league_name) = lower(stadium_league) LIMIT 1),
  stadium_id,
  'draft',
  'identity_only'
FROM new_tenants
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- 7. BACKFILL: club_stadiums junction
-- ---------------------------------------------------------------------

-- 7a. Home stadium from clubs.home_stadium_id
INSERT INTO public.club_stadiums (club_id, stadium_id, role, is_current)
SELECT c.id, c.home_stadium_id, 'home', true
FROM public.clubs c
WHERE c.home_stadium_id IS NOT NULL
ON CONFLICT (club_id, stadium_id, role) DO NOTHING;

-- 7b. Tenant links from stadiums.clubs[]
INSERT INTO public.club_stadiums (club_id, stadium_id, role, is_current)
SELECT DISTINCT
  c.id,
  s.id,
  CASE WHEN c.home_stadium_id = s.id THEN 'home' ELSE 'secondary' END,
  true
FROM public.stadiums s
CROSS JOIN LATERAL unnest(s.clubs) AS tenant_name
JOIN public.clubs c
  ON lower(c.club_name) = lower(btrim(tenant_name))
  OR lower(btrim(tenant_name)) = ANY(SELECT lower(a) FROM unnest(c.aliases) a)
WHERE s.archived_at IS NULL
  AND btrim(tenant_name) <> ''
  AND tenant_name NOT ILIKE '%(alt)%'
ON CONFLICT (club_id, stadium_id, role) DO NOTHING;
