CREATE TABLE IF NOT EXISTS public.stadiums_master_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  normalized_name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  slug text NOT NULL,
  normalized_slug text NOT NULL,
  city text,
  normalized_city text,
  country text,
  normalized_country text,
  league text,
  club_names text[] NOT NULL DEFAULT '{}',
  hero_image_url text,
  thumbnail_image_url text,
  background_image_url text,
  latitude numeric,
  longitude numeric,
  capacity integer,
  year_opened integer,
  official_website text,
  description text,
  sources text[] NOT NULL DEFAULT '{}',
  source_ids jsonb NOT NULL DEFAULT '{}'::jsonb,
  production_stadium_id uuid,
  dedupe_cluster_id text,
  duplicate_of uuid,
  conflict_flags text[] NOT NULL DEFAULT '{}',
  has_missing_metadata boolean NOT NULL DEFAULT false,
  image_score integer NOT NULL DEFAULT 0,
  confidence text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_norm_name ON public.stadiums_master_staging(normalized_name);
CREATE INDEX IF NOT EXISTS idx_sms_norm_slug ON public.stadiums_master_staging(normalized_slug);
CREATE INDEX IF NOT EXISTS idx_sms_cluster ON public.stadiums_master_staging(dedupe_cluster_id);
CREATE INDEX IF NOT EXISTS idx_sms_prod ON public.stadiums_master_staging(production_stadium_id);
CREATE INDEX IF NOT EXISTS idx_sms_status ON public.stadiums_master_staging(status);

ALTER TABLE public.stadiums_master_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage stadiums master staging"
  ON public.stadiums_master_staging
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
