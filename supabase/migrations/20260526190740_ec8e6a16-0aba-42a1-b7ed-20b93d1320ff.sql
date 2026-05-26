ALTER TABLE public.wc_ticket_coverage
  ADD COLUMN IF NOT EXISTS match_id text,
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_limited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_sync_status text;

CREATE INDEX IF NOT EXISTS wc_ticket_coverage_match_idx ON public.wc_ticket_coverage(match_id) WHERE match_id IS NOT NULL;