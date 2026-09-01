-- Bhutan Center Unified V13
-- Safe additive migration: creates NEW support tables only.
-- Does not delete or alter existing pricing / quotation / tracking / invoice data.

create extension if not exists pgcrypto;

create table if not exists public.website_public_prices (
  package_id text primary key,
  visible boolean not null default true,
  price_override_thb numeric null check (price_override_thb is null or price_override_thb >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id text,
  session_id text,
  event_name text not null,
  page_path text,
  package_slug text,
  source text,
  campaign text,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists website_events_created_at_idx on public.website_events(created_at desc);
create index if not exists website_events_visitor_idx on public.website_events(visitor_id);
create index if not exists website_events_event_idx on public.website_events(event_name, created_at desc);

create table if not exists public.website_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  travel_date date,
  pax integer,
  adults integer,
  children integer not null default 0,
  package_slug text,
  hotel_level text,
  cabin_class text,
  note text,
  source text not null default 'bhutancenter.org',
  status text not null default 'new',
  tracking_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists website_leads_created_at_idx on public.website_leads(created_at desc);
create index if not exists website_leads_status_idx on public.website_leads(status);

create table if not exists public.line_contacts (
  line_user_id text primary key,
  display_name text,
  picture_url text,
  status text not null default 'friend',
  visitor_id text,
  tracking_id text,
  tags text[] not null default '{}',
  last_event_type text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists line_contacts_tracking_idx on public.line_contacts(tracking_id);
create index if not exists line_contacts_visitor_idx on public.line_contacts(visitor_id);
create index if not exists line_contacts_status_idx on public.line_contacts(status);

create table if not exists public.line_events (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null,
  event_type text not null,
  message_type text,
  message_text text,
  visitor_id text,
  raw_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists line_events_user_idx on public.line_events(line_user_id, created_at desc);

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null default 'line',
  status text not null default 'draft',
  message_text text,
  audience_count integer not null default 0,
  sent_count integer not null default 0,
  created_by_id text,
  created_by_name text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep support tables private. Public website writes through server routes using Service Role.
alter table public.website_public_prices enable row level security;
alter table public.website_events enable row level security;
alter table public.website_leads enable row level security;
alter table public.line_contacts enable row level security;
alter table public.line_events enable row level security;
alter table public.marketing_campaigns enable row level security;

-- No public policies are intentionally created. The unified Next.js API uses the Service Role key.
-- Existing Bhutan Pricing tables remain untouched.

-- SEO Center persistence (from the website project, now in the same Supabase)
create table if not exists public.website_seo_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.website_seo_state enable row level security;
