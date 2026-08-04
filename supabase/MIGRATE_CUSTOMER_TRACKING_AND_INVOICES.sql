-- Bhutan Center Pricing v11
-- Customer tracking + two-stage payment invoices
-- Run once in Supabase SQL Editor.

create table if not exists public.customer_tracking (
  id text primary key,
  opportunity_name text not null,
  customer_name text not null,
  phone text not null default '',
  email text not null default '',
  lead_source text not null default 'LINE OA',
  land_supplier text not null default '',
  airline text not null default '',
  travel_start_date date,
  travel_end_date date,
  package_id text,
  package_name text not null default '',
  hotel_category text not null default '3 Stars',
  passenger_count integer not null default 1 check (passenger_count > 0),
  channel text not null default 'retail' check (channel in ('retail','agent')),
  selling_price_per_person numeric(14,2) not null default 0,
  single_room_count integer not null default 0 check (single_room_count >= 0),
  single_supplement_per_person numeric(14,2) not null default 0,
  single_supplement_total numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  ticket_amount numeric(14,2) not null default 0,
  airport_tax_amount numeric(14,2) not null default 0,
  land_payment numeric(14,2) not null default 0,
  profit_amount numeric(14,2) not null default 0,
  deposit_amount numeric(14,2) not null default 0,
  deposit_due_date date,
  deposit_status text not null default 'pending' check (deposit_status in ('pending','invoiced','paid','overdue','cancelled')),
  balance_amount numeric(14,2) not null default 0,
  balance_due_date date,
  balance_status text not null default 'pending' check (balance_status in ('pending','invoiced','paid','overdue','cancelled')),
  status text not null default 'new' check (status in ('new','following','quote_sent','won','lost','completed')),
  sales_owner_id text,
  sales_owner_name text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_invoices (
  id text primary key,
  tracking_id text not null references public.customer_tracking(id) on delete cascade,
  invoice_no text not null unique,
  installment text not null check (installment in ('deposit','balance')),
  issue_date date,
  due_date date,
  amount numeric(14,2) not null default 0,
  status text not null default 'invoiced' check (status in ('pending','invoiced','paid','overdue','cancelled')),
  paid_at date,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tracking_id, installment)
);

create index if not exists customer_tracking_travel_start_idx on public.customer_tracking(travel_start_date);
create index if not exists customer_tracking_status_idx on public.customer_tracking(status);
create index if not exists customer_tracking_deposit_due_idx on public.customer_tracking(deposit_due_date);
create index if not exists customer_tracking_balance_due_idx on public.customer_tracking(balance_due_date);
create index if not exists payment_invoices_tracking_idx on public.payment_invoices(tracking_id);
create index if not exists payment_invoices_due_idx on public.payment_invoices(due_date);

alter table public.customer_tracking enable row level security;
alter table public.payment_invoices enable row level security;

drop policy if exists "Authenticated users manage customer tracking" on public.customer_tracking;
create policy "Authenticated users manage customer tracking"
on public.customer_tracking for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users manage payment invoices" on public.payment_invoices;
create policy "Authenticated users manage payment invoices"
on public.payment_invoices for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.customer_tracking to authenticated;
grant select, insert, update, delete on public.payment_invoices to authenticated;
