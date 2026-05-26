
DROP INDEX IF EXISTS public.wc_ticket_coverage_event_provider_uidx;
DROP INDEX IF EXISTS public.wc_ticket_coverage_event_slug_provider_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS wc_ticket_coverage_event_provider_unique
  ON public.wc_ticket_coverage (event_slug, provider);
