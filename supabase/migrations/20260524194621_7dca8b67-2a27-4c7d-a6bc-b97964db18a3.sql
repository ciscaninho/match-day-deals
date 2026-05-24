create table public.wc_ticket_coverage (
  id uuid primary key default gen_random_uuid(),
  stadium_slug text not null,
  stadium_name text not null,
  city text,
  country text,
  kind text not null default 'affiliate',
  provider text not null,
  provider_logo text,
  url text not null,
  starting_price numeric,
  currency text not null default 'EUR',
  event_date timestamptz,
  label text,
  notes text,
  status text not null default 'active',
  priority integer not null default 100,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wc_ticket_coverage_stadium_idx on public.wc_ticket_coverage(stadium_slug);
create index wc_ticket_coverage_status_idx on public.wc_ticket_coverage(status);

alter table public.wc_ticket_coverage enable row level security;

create policy "Anyone views active wc ticket coverage"
  on public.wc_ticket_coverage for select
  using (status = 'active' or public.has_role(auth.uid(), 'admin'));

create policy "Admins insert wc ticket coverage"
  on public.wc_ticket_coverage for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins update wc ticket coverage"
  on public.wc_ticket_coverage for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete wc ticket coverage"
  on public.wc_ticket_coverage for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create trigger update_wc_ticket_coverage_updated_at
  before update on public.wc_ticket_coverage
  for each row execute function public.update_updated_at_column();