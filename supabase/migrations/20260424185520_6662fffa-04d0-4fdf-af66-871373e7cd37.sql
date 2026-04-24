-- Add Sportmonks integration fields to matches table
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS sportmonks_id BIGINT,
  ADD COLUMN IF NOT EXISTS home_logo TEXT,
  ADD COLUMN IF NOT EXISTS away_logo TEXT;

-- Unique index on sportmonks_id for upsert (allow nulls for manually-created matches)
CREATE UNIQUE INDEX IF NOT EXISTS matches_sportmonks_id_unique
  ON public.matches (sportmonks_id)
  WHERE sportmonks_id IS NOT NULL;

-- Index for ordering by date
CREATE INDEX IF NOT EXISTS matches_date_idx ON public.matches (date);
