-- 23_rpc_admin_update_investment_plan.sql
-- RPC used by the "Edit" button on each plan row. Null-safe: pass null for
-- any field you don't want to change. Does NOT change status — use
-- admin_set_investment_plan_status for that so status transitions live in
-- one place and emit a plan_status_changed event.

create or replace function public.admin_update_investment_plan(
  plan_id uuid,
  new_name text default null,
  new_description text default null,
  new_tag text default null,
  new_risk public.plan_risk default null,
  new_min_deposit_usd numeric default null,
  new_max_deposit_usd numeric default null,
  new_return_rate_percent numeric default null,
  new_duration_hours integer default null,
  new_features text[] default null,
  new_highlight boolean default null,
  new_display_order integer default null,
  clear_max_deposit boolean default false
)
returns public.investment_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  old_plan public.investment_plans;
  updated_plan public.investment_plans;
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

  update public.investment_plans
  set
    name = coalesce(new_name, name),
    description = coalesce(new_description, description),
    tag = coalesce(new_tag, tag),
    risk = coalesce(new_risk, risk),
    min_deposit_usd = coalesce(new_min_deposit_usd, min_deposit_usd),
    max_deposit_usd = case
      when clear_max_deposit then null
      else coalesce(new_max_deposit_usd, max_deposit_usd)
    end,
    return_rate_percent = coalesce(new_return_rate_percent, return_rate_percent),
    duration_hours = coalesce(new_duration_hours, duration_hours),
    features = coalesce(new_features, features),
    highlight = coalesce(new_highlight, highlight),
    display_order = coalesce(new_display_order, display_order),
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
    'plan_updated',
    updated_plan.name,
    'Plan details updated',
    old_plan.status,
    updated_plan.status,
    to_jsonb(old_plan),
    to_jsonb(updated_plan)
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
    'plan_updated',
    'investment_plans',
    plan_id,
    to_jsonb(old_plan),
    to_jsonb(updated_plan)
  );

  return updated_plan;
end;
$$;
