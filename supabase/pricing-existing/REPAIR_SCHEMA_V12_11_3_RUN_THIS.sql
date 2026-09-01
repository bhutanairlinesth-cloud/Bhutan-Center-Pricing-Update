-- Bhutan Center Pricing v12.11.3
-- ONE-TIME SCHEMA REPAIR / COMPATIBILITY MIGRATION
-- Safe for an existing project: adds missing structures only and keeps customer data.
-- Run this entire file in Supabase Dashboard > SQL Editor > Run.

begin;

-- ---------- APP SETTINGS ----------
alter table if exists public.app_settings
  add column if not exists agent_ticket_price_thb numeric not null default 25220,
  add column if not exists agent_ticket_discount_percent numeric not null default 3,
  add column if not exists agent_margin_thb numeric not null default 3000,
  add column if not exists group_discount_min_pax integer not null default 10,
  add column if not exists group_discount_percent numeric not null default 10,
  add column if not exists business_upgrade_thb numeric not null default 15000,
  add column if not exists logo_url text not null default '',
  add column if not exists company_bank_name text not null default 'ธนาคารกสิกรไทย',
  add column if not exists company_account_name text not null default 'บริษัท OMG Experience Co., Ltd.',
  add column if not exists company_account_number text not null default '051-2-51692-0',
  add column if not exists company_payment_qr_url text not null default '',
  add column if not exists owner_bank_name text not null default 'ธนาคารไทยพาณิชย์',
  add column if not exists owner_account_name text not null default 'นายศิเวก สัจเดว',
  add column if not exists owner_account_number text not null default '203-215366-9',
  add column if not exists owner_payment_qr_url text not null default '',
  add column if not exists vat_rate_percent numeric not null default 7;

-- ---------- TOUR PACKAGES ----------
alter table if exists public.tour_packages
  add column if not exists single_supplements_thb jsonb not null default '{"star3":0,"star4":0,"star5":0}'::jsonb;

