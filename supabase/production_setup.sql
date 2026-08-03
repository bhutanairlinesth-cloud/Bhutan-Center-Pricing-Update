-- Bhutan Center Pricing — production setup / migration
-- Run once in Supabase Dashboard > SQL Editor.
-- Safe to re-run.

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

-- Automatically create a sales profile for every future Auth user.
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
    'sales'::public.user_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Create/fix profiles for users that already exist.
insert into public.profiles (id, name, email, role)
select
  id,
  coalesce(raw_user_meta_data->>'name', split_part(coalesce(email,''), '@', 1)),
  coalesce(email,''),
  case when lower(email) = 'info@omgexp.com'
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

-- Confirmation
select id, name, email, role, created_at from public.profiles order by created_at;
