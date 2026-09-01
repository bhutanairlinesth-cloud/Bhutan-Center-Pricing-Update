-- Bhutan Center Unified V13.5.1
-- Realtime Website Visitors repair + safe RLS fallback.
-- Safe additive migration. Does NOT modify Pricing, Quotation, Invoice, Payment or Customer Tracking data.

create extension if not exists pgcrypto;

-- V13.5 realtime depends on this table. Create/repair it here so users who
-- skipped the original V13 marketing migration can run ONE SQL file.
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

alter table public.website_events add column if not exists visitor_id text;
alter table public.website_events add column if not exists session_id text;
alter table public.website_events add column if not exists event_name text;
alter table public.website_events add column if not exists page_path text;
alter table public.website_events add column if not exists package_slug text;
alter table public.website_events add column if not exists source text;
alter table public.website_events add column if not exists campaign text;
alter table public.website_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.website_events add column if not exists user_agent text;
alter table public.website_events add column if not exists created_at timestamptz not null default now();

create index if not exists website_events_created_at_idx on public.website_events(created_at desc);
create index if not exists website_events_visitor_idx on public.website_events(visitor_id);
create index if not exists website_events_session_idx on public.website_events(session_id, created_at desc);
create index if not exists website_events_event_idx on public.website_events(event_name, created_at desc);

alter table public.website_events enable row level security;

-- Staff helper used only by RLS fallback when Service Role has not yet been
-- connected in Vercel. SECURITY DEFINER avoids policy recursion on profiles.
create or replace function public.bc_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id::text = auth.uid()::text
      and p.role in ('admin','sales')
  );
$$;

revoke all on function public.bc_is_staff() from public;
grant execute on function public.bc_is_staff() to authenticated;

-- Public website may INSERT analytics events only. It cannot read them.
drop policy if exists bc_website_events_public_ingest on public.website_events;
create policy bc_website_events_public_ingest
on public.website_events
for insert
to anon, authenticated
with check (
  event_name in ('page_view','package_view','line_click','lead_submit','contact_click','heartbeat')
  and char_length(coalesce(visitor_id,'')) between 1 and 120
  and char_length(coalesce(session_id,'')) <= 120
  and char_length(coalesce(page_path,'')) <= 400
  and char_length(coalesce(package_slug,'')) <= 120
  and char_length(coalesce(source,'')) <= 160
  and char_length(coalesce(campaign,'')) <= 160
);

-- Signed-in Bhutan Center staff can read analytics for the Back Office.
drop policy if exists bc_website_events_staff_read on public.website_events;
create policy bc_website_events_staff_read
on public.website_events
for select
to authenticated
using (public.bc_is_staff());

grant insert on public.website_events to anon, authenticated;
grant select on public.website_events to authenticated;

-- V13.5 tags (idempotent) so this repair can also be used when only realtime
-- was installed and the audience migration was skipped.
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
alter table public.website_visitor_tags enable row level security;

-- Do not create a public write policy for persistent CRM tags. Those remain
-- server-managed when Service Role is connected.
