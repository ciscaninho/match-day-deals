
CREATE TABLE public.stadium_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  stadium_slug text NOT NULL,
  stadium_name text NOT NULL,
  section text,
  atmosphere smallint NOT NULL CHECK (atmosphere BETWEEN 1 AND 5),
  view_rating smallint NOT NULL CHECK (view_rating BETWEEN 1 AND 5),
  facilities smallint NOT NULL CHECK (facilities BETWEEN 1 AND 5),
  accessibility smallint NOT NULL CHECK (accessibility BETWEEN 1 AND 5),
  value smallint NOT NULL CHECK (value BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, stadium_slug)
);

CREATE INDEX idx_stadium_reviews_slug ON public.stadium_reviews(stadium_slug);

ALTER TABLE public.stadium_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stadium reviews"
  ON public.stadium_reviews FOR SELECT USING (true);

CREATE POLICY "Users insert own stadium reviews"
  ON public.stadium_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own stadium reviews"
  ON public.stadium_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own stadium reviews"
  ON public.stadium_reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_stadium_reviews_updated
  BEFORE UPDATE ON public.stadium_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_matches_updated_at();

CREATE TABLE public.stadium_tips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  stadium_slug text NOT NULL,
  tip text NOT NULL CHECK (char_length(tip) BETWEEN 4 AND 240),
  upvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stadium_tips_slug ON public.stadium_tips(stadium_slug);

ALTER TABLE public.stadium_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stadium tips"
  ON public.stadium_tips FOR SELECT USING (true);

CREATE POLICY "Users insert own stadium tips"
  ON public.stadium_tips FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own stadium tips"
  ON public.stadium_tips FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
