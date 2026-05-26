ALTER TABLE public.wc_ticket_coverage
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ticket_url text;

UPDATE public.wc_ticket_coverage
SET active = true,
    ticket_url = COALESCE(ticket_url, url),
    updated_at = now()
WHERE active IS DISTINCT FROM true
   OR ticket_url IS NULL;

CREATE INDEX IF NOT EXISTS wc_ticket_coverage_provider_active_idx
  ON public.wc_ticket_coverage (provider, active);

CREATE INDEX IF NOT EXISTS wc_ticket_coverage_ticket_url_idx
  ON public.wc_ticket_coverage (ticket_url)
  WHERE ticket_url IS NOT NULL;