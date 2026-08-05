-- Bhutan Center Pricing v12.3.5
-- เพิ่มไฟล์สลิปแยกตามรายการรับชำระ และ Storage bucket แบบ private

alter table if exists public.payment_transactions
  add column if not exists slip_path text,
  add column if not exists slip_file_name text,
  add column if not exists slip_mime_type text,
  add column if not exists slip_size bigint not null default 0;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-slips',
  'payment-slips',
  false,
  10485760,
  array['image/png','image/jpeg','image/webp','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ผู้ใช้ที่เข้าสู่ระบบสามารถดูและจัดการสลิปได้
-- Bucket เป็น private: เว็บไซต์จะสร้าง signed URL ชั่วคราวเมื่อกดดูสลิป

drop policy if exists "Authenticated users can view payment slips" on storage.objects;
create policy "Authenticated users can view payment slips"
on storage.objects for select
to authenticated
using (bucket_id = 'payment-slips');

drop policy if exists "Authenticated users can upload payment slips" on storage.objects;
create policy "Authenticated users can upload payment slips"
on storage.objects for insert
to authenticated
with check (bucket_id = 'payment-slips');

drop policy if exists "Authenticated users can update payment slips" on storage.objects;
create policy "Authenticated users can update payment slips"
on storage.objects for update
to authenticated
using (bucket_id = 'payment-slips')
with check (bucket_id = 'payment-slips');

drop policy if exists "Authenticated users can delete payment slips" on storage.objects;
create policy "Authenticated users can delete payment slips"
on storage.objects for delete
to authenticated
using (bucket_id = 'payment-slips');

grant select, insert, update, delete on public.payment_transactions to authenticated;
