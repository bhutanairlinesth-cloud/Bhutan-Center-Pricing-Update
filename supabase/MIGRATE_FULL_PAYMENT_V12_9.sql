-- Bhutan Center Pricing v12.9
-- Payment plan: 2-stage / one-time full payment / custom.
-- Run once in Supabase SQL Editor after deploying v12.9.

alter table public.customer_tracking
  add column if not exists payment_plan text not null default 'installments';

update public.customer_tracking
set payment_plan = 'installments'
where payment_plan is null or payment_plan not in ('installments','full_payment','custom');

alter table public.customer_tracking drop constraint if exists customer_tracking_payment_plan_check;
alter table public.customer_tracking
  add constraint customer_tracking_payment_plan_check
  check (payment_plan in ('installments','full_payment','custom'));

-- Allow a dedicated one-time invoice without changing old Invoice 1 / Invoice 2 records.
alter table public.payment_invoices drop constraint if exists payment_invoices_installment_check;
alter table public.payment_invoices
  add constraint payment_invoices_installment_check
  check (installment in ('deposit','balance','full','supplemental'));

-- A customer may have at most one active base invoice of each kind.
drop index if exists payment_invoices_base_installment_unique;
create unique index if not exists payment_invoices_base_installment_unique
  on public.payment_invoices(tracking_id, installment)
  where installment in ('deposit','balance','full');

-- Payment ledger can explicitly link a one-time full-payment receipt.
alter table public.payment_transactions drop constraint if exists payment_transactions_type_check;
alter table public.payment_transactions
  add constraint payment_transactions_type_check
  check (type in ('ticket_deposit','package_balance','full_payment','supplemental','refund','other'));

comment on column public.customer_tracking.payment_plan is
  'installments = Invoice 1 + Invoice 2, full_payment = collect all in one invoice, custom = manual/special case';
