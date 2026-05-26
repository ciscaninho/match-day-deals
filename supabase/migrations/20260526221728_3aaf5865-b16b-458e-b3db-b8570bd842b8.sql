CREATE UNIQUE INDEX IF NOT EXISTS wc_ticket_coverage_event_slug_provider_uidx
  ON public.wc_ticket_coverage (event_slug, provider)
  WHERE event_slug IS NOT NULL;