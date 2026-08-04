-- Bhutan Center Pricing v12.2
-- Land supplier invoice in USD, actual transfer-day FX rate, THB payment and realized profit.
-- Run once in Supabase SQL Editor after the v12.1 migration.

alter table public.customer_tracking
  add column if not exists land_invoice_no text not null default '',
  add column if not exists land_invoice_received_at date,
  add column if not exists land_invoice_amount_usd numeric(14,2) not null default 0,
  add column if not exists land_exchange_rate numeric(14,4) not null default 0,
  add column if not exists land_transfer_fee_thb numeric(14,2) not null default 0,
  add column if not exists land_paid_at date,
  add column if not exists land_transfer_reference text not null default '';

create index if not exists customer_tracking_land_invoice_received_idx
  on public.customer_tracking(land_invoice_received_at);

create index if not exists customer_tracking_land_paid_idx
  on public.customer_tracking(land_paid_at);

comment on column public.customer_tracking.land_invoice_amount_usd is
  'Amount shown on the Bhutan land supplier invoice in USD.';
comment on column public.customer_tracking.land_exchange_rate is
  'Actual THB per USD rate used on the supplier transfer date.';
comment on column public.customer_tracking.land_transfer_fee_thb is
  'Optional bank or transfer fee in THB.';
comment on column public.customer_tracking.land_payment is
  'Actual THB land cost: USD invoice x transfer-day FX rate + transfer fee.';
comment on column public.customer_tracking.profit_amount is
  'Realized gross profit: package sales - airfare - airport tax - actual land payment.';
