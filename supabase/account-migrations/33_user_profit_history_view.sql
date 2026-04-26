-- 33_user_profit_history_view.sql
-- Recent profit credits for the /account/portfolio "Profit history" card.
--
-- Source 1: investment_plan_events with action_type = 'plan_profit_credited'
-- filtered to the caller's own investments (joined through user_investments
-- via `new_values->>'investmentId'`). These are the display_status = 'Credited'
-- entries — a real payout has been recorded.
--
-- Source 2: active user_investments with profit_credited_usd = 0 — shown as
-- 'Accruing' until the first credit lands.
--
-- Source 3: matured user_investments where profit_credited_usd is less than
-- projected_profit_usd — shown as 'Pending' (projected but not yet settled).
--
-- Rows are ordered most recent first; the frontend takes the top N.
--
-- security_invoker = false is required here because investment_plan_events is
-- admin-readable only at the table-RLS level. The auth.uid()-scoped
-- my_investments CTE is the authoritative tenant filter.

create or replace view public.user_profit_history_view
with (security_invoker = false)
as
with my_investments as (
  select ui.*, p.name as plan_name
  from public.user_investments ui
  join public.investment_plans p on p.id = ui.plan_id
  where ui.user_id = auth.uid()
),
credited_events as (
  select
    e.id::text as id,
    mi.plan_name,
    mi.plan_id,
    mi.id as investment_id,
    coalesce(
      (e.new_values ->> 'amountUsd')::numeric(18, 2),
      mi.profit_credited_usd
    ) as amount_usd,
    e.created_at as occurred_at,
    'Credited'::text as display_status
  from public.investment_plan_events e
  join my_investments mi
    on mi.id::text = e.new_values ->> 'investmentId'
  where e.action_type = 'plan_profit_credited'
),
accruing_rows as (
  select
    ('accruing-' || mi.id::text) as id,
    mi.plan_name,
    mi.plan_id,
    mi.id as investment_id,
    mi.projected_profit_usd as amount_usd,
    mi.start_at as occurred_at,
    'Accruing'::text as display_status
  from my_investments mi
  where mi.status = 'active'
    and mi.profit_credited_usd = 0
),
pending_rows as (
  select
    ('pending-' || mi.id::text) as id,
    mi.plan_name,
    mi.plan_id,
    mi.id as investment_id,
    (mi.projected_profit_usd - mi.profit_credited_usd)::numeric(18, 2) as amount_usd,
    coalesce(mi.matured_at, mi.end_at) as occurred_at,
    'Pending'::text as display_status
  from my_investments mi
  where mi.status = 'matured'
    and mi.profit_credited_usd < mi.projected_profit_usd
)
select id, plan_name, plan_id, investment_id, amount_usd, occurred_at, display_status
from credited_events
union all
select id, plan_name, plan_id, investment_id, amount_usd, occurred_at, display_status
from accruing_rows
union all
select id, plan_name, plan_id, investment_id, amount_usd, occurred_at, display_status
from pending_rows
order by occurred_at desc;

grant select on public.user_profit_history_view to authenticated;
