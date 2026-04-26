-- 21_admin_investment_plan_catalog_view.sql
-- Read model for the "Plan catalog" section on the admin Investment Plan
-- Management page. One row per plan, with per-plan aggregates pulled from
-- user_investments.
--
-- security_invoker = true means RLS on the underlying tables applies:
--   - non-admins see only plans with status='active' (via investment_plans RLS)
--     aggregated against their own user_investments (via user_investments RLS),
--     which is not a useful surface — treat this view as admin-only in the
--     client.
--   - admins see every plan with full aggregates.
-- The view intentionally does not enforce is_admin() itself so a future
-- /plans marketing page could reuse a stripped-down variant.

create or replace view public.admin_investment_plan_catalog_view
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.name,
  p.description,
  p.tag,
  p.status,
  p.risk,
  p.min_deposit_usd,
  p.max_deposit_usd,
  p.return_rate_percent,
  p.duration_hours,
  p.features,
  p.highlight,
  p.display_order,
  p.archived_at,
  p.created_at,
  p.updated_at,
  coalesce(
    count(distinct ui.user_id) filter (where ui.status = 'active'),
    0
  )::bigint as active_investors,
  coalesce(
    sum(ui.amount_usd) filter (where ui.status = 'active'),
    0
  )::numeric(18, 2) as total_invested_usd,
  coalesce(sum(ui.profit_credited_usd), 0)::numeric(18, 2) as profit_credited_usd,
  coalesce(
    count(*) filter (where ui.status = 'active' and ui.end_at::date = current_date),
    0
  )::bigint as maturing_today
from public.investment_plans p
left join public.user_investments ui on ui.plan_id = p.id
group by p.id;
