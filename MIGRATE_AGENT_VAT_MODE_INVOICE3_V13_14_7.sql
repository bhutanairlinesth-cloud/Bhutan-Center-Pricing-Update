-- Bhutan Center Pricing V13.14.7
-- Agent VAT modes:
--   1) total_package  = VAT on the whole package portion (excluding airfare/airport tax)
--   2) service_split  = package invoice excludes the service-fee portion and Invoice 3 bills service fee + VAT
--
-- No new columns are required. The link/mode are stored inside payment_invoices.document_data JSONB.
-- This migration only updates the supplemental-total trigger so the VAT service Invoice 3 is not
-- counted as new revenue a second time (its service-fee base already exists inside the package sale).

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
    coalesce(sum(amount) filter (
      where status <> 'cancelled'
        and coalesce(document_data->>'agentVatMode', '') <> 'service_split_invoice'
    ), 0),
    coalesce(sum(cost_amount) filter (
      where status <> 'cancelled'
        and coalesce(document_data->>'agentVatMode', '') <> 'service_split_invoice'
    ), 0)
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

grant execute on function public.refresh_customer_supplemental_totals(text) to authenticated;

-- Recalculate existing rows once so reports and dashboard totals remain correct.
do $$
declare r record;
begin
  for r in select id from public.customer_tracking loop
    perform public.refresh_customer_supplemental_totals(r.id);
  end loop;
end $$;
