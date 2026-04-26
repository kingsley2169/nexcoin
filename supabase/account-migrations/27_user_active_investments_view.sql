-- 27_user_active_investments_view.sql
-- Read model for /account/plans "Active plans". Returns the caller's own
-- investment rows joined to plan metadata plus display-friendly progress and
-- payout calculations.

create or replace view public.user_active_investments_view
with (security_invoker = true)
as
select
  ui.id,
  ui.user_id,
  ui.plan_id,
  p.slug as plan_slug,
  p.name as plan_name,
  p.tag as plan_tag,
  p.risk as plan_risk,
  p.highlight as plan_highlight,
  p.duration_hours,
  ui.amount_usd,
  ui.projected_profit_usd,
  ui.profit_credited_usd,
  (ui.amount_usd + ui.projected_profit_usd)::numeric(18, 2) as total_payout_usd,
  ui.status,
  ui.start_at,
  ui.end_at,
  greatest(
    least(
      round(
        (
          extract(epoch from (now() - ui.start_at))
          / nullif(extract(epoch from (ui.end_at - ui.start_at)), 0)
        ) * 100
      ),
      100
    ),
    0
  )::integer as progress_percent,
  greatest(
    extract(epoch from (ui.end_at - now())),
    0
  )::bigint as seconds_until_maturity
from public.user_investments ui
join public.investment_plans p
  on p.id = ui.plan_id
where ui.status = 'active'
order by ui.end_at asc, ui.created_at desc;

grant select on public.user_active_investments_view to authenticated;
