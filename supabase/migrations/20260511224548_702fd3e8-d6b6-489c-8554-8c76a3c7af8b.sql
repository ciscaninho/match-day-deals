
ALTER TABLE public.stadium_media_history
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS manual_stadium_id uuid,
  ADD COLUMN IF NOT EXISTS drive_thumbnail_link text,
  ADD COLUMN IF NOT EXISTS drive_image_width integer,
  ADD COLUMN IF NOT EXISTS drive_image_height integer;

CREATE INDEX IF NOT EXISTS idx_stadium_media_history_import_review
  ON public.stadium_media_history (import_id, review_status);
