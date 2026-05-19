
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL DEFAULT 'ticket_click',
  club_slug text,
  club_name text,
  stadium_name text,
  league text,
  match_id text,
  provider text,
  network text,
  merchant text,
  destination text,
  transformed text,
  is_tracked boolean NOT NULL DEFAULT false,
  page_path text,
  user_id uuid,
  -- future-ready
  conversion_imported boolean NOT NULL DEFAULT false,
  revenue_estimate numeric,
  epc numeric,
  approval_rate numeric
);

CREATE INDEX IF NOT EXISTS affiliate_clicks_created_at_idx ON public.affiliate_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS affiliate_clicks_merchant_idx ON public.affiliate_clicks(merchant);
CREATE INDEX IF NOT EXISTS affiliate_clicks_club_slug_idx ON public.affiliate_clicks(club_slug);
CREATE INDEX IF NOT EXISTS affiliate_clicks_league_idx ON public.affiliate_clicks(league);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert affiliate clicks"
  ON public.affiliate_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins view affiliate clicks"
  ON public.affiliate_clicks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
