create table if not exists public.tour_programs (
  id text primary key,
  tracking_id text,
  customer_name text not null default '',
  title text not null default '',
  status text not null default 'draft',
  start_date date,
  end_date date,
  cities text[] not null default '{}',
  hotel_category text not null default '3 Stars',
  outbound_flight jsonb not null default '{}'::jsonb,
  inbound_flight jsonb not null default '{}'::jsonb,
  options jsonb not null default '{}'::jsonb,
  selected_festival_ids text[] not null default '{}',
  days jsonb not null default '[]'::jsonb,
  guide_name text not null default '',
  guide_contact text not null default '',
  room_type text not null default '',
  note text not null default '',
  created_by_id text not null default '',
  created_by_name text not null default '',
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tour_programs_tracking_id_idx
  on public.tour_programs (tracking_id);

create index if not exists tour_programs_start_date_idx
  on public.tour_programs (start_date desc);

alter table public.tour_programs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='tour_programs'
      and policyname='tour_programs_select_authenticated'
  ) then
    create policy tour_programs_select_authenticated
      on public.tour_programs for select
      to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='tour_programs'
      and policyname='tour_programs_insert_authenticated'
  ) then
    create policy tour_programs_insert_authenticated
      on public.tour_programs for insert
      to authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='tour_programs'
      and policyname='tour_programs_update_authenticated'
  ) then
    create policy tour_programs_update_authenticated
      on public.tour_programs for update
      to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='tour_programs'
      and policyname='tour_programs_delete_authenticated'
  ) then
    create policy tour_programs_delete_authenticated
      on public.tour_programs for delete
      to authenticated using (true);
  end if;
end
$$;
