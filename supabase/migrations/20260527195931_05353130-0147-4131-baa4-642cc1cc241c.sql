
CREATE TABLE IF NOT EXISTS public.stadium_aliases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name text NOT NULL,
  provider text NOT NULL DEFAULT 'unknown',
  canonical_stadium_id uuid NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  confidence text NOT NULL DEFAULT 'medium',
  auto_resolved boolean NOT NULL DEFAULT false,
  manually_verified boolean NOT NULL DEFAULT false,
  verified_by uuid,
  verified_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS stadium_aliases_provider_name_uq
  ON public.stadium_aliases (lower(provider_name), provider);
CREATE INDEX IF NOT EXISTS stadium_aliases_stadium_idx
  ON public.stadium_aliases (canonical_stadium_id);

GRANT SELECT ON public.stadium_aliases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stadium_aliases TO authenticated;
GRANT ALL ON public.stadium_aliases TO service_role;

ALTER TABLE public.stadium_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stadium aliases"
  ON public.stadium_aliases FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage stadium aliases"
  ON public.stadium_aliases FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER stadium_aliases_set_updated_at
  BEFORE UPDATE ON public.stadium_aliases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
