-- Bhutan Center Pricing v12.3
-- Flexible additional services, automatic airfare/tax totals and Business Class upgrades.
-- Run once in Supabase SQL Editor after v12.2.

alter table public.app_settings
  add column if not exists business_upgrade_thb numeric(14,2) not null default 15000;

alter table public.customer_tracking
  add column if not exists ticket_price_per_person numeric(14,2) not null default 0,
  add column if not exists airport_tax_per_person numeric(14,2) not null default 0,
  add column if not exists business_upgrade_count integer not null default 0 check (business_upgrade_count >= 0),
  add column if not exists business_upgrade_per_person numeric(14,2) not null default 15000,
  add column if not exists business_upgrade_total numeric(14,2) not null default 0,
  add column if not exists additional_items jsonb not null default '[]'::jsonb,
  add column if not exists additional_items_total numeric(14,2) not null default 0;

-- Preserve existing totals while calculating useful unit prices for old records.
update public.customer_tracking
set
  ticket_price_per_person = case
    when coalesce(ticket_price_per_person, 0) = 0 and passenger_count > 0
      then round(ticket_amount / passenger_count, 2)
    else ticket_price_per_person
  end,
  airport_tax_per_person = case
    when coalesce(airport_tax_per_person, 0) = 0 and passenger_count > 0
      then round(airport_tax_amount / passenger_count, 2)
    else airport_tax_per_person
  end,
  business_upgrade_total = coalesce(business_upgrade_count, 0) * coalesce(business_upgrade_per_person, 0),
  additional_items = coalesce(additional_items, '[]'::jsonb),
  additional_items_total = coalesce(additional_items_total, 0);

comment on column public.app_settings.business_upgrade_thb is
  'Default Business Class surcharge per upgraded passenger in THB.';
comment on column public.customer_tracking.ticket_price_per_person is
  'Airfare unit price; total airfare is calculated automatically by passenger count.';
comment on column public.customer_tracking.airport_tax_per_person is
  'Airport tax unit price; total tax is calculated automatically by passenger count.';
comment on column public.customer_tracking.business_upgrade_total is
  'Business Class surcharge total and part of Invoice 1.';
comment on column public.customer_tracking.additional_items is
  'Flexible package extras such as hotel upgrade, mask dance or baggage vehicle.';
