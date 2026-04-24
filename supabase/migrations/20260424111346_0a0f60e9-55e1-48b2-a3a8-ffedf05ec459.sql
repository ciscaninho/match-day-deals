-- Create matches table with full schema to preserve existing UI
CREATE TABLE public.matches (
  id text PRIMARY KEY,
  home_team text NOT NULL,
  away_team text NOT NULL,
  home_short text NOT NULL,
  away_short text NOT NULL,
  competition text NOT NULL,
  country text NOT NULL DEFAULT '',
  date timestamptz NOT NULL,
  stadium text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  starting_price numeric,
  ticket_status text NOT NULL DEFAULT 'not_released',
  ticket_release_date timestamptz,
  ticket_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured boolean NOT NULL DEFAULT false,
  priority boolean NOT NULL DEFAULT false,
  official_link text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Public read (matches are public info)
CREATE POLICY "Anyone can view matches"
ON public.matches
FOR SELECT
USING (true);

-- Only admins can modify matches
CREATE POLICY "Admins can insert matches"
ON public.matches
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update matches"
ON public.matches
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete matches"
ON public.matches
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Reuse existing timestamp helper (create if not exists)
CREATE OR REPLACE FUNCTION public.update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_matches_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.update_matches_updated_at();

-- Indexes for filters
CREATE INDEX idx_matches_date ON public.matches(date);
CREATE INDEX idx_matches_competition ON public.matches(competition);
CREATE INDEX idx_matches_country ON public.matches(country);
CREATE INDEX idx_matches_featured ON public.matches(featured) WHERE featured = true;
CREATE INDEX idx_matches_priority ON public.matches(priority) WHERE priority = true;