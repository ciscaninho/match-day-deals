-- Coverage quality scoring + soft-archive on wc_ticket_coverage
ALTER TABLE public.wc_ticket_coverage
  ADD COLUMN IF NOT EXISTS quality_score TEXT NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS quality_reasons TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS extraction_source TEXT,
  ADD COLUMN IF NOT EXISTS stadium_confidence TEXT NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_wc_coverage_quality
  ON public.wc_ticket_coverage (quality_score)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wc_coverage_archived
  ON public.wc_ticket_coverage (archived_at);

-- Quality computation function (single source of truth)
CREATE OR REPLACE FUNCTION public.wc_coverage_compute_quality()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  reasons TEXT[] := '{}'::text[];
  is_generic BOOLEAN := false;
  cluster_count INT := 0;
BEGIN
  IF NEW.event_name IS NULL
     OR NEW.event_name ~* '^\s*Match\s+\d+\s+Group\s+[A-L]\s*$'
     OR NEW.event_name ~* '^\s*Group\s+Stage\s+Match'
     OR NEW.event_name ~* '^\s*World\s+Cup\s+Match' THEN
    is_generic := true;
    reasons := array_append(reasons, 'generic_title');
  END IF;

  IF NEW.provider_event_id IS NULL OR btrim(NEW.provider_event_id) = '' THEN
    reasons := array_append(reasons, 'no_event_id');
  END IF;

  IF NEW.extraction_source IS NULL OR NEW.extraction_source IN ('schedule_page','search_page') THEN
    reasons := array_append(reasons, 'generic_extraction');
  END IF;

  IF NEW.stadium_confidence = 'low' THEN
    reasons := array_append(reasons, 'stadium_fallback');
  END IF;

  IF NEW.event_date IS NOT NULL AND NEW.stadium_slug IS NOT NULL THEN
    SELECT count(*) INTO cluster_count
      FROM public.wc_ticket_coverage
     WHERE stadium_slug = NEW.stadium_slug
       AND event_date::date = NEW.event_date::date
       AND archived_at IS NULL
       AND id <> NEW.id;
    IF cluster_count > 5 THEN
      reasons := array_append(reasons, 'bulk_cluster');
    END IF;
  END IF;

  NEW.quality_reasons := reasons;
  IF array_length(reasons,1) IS NULL THEN
    NEW.quality_score := 'high';
  ELSIF 'generic_title' = ANY(reasons) OR 'generic_extraction' = ANY(reasons) OR 'bulk_cluster' = ANY(reasons) THEN
    NEW.quality_score := 'low';
  ELSE
    NEW.quality_score := 'medium';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wc_coverage_compute_quality ON public.wc_ticket_coverage;
CREATE TRIGGER trg_wc_coverage_compute_quality
BEFORE INSERT OR UPDATE ON public.wc_ticket_coverage
FOR EACH ROW EXECUTE FUNCTION public.wc_coverage_compute_quality();