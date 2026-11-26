-- Additive; no existing rows or invoice snapshots are rewritten.
alter table public.customer_tracking
  add column if not exists indian_adult_count integer not null default 0,
  add column if not exists indian_selling_price_per_person numeric(14,2) not null default 0,
  add column if not exists flight_segments jsonb not null default '[]'::jsonb;
