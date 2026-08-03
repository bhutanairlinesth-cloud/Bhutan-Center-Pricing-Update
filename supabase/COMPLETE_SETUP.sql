-- Bhutan Center Pricing — Complete Supabase Setup
-- Run this whole file once in Supabase Dashboard > SQL Editor.
-- Safe to run again.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('admin', 'sales');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null,
  role public.user_role not null default 'sales',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key,
  exchange_rate_usd numeric not null default 35,
  ticket_price_thb numeric not null default 26000,
  airport_tax_thb numeric not null default 6500,
  visa_fee_usd numeric not null default 40,
  margin_thb numeric not null default 5000,
  hotel_3_star_pax1_usd numeric not null default 250,
  hotel_3_star_pax2_usd numeric not null default 200,
  hotel_3_star_pax3_plus_usd numeric not null default 180,
  hotel_4_star_pax1_usd numeric not null default 300,
  hotel_4_star_pax2_usd numeric not null default 240,
  hotel_4_star_pax3_plus_usd numeric not null default 220,
  agent_ticket_price_thb numeric not null default 25220,
  agent_ticket_discount_percent numeric not null default 3,
  agent_margin_thb numeric not null default 3000,
  updated_at timestamptz not null default now()
);

create table if not exists public.hotels (
  id text primary key,
  name text not null,
  category text not null check (category in ('3 Stars','4 Stars','5 Stars')),
  pax1_usd numeric not null,
  pax2_usd numeric not null,
  pax3_plus_usd numeric not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.tour_packages (
  id text primary key,
  name text not null,
  nights integer not null check (nights > 0),
  rates jsonb not null,
  hotel_rates jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''), '@', 1)),
    coalesce(new.email,''),
    case when lower(coalesce(new.email,'')) = 'info@omgexp.com'
         then 'admin'::public.user_role
         else 'sales'::public.user_role end
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Fix/create profiles for existing Auth users.
insert into public.profiles (id, name, email, role)
select
  id,
  coalesce(raw_user_meta_data->>'name', split_part(coalesce(email,''), '@', 1)),
  coalesce(email,''),
  case when lower(coalesce(email,'')) = 'info@omgexp.com'
       then 'admin'::public.user_role
       else 'sales'::public.user_role end
from auth.users
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = case when lower(excluded.email) = 'info@omgexp.com'
              then 'admin'::public.user_role
              else public.profiles.role end,
  updated_at = now();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.app_settings add column if not exists agent_ticket_price_thb numeric not null default 25220;
alter table public.app_settings add column if not exists agent_ticket_discount_percent numeric not null default 3;
alter table public.app_settings add column if not exists agent_margin_thb numeric not null default 3000;
update public.app_settings set agent_ticket_price_thb = 25220 where agent_ticket_price_thb is null;

alter table public.app_settings enable row level security;
alter table public.hotels enable row level security;
alter table public.tour_packages enable row level security;

drop policy if exists "profiles read authenticated" on public.profiles;
drop policy if exists "profiles admin write" on public.profiles;
drop policy if exists "settings read authenticated" on public.app_settings;
drop policy if exists "settings admin write" on public.app_settings;
drop policy if exists "hotels read authenticated" on public.hotels;
drop policy if exists "hotels admin write" on public.hotels;
drop policy if exists "packages read authenticated" on public.tour_packages;
drop policy if exists "packages admin write" on public.tour_packages;

create policy "profiles read authenticated" on public.profiles
for select to authenticated using (true);
create policy "profiles admin write" on public.profiles
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings read authenticated" on public.app_settings
for select to authenticated using (true);
create policy "settings admin write" on public.app_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "hotels read authenticated" on public.hotels
for select to authenticated using (true);
create policy "hotels admin write" on public.hotels
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "packages read authenticated" on public.tour_packages
for select to authenticated using (true);
create policy "packages admin write" on public.tour_packages
for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant execute on function public.is_admin() to authenticated;

insert into public.app_settings (
  id, exchange_rate_usd, ticket_price_thb, airport_tax_thb, visa_fee_usd, margin_thb,
  hotel_3_star_pax1_usd, hotel_3_star_pax2_usd, hotel_3_star_pax3_plus_usd,
  hotel_4_star_pax1_usd, hotel_4_star_pax2_usd, hotel_4_star_pax3_plus_usd,
  agent_ticket_price_thb, agent_ticket_discount_percent, agent_margin_thb, updated_at
) values (
  '00000000-0000-0000-0000-000000000001', 35, 26000, 6500, 40, 5000,
  250, 200, 180, 300, 240, 220, 25220, 3, 3000, now()
)
on conflict (id) do nothing;

insert into public.hotels (id,name,category,pax1_usd,pax2_usd,pax3_plus_usd) values
('htl_3s_1','Hotel Thimphu Tower','3 Stars',250,200,180),
('htl_3s_2','Phuentsholing Lodge','3 Stars',240,190,170),
('htl_4s_1','Ariana Bhutan Resort','4 Stars',300,240,220),
('htl_4s_2','Zhiwa Ling Heritage','4 Stars',320,260,230),
('htl_5s_1','Taj Tashi Thimphu','5 Stars',450,380,350),
('htl_5s_2','Amankora Paro Lodge','5 Stars',550,480,440)
on conflict (id) do nothing;

insert into public.tour_packages (id,name,nights,rates,hotel_rates) values
('pkg_1','4 Days 3 Nights (JOURNEY TO BHUTAN)',3,
 '{"pax1USD":250,"pax2USD":200,"pax3PlusUSD":180}',
 '{"star3":{"pax1USD":250,"pax2USD":200,"pax3PlusUSD":180},"star4":{"pax1USD":300,"pax2USD":240,"pax3PlusUSD":220},"star5":{"pax1USD":500,"pax2USD":420,"pax3PlusUSD":380}}'),
('pkg_2','5 Days 4 Nights (WONDERS OF BHUTAN)',4,
 '{"pax1USD":260,"pax2USD":210,"pax3PlusUSD":190}',
 '{"star3":{"pax1USD":250,"pax2USD":200,"pax3PlusUSD":180},"star4":{"pax1USD":300,"pax2USD":240,"pax3PlusUSD":220},"star5":{"pax1USD":500,"pax2USD":420,"pax3PlusUSD":380}}'),
('pkg_3','6 Days 5 Nights (THE ULTIMATE BHUTAN)',5,
 '{"pax1USD":270,"pax2USD":220,"pax3PlusUSD":200}',
 '{"star3":{"pax1USD":250,"pax2USD":200,"pax3PlusUSD":180},"star4":{"pax1USD":300,"pax2USD":240,"pax3PlusUSD":220},"star5":{"pax1USD":500,"pax2USD":420,"pax3PlusUSD":380}}')
on conflict (id) do nothing;

select id, name, email, role from public.profiles order by created_at;
