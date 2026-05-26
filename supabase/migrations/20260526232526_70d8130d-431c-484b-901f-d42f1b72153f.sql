ALTER TABLE public.wc_ticket_coverage
  ADD COLUMN IF NOT EXISTS provider_event_id text,
  ADD COLUMN IF NOT EXISTS manual_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS wc_ticket_coverage_provider_event_id_idx
  ON public.wc_ticket_coverage (provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;