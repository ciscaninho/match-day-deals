ALTER TABLE public.matches DISABLE TRIGGER USER;
UPDATE public.matches SET country = 'United States', updated_at = now() WHERE stadium = 'Levi''s Stadium' AND country <> 'United States';
ALTER TABLE public.matches ENABLE TRIGGER USER;