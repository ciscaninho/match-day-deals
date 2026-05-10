-- Extend staging table for review workflow
ALTER TABLE public.stadium_image_staging
  ADD COLUMN IF NOT EXISTS confidence text NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS match_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS suggested_stadium_id uuid,
  ADD COLUMN IF NOT EXISTS published_stadium_id uuid,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS year_opened integer,
  ADD COLUMN IF NOT EXISTS official_website text,
  ADD COLUMN IF NOT EXISTS atmosphere_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.stadium_image_staging
  DROP CONSTRAINT IF EXISTS stadium_image_staging_confidence_check;
ALTER TABLE public.stadium_image_staging
  ADD CONSTRAINT stadium_image_staging_confidence_check
  CHECK (confidence IN ('high','medium','low'));

ALTER TABLE public.stadium_image_staging
  DROP CONSTRAINT IF EXISTS stadium_image_staging_status_check;
ALTER TABLE public.stadium_image_staging
  ADD CONSTRAINT stadium_image_staging_status_check
  CHECK (status IN ('pending','approved','rejected','merged','published'));

CREATE INDEX IF NOT EXISTS idx_staging_status ON public.stadium_image_staging(status);
CREATE INDEX IF NOT EXISTS idx_staging_confidence ON public.stadium_image_staging(confidence);

-- Backfill confidence + suggested match for currently pending rows
WITH norm AS (
  SELECT
    s.id,
    lower(regexp_replace(coalesce(s.stadium_name,''), '[^a-z0-9]+', '', 'gi')) AS sn,
    lower(coalesce(s.city,'')) AS sc,
    lower(coalesce(s.club,'')) AS scl
  FROM public.stadium_image_staging s
),
prod AS (
  SELECT
    p.id,
    lower(regexp_replace(coalesce(p.stadium_name,''), '[^a-z0-9]+', '', 'gi')) AS pn,
    lower(coalesce(p.city,'')) AS pc,
    lower(coalesce(p.club_name,'')) AS pcl
  FROM public.stadiums p
),
matched AS (
  SELECT DISTINCT ON (n.id)
    n.id AS staging_id,
    p.id AS prod_id,
    CASE
      WHEN n.sc <> '' AND n.sc <> 'unknown' AND n.sc = p.pc THEN 'name+city'
      WHEN n.scl <> '' AND n.scl = p.pcl THEN 'name+club'
      ELSE 'name-only'
    END AS mtype,
    CASE
      WHEN n.sc <> '' AND n.sc <> 'unknown' AND n.sc = p.pc THEN 'high'
      WHEN n.scl <> '' AND n.scl = p.pcl THEN 'high'
      ELSE 'medium'
    END AS conf
  FROM norm n
  JOIN prod p ON p.pn = n.sn AND n.sn <> ''
  ORDER BY n.id,
    CASE WHEN n.sc = p.pc AND n.sc <> '' AND n.sc <> 'unknown' THEN 0
         WHEN n.scl = p.pcl AND n.scl <> '' THEN 1
         ELSE 2 END
)
UPDATE public.stadium_image_staging s
SET confidence = m.conf,
    match_type = m.mtype,
    suggested_stadium_id = m.prod_id
FROM matched m
WHERE s.id = m.staging_id
  AND s.status = 'pending';

-- Anything still without a match remains low/none (default)
UPDATE public.stadium_image_staging
SET confidence = 'low', match_type = 'none'
WHERE suggested_stadium_id IS NULL AND status = 'pending';