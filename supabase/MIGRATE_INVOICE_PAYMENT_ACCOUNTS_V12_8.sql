-- Bhutan Center Pricing v12.8 — Invoice payment accounts, QR and VAT option
-- Run once in Supabase Dashboard > SQL Editor.

alter table public.app_settings
  add column if not exists company_bank_name text not null default 'ธนาคารกสิกรไทย',
  add column if not exists company_account_name text not null default 'บริษัท OMG Experience Co., Ltd.',
  add column if not exists company_account_number text not null default '051-2-51692-0',
  add column if not exists company_payment_qr_url text not null default '',
  add column if not exists owner_bank_name text not null default 'ธนาคารไทยพาณิชย์',
  add column if not exists owner_account_name text not null default 'นายศิเวก สัจเดว',
  add column if not exists owner_account_number text not null default '203-215366-9',
  add column if not exists owner_payment_qr_url text not null default '',
  add column if not exists vat_rate_percent numeric not null default 7;

alter table public.payment_invoices
  add column if not exists subtotal_amount numeric not null default 0,
  add column if not exists vat_enabled boolean not null default false,
  add column if not exists vat_rate_percent numeric not null default 7,
  add column if not exists vat_amount numeric not null default 0,
  add column if not exists payment_account_type text not null default 'company',
  add column if not exists payment_bank_name text not null default '',
  add column if not exists payment_account_name text not null default '',
  add column if not exists payment_account_number text not null default '',
  add column if not exists payment_qr_url text not null default '';

-- Backfill old invoice base amounts without changing historical totals.
update public.payment_invoices
set subtotal_amount = amount
where coalesce(subtotal_amount, 0) = 0 and amount > 0;

-- Make sure the branding bucket also accepts payment QR images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  3145728,
  array['image/png','image/jpeg','image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Recreate permissive public-read / admin-write policies used for the logo and QR files.
drop policy if exists "branding public read" on storage.objects;
create policy "branding public read"
on storage.objects for select
to public
using (bucket_id = 'branding');

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

-- Sensible defaults for existing documents: Invoice 1 -> company, Invoice 2 -> owner.
update public.payment_invoices
set payment_account_type = case when installment = 'balance' then 'owner' else 'company' end
where coalesce(payment_bank_name, '') = '' and coalesce(payment_account_number, '') = '';
