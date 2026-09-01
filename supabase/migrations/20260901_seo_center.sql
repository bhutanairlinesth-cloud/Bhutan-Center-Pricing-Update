-- Bhutan Center SEO & GEO Center
-- Run in the same Supabase project used by Bhutan Pricing when ready.
create table if not exists public.website_seo_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.website_seo_state enable row level security;

-- No public policies are intentionally created.
-- The Next.js server uses SUPABASE_SERVICE_ROLE_KEY for admin writes.
comment on table public.website_seo_state is 'Private admin state for Bhutan Center SEO checklist, metadata and redirect mapping.';
