-- Bhutan Center Pricing v12.4.6
-- Preserve the exact package, ticket batch, passenger names and paid-ticket deductions
-- shown on each Invoice 1 / Invoice 2 at the moment the document is issued.

alter table public.payment_invoices
  add column if not exists document_data jsonb;

comment on column public.payment_invoices.document_data is
  'Immutable customer-facing invoice snapshot: package lines, ticket batch, passenger names, deductions and totals captured at issue time.';

grant select, insert, update, delete on public.payment_invoices to authenticated;
