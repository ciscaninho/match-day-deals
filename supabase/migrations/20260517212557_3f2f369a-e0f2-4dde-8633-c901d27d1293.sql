-- Wave 1: Ticketing Operations Center foundation

-- 1. Extend club_ticketing_profiles with verification + operational metadata
ALTER TABLE public.club_ticketing_profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS source_confidence text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS geo_restrictions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS tickets_last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS tickets_checked_by uuid;

-- 2. Create ticket_sources table (one club -> many sources)
CREATE TABLE IF NOT EXISTS public.ticket_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_slug text NOT NULL,
  kind text NOT NULL DEFAULT 'official', -- official | hospitality | resale | affiliate
  provider_name text NOT NULL,
  url text NOT NULL,
  deeplink_template text,
  affiliate_network text NOT NULL DEFAULT 'none', -- partnerize | awin | impact | cj | custom | none
  campaign_id text,
  tracking_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  monetization_enabled boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 100,
  verification_status text NOT NULL DEFAULT 'unverified',
  last_checked_at timestamptz,
  checked_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_sources_club_slug ON public.ticket_sources(club_slug);
CREATE INDEX IF NOT EXISTS idx_ticket_sources_kind ON public.ticket_sources(kind);

ALTER TABLE public.ticket_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ticket sources"
  ON public.ticket_sources FOR SELECT
  USING (true);

CREATE POLICY "Admins insert ticket sources"
  ON public.ticket_sources FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update ticket sources"
  ON public.ticket_sources FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete ticket sources"
  ON public.ticket_sources FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.touch_ticket_sources_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_touch_ticket_sources ON public.ticket_sources;
CREATE TRIGGER trg_touch_ticket_sources
  BEFORE UPDATE ON public.ticket_sources
  FOR EACH ROW EXECUTE FUNCTION public.touch_ticket_sources_updated_at();