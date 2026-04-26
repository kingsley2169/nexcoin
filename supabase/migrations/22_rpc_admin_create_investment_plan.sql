-- 22_rpc_admin_create_investment_plan.sql
-- RPC used by the "Create Plan" button on the admin Investment Plan
-- Management page. Inserts a plan row, records a matching row in
-- investment_plan_events and admin_audit_logs.
--
-- Role gate: owner and admin. support/compliance/finance/viewer cannot
-- create plans — plans directly affect money flow.

create or replace function public.admin_create_investment_plan(
  slug text,
  name text,
  description text default '',
  tag text default null,
  status public.plan_status default 'draft',
  risk public.plan_risk default 'balanced',
  min_deposit_usd numeric default 0,
  max_deposit_usd numeric default null,
  return_rate_percent numeric default 0,
  duration_hours integer default 24,
  features text[] default array[]::text[],
  highlight boolean default false,
  display_order integer default 0
)
returns public.investment_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted public.investment_plans;
begin
  if not public.is_admin_with_role(array['owner', 'admin']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  insert into public.investment_plans (
    slug,
    name,
    description,
    tag,
    status,
    risk,
    min_deposit_usd,
    max_deposit_usd,
    return_rate_percent,
    duration_hours,
    features,
    highlight,
    display_order,
    created_by,
    updated_by
  )
  values (
    slug,
    name,
    description,
    tag,
    status,
    risk,
    min_deposit_usd,
    max_deposit_usd,
    return_rate_percent,
    duration_hours,
    features,
    highlight,
    display_order,
    auth.uid(),
    auth.uid()
  )
  returning * into inserted;

  insert into public.investment_plan_events (
    plan_id,
    actor_admin_id,
    action_type,
    plan_name_snapshot,
    title,
    to_status,
    new_values
  )
  values (
    inserted.id,
    auth.uid(),
    'plan_created',
    inserted.name,
    'Plan created',
    inserted.status,
    to_jsonb(inserted)
  );

  insert into public.admin_audit_logs (
    actor_admin_id,
    action_type,
    entity_table,
    entity_id,
    new_values
  )
  values (
    auth.uid(),
    'plan_created',
    'investment_plans',
    inserted.id,
    to_jsonb(inserted)
  );

  return inserted;
end;
$$;
