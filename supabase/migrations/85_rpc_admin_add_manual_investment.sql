-- 85_rpc_admin_add_manual_investment.sql
-- Privileged RPC for the User Management → Add Investment modal.
--
-- Inserts a row into user_investments on behalf of a user (e.g. to record
-- a historical or off-platform subscription). Updates user_balance_snapshots
-- so the user's deposits, locked balance, profit history, and active plan
-- count reflect the new entry consistently with the rest of the platform.
--
-- The investment_plan_events table is keyed to plan-level events (with a
-- plan_status enum on from/to_status), so it is intentionally NOT touched
-- here — the audit trail for individual user investments lives in
-- admin_audit_logs.

create or replace function public.admin_add_manual_investment(
  p_user_id uuid,
  p_plan_id uuid,
  p_amount_usd numeric,
  p_projected_profit_usd numeric,
  p_profit_credited_usd numeric default 0,
  p_status text default 'active',
  p_start_at timestamptz default now(),
  p_end_at timestamptz default null,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  investment_status public.user_investment_status;
  user_profile public.profiles;
  plan_record public.investment_plans;
  resolved_end_at timestamptz;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if p_amount_usd is null or p_amount_usd <= 0 then
    raise exception 'Investment amount must be greater than zero';
  end if;

  if p_projected_profit_usd is null or p_projected_profit_usd < 0 then
    raise exception 'Projected profit must be non-negative';
  end if;

  if p_profit_credited_usd < 0 or p_profit_credited_usd > p_projected_profit_usd then
    raise exception 'Profit credited must be between 0 and projected profit';
  end if;

  begin
    investment_status := p_status::public.user_investment_status;
  exception when invalid_text_representation then
    raise exception 'Invalid status: %', p_status;
  end;

  select * into user_profile from public.profiles where id = p_user_id;
  if user_profile.id is null then
    raise exception 'User not found';
  end if;

  select * into plan_record from public.investment_plans where id = p_plan_id;
  if plan_record.id is null then
    raise exception 'Investment plan not found';
  end if;

  resolved_end_at := coalesce(p_end_at, p_start_at + interval '72 hours');

  if resolved_end_at <= p_start_at then
    raise exception 'End date must be after start date';
  end if;

  insert into public.user_investments (
    user_id,
    plan_id,
    amount_usd,
    projected_profit_usd,
    profit_credited_usd,
    status,
    start_at,
    end_at,
    cancelled_at,
    cancel_reason,
    matured_at
  ) values (
    p_user_id,
    p_plan_id,
    p_amount_usd,
    p_projected_profit_usd,
    p_profit_credited_usd,
    investment_status,
    p_start_at,
    resolved_end_at,
    case when investment_status = 'cancelled' then now() else null end,
    case when investment_status = 'cancelled' then p_reason else null end,
    case when investment_status = 'matured' then now() else null end
  ) returning id into new_id;

  -- Rebalance the user's snapshot to reflect the new row.
  -- Active plans:  available -= amount, locked += amount, active_plans += 1.
  -- Matured plans: available += credited profit (it's been paid out).
  -- Cancelled:     no balance change.
  if investment_status = 'active' then
    insert into public.user_balance_snapshots (user_id, active_plans_count)
    values (p_user_id, 1)
    on conflict (user_id) do update
    set
      available_balance_usd = greatest(public.user_balance_snapshots.available_balance_usd - p_amount_usd, 0),
      locked_balance_usd = public.user_balance_snapshots.locked_balance_usd + p_amount_usd,
      active_plans_count = public.user_balance_snapshots.active_plans_count + 1;
  elsif investment_status = 'matured' and p_profit_credited_usd > 0 then
    insert into public.user_balance_snapshots (user_id, available_balance_usd)
    values (p_user_id, p_profit_credited_usd)
    on conflict (user_id) do update
    set
      available_balance_usd = public.user_balance_snapshots.available_balance_usd + excluded.available_balance_usd;
  end if;

  insert into public.admin_audit_logs (
    actor_admin_id,
    target_user_id,
    action_type,
    entity_table,
    entity_id,
    old_values,
    new_values
  ) values (
    auth.uid(),
    p_user_id,
    'note_added',
    'user_investments',
    new_id,
    null,
    jsonb_build_object(
      'plan_id', p_plan_id,
      'plan_name', plan_record.name,
      'amount_usd', p_amount_usd,
      'projected_profit_usd', p_projected_profit_usd,
      'profit_credited_usd', p_profit_credited_usd,
      'status', investment_status,
      'start_at', p_start_at,
      'end_at', resolved_end_at,
      'reason', p_reason,
      'manual', true
    )
  );

  return new_id;
end;
$$;
