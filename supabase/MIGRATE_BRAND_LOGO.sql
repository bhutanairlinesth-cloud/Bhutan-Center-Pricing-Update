-- Bhutan Center Pricing v11.1 — Company logo / branding
-- Run once in Supabase Dashboard > SQL Editor.
-- Creates a public logo bucket, restricts uploads to Admin users,
-- and stores the current public logo URL in app_settings.

alter table public.app_settings
  add column if not exists logo_url text not null default '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  2097152,
  array['image/png','image/jpeg','image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read: the logo must load on the login page, website and PDF preview.
drop policy if exists "branding public read" on storage.objects;
create policy "branding public read"
on storage.objects for select
to public
using (bucket_id = 'branding');

-- Only authenticated Admin users may upload or replace the logo.
drop policy if exists "branding admin insert" on storage.objects;
create policy "branding admin insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'branding' and public.is_admin());

drop policy if exists "branding admin update" on storage.objects;
create policy "branding admin update"
on storage.objects for update
to authenticated
using (bucket_id = 'branding' and public.is_admin())
with check (bucket_id = 'branding' and public.is_admin());

drop policy if exists "branding admin delete" on storage.objects;
create policy "branding admin delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'branding' and public.is_admin());
