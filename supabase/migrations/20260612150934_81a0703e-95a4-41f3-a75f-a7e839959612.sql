
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS validation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS validated_by uuid;

ALTER TABLE public.clubs
  DROP CONSTRAINT IF EXISTS clubs_validation_status_check;
ALTER TABLE public.clubs
  ADD CONSTRAINT clubs_validation_status_check
  CHECK (validation_status IN ('pending','validated','needs_review'));

CREATE INDEX IF NOT EXISTS idx_clubs_validation_status ON public.clubs(validation_status) WHERE archived_at IS NULL;
