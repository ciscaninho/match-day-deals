
ALTER TABLE public.wc_ticket_coverage
  ADD COLUMN IF NOT EXISTS event_name text,
  ADD COLUMN IF NOT EXISTS event_slug text,
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS event_time time,
  ADD COLUMN IF NOT EXISTS event_status text,
  ADD COLUMN IF NOT EXISTS home_label text,
  ADD COLUMN IF NOT EXISTS away_label text,
  ADD COLUMN IF NOT EXISTS ticket_source_type text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS last_price_check timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS wc_ticket_coverage_event_provider_uidx
  ON public.wc_ticket_coverage (event_slug, provider)
  WHERE event_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS wc_ticket_coverage_event_date_idx
  ON public.wc_ticket_coverage (event_date)
  WHERE event_date IS NOT NULL;
