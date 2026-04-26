-- Supprimer les policies de test dangereuses sur la table matches
-- Elles permettaient à n'importe qui (anonyme) d'insérer ou modifier des matchs

DROP POLICY IF EXISTS "Anyone can insert matches (test)" ON public.matches;
DROP POLICY IF EXISTS "Anyone can update matches (test)" ON public.matches;

-- Les policies suivantes restent en place et sont les bonnes :
-- - "Anyone can view matches" (SELECT public) → tout le monde peut LIRE les matchs
-- - "Admins can insert matches" → seuls les admins peuvent AJOUTER
-- - "Admins can update matches" → seuls les admins peuvent MODIFIER
-- - "Admins can delete matches" → seuls les admins peuvent SUPPRIMER