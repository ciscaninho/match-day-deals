
CREATE TABLE IF NOT EXISTS public.wc_ticombo_discovery_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wc_ticombo_discovery_queue TO authenticated;
GRANT ALL ON public.wc_ticombo_discovery_queue TO service_role;

ALTER TABLE public.wc_ticombo_discovery_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ticombo discovery queue"
  ON public.wc_ticombo_discovery_queue
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_wc_ticombo_queue_status ON public.wc_ticombo_discovery_queue(status);
