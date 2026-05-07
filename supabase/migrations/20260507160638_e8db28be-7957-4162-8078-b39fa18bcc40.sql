
-- Future-ready columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_stadium_slug text,
  ADD COLUMN IF NOT EXISTS favorite_atmosphere text;

ALTER TABLE public.stadiums
  ADD COLUMN IF NOT EXISTS continent text;

-- ============================================================
-- stadium_visits: Stadium Passport core
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stadium_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stadium_slug text NOT NULL,
  stadium_name text NOT NULL,
  city text,
  country text,
  visit_date date,
  match_label text,
  match_id text,
  overall_rating smallint CHECK (overall_rating BETWEEN 1 AND 10),
  atmosphere_rating smallint CHECK (atmosphere_rating BETWEEN 1 AND 10),
  favorite_section text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, stadium_slug, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_stadium_visits_user ON public.stadium_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_stadium_visits_slug ON public.stadium_visits(stadium_slug);

ALTER TABLE public.stadium_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stadium visits"
  ON public.stadium_visits FOR SELECT USING (true);

CREATE POLICY "Users insert own stadium visits"
  ON public.stadium_visits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own stadium visits"
  ON public.stadium_visits FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own stadium visits"
  ON public.stadium_visits FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage stadium visits"
  ON public.stadium_visits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_stadium_visits_updated
  BEFORE UPDATE ON public.stadium_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_matches_updated_at();

-- ============================================================
-- stadium_experience_tips: Stadium Experience layer
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stadium_experience_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stadium_slug text NOT NULL,
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('general','transport','food','pre_match','best_section','atmosphere')),
  tip text NOT NULL,
  upvotes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experience_tips_slug ON public.stadium_experience_tips(stadium_slug);
CREATE INDEX IF NOT EXISTS idx_experience_tips_user ON public.stadium_experience_tips(user_id);

ALTER TABLE public.stadium_experience_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view experience tips"
  ON public.stadium_experience_tips FOR SELECT USING (true);

CREATE POLICY "Users insert own experience tips"
  ON public.stadium_experience_tips FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own experience tips"
  ON public.stadium_experience_tips FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own experience tips"
  ON public.stadium_experience_tips FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage experience tips"
  ON public.stadium_experience_tips FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_experience_tips_updated
  BEFORE UPDATE ON public.stadium_experience_tips
  FOR EACH ROW EXECUTE FUNCTION public.update_matches_updated_at();

-- ============================================================
-- stadium_suggestions: user submissions + moderation
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stadium_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  stadium_name text NOT NULL,
  club text,
  city text,
  country text,
  league text,
  notes text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','duplicate')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  resulting_stadium_slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.stadium_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_user ON public.stadium_suggestions(user_id);

ALTER TABLE public.stadium_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved suggestions"
  ON public.stadium_suggestions FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users view own suggestions"
  ON public.stadium_suggestions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all suggestions"
  ON public.stadium_suggestions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can submit a suggestion"
  ON public.stadium_suggestions FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Admins update suggestions"
  ON public.stadium_suggestions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete suggestions"
  ON public.stadium_suggestions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_suggestions_updated
  BEFORE UPDATE ON public.stadium_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_matches_updated_at();
