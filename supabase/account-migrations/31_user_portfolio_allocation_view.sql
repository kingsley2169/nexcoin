-- 31_user_portfolio_allocation_view.sql
-- Per-plan allocation breakdown for the /account/portfolio "Allocation" card.
-- One row per active plan the caller currently has capital in, with the
-- USD amount, share of total, and count of open positions.
--
-- Important: do not group by investment_plans.tag. Tag is a marketing label
-- and is not a stable identity key; multiple plans could share it or admins
-- could rename it. Grouping uses plan_id + plan_name instead.
--
-- color_hex is a display hint chosen by plan slug/name to match the visual language on
-- the portfolio page. Unknown tiers fall back to a neutral color; the
-- frontend is free to override.

create or replace view public.user_portfolio_allocation_view
with (security_invoker = true)
as
with my_active as (
  select
    p.id as plan_id,
    p.slug as plan_slug,
    p.name as plan_name,
    ui.amount_usd
  from public.user_investments ui
  join public.investment_plans p on p.id = ui.plan_id
  where ui.user_id = auth.uid()
    and ui.status = 'active'
),
totals as (
  select coalesce(sum(amount_usd), 0)::numeric(18, 2) as total_usd
  from my_active
)
select
  m.plan_id,
  m.plan_slug,
  m.plan_name,
  sum(m.amount_usd)::numeric(18, 2) as amount_usd,
  case
    when (select total_usd from totals) > 0
      then round(
        sum(m.amount_usd) / (select total_usd from totals) * 100,
        2
      )::numeric(6, 2)
    else 0::numeric(6, 2)
  end as percent_of_total,
  count(*)::integer as position_count,
  case lower(coalesce(m.plan_slug, m.plan_name))
    when 'beginner' then '#9fc8c9'
    when 'amateur' then '#5F9EA0'
    when 'advanced' then '#3c7f80'
    when 'pro' then '#1f5556'
    else '#b7c8c7'
  end as color_hex
from my_active m
group by m.plan_id, m.plan_slug, m.plan_name
order by amount_usd desc;

grant select on public.user_portfolio_allocation_view to authenticated;
