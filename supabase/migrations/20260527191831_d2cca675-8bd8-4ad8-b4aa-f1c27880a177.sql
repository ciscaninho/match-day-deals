-- Add fixture origin & lock columns to matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS fixture_origin TEXT NOT NULL DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS fifa_match_number INTEGER,
  ADD COLUMN IF NOT EXISTS kickoff_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stadium_locked BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS matches_wc_fifa_match_number_uniq
  ON public.matches (fifa_match_number)
  WHERE competition = 'FIFA World Cup 2026' AND fifa_match_number IS NOT NULL;

-- Backfill: any WC row created via official import path should be marked official.
-- Heuristic: rows whose id starts with 'wc2026-m' OR have import_source = 'fifa_seed'/'csv'.
UPDATE public.matches
SET fixture_origin = 'official_import',
    kickoff_locked = true,
    stadium_locked = true
WHERE competition = 'FIFA World Cup 2026'
  AND (id LIKE 'wc2026-m%' OR import_source IN ('fifa_seed','csv'))
  AND fixture_origin = 'generated';

-- Immutability trigger for official WC fixtures
CREATE OR REPLACE FUNCTION public.wc_lock_official_fixture_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.competition = 'FIFA World Cup 2026'
     AND OLD.fixture_origin = 'official_import' THEN
    IF NEW.date IS DISTINCT FROM OLD.date
       OR NEW.stadium IS DISTINCT FROM OLD.stadium
       OR NEW.stadium_id IS DISTINCT FROM OLD.stadium_id
       OR NEW.city IS DISTINCT FROM OLD.city
       OR NEW.country IS DISTINCT FROM OLD.country
       OR NEW.phase IS DISTINCT FROM OLD.phase
       OR NEW.group_code IS DISTINCT FROM OLD.group_code
       OR NEW.matchday IS DISTINCT FROM OLD.matchday
       OR NEW.fifa_match_number IS DISTINCT FROM OLD.fifa_match_number THEN
      RAISE EXCEPTION 'wc_official_fixture_locked: cannot modify date/stadium/city/phase/group/matchday on official WC fixture %', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wc_lock_official_fixture_fields_trg ON public.matches;
CREATE TRIGGER wc_lock_official_fixture_fields_trg
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.wc_lock_official_fixture_fields();