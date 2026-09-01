-- Bhutan Center Pricing v12.11 — Child pricing (ADT / CHD)
-- Safe migration: only adds optional columns; existing records remain unchanged.

alter table public.quotations add column if not exists child_passenger_count integer not null default 0;
alter table public.quotations add column if not exists child_selling_price_per_person numeric not null default 0;

alter table public.customer_tracking add column if not exists child_passenger_count integer not null default 0;
alter table public.customer_tracking add column if not exists child_selling_price_per_person numeric not null default 0;
alter table public.customer_tracking add column if not exists child_ticket_price_per_person numeric not null default 0;
alter table public.customer_tracking add column if not exists child_airport_tax_per_person numeric not null default 0;
