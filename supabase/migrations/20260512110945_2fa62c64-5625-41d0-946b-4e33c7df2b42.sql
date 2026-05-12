
create table if not exists public.admin_assistant_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.admin_assistant_threads enable row level security;
create policy "Admins manage assistant threads" on public.admin_assistant_threads
  for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create index if not exists admin_assistant_threads_user_idx on public.admin_assistant_threads(user_id, updated_at desc);

create table if not exists public.admin_assistant_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.admin_assistant_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null default '',
  action_id uuid,
  created_at timestamptz not null default now()
);
alter table public.admin_assistant_messages enable row level security;
create policy "Admins manage assistant messages" on public.admin_assistant_messages
  for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create index if not exists admin_assistant_messages_thread_idx on public.admin_assistant_messages(thread_id, created_at);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  preview jsonb not null default '{}'::jsonb,
  status text not null default 'proposed' check (status in ('proposed','approved','executed','rejected','rolled_back','failed')),
  undo_payload jsonb,
  error text,
  created_by uuid not null,
  thread_id uuid references public.admin_assistant_threads(id) on delete set null,
  created_at timestamptz not null default now(),
  executed_at timestamptz,
  executed_by uuid
);
alter table public.admin_actions enable row level security;
create policy "Admins manage admin actions" on public.admin_actions
  for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create index if not exists admin_actions_recent_idx on public.admin_actions(created_at desc);
