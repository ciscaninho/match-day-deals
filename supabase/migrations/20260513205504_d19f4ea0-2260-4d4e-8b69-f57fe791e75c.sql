
-- 1. Publication status enum (text + check, simpler than enum type for forward compat)
ALTER TABLE public.club_ticketing_profiles
  ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'draft';

ALTER TABLE public.stadiums
  ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'draft';

-- Backfill existing rows to 'published' (they are already live)
UPDATE public.club_ticketing_profiles SET publication_status = 'published' WHERE publication_status = 'draft';
UPDATE public.stadiums SET publication_status = 'published' WHERE publication_status = 'draft';

-- Constrain values
ALTER TABLE public.club_ticketing_profiles
  DROP CONSTRAINT IF EXISTS club_ticketing_profiles_publication_status_check;
ALTER TABLE public.club_ticketing_profiles
  ADD CONSTRAINT club_ticketing_profiles_publication_status_check
  CHECK (publication_status IN ('draft','internal_review','verified','published'));

ALTER TABLE public.stadiums
  DROP CONSTRAINT IF EXISTS stadiums_publication_status_check;
ALTER TABLE public.stadiums
  ADD CONSTRAINT stadiums_publication_status_check
  CHECK (publication_status IN ('draft','internal_review','verified','published'));

CREATE INDEX IF NOT EXISTS idx_clubs_publication_status ON public.club_ticketing_profiles(publication_status);
CREATE INDEX IF NOT EXISTS idx_stadiums_publication_status ON public.stadiums(publication_status);

-- 2. League publication overlay table
CREATE TABLE IF NOT EXISTS public.league_publication (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_name text NOT NULL,
  country text NOT NULL,
  continent text,
  slug text,
  division_level integer,
  logo_url text,
  aliases text[] NOT NULL DEFAULT '{}'::text[],
  publication_status text NOT NULL DEFAULT 'draft'
    CHECK (publication_status IN ('draft','internal_review','verified','published')),
  archived_at timestamp with time zone,
  archived_reason text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT league_publication_unique UNIQUE (league_name, country)
);

CREATE INDEX IF NOT EXISTS idx_league_publication_country ON public.league_publication(country);
CREATE INDEX IF NOT EXISTS idx_league_publication_status ON public.league_publication(publication_status);

ALTER TABLE public.league_publication ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published leagues" ON public.league_publication;
CREATE POLICY "Public can view published leagues"
  ON public.league_publication FOR SELECT
  TO anon, authenticated
  USING (publication_status = 'published' AND archived_at IS NULL);

DROP POLICY IF EXISTS "Admins view all league publication" ON public.league_publication;
CREATE POLICY "Admins view all league publication"
  ON public.league_publication FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert league publication" ON public.league_publication;
CREATE POLICY "Admins insert league publication"
  ON public.league_publication FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update league publication" ON public.league_publication;
CREATE POLICY "Admins update league publication"
  ON public.league_publication FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete league publication" ON public.league_publication;
CREATE POLICY "Admins delete league publication"
  ON public.league_publication FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_league_publication_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_league_publication_updated_at ON public.league_publication;
CREATE TRIGGER trg_league_publication_updated_at
  BEFORE UPDATE ON public.league_publication
  FOR EACH ROW EXECUTE FUNCTION public.touch_league_publication_updated_at();
