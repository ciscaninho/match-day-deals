
-- ============ STADIUMS RLS HARDENING ============
DROP POLICY IF EXISTS "Public view active stadiums" ON public.stadiums;
DROP POLICY IF EXISTS "Admins can view archived stadiums" ON public.stadiums;

CREATE POLICY "View stadiums (active for all, archived for admins)"
ON public.stadiums
FOR SELECT
TO anon, authenticated
USING (archived_at IS NULL OR public.has_role(auth.uid(), 'admin'));

-- ============ CLUB ARCHIVE COLUMNS ============
ALTER TABLE public.club_ticketing_profiles
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_reason text,
  ADD COLUMN IF NOT EXISTS archived_into_club_id uuid,
  ADD COLUMN IF NOT EXISTS archived_into_slug text,
  ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}'::text[];

-- ============ CLUBS RLS HARDENING ============
DROP POLICY IF EXISTS "Anyone can view club ticketing profiles" ON public.club_ticketing_profiles;

CREATE POLICY "View clubs (active for all, archived for admins)"
ON public.club_ticketing_profiles
FOR SELECT
TO anon, authenticated
USING (archived_at IS NULL OR public.has_role(auth.uid(), 'admin'));

-- ============ MERGE CLUB FUNCTION ============
CREATE OR REPLACE FUNCTION public.merge_club_records(
  p_canonical_slug text,
  p_duplicate_slug text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  canonical_row public.club_ticketing_profiles%rowtype;
  duplicate_row public.club_ticketing_profiles%rowtype;
  merged_aliases text[] := '{}'::text[];
  matches_reassigned integer := 0;
  saved_reassigned integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT * INTO canonical_row FROM public.club_ticketing_profiles
    WHERE slug = p_canonical_slug AND archived_at IS NULL LIMIT 1;
  IF canonical_row.id IS NULL THEN RAISE EXCEPTION 'canonical_not_found'; END IF;

  SELECT * INTO duplicate_row FROM public.club_ticketing_profiles
    WHERE slug = p_duplicate_slug LIMIT 1;
  IF duplicate_row.id IS NULL THEN RAISE EXCEPTION 'duplicate_not_found'; END IF;
  IF duplicate_row.archived_at IS NOT NULL THEN RAISE EXCEPTION 'duplicate_already_archived'; END IF;
  IF canonical_row.id = duplicate_row.id THEN RAISE EXCEPTION 'same_club'; END IF;

  -- Build merged aliases
  SELECT COALESCE(array_agg(DISTINCT item), '{}'::text[]) INTO merged_aliases
  FROM unnest(
    COALESCE(canonical_row.aliases, '{}'::text[])
    || COALESCE(duplicate_row.aliases, '{}'::text[])
    || ARRAY[duplicate_row.club_name, duplicate_row.slug, duplicate_row.short_name]
  ) AS item
  WHERE NULLIF(btrim(item), '') IS NOT NULL
    AND lower(btrim(item)) <> lower(btrim(canonical_row.club_name));

  -- Update canonical: aliases + fill missing fields from duplicate
  UPDATE public.club_ticketing_profiles
  SET aliases = merged_aliases,
      short_name = COALESCE(NULLIF(canonical_row.short_name, ''), duplicate_row.short_name),
      country = COALESCE(NULLIF(canonical_row.country, ''), duplicate_row.country),
      city = COALESCE(NULLIF(canonical_row.city, ''), duplicate_row.city),
      league = COALESCE(NULLIF(canonical_row.league, ''), duplicate_row.league),
      stadium_name = COALESCE(NULLIF(canonical_row.stadium_name, ''), duplicate_row.stadium_name),
      stadium_slug = COALESCE(NULLIF(canonical_row.stadium_slug, ''), duplicate_row.stadium_slug),
      logo_url = COALESCE(NULLIF(canonical_row.logo_url, ''), duplicate_row.logo_url),
      hero_image_url = COALESCE(NULLIF(canonical_row.hero_image_url, ''), duplicate_row.hero_image_url),
      official_website = COALESCE(NULLIF(canonical_row.official_website, ''), duplicate_row.official_website),
      official_ticketing_url = COALESCE(NULLIF(canonical_row.official_ticketing_url, ''), duplicate_row.official_ticketing_url),
      updated_at = now()
  WHERE id = canonical_row.id;

  -- Reassign matches that reference the duplicate by name
  UPDATE public.matches
  SET home_team = canonical_row.club_name, updated_at = now()
  WHERE home_team = duplicate_row.club_name;
  GET DIAGNOSTICS matches_reassigned = ROW_COUNT;

  UPDATE public.matches
  SET away_team = canonical_row.club_name, updated_at = now()
  WHERE away_team = duplicate_row.club_name;

  -- Saved matches don't reference clubs directly, so no-op
  saved_reassigned := 0;

  -- Archive duplicate
  UPDATE public.club_ticketing_profiles
  SET archived_at = now(),
      archived_reason = COALESCE(NULLIF(btrim(p_reason), ''), 'Merged into ' || canonical_row.slug),
      archived_into_club_id = canonical_row.id,
      archived_into_slug = canonical_row.slug,
      updated_at = now()
  WHERE id = duplicate_row.id;

  RETURN jsonb_build_object(
    'canonical', jsonb_build_object('slug', canonical_row.slug, 'club_name', canonical_row.club_name),
    'archived', jsonb_build_object('slug', duplicate_row.slug, 'club_name', duplicate_row.club_name),
    'aliases_after_merge', to_jsonb(merged_aliases),
    'matches_reassigned', matches_reassigned
  );
END;
$$;

REVOKE ALL ON FUNCTION public.merge_club_records(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.merge_club_records(text, text, text) TO authenticated;
