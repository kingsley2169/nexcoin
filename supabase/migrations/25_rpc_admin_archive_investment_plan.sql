-- 25_rpc_admin_archive_investment_plan.sql
-- Soft-delete RPC. Flips status to 'archived' and sets archived_at.
-- The catalog view still includes archived plans so the admin page can
-- render a "Show archived" filter later; the public /plans policy does
-- NOT expose archived plans because its RLS requires status='active'.
--
-- Refuses to archive a plan that still has active user_investments —
-- that would orphan live user commitments. Cancel / settle those first.

create or replace function public.admin_archive_investment_plan(
  plan_id uuid,
  reason text default null
)
returns public.investment_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  old_plan public.investment_plans;
  updated_plan public.investment_plans;
  active_count integer;
begin
  if not public.is_admin_with_role(array['owner', 'admin']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select * into old_plan
  from public.investment_plans
  where id = plan_id
  for update;

  if old_plan.id is null then
    raise exception 'Plan not found';
  end if;

  if old_plan.archived_at is not null then
    return old_plan;
  end if;

  select count(*)
  into active_count
  from public.user_investments
  where plan_id = old_plan.id
    and status = 'active';

  if active_count > 0 then
    raise exception 'Cannot archive plan with % active investments', active_count;
  end if;

  update public.investment_plans
  set
    status = 'archived',
    archived_at = now(),
    updated_by = auth.uid()
  where id = plan_id
  returning * into updated_plan;

  insert into public.investment_plan_events (
    plan_id,
    actor_admin_id,
    action_type,
    plan_name_snapshot,
    title,
    from_status,
    to_status,
    old_values,
    new_values
  )
  values (
    plan_id,
    auth.uid(),
    'plan_archived',
    updated_plan.name,
    'Plan archived',
    old_plan.status,
    'archived',
    jsonb_build_object('status', old_plan.status, 'archived_at', old_plan.archived_at),
    jsonb_build_object('status', 'archived', 'archived_at', updated_plan.archived_at, 'reason', reason)
  );

  insert into public.admin_audit_logs (
    actor_admin_id,
    action_type,
    entity_table,
    entity_id,
    old_values,
    new_values
  )
  values (
    auth.uid(),
    'plan_archived',
    'investment_plans',
    plan_id,
    jsonb_build_object('status', old_plan.status),
    jsonb_build_object('status', 'archived', 'reason', reason)
  );

  return updated_plan;
end;
$$;
