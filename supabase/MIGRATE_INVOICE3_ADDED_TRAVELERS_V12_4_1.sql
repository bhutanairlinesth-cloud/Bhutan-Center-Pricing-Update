-- Bhutan Center Pricing v12.4
-- Invoice 3+ / supplemental invoices, line items, separate payments, and grand totals.
-- Run once in Supabase SQL Editor.

alter table public.customer_tracking
  add column if not exists supplemental_invoice_total numeric(14,2) not null default 0,
  add column if not exists supplemental_cost_total numeric(14,2) not null default 0,
  add column if not exists grand_total_amount numeric(14,2) not null default 0,
  add column if not exists traveler_additions jsonb not null default '[]'::jsonb;

update public.customer_tracking
set grand_total_amount = greatest(0, coalesce(total_amount, 0) + coalesce(supplemental_invoice_total, 0))
where grand_total_amount = 0;

alter table public.payment_invoices
  add column if not exists sequence_no integer not null default 1,
  add column if not exists title text not null default '',
  add column if not exists line_items jsonb not null default '[]'::jsonb,
  add column if not exists cost_amount numeric(14,2) not null default 0;

-- Existing installations normally use these auto-generated constraint names.
alter table public.payment_invoices drop constraint if exists payment_invoices_installment_check;
alter table public.payment_invoices
  add constraint payment_invoices_installment_check
  check (installment in ('deposit','balance','supplemental'));

alter table public.payment_invoices drop constraint if exists payment_invoices_tracking_id_installment_key;
drop index if exists payment_invoices_tracking_id_installment_key;

-- Invoice 1 and Invoice 2 stay unique per customer; Invoice 3+ can be unlimited.
create unique index if not exists payment_invoices_base_installment_unique
  on public.payment_invoices(tracking_id, installment)
  where installment in ('deposit','balance');

update public.payment_invoices
set sequence_no = case installment when 'deposit' then 1 when 'balance' then 2 else greatest(sequence_no, 3) end,
    title = case
      when title <> '' then title
      when installment = 'deposit' then 'ค่าตั๋วเครื่องบินและภาษีสนามบิน'
      when installment = 'balance' then 'ค่าแพ็กเกจส่วนที่เหลือ'
      else 'บริการเพิ่มเติม'
    end;

alter table public.payment_transactions
  add column if not exists invoice_id text references public.payment_invoices(id) on delete set null;

alter table public.payment_transactions drop constraint if exists payment_transactions_type_check;
alter table public.payment_transactions
  add constraint payment_transactions_type_check
  check (type in ('ticket_deposit','package_balance','supplemental','refund','other'));

create index if not exists payment_invoices_tracking_sequence_idx
  on public.payment_invoices(tracking_id, sequence_no);
create index if not exists payment_transactions_invoice_idx
  on public.payment_transactions(invoice_id);

-- Keep the denormalized grand totals synchronized for reporting.
create or replace function public.refresh_customer_supplemental_totals(target_tracking_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  revenue_total numeric(14,2);
  cost_total numeric(14,2);
begin
  select
    coalesce(sum(amount) filter (where status <> 'cancelled'), 0),
    coalesce(sum(cost_amount) filter (where status <> 'cancelled'), 0)
  into revenue_total, cost_total
  from public.payment_invoices
  where tracking_id = target_tracking_id
    and installment = 'supplemental';

  update public.customer_tracking
  set supplemental_invoice_total = revenue_total,
      supplemental_cost_total = cost_total,
      grand_total_amount = greatest(0, coalesce(total_amount,0) + revenue_total),
      updated_at = now()
  where id = target_tracking_id;
end;
$$;

create or replace function public.payment_invoices_refresh_tracking_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_customer_supplemental_totals(old.tracking_id);
    return old;
  end if;
  perform public.refresh_customer_supplemental_totals(new.tracking_id);
  if tg_op = 'UPDATE' and old.tracking_id is distinct from new.tracking_id then
    perform public.refresh_customer_supplemental_totals(old.tracking_id);
  end if;
  return new;
end;
$$;

drop trigger if exists payment_invoices_refresh_tracking_totals_trigger on public.payment_invoices;
create trigger payment_invoices_refresh_tracking_totals_trigger
after insert or update or delete on public.payment_invoices
for each row execute function public.payment_invoices_refresh_tracking_totals();

-- Refresh all existing tracking records once.
do $$
declare r record;
begin
  for r in select id from public.customer_tracking loop
    perform public.refresh_customer_supplemental_totals(r.id);
  end loop;
end $$;

grant execute on function public.refresh_customer_supplemental_totals(text) to authenticated;
grant select, insert, update, delete on public.payment_invoices to authenticated;
grant select, insert, update, delete on public.payment_transactions to authenticated;
