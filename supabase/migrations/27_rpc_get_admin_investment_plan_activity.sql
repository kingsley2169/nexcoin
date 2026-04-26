-- 27_rpc_get_admin_investment_plan_activity.sql
-- Feeds the "Plan activity" panel on the admin Investment Plan Management page.
-- Returns the most recent plan events (create / update / status change /
-- archive), each with the plan name snapshot and a display-friendly title
-- so the panel renders without extra joins.

create or replace function public.get_admin_investment_plan_activity(
  limit_count integer default 10
)
returns table (
  id uuid,
  plan_id uuid,
  plan_name text,
  action_type public.admin_action_type,
  title text,
  from_status public.plan_status,
  to_status public.plan_status,
  actor_admin_id uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.plan_id,
    e.plan_name_snapshot as plan_name,
    e.action_type,
    e.title,
    e.from_status,
    e.to_status,
    e.actor_admin_id,
    e.created_at
  from public.investment_plan_events e
  where public.is_admin()
  order by e.created_at desc
  limit greatest(limit_count, 1);
$$;
