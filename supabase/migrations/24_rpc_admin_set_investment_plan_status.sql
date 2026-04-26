-- 24_rpc_admin_set_investment_plan_status.sql
-- RPC used by the "Pause" / "Activate" button on each plan row, and by
-- any UI that needs to move a plan in or out of 'draft'.
--
-- Use admin_archive_investment_plan to move a plan to 'archived' — this
-- function rejects 'archived' to keep the soft-delete path explicit.

create or replace function public.admin_set_investment_plan_status(
  plan_id uuid,
  new_status public.plan_status,
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
  display_title text;
begin
  if not public.is_admin_with_role(array['owner', 'admin']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if new_status = 'archived' then
    raise exception 'Use admin_archive_investment_plan to archive plans';
  end if;

  select * into old_plan
  from public.investment_plans
  where id = plan_id
  for update;

  if old_plan.id is null then
    raise exception 'Plan not found';
  end if;

  if old_plan.archived_at is not null then
    raise exception 'Cannot change status of archived plan';
  end if;

  if old_plan.status = new_status then
    return old_plan;
  end if;

  update public.investment_plans
  set
    status = new_status,
    updated_by = auth.uid()
  where id = plan_id
  returning * into updated_plan;

  display_title := case new_status
    when 'active' then 'Plan activated'
    when 'paused' then 'Plan paused'
    when 'draft' then 'Plan moved to draft'
    else 'Plan status changed'
  end;

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
    'plan_status_changed',
    updated_plan.name,
    display_title,
    old_plan.status,
    new_status,
    jsonb_build_object('status', old_plan.status),
    jsonb_build_object('status', new_status, 'reason', reason)
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
    'plan_status_changed',
    'investment_plans',
    plan_id,
    jsonb_build_object('status', old_plan.status),
    jsonb_build_object('status', new_status, 'reason', reason)
  );

  return updated_plan;
end;
$$;
