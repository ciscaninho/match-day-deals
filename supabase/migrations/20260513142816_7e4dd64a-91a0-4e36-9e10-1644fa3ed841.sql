-- 1) Add admin gate to merge_stadium_records (mirrors merge_club_records)
CREATE OR REPLACE FUNCTION public.merge_stadium_records(p_canonical_slug text, p_duplicate_slug text, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  canonical_row public.stadiums%rowtype;
  duplicate_row public.stadiums%rowtype;
  merged_aliases text[] := '{}'::text[];
  merged_clubs text[] := '{}'::text[];
  clubs_reassigned integer := 0;
  matches_reassigned integer := 0;
  experience_tips_reassigned integer := 0;
  reviews_reassigned integer := 0;
  tips_reassigned integer := 0;
  visits_reassigned integer := 0;
  profiles_reassigned integer := 0;
  preferences_reassigned integer := 0;
  suggestions_reassigned integer := 0;
  media_history_reassigned integer := 0;
  media_history_manual_reassigned integer := 0;
  image_staging_reassigned integer := 0;
  master_staging_reassigned integer := 0;
begin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  select * into canonical_row from public.stadiums where slug = p_canonical_slug and archived_at is null limit 1;
  if canonical_row.id is null then raise exception 'canonical_not_found'; end if;

  select * into duplicate_row from public.stadiums where slug = p_duplicate_slug limit 1;
  if duplicate_row.id is null then raise exception 'duplicate_not_found'; end if;
  if duplicate_row.archived_at is not null then raise exception 'duplicate_already_archived'; end if;
  if canonical_row.id = duplicate_row.id then raise exception 'same_stadium'; end if;

  select coalesce(array_agg(distinct item), '{}'::text[]) into merged_aliases
  from unnest(coalesce(canonical_row.aliases, '{}'::text[]) || coalesce(duplicate_row.aliases, '{}'::text[]) || array[duplicate_row.stadium_name, duplicate_row.slug]) as item
  where nullif(btrim(item), '') is not null and lower(btrim(item)) <> lower(btrim(canonical_row.stadium_name));

  select coalesce(array_agg(distinct item), '{}'::text[]) into merged_clubs
  from unnest(coalesce(canonical_row.clubs, '{}'::text[]) || coalesce(duplicate_row.clubs, '{}'::text[])) as item
  where nullif(btrim(item), '') is not null;

  update public.stadiums set aliases = merged_aliases, clubs = merged_clubs, updated_at = now() where id = canonical_row.id;

  update public.club_ticketing_profiles set stadium_slug = canonical_row.slug, stadium_name = canonical_row.stadium_name, updated_at = now()
  where stadium_slug = duplicate_row.slug or (stadium_slug is null and stadium_name = duplicate_row.stadium_name);
  get diagnostics clubs_reassigned = row_count;

  update public.matches set stadium = canonical_row.stadium_name, updated_at = now() where stadium = duplicate_row.stadium_name;
  get diagnostics matches_reassigned = row_count;

  update public.stadium_experience_tips set stadium_slug = canonical_row.slug, updated_at = now() where stadium_slug = duplicate_row.slug;
  get diagnostics experience_tips_reassigned = row_count;

  update public.stadium_reviews set stadium_slug = canonical_row.slug, stadium_name = canonical_row.stadium_name, updated_at = now()
  where stadium_slug = duplicate_row.slug or stadium_name = duplicate_row.stadium_name;
  get diagnostics reviews_reassigned = row_count;

  update public.stadium_tips set stadium_slug = canonical_row.slug where stadium_slug = duplicate_row.slug;
  get diagnostics tips_reassigned = row_count;

  update public.stadium_visits set stadium_slug = canonical_row.slug, stadium_name = canonical_row.stadium_name, updated_at = now()
  where stadium_slug = duplicate_row.slug or stadium_name = duplicate_row.stadium_name;
  get diagnostics visits_reassigned = row_count;

  update public.profiles set favorite_stadium_slug = canonical_row.slug, updated_at = now() where favorite_stadium_slug = duplicate_row.slug;
  get diagnostics profiles_reassigned = row_count;

  update public.user_preferences set dream_stadium_slug = canonical_row.slug, updated_at = now() where dream_stadium_slug = duplicate_row.slug;
  get diagnostics preferences_reassigned = row_count;

  update public.stadium_suggestions set resulting_stadium_slug = canonical_row.slug, updated_at = now() where resulting_stadium_slug = duplicate_row.slug;
  get diagnostics suggestions_reassigned = row_count;

  update public.stadium_media_history set matched_stadium_id = canonical_row.id, matched_stadium_slug = canonical_row.slug, matched_stadium_name = canonical_row.stadium_name
  where matched_stadium_id = duplicate_row.id or matched_stadium_slug = duplicate_row.slug or matched_stadium_name = duplicate_row.stadium_name;
  get diagnostics media_history_reassigned = row_count;

  update public.stadium_media_history set manual_stadium_id = canonical_row.id where manual_stadium_id = duplicate_row.id;
  get diagnostics media_history_manual_reassigned = row_count;

  update public.stadium_image_staging
  set suggested_stadium_id = case when suggested_stadium_id = duplicate_row.id then canonical_row.id else suggested_stadium_id end,
      published_stadium_id = case when published_stadium_id = duplicate_row.id then canonical_row.id else published_stadium_id end
  where suggested_stadium_id = duplicate_row.id or published_stadium_id = duplicate_row.id;
  get diagnostics image_staging_reassigned = row_count;

  update public.stadiums_master_staging set production_stadium_id = canonical_row.id, updated_at = now() where production_stadium_id = duplicate_row.id;
  get diagnostics master_staging_reassigned = row_count;

  update public.stadiums set archived_at = now(),
      archived_reason = coalesce(nullif(btrim(p_reason), ''), 'Merged into ' || canonical_row.slug),
      archived_into_stadium_id = canonical_row.id,
      archived_into_slug = canonical_row.slug,
      clubs = '{}'::text[],
      updated_at = now()
  where id = duplicate_row.id;

  return jsonb_build_object(
    'canonical', jsonb_build_object('id', canonical_row.id, 'slug', canonical_row.slug, 'stadium_name', canonical_row.stadium_name),
    'archived', jsonb_build_object('id', duplicate_row.id, 'slug', duplicate_row.slug, 'stadium_name', duplicate_row.stadium_name),
    'aliases_added', to_jsonb(merged_aliases),
    'clubs_after_merge', to_jsonb(merged_clubs),
    'reassigned', jsonb_build_object(
      'clubs', clubs_reassigned, 'matches', matches_reassigned, 'experience_tips', experience_tips_reassigned,
      'reviews', reviews_reassigned, 'tips', tips_reassigned, 'visits', visits_reassigned,
      'profiles', profiles_reassigned, 'preferences', preferences_reassigned, 'suggestions', suggestions_reassigned,
      'media_history', media_history_reassigned, 'media_history_manual', media_history_manual_reassigned,
      'image_staging', image_staging_reassigned, 'master_staging', master_staging_reassigned
    )
  );
end;
$function$;

-- 2) Tighten stadium-media bucket: drop public listing policy, restrict to admins.
-- Public URL fetches still work because the bucket is marked public (served via storage CDN).
DROP POLICY IF EXISTS "Public can view stadium media" ON storage.objects;

CREATE POLICY "Admins list stadium media"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'stadium-media' AND has_role(auth.uid(), 'admin'::app_role));
