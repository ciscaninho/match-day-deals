CREATE TABLE public.club_duplicate_dismissals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug_a text NOT NULL,
  slug_b text NOT NULL,
  reason text,
  kind text NOT NULL DEFAULT 'separate_clubs',
  dismissed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT club_dismissal_pair_order CHECK (slug_a < slug_b),
  CONSTRAINT club_dismissal_unique UNIQUE (slug_a, slug_b)
);

ALTER TABLE public.club_duplicate_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage club duplicate dismissals"
ON public.club_duplicate_dismissals
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));