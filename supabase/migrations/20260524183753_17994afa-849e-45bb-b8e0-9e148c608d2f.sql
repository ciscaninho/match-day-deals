-- Fix regression: previous migration defaulted fixture_confidence='projected' and
-- statuses='tbd' for ALL existing matches. Domestic club matches should default
-- to 'confirmed'. Reset defaults and backfill non-tournament rows.

ALTER TABLE public.matches
  ALTER COLUMN fixture_confidence SET DEFAULT 'confirmed',
  ALTER COLUMN home_team_status SET DEFAULT 'confirmed',
  ALTER COLUMN away_team_status SET DEFAULT 'confirmed';

-- Backfill: any existing row that is NOT a recognised international tournament
-- should be treated as confirmed (it was imported as a real fixture).
UPDATE public.matches
SET
  fixture_confidence = 'confirmed',
  home_team_status   = 'confirmed',
  away_team_status   = 'confirmed'
WHERE fixture_confidence = 'projected'
  AND competition !~* '(world cup|coupe du monde|fifa\s*wc|copa\s*mundial|mundial|\beuro\b|copa am[eé]rica|nations league)';