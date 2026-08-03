-- Add explicit Agent flight fare and set current company rates
alter table public.app_settings
add column if not exists agent_ticket_price_thb numeric not null default 25220;

update public.app_settings
set ticket_price_thb = 26000,
    agent_ticket_price_thb = 25220,
    agent_ticket_discount_percent = 3,
    updated_at = now();
