-- Add editable group travel discount settings to app_settings.
-- Run once in Supabase Dashboard > SQL Editor. Safe to run again.

alter table public.app_settings
  add column if not exists group_discount_min_pax integer not null default 10;

alter table public.app_settings
  add column if not exists group_discount_percent numeric not null default 10;

update public.app_settings
set group_discount_min_pax = coalesce(group_discount_min_pax, 10),
    group_discount_percent = coalesce(group_discount_percent, 10),
    updated_at = now()
where id = '00000000-0000-0000-0000-000000000001';

select id, group_discount_min_pax, group_discount_percent
from public.app_settings
where id = '00000000-0000-0000-0000-000000000001';
