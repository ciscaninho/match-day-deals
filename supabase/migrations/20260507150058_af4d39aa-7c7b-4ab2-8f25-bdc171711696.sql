
-- Verified fixture metadata
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS data_source text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_matches_verified ON public.matches(verified);
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(date);

-- Enable pg_cron + pg_net for scheduled sync
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
