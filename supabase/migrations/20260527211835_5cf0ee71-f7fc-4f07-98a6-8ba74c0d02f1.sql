ALTER TABLE public.wc_ticket_coverage
  ADD COLUMN IF NOT EXISTS lowest_single_ticket_price NUMERIC,
  ADD COLUMN IF NOT EXISTS quantity_basis INTEGER;