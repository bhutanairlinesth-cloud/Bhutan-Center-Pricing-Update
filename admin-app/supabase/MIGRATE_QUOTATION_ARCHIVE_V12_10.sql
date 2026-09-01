-- Bhutan Center Pricing v12.10
-- Persist every quotation and allow confirmed quotes to become Customer Journey records.

create table if not exists public.quotations (
  id text primary key,
  quotation_no text not null unique,
  status text not null default 'sent' check (status in ('sent','confirmed','converted','lost')),
  customer_name text not null default '',
  phone text not null default '',
  email text not null default '',
  invoice_address text not null default '',
  note text not null default '',
  channel text not null default 'retail',
  pricing_mode text not null default 'standard',
  package_id text,
  package_name text not null default '',
  hotel_category text not null default '3 Stars',
  travel_date date,
  passenger_count integer not null default 1,
  chargeable_passenger_count integer not null default 1,
  tour_leader_count integer not null default 0,
  selling_price_per_person numeric not null default 0,
  total_amount numeric not null default 0,
  pricing_input jsonb not null default '{}'::jsonb,
  pricing_result jsonb not null default '{}'::jsonb,
  created_by_id uuid,
  created_by_name text not null default '',
  confirmed_at timestamptz,
  converted_tracking_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotations_created_at_idx on public.quotations(created_at desc);
create index if not exists quotations_customer_name_idx on public.quotations(customer_name);
create index if not exists quotations_status_idx on public.quotations(status);

alter table public.quotations enable row level security;

drop policy if exists "quotations_select_authenticated" on public.quotations;
create policy "quotations_select_authenticated" on public.quotations
for select to authenticated using (true);

drop policy if exists "quotations_insert_authenticated" on public.quotations;
create policy "quotations_insert_authenticated" on public.quotations
for insert to authenticated with check (true);

drop policy if exists "quotations_update_authenticated" on public.quotations;
create policy "quotations_update_authenticated" on public.quotations
for update to authenticated using (true) with check (true);

drop policy if exists "quotations_delete_authenticated" on public.quotations;
create policy "quotations_delete_authenticated" on public.quotations
for delete to authenticated using (true);

alter table public.customer_tracking add column if not exists source_quotation_id text;
alter table public.customer_tracking add column if not exists source_quotation_no text;
