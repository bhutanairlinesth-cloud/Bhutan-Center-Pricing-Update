-- Bhutan Center Pricing v12.1 — Single-room supplement
-- Run once in Supabase SQL Editor before deploying v12.1.

alter table if exists public.tour_packages
  add column if not exists single_supplements_thb jsonb not null
  default '{"star3":0,"star4":0,"star5":0}'::jsonb;

update public.tour_packages
set single_supplements_thb = '{"star3":0,"star4":0,"star5":0}'::jsonb
where single_supplements_thb is null;

alter table if exists public.customer_tracking
  add column if not exists single_room_count integer not null default 0;
alter table if exists public.customer_tracking
  add column if not exists single_supplement_per_person numeric(14,2) not null default 0;
alter table if exists public.customer_tracking
  add column if not exists single_supplement_total numeric(14,2) not null default 0;

update public.customer_tracking
set single_supplement_total = greatest(0, single_room_count) * greatest(0, single_supplement_per_person)
where single_supplement_total is null or single_supplement_total = 0;

select id, name, single_supplements_thb from public.tour_packages order by name;
