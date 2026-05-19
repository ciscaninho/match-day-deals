
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'upcoming';

CREATE OR REPLACE FUNCTION public.match_lifecycle_status(
  p_date timestamptz,
  p_archived_at timestamptz
) RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_archived_at IS NOT NULL THEN 'archived'
    WHEN now() < p_date THEN 'upcoming'
    WHEN now() < p_date + interval '2 hours 30 minutes' THEN 'live'
    WHEN now() < p_date + interval '14 days' THEN 'completed'
    ELSE 'archived'
  END;
$$;

CREATE OR REPLACE FUNCTION public.set_match_lifecycle_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.lifecycle_status := public.match_lifecycle_status(NEW.date, NEW.archived_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_matches_lifecycle_status ON public.matches;
CREATE TRIGGER trg_matches_lifecycle_status
  BEFORE INSERT OR UPDATE OF date, archived_at ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_match_lifecycle_status();

-- Backfill existing rows
UPDATE public.matches
SET lifecycle_status = public.match_lifecycle_status(date, archived_at);

CREATE INDEX IF NOT EXISTS idx_matches_lifecycle_date
  ON public.matches (lifecycle_status, date);
