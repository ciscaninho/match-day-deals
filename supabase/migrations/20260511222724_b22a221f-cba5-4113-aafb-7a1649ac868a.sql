-- 1. Storage bucket for curated stadium media (public read, admin write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'stadium-media',
  'stadium-media',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
drop policy if exists "Public can view stadium media" on storage.objects;
create policy "Public can view stadium media"
  on storage.objects for select
  using (bucket_id = 'stadium-media');

drop policy if exists "Admins upload stadium media" on storage.objects;
create policy "Admins upload stadium media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'stadium-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins update stadium media" on storage.objects;
create policy "Admins update stadium media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'stadium-media' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'stadium-media' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins delete stadium media" on storage.objects;
create policy "Admins delete stadium media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'stadium-media' and public.has_role(auth.uid(), 'admin'));

-- 2. Imports table (one row per sync run)
create table if not exists public.stadium_media_imports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  triggered_by uuid,
  dry_run boolean not null default true,
  source text not null default 'google_drive',
  folder_id text,
  status text not null default 'running',
  total_files integer not null default 0,
  matched_count integer not null default 0,
  ambiguous_count integer not null default 0,
  unmatched_count integer not null default 0,
  would_overwrite_count integer not null default 0,
  duplicate_count integer not null default 0,
  imported_count integer not null default 0,
  error_message text,
  report jsonb not null default '{}'::jsonb
);

alter table public.stadium_media_imports enable row level security;

drop policy if exists "Admins manage stadium media imports" on public.stadium_media_imports;
create policy "Admins manage stadium media imports"
  on public.stadium_media_imports for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 3. History table (one row per file decision in a run)
create table if not exists public.stadium_media_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  import_id uuid references public.stadium_media_imports(id) on delete cascade,
  drive_file_id text,
  drive_file_name text not null,
  drive_mime_type text,
  drive_size_bytes bigint,
  normalized_name text,
  matched_stadium_id uuid,
  matched_stadium_slug text,
  matched_stadium_name text,
  match_confidence text not null default 'none',
  match_type text not null default 'none',
  candidates jsonb not null default '[]'::jsonb,
  action text not null default 'skip',
  would_overwrite boolean not null default false,
  previous_image_url text,
  destination_path text,
  destination_public_url text,
  notes text
);

create index if not exists idx_stadium_media_history_import on public.stadium_media_history(import_id);
create index if not exists idx_stadium_media_history_slug on public.stadium_media_history(matched_stadium_slug);

alter table public.stadium_media_history enable row level security;

drop policy if exists "Admins manage stadium media history" on public.stadium_media_history;
create policy "Admins manage stadium media history"
  on public.stadium_media_history for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));