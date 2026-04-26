-- 26_rpc_get_admin_investment_plan_summary.sql
-- Feeds the four summary cards at the top of the admin Investment Plan
-- Management page:
--   - Active plans        = count of investment_plans where status='active'
--   - Total invested      = sum of active user_investments.amount_usd
--   - Active investors    = distinct users with an active investment
--   - Profit credited     = sum of user_investments.profit_credited_usd
--   - Maturing today      = active investments whose end_at is today
--
-- Admin-only: the WHERE clause short-circuits for non-admins.

create or replace function public.get_admin_investment_plan_summary()
returns table (
  total_plans bigint,
  active_plans bigint,
  paused_plans bigint,
  draft_plans bigint,
  total_invested_usd numeric,
  total_profit_credited_usd numeric,
  active_investors bigint,
  maturing_today bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with plan_counts as (
    select
      count(*)::bigint as total_plans,
      count(*) filter (where status = 'active')::bigint as active_plans,
      count(*) filter (where status = 'paused')::bigint as paused_plans,
      count(*) filter (where status = 'draft')::bigint as draft_plans
    from public.investment_plans
    where public.is_admin()
  ),
  investment_stats as (
    select
      coalesce(sum(amount_usd) filter (where status = 'active'), 0)::numeric as total_invested_usd,
      coalesce(sum(profit_credited_usd), 0)::numeric as total_profit_credited_usd,
      count(distinct user_id) filter (where status = 'active')::bigint as active_investors,
      count(*) filter (where status = 'active' and end_at::date = current_date)::bigint as maturing_today
    from public.user_investments
    where public.is_admin()
  )
  select
    pc.total_plans,
    pc.active_plans,
    pc.paused_plans,
    pc.draft_plans,
    is2.total_invested_usd,
    is2.total_profit_credited_usd,
    is2.active_investors,
    is2.maturing_today
  from plan_counts pc
  cross join investment_stats is2;
$$;