-- ---------- CORE CRM TABLES (create only when completely missing) ----------
create table if not exists public.customer_tracking (
  id text primary key,
  opportunity_name text not null default '',
  customer_name text not null default '',
  phone text not null default '',
  email text not null default '',
  lead_source text not null default 'Other',
  land_supplier text not null default '',
  airline text not null default '',
  travel_start_date date,
  travel_end_date date,
  package_id text,
  package_name text not null default '',
  hotel_category text not null default '3 Stars',
  passenger_count integer not null default 1,
  channel text not null default 'retail',
  selling_price_per_person numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  ticket_amount numeric(14,2) not null default 0,
  airport_tax_amount numeric(14,2) not null default 0,
  land_payment numeric(14,2) not null default 0,
  profit_amount numeric(14,2) not null default 0,
  deposit_amount numeric(14,2) not null default 0,
  deposit_due_date date,
  deposit_status text not null default 'pending',
  balance_amount numeric(14,2) not null default 0,
  balance_due_date date,
  balance_status text not null default 'pending',
  status text not null default 'new',
  sales_owner_id text,
  sales_owner_name text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_invoices (
  id text primary key,
  tracking_id text not null references public.customer_tracking(id) on delete cascade,
  invoice_no text not null unique,
  installment text not null default 'deposit',
  issue_date date,
  due_date date,
  amount numeric(14,2) not null default 0,
  status text not null default 'invoiced',
  paid_at date,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id text primary key,
  tracking_id text not null references public.customer_tracking(id) on delete cascade,
  type text not null default 'other',
  amount numeric(14,2) not null default 0,
  paid_at date,
  reference text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- CUSTOMER TRACKING ----------
-- The base table already exists in live projects. These ALTERs repair every
-- column currently used by v12.11.3 so older projects can be upgraded in one run.
alter table if exists public.customer_tracking
  add column if not exists source_quotation_id text,
  add column if not exists source_quotation_no text,
  add column if not exists invoice_address text not null default '',
  add column if not exists chargeable_passenger_count integer,
  add column if not exists tour_leader_count integer not null default 0,
  add column if not exists pricing_mode text not null default 'standard',
  add column if not exists payment_plan text not null default 'installments',
  add column if not exists child_passenger_count integer not null default 0,
  add column if not exists child_selling_price_per_person numeric(14,2) not null default 0,
  add column if not exists child_ticket_price_per_person numeric(14,2) not null default 0,
  add column if not exists child_airport_tax_per_person numeric(14,2) not null default 0,
  add column if not exists regular_land_cost_per_person numeric(14,2) not null default 0,
  add column if not exists tour_leader_land_cost_per_person numeric(14,2) not null default 0,
  add column if not exists group_margin_per_traveler numeric(14,2) not null default 0,
  add column if not exists group_selling_price_override_per_person numeric(14,2) not null default 0,
  add column if not exists group_pricing_cost_total numeric(14,2) not null default 0,
  add column if not exists single_room_count integer not null default 0,
  add column if not exists single_supplement_per_person numeric(14,2) not null default 0,
  add column if not exists single_supplement_total numeric(14,2) not null default 0,
  add column if not exists supplemental_invoice_total numeric(14,2) not null default 0,
  add column if not exists supplemental_cost_total numeric(14,2) not null default 0,
  add column if not exists grand_total_amount numeric(14,2) not null default 0,
  add column if not exists traveler_additions jsonb not null default '[]'::jsonb,
  add column if not exists ticket_price_per_person numeric(14,2) not null default 0,
  add column if not exists airport_tax_per_person numeric(14,2) not null default 0,
  add column if not exists business_upgrade_count integer not null default 0,
  add column if not exists business_upgrade_per_person numeric(14,2) not null default 15000,
  add column if not exists business_upgrade_total numeric(14,2) not null default 0,
  add column if not exists additional_items jsonb not null default '[]'::jsonb,
  add column if not exists additional_items_total numeric(14,2) not null default 0,
  add column if not exists land_invoice_no text not null default '',
  add column if not exists land_invoice_received_at date,
  add column if not exists land_invoice_amount_usd numeric(14,2) not null default 0,
  add column if not exists land_exchange_rate numeric(14,4) not null default 0,
  add column if not exists land_transfer_fee_thb numeric(14,2) not null default 0,
  add column if not exists land_paid_at date,
  add column if not exists land_transfer_reference text not null default '',
  add column if not exists quotation_sent_at date,
  add column if not exists booking_confirmed_at date,
  add column if not exists passport_received_at date,
  add column if not exists photo_received_at date,
  add column if not exists passenger_names text not null default '',
  add column if not exists flight_pnr text not null default '',
  add column if not exists flight_reserved_at date,
  add column if not exists invoice_1_sent_at date,
  add column if not exists first_payment_received_at date,
  add column if not exists ticket_sent_at date,
  add column if not exists documents_sent_to_land_at date,
  add column if not exists invoice_2_prepared_at date,
  add column if not exists visa_received_at date,
  add column if not exists visa_sent_at date,
  add column if not exists full_payment_received_at date,
  add column if not exists itinerary_sent_at date,
  add column if not exists ready_to_travel_at date,
  add column if not exists trip_returned_at date,
  add column if not exists feedback_requested_at date,
  add column if not exists feedback_received_at date,
  add column if not exists feedback_note text not null default '',
  add column if not exists next_action text not null default '',
  add column if not exists next_action_due_date date,
  add column if not exists closed_at date;

update public.customer_tracking
set chargeable_passenger_count = greatest(1, passenger_count)
where chargeable_passenger_count is null or chargeable_passenger_count < 1;

update public.customer_tracking
set child_passenger_count = greatest(0, least(coalesce(child_passenger_count,0), greatest(1,passenger_count))),
    pricing_mode = case when pricing_mode = 'group_tl' then 'group_tl' else 'standard' end,
    payment_plan = case when payment_plan in ('installments','full_payment','custom') then payment_plan else 'installments' end,
    traveler_additions = coalesce(traveler_additions, '[]'::jsonb),
    additional_items = coalesce(additional_items, '[]'::jsonb),
    grand_total_amount = greatest(0, coalesce(total_amount,0) + coalesce(supplemental_invoice_total,0));

-- ---------- PAYMENT INVOICES ----------
alter table if exists public.payment_invoices
  add column if not exists sequence_no integer not null default 1,
  add column if not exists title text not null default '',
  add column if not exists line_items jsonb not null default '[]'::jsonb,
  add column if not exists cost_amount numeric(14,2) not null default 0,
  add column if not exists subtotal_amount numeric not null default 0,
  add column if not exists vat_enabled boolean not null default false,
  add column if not exists vat_rate_percent numeric not null default 7,
  add column if not exists vat_amount numeric not null default 0,
  add column if not exists payment_account_type text not null default 'company',
  add column if not exists payment_bank_name text not null default '',
  add column if not exists payment_account_name text not null default '',
  add column if not exists payment_account_number text not null default '',
  add column if not exists payment_qr_url text not null default '',
  add column if not exists document_data jsonb;

alter table if exists public.payment_invoices drop constraint if exists payment_invoices_installment_check;
alter table if exists public.payment_invoices
  add constraint payment_invoices_installment_check
  check (installment in ('deposit','balance','full','supplemental'));

alter table if exists public.payment_invoices drop constraint if exists payment_invoices_tracking_id_installment_key;
drop index if exists public.payment_invoices_tracking_id_installment_key;
drop index if exists public.payment_invoices_base_installment_unique;
create unique index if not exists payment_invoices_base_installment_unique
  on public.payment_invoices(tracking_id, installment)
  where installment in ('deposit','balance','full');
create index if not exists payment_invoices_tracking_idx on public.payment_invoices(tracking_id);
create index if not exists payment_invoices_tracking_sequence_idx on public.payment_invoices(tracking_id, sequence_no);

update public.payment_invoices
set subtotal_amount = case when coalesce(subtotal_amount,0) = 0 then amount else subtotal_amount end,
    sequence_no = case installment when 'deposit' then 1 when 'balance' then 2 when 'full' then 1 else greatest(sequence_no,3) end;

-- ---------- PAYMENT TRANSACTIONS ----------
alter table if exists public.payment_transactions
  add column if not exists invoice_id text,
  add column if not exists slip_path text,
  add column if not exists slip_file_name text,
  add column if not exists slip_mime_type text,
  add column if not exists slip_size bigint not null default 0;

-- Make invoice_id FK idempotently.
do $$
begin
  if to_regclass('public.payment_transactions') is not null
     and to_regclass('public.payment_invoices') is not null
     and not exists (select 1 from pg_constraint where conname = 'payment_transactions_invoice_id_fkey') then
    alter table public.payment_transactions
      add constraint payment_transactions_invoice_id_fkey
      foreign key (invoice_id) references public.payment_invoices(id) on delete set null;
  end if;
end $$;

alter table if exists public.payment_transactions drop constraint if exists payment_transactions_type_check;
alter table if exists public.payment_transactions
  add constraint payment_transactions_type_check
  check (type in ('ticket_deposit','package_balance','full_payment','supplemental','refund','other'));
create index if not exists payment_transactions_tracking_idx on public.payment_transactions(tracking_id);
create index if not exists payment_transactions_invoice_idx on public.payment_transactions(invoice_id);

-- ---------- QUOTATION ARCHIVE ----------
create table if not exists public.quotations (
  id text primary key,
  quotation_no text not null unique,
  status text not null default 'sent',
  customer_name text not null default '',
  phone text not null default '',
  email text not null default '',
  invoice_address text not null default '',
  note text not null default '',
  channel text not null default 'retail',
  pricing_mode text not null default 'standard',
  package_id text,
  package_name text not null default '',
  hotel_category text not null default '3 Stars',
  travel_date date,
  passenger_count integer not null default 1,
  chargeable_passenger_count integer not null default 1,
  tour_leader_count integer not null default 0,
  selling_price_per_person numeric(14,2) not null default 0,
  child_passenger_count integer not null default 0,
  child_selling_price_per_person numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  pricing_input jsonb not null default '{}'::jsonb,
  pricing_result jsonb not null default '{}'::jsonb,
  created_by_id uuid,
  created_by_name text not null default '',
  confirmed_at timestamptz,
  converted_tracking_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.quotations
  add column if not exists child_passenger_count integer not null default 0,
  add column if not exists child_selling_price_per_person numeric(14,2) not null default 0;

-- ---------- RLS / GRANTS ----------
alter table if exists public.customer_tracking enable row level security;
alter table if exists public.payment_invoices enable row level security;
alter table if exists public.payment_transactions enable row level security;
alter table if exists public.quotations enable row level security;

drop policy if exists "Authenticated users manage customer tracking" on public.customer_tracking;
create policy "Authenticated users manage customer tracking" on public.customer_tracking
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users manage payment invoices" on public.payment_invoices;
create policy "Authenticated users manage payment invoices" on public.payment_invoices
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users manage payment transactions" on public.payment_transactions;
create policy "Authenticated users manage payment transactions" on public.payment_transactions
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users manage quotations" on public.quotations;
create policy "Authenticated users manage quotations" on public.quotations
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.customer_tracking to authenticated;
grant select, insert, update, delete on public.payment_invoices to authenticated;
grant select, insert, update, delete on public.payment_transactions to authenticated;
grant select, insert, update, delete on public.quotations to authenticated;

-- ---------- PAYMENT SLIP STORAGE ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-slips','payment-slips',false,10485760,array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can view payment slips" on storage.objects;
create policy "Authenticated users can view payment slips" on storage.objects for select to authenticated using (bucket_id='payment-slips');
drop policy if exists "Authenticated users can upload payment slips" on storage.objects;
create policy "Authenticated users can upload payment slips" on storage.objects for insert to authenticated with check (bucket_id='payment-slips');
drop policy if exists "Authenticated users can update payment slips" on storage.objects;
create policy "Authenticated users can update payment slips" on storage.objects for update to authenticated using (bucket_id='payment-slips') with check (bucket_id='payment-slips');
drop policy if exists "Authenticated users can delete payment slips" on storage.objects;
create policy "Authenticated users can delete payment slips" on storage.objects for delete to authenticated using (bucket_id='payment-slips');

-- ---------- SUPPLEMENTAL TOTALS TRIGGER ----------
create or replace function public.refresh_customer_supplemental_totals(target_tracking_id text)
returns void language plpgsql security definer set search_path = public as $$
declare revenue_total numeric(14,2); cost_total numeric(14,2);
begin
  select coalesce(sum(amount) filter (where status <> 'cancelled'),0),
         coalesce(sum(cost_amount) filter (where status <> 'cancelled'),0)
  into revenue_total, cost_total
  from public.payment_invoices
  where tracking_id = target_tracking_id and installment = 'supplemental';
  update public.customer_tracking
  set supplemental_invoice_total = revenue_total,
      supplemental_cost_total = cost_total,
      grand_total_amount = greatest(0, coalesce(total_amount,0) + revenue_total),
      updated_at = now()
  where id = target_tracking_id;
end;
$$;

create or replace function public.payment_invoices_refresh_tracking_totals()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op='DELETE' then
    perform public.refresh_customer_supplemental_totals(old.tracking_id);
    return old;
  end if;
  perform public.refresh_customer_supplemental_totals(new.tracking_id);
  if tg_op='UPDATE' and old.tracking_id is distinct from new.tracking_id then
    perform public.refresh_customer_supplemental_totals(old.tracking_id);
  end if;
  return new;
end;
$$;

drop trigger if exists payment_invoices_refresh_tracking_totals_trigger on public.payment_invoices;
create trigger payment_invoices_refresh_tracking_totals_trigger
  after insert or update or delete on public.payment_invoices
  for each row execute function public.payment_invoices_refresh_tracking_totals();

grant execute on function public.refresh_customer_supplemental_totals(text) to authenticated;

-- ---------- SCHEMA VERIFICATION ----------
-- Fail now, in the SQL editor, rather than later while issuing an invoice.
do $$
declare missing text;
begin
  select string_agg(required_col, ', ' order by required_col)
  into missing
  from unnest(array[
    'child_passenger_count','child_selling_price_per_person','child_ticket_price_per_person','child_airport_tax_per_person',
    'payment_plan','invoice_address','ticket_price_per_person','airport_tax_per_person','business_upgrade_count',
    'traveler_additions','land_invoice_amount_usd','passenger_names','flight_pnr','documents_sent_to_land_at'
  ]) required_col
  where not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='customer_tracking' and column_name=required_col
  );
  if missing is not null then
    raise exception 'customer_tracking still missing columns: %', missing;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='payment_invoices' and column_name='document_data') then
    raise exception 'payment_invoices.document_data is missing';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='quotations' and column_name='child_selling_price_per_person') then
    raise exception 'quotations.child_selling_price_per_person is missing';
  end if;
end $$;

commit;

-- Force PostgREST/Supabase API to refresh its column cache immediately.
notify pgrst, 'reload schema';

select 'OK - Bhutan Center Pricing schema v12.11.3 is ready' as result;
