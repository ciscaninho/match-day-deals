ALTER TABLE public.stadiums_master_staging
  ADD COLUMN IF NOT EXISTS primary_club text,
  ADD COLUMN IF NOT EXISTS is_historic boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_inactive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_multi_club boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_national_team_stadium boolean NOT NULL DEFAULT false;