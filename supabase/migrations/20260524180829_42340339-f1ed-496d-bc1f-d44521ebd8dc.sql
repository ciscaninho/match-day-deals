ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS fixture_confidence text NOT NULL DEFAULT 'projected',
  ADD COLUMN IF NOT EXISTS home_team_status text NOT NULL DEFAULT 'tbd',
  ADD COLUMN IF NOT EXISTS away_team_status text NOT NULL DEFAULT 'tbd',
  ADD COLUMN IF NOT EXISTS home_team_projected text,
  ADD COLUMN IF NOT EXISTS away_team_projected text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_fixture_confidence_check') THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_fixture_confidence_check
      CHECK (fixture_confidence IN ('projected','confirmed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_home_team_status_check') THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_home_team_status_check
      CHECK (home_team_status IN ('tbd','projected','confirmed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'matches_away_team_status_check') THEN
    ALTER TABLE public.matches
      ADD CONSTRAINT matches_away_team_status_check
      CHECK (away_team_status IN ('tbd','projected','confirmed'));
  END IF;
END $$;