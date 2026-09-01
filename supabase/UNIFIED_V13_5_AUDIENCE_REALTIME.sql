-- Bhutan Center Unified V13.5
-- Audience + Retargeting Tags foundation.
-- Safe additive migration: does not alter Pricing / Quotation / Invoice / Customer Tracking data.

create table if not exists public.website_visitor_tags (
  visitor_id text not null,
  tag text not null,
  source text not null default 'website',
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (visitor_id, tag)
);
create index if not exists website_visitor_tags_tag_idx on public.website_visitor_tags(tag, last_seen_at desc);
create index if not exists website_visitor_tags_visitor_idx on public.website_visitor_tags(visitor_id, last_seen_at desc);

create table if not exists public.marketing_audiences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft',
  source_types text[] not null default '{}',
  rules jsonb not null default '{}'::jsonb,
  destination text not null default 'internal',
  meta_audience_id text,
  last_count integer not null default 0,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marketing_audiences_status_idx on public.marketing_audiences(status, updated_at desc);

alter table public.website_visitor_tags enable row level security;
alter table public.marketing_audiences enable row level security;

-- No public policies. Public tracking writes through the Next.js server route using Service Role.
-- Realtime visitors use the existing website_events table and 30-second heartbeat; no extra realtime publication is required.
