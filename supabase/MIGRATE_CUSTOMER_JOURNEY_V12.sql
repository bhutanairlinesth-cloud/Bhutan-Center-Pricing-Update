-- Bhutan Center Pricing v12
-- Customer Journey workflow from quotation to post-trip feedback.
-- Run once in Supabase SQL Editor after v11/v11.1 migrations.

alter table public.customer_tracking
  add column if not exists quotation_sent_at date,
  add column if not exists booking_confirmed_at date,
  add column if not exists passport_received_at date,
  add column if not exists photo_received_at date,
  add column if not exists passenger_names text not null default '',
  add column if not exists flight_pnr text not null default '',
  add column if not exists flight_reserved_at date,
  add column if not exists invoice_1_sent_at date,
  add column if not exists first_payment_received_at date,
  add column if not exists ticket_sent_at date,
  add column if not exists documents_sent_to_land_at date,
  add column if not exists invoice_2_prepared_at date,
  add column if not exists visa_received_at date,
  add column if not exists visa_sent_at date,
  add column if not exists full_payment_received_at date,
  add column if not exists itinerary_sent_at date,
  add column if not exists ready_to_travel_at date,
  add column if not exists trip_returned_at date,
  add column if not exists feedback_requested_at date,
  add column if not exists feedback_received_at date,
  add column if not exists feedback_note text not null default '',
  add column if not exists next_action text not null default '',
  add column if not exists next_action_due_date date,
  add column if not exists closed_at date;

create table if not exists public.payment_transactions (
  id text primary key,
  tracking_id text not null references public.customer_tracking(id) on delete cascade,
  type text not null default 'other' check (type in ('ticket_deposit','package_balance','refund','other')),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  paid_at date,
  reference text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_tracking_next_action_due_idx on public.customer_tracking(next_action_due_date);
create index if not exists customer_tracking_travel_end_idx on public.customer_tracking(travel_end_date);
create index if not exists payment_transactions_tracking_idx on public.payment_transactions(tracking_id);
create index if not exists payment_transactions_paid_at_idx on public.payment_transactions(paid_at);
create index if not exists payment_transactions_type_idx on public.payment_transactions(type);

alter table public.payment_transactions enable row level security;

drop policy if exists "Authenticated users manage payment transactions" on public.payment_transactions;
create policy "Authenticated users manage payment transactions"
on public.payment_transactions for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.payment_transactions to authenticated;

-- Backfill useful milestone dates from existing v11 payment statuses where possible.
update public.customer_tracking
set
  invoice_1_sent_at = coalesce(invoice_1_sent_at, case when deposit_status in ('invoiced','paid') then deposit_due_date else null end),
  first_payment_received_at = coalesce(first_payment_received_at, case when deposit_status = 'paid' then deposit_due_date else null end),
  invoice_2_prepared_at = coalesce(invoice_2_prepared_at, case when balance_status in ('invoiced','paid') then balance_due_date else null end),
  full_payment_received_at = coalesce(full_payment_received_at, case when balance_status = 'paid' then balance_due_date else null end)
where deposit_status in ('invoiced','paid') or balance_status in ('invoiced','paid');
