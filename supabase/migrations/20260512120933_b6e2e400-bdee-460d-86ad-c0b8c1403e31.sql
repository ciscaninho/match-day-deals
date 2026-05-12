alter table public.stadiums
  add column if not exists aliases text[] not null default '{}'::text[],
  add column if not exists archived_at timestamp with time zone,
  add column if not exists archived_reason text,
  add column if not exists archived_into_stadium_id uuid references public.stadiums(id),
  add column if not exists archived_into_slug text;

create index if not exists idx_stadiums_archived_at on public.stadiums (archived_at);
create index if not exists idx_stadiums_archived_into_slug on public.stadiums (archived_into_slug);

alter table public.admin_actions
  add column if not exists result jsonb not null default '{}'::jsonb;