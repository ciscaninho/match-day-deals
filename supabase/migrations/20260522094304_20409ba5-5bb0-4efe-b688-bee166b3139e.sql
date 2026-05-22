
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS phase text,
  ADD COLUMN IF NOT EXISTS matchday integer,
  ADD COLUMN IF NOT EXISTS group_code text,
  ADD COLUMN IF NOT EXISTS kickoff_local time,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS stadium_id uuid,
  ADD COLUMN IF NOT EXISTS import_source text,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS matches_slug_unique ON public.matches(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS matches_stadium_id_idx ON public.matches(stadium_id);
CREATE INDEX IF NOT EXISTS matches_import_batch_idx ON public.matches(import_batch_id);

CREATE TABLE IF NOT EXISTS public.wc_match_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  proposed jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid,
  applied_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wc_match_import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage wc match import batches" ON public.wc_match_import_batches;
CREATE POLICY "Admins manage wc match import batches"
  ON public.wc_match_import_batches
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_wc_match_import_batches_touch ON public.wc_match_import_batches;
CREATE TRIGGER trg_wc_match_import_batches_touch
  BEFORE UPDATE ON public.wc_match_import_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
