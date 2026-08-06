-- Bhutan Center Pricing v12.7
-- Optional billing address + large group pricing (e.g. 15 paying + 1 Tour Leader)

alter table public.customer_tracking
  add column if not exists invoice_address text not null default '',
  add column if not exists pricing_mode text not null default 'standard',
  add column if not exists chargeable_passenger_count integer,
  add column if not exists tour_leader_count integer not null default 0,
  add column if not exists regular_land_cost_per_person numeric(14,2) not null default 0,
  add column if not exists tour_leader_land_cost_per_person numeric(14,2) not null default 0,
  add column if not exists group_margin_per_traveler numeric(14,2) not null default 0,
  add column if not exists group_selling_price_override_per_person numeric(14,2) not null default 0,
  add column if not exists group_pricing_cost_total numeric(14,2) not null default 0;

update public.customer_tracking
set chargeable_passenger_count = greatest(1, passenger_count)
where chargeable_passenger_count is null or chargeable_passenger_count < 1;

update public.customer_tracking
set pricing_mode = 'standard'
where pricing_mode not in ('standard', 'group_tl') or pricing_mode is null;

update public.customer_tracking
set tour_leader_count = greatest(0, passenger_count - chargeable_passenger_count)
where pricing_mode = 'group_tl';

-- Keep values valid without failing when the migration is run more than once.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customer_tracking_pricing_mode_check'
  ) then
    alter table public.customer_tracking
      add constraint customer_tracking_pricing_mode_check
      check (pricing_mode in ('standard', 'group_tl'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'customer_tracking_chargeable_pax_check'
  ) then
    alter table public.customer_tracking
      add constraint customer_tracking_chargeable_pax_check
      check (
        chargeable_passenger_count is null
        or (chargeable_passenger_count >= 1 and chargeable_passenger_count <= passenger_count)
      );
  end if;
end $$;

comment on column public.customer_tracking.invoice_address is 'Optional address printed on quotation and invoice documents';
comment on column public.customer_tracking.pricing_mode is 'standard or group_tl';
comment on column public.customer_tracking.chargeable_passenger_count is 'Number of travellers billed; actual passenger_count may include Tour Leaders';
comment on column public.customer_tracking.tour_leader_land_cost_per_person is 'LAND cost for each Tour Leader after complimentary accommodation; includes payable SDF, visa and ground services';
