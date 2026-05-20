CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

ALTER TABLE public.stadiums
  ADD COLUMN IF NOT EXISTS is_world_cup_host boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS world_cup_edition text,
  ADD COLUMN IF NOT EXISTS world_cup_role text,
  ADD COLUMN IF NOT EXISTS host_city_context text,
  ADD COLUMN IF NOT EXISTS architecture_notes text,
  ADD COLUMN IF NOT EXISTS seat_recommendations text,
  ADD COLUMN IF NOT EXISTS fan_zones text,
  ADD COLUMN IF NOT EXISTS transport_notes text,
  ADD COLUMN IF NOT EXISTS hospitality_notes text,
  ADD COLUMN IF NOT EXISTS ticket_guidance text,
  ADD COLUMN IF NOT EXISTS matchday_advice text,
  ADD COLUMN IF NOT EXISTS travel_notes text,
  ADD COLUMN IF NOT EXISTS historical_facts text,
  ADD COLUMN IF NOT EXISTS enrichment_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS enrichment_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_stadiums_world_cup_host ON public.stadiums (is_world_cup_host) WHERE is_world_cup_host = true;

CREATE TABLE IF NOT EXISTS public.stadium_enrichment_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id uuid NOT NULL,
  field text NOT NULL,
  proposed_value text NOT NULL,
  rationale text,
  source text DEFAULT 'copilot',
  status text NOT NULL DEFAULT 'pending',
  created_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_proposals_stadium ON public.stadium_enrichment_proposals (stadium_id, status);

ALTER TABLE public.stadium_enrichment_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage enrichment proposals" ON public.stadium_enrichment_proposals;
CREATE POLICY "Admins manage enrichment proposals"
  ON public.stadium_enrichment_proposals
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_enrichment_proposals_updated_at ON public.stadium_enrichment_proposals;
CREATE TRIGGER trg_enrichment_proposals_updated_at
  BEFORE UPDATE ON public.stadium_enrichment_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
