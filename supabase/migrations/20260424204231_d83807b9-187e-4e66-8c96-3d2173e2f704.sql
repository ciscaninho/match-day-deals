-- Temporary test-phase policies: allow anyone to insert/update matches.
-- Remove and restore admin-only policies before production.
DROP POLICY IF EXISTS "Anyone can insert matches (test)" ON public.matches;
DROP POLICY IF EXISTS "Anyone can update matches (test)" ON public.matches;

CREATE POLICY "Anyone can insert matches (test)"
ON public.matches
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update matches (test)"
ON public.matches
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);