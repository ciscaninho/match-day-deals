
CREATE TABLE public.club_ticketing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  club_name text NOT NULL,
  short_name text,
  country text,
  city text,
  league text,
  stadium_name text,
  stadium_slug text,
  logo_url text,
  hero_image_url text,
  official_website text,
  official_ticketing_url text,
  membership_required boolean NOT NULL DEFAULT false,
  membership_name text,
  membership_required_for_big_games boolean NOT NULL DEFAULT false,
  public_sale_possible boolean NOT NULL DEFAULT true,
  resale_exchange_available boolean NOT NULL DEFAULT false,
  resale_exchange_name text,
  resale_exchange_url text,
  average_difficulty text NOT NULL DEFAULT 'medium',
  ticket_release_process text,
  important_restrictions text,
  hospitality_available boolean NOT NULL DEFAULT false,
  hospitality_url text,
  queue_system text,
  ballot_system boolean NOT NULL DEFAULT false,
  ballot_notes text,
  local_fan_restrictions text,
  notes text,
  best_matches text,
  seo_title text,
  seo_description text,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_ticketing_slug ON public.club_ticketing_profiles(slug);

ALTER TABLE public.club_ticketing_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view club ticketing profiles"
ON public.club_ticketing_profiles FOR SELECT USING (true);

CREATE POLICY "Admins can insert club ticketing profiles"
ON public.club_ticketing_profiles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update club ticketing profiles"
ON public.club_ticketing_profiles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete club ticketing profiles"
ON public.club_ticketing_profiles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_club_ticketing_profiles_updated_at
BEFORE UPDATE ON public.club_ticketing_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_matches_updated_at();
