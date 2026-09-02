-- Bhutan Center Unified V13.7
-- Marketing integration settings managed from Back Office.
-- Safe additive migration. Does not alter Pricing / CRM / Quotation / Invoice data.

create table if not exists public.marketing_runtime_settings (
  id text primary key,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table public.marketing_runtime_settings enable row level security;

-- Runtime values here are intentionally non-secret:
-- Meta Pixel ID, Meta Test Event Code, LINE OA URL.
-- CAPI Access Token remains server-only in Vercel env / future encrypted secret storage.
drop policy if exists "marketing_runtime_public_read" on public.marketing_runtime_settings;
create policy "marketing_runtime_public_read"
on public.marketing_runtime_settings
for select
to anon, authenticated
using (id in ('meta','line'));

drop policy if exists "marketing_runtime_staff_insert" on public.marketing_runtime_settings;
create policy "marketing_runtime_staff_insert"
on public.marketing_runtime_settings
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','sales')
  )
);

drop policy if exists "marketing_runtime_staff_update" on public.marketing_runtime_settings;
create policy "marketing_runtime_staff_update"
on public.marketing_runtime_settings
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','sales')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','sales')
  )
);

-- Preload Bhutan Center LINE OA add-friend link supplied by the business.
insert into public.marketing_runtime_settings (id, enabled, config)
values ('line', true, jsonb_build_object('line_oa_url','https://lin.ee/qQQMmYIt'))
on conflict (id) do nothing;

-- Meta row starts disabled until a Pixel ID is saved from Back Office.
insert into public.marketing_runtime_settings (id, enabled, config)
values ('meta', false, '{}'::jsonb)
on conflict (id) do nothing;
