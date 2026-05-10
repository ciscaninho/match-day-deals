-- Wave 4: premium aerial image migration (safe, image-only)
-- 125 high-confidence updates (name + city/club), 363 staged for review

CREATE TABLE IF NOT EXISTS public.stadium_image_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_name text NOT NULL,
  slug text,
  club text,
  city text,
  country text,
  league text,
  hero_image_url text,
  thumbnail_image_url text,
  background_image_url text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stadium_image_staging ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage stadium image staging" ON public.stadium_image_staging;
CREATE POLICY "Admins manage stadium image staging" ON public.stadium_image_staging FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS stadium_image_staging_status_idx ON public.stadium_image_staging(status);
CREATE UNIQUE INDEX IF NOT EXISTS stadium_image_staging_slug_pending_idx ON public.stadium_image_staging(slug) WHERE status='pending';