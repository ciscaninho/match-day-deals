ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS matchday_style text,
  ADD COLUMN IF NOT EXISTS dream_stadium_slug text,
  ADD COLUMN IF NOT EXISTS stadiums_visited_bucket text,
  ADD COLUMN IF NOT EXISTS alert_preferences jsonb NOT NULL DEFAULT '{}'::jsonb;