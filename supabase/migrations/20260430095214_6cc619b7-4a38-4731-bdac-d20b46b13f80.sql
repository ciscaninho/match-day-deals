CREATE TABLE public.ticket_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_logo TEXT,
  price NUMERIC,
  currency TEXT NOT NULL DEFAULT 'EUR',
  category TEXT,
  url TEXT NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  last_checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_offers_match_id ON public.ticket_offers(match_id);
CREATE INDEX idx_ticket_offers_price ON public.ticket_offers(match_id, price);

ALTER TABLE public.ticket_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ticket offers"
ON public.ticket_offers
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert ticket offers"
ON public.ticket_offers
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ticket offers"
ON public.ticket_offers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ticket offers"
ON public.ticket_offers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_ticket_offers_updated_at
BEFORE UPDATE ON public.ticket_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_matches_updated_at();