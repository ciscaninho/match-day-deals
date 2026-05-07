ALTER TABLE public.stadiums ADD COLUMN IF NOT EXISTS league_slug text;

UPDATE public.stadiums
SET league_slug = lower(
  regexp_replace(
    regexp_replace(country || '-' || league, '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-+|-+$)', '', 'g'
  )
)
WHERE league_slug IS NULL OR league_slug = '';

CREATE INDEX IF NOT EXISTS idx_stadiums_league_slug ON public.stadiums(league_slug);