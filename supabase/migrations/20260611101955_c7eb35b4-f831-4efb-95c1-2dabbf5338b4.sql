
create extension if not exists pg_trgm;

create table public.club_merge_candidates (
  id uuid primary key default gen_random_uuid(),
  club_a_id uuid not null references public.clubs(id) on delete cascade,
  club_b_id uuid not null references public.clubs(id) on delete cascade,
  confidence text not null check (confidence in ('high','medium','low')),
  signals jsonb not null default '{}'::jsonb,
  recommended_canonical_id uuid references public.clubs(id) on delete set null,
  name_similarity numeric,
  status text not null default 'pending' check (status in ('pending','merged','ignored','later')),
  reviewed_at timestamptz,
  reviewed_by uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_a_id, club_b_id)
);

grant select, insert, update, delete on public.club_merge_candidates to authenticated;
grant all on public.club_merge_candidates to service_role;
alter table public.club_merge_candidates enable row level security;
create policy "admins read merge candidates" on public.club_merge_candidates for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins write merge candidates" on public.club_merge_candidates for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create trigger trg_club_merge_candidates_updated_at
  before update on public.club_merge_candidates
  for each row execute function public.update_updated_at_column();

create index if not exists idx_cmc_status on public.club_merge_candidates(status);
create index if not exists idx_cmc_confidence on public.club_merge_candidates(confidence);

create or replace function public.pick_canonical_club(_a uuid, _b uuid)
returns uuid language sql stable security definer set search_path = public as $$
  with pair as (
    select c.*,
      exists(select 1 from public.club_ticketing_profiles t where t.club_id=c.id and t.archived_at is null) as has_ticketing
    from public.clubs c where c.id in (_a,_b)
  ),
  scored as (
    select id,
      (case when has_ticketing then 100 else 0 end)
    + (case when club_type <> 'identity_only' then 50 else 0 end)
    + (case when publication_status='published' then 40 else 0 end)
    + (case when coalesce(seo_title,'')<>'' or coalesce(seo_description,'')<>'' then 20 else 0 end)
    + (case when coalesce(crest_url,'')<>'' then 10 else 0 end)
    + (case when coalesce(hero_image_url,'')<>'' then 5 else 0 end)
    - (extract(epoch from created_at)/1e10) as score
    from pair
  )
  select id from scored order by score desc, id limit 1
$$;

create or replace function public.merge_clubs_master(p_canonical_id uuid, p_duplicate_id uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  canon public.clubs%rowtype;
  dup public.clubs%rowtype;
  merged_aliases text[];
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'not_authorized'; end if;
  if p_canonical_id = p_duplicate_id then raise exception 'same_club'; end if;

  select * into canon from public.clubs where id=p_canonical_id and archived_at is null;
  if canon.id is null then raise exception 'canonical_not_found'; end if;
  select * into dup from public.clubs where id=p_duplicate_id;
  if dup.id is null then raise exception 'duplicate_not_found'; end if;
  if dup.archived_at is not null then raise exception 'duplicate_already_archived'; end if;

  select coalesce(array_agg(distinct x), '{}'::text[]) into merged_aliases
  from unnest(
    coalesce(canon.aliases,'{}'::text[]) || coalesce(dup.aliases,'{}'::text[])
    || array[dup.club_name, dup.slug, dup.short_name]
  ) x
  where nullif(btrim(x),'') is not null
    and lower(btrim(x)) <> lower(btrim(canon.club_name));

  update public.clubs set
    aliases = merged_aliases,
    short_name = coalesce(nullif(canon.short_name,''), dup.short_name),
    country_id = coalesce(canon.country_id, dup.country_id),
    primary_league_id = coalesce(canon.primary_league_id, dup.primary_league_id),
    home_stadium_id = coalesce(canon.home_stadium_id, dup.home_stadium_id),
    founded_year = coalesce(canon.founded_year, dup.founded_year),
    crest_url = coalesce(nullif(canon.crest_url,''), dup.crest_url),
    hero_image_url = coalesce(nullif(canon.hero_image_url,''), dup.hero_image_url),
    official_website = coalesce(nullif(canon.official_website,''), dup.official_website),
    seo_title = coalesce(nullif(canon.seo_title,''), dup.seo_title),
    seo_description = coalesce(nullif(canon.seo_description,''), dup.seo_description),
    publication_status = case
      when canon.publication_status='published' or dup.publication_status='published' then 'published'
      else canon.publication_status end,
    updated_at = now()
  where id = canon.id;

  update public.club_ticketing_profiles set club_id = canon.id, updated_at = now()
   where club_id = dup.id
     and not exists (select 1 from public.club_ticketing_profiles where club_id = canon.id and archived_at is null);

  update public.club_stadiums cs set club_id = canon.id
   where cs.club_id = dup.id
     and not exists (
       select 1 from public.club_stadiums x
       where x.club_id = canon.id and x.stadium_id = cs.stadium_id and coalesce(x.role,'') = coalesce(cs.role,'')
     );
  delete from public.club_stadiums where club_id = dup.id;

  update public.clubs
    set archived_at = now(),
        publication_status = 'hidden',
        updated_at = now()
  where id = dup.id;

  update public.club_merge_candidates
   set status='merged', reviewed_at=now(), reviewed_by=auth.uid(), updated_at=now()
   where (club_a_id=dup.id or club_b_id=dup.id) and status='pending';

  return jsonb_build_object('canonical_id', canon.id, 'duplicate_id', dup.id, 'aliases', to_jsonb(merged_aliases), 'reason', p_reason);
end $$;

create or replace function public.detect_club_duplicates()
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_high int := 0; v_med int := 0; v_low int := 0;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'not_authorized'; end if;

  with pairs as (
    select a.id a_id, b.id b_id,
      (a.country_id is not null and a.country_id=b.country_id)::int same_country,
      (a.primary_league_id is not null and a.primary_league_id=b.primary_league_id)::int same_league,
      (a.home_stadium_id is not null and a.home_stadium_id=b.home_stadium_id)::int same_stadium,
      greatest(
        similarity(lower(a.club_name), lower(b.club_name)),
        similarity(lower(a.slug), lower(b.slug))
      ) name_sim
    from public.clubs a
    join public.clubs b on a.id < b.id
      and a.archived_at is null and b.archived_at is null
      and (
        (a.home_stadium_id is not null and a.home_stadium_id=b.home_stadium_id)
        or (a.country_id is not null and a.country_id=b.country_id
            and similarity(lower(a.club_name), lower(b.club_name)) > 0.4)
      )
  ),
  scored as (
    select a_id, b_id, same_country, same_league, same_stadium, name_sim,
      case
        when same_stadium=1 and same_country=1 and (same_league=1 or name_sim>=0.45) then 'high'
        when (same_stadium + same_country + same_league) >= 2 and name_sim >= 0.4 then 'medium'
        when same_stadium=1 and name_sim >= 0.3 then 'medium'
        when name_sim >= 0.6 then 'medium'
        else 'low'
      end as conf
    from pairs where name_sim >= 0.3
  )
  insert into public.club_merge_candidates (club_a_id, club_b_id, confidence, signals, recommended_canonical_id, name_similarity)
  select a_id, b_id, conf,
    jsonb_build_object(
      'same_stadium', same_stadium=1,
      'same_country', same_country=1,
      'same_league', same_league=1,
      'name_similarity', round(name_sim::numeric, 3)
    ),
    public.pick_canonical_club(a_id, b_id),
    round(name_sim::numeric, 3)
  from scored
  on conflict (club_a_id, club_b_id) do update
    set confidence = excluded.confidence,
        signals = excluded.signals,
        recommended_canonical_id = excluded.recommended_canonical_id,
        name_similarity = excluded.name_similarity,
        updated_at = now()
    where public.club_merge_candidates.status = 'pending';

  select count(*) filter (where confidence='high'),
         count(*) filter (where confidence='medium'),
         count(*) filter (where confidence='low')
    into v_high, v_med, v_low
  from public.club_merge_candidates where status='pending';

  return jsonb_build_object('high', v_high, 'medium', v_med, 'low', v_low);
end $$;

create or replace function public.auto_merge_high_confidence_clubs()
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; merged int := 0; failed int := 0;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'not_authorized'; end if;
  for r in
    select id, club_a_id, club_b_id, recommended_canonical_id
    from public.club_merge_candidates
    where status='pending' and confidence='high' and recommended_canonical_id is not null
  loop
    begin
      perform public.merge_clubs_master(
        r.recommended_canonical_id,
        case when r.recommended_canonical_id = r.club_a_id then r.club_b_id else r.club_a_id end,
        'auto_high_confidence'
      );
      merged := merged + 1;
    exception when others then
      failed := failed + 1;
      update public.club_merge_candidates
         set notes = 'auto_merge_error: '||SQLERRM, updated_at = now()
       where id = r.id;
    end;
  end loop;
  return jsonb_build_object('merged', merged, 'failed', failed);
end $$;
