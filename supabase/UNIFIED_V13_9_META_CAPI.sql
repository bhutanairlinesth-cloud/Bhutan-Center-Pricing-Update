-- Bhutan Center Unified V13.9
-- Meta Conversions API secret storage + Test Event support.
-- Safe additive migration. Does not alter Pricing / CRM / Quotation / Invoice data.

create table if not exists public.marketing_secret_settings (
  id text primary key,
  encrypted_value text not null,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table public.marketing_secret_settings enable row level security;

-- Secrets are never readable/writable by browser roles. The Next.js server uses
-- SUPABASE_SERVICE_ROLE_KEY and encrypts values before storing them here.
revoke all on table public.marketing_secret_settings from anon, authenticated;
grant all on table public.marketing_secret_settings to service_role;

comment on table public.marketing_secret_settings is
  'Encrypted server-only marketing credentials. Never expose this table through client-side code.';

-- Ensure the non-secret runtime settings table exists for Pixel ID / test code
-- and last Test Event status. This is compatible with V13.7 and safe to re-run.
create table if not exists public.marketing_runtime_settings (
  id text primary key,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now()
);

insert into public.marketing_runtime_settings (id, enabled, config)
values ('meta', false, '{}'::jsonb)
on conflict (id) do nothing;
