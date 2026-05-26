
ALTER TABLE public.wc_ticket_coverage
  ADD COLUMN IF NOT EXISTS price_source text,
  ADD COLUMN IF NOT EXISTS price_confidence text,
  ADD COLUMN IF NOT EXISTS price_checked_at timestamptz;

CREATE INDEX IF NOT EXISTS wc_ticket_coverage_price_confidence_idx
  ON public.wc_ticket_coverage (price_confidence)
  WHERE price_confidence IS NOT NULL;
