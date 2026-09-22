-- Bhutan Center Pricing v12.12
-- 5-star margin + Agent package service-fee VAT split
-- Safe to run once on an existing project.

begin;

alter table if exists public.app_settings
  add column if not exists hotel_5_star_margin_thb numeric not null default 10000,
  add column if not exists agent_service_fee_4d3n_thb numeric not null default 1500,
  add column if not exists agent_service_fee_5d4n_thb numeric not null default 2000,
  add column if not exists agent_service_fee_6d5n_thb numeric not null default 2500;

update public.app_settings
set hotel_5_star_margin_thb = coalesce(hotel_5_star_margin_thb, 10000),
    agent_service_fee_4d3n_thb = coalesce(agent_service_fee_4d3n_thb, 1500),
    agent_service_fee_5d4n_thb = coalesce(agent_service_fee_5d4n_thb, 2000),
    agent_service_fee_6d5n_thb = coalesce(agent_service_fee_6d5n_thb, 2500)
where true;

commit;

notify pgrst, 'reload schema';

select
  'OK - v12.12 settings ready' as status,
  hotel_5_star_margin_thb,
  agent_service_fee_4d3n_thb,
  agent_service_fee_5d4n_thb,
  agent_service_fee_6d5n_thb
from public.app_settings
limit 1;
