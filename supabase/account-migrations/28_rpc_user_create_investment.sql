-- 28_rpc_user_create_investment.sql
-- User RPC for /account/plans. Debits available balance, creates an active
-- user_investments row, updates lightweight balance snapshot counters, and
-- emits an investment_plan_events row for audit/history.

create or replace function public.user_create_investment(
  p_plan_id uuid,
  p_amount_usd numeric
)
returns public.user_investments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan public.investment_plans;
  v_balance public.user_balance_snapshots;
  v_profile public.profiles;
  v_investment public.user_investments;
  v_projected_profit numeric(18, 2);
  v_start_at timestamptz := now();
  v_end_at timestamptz;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount_usd is null or p_amount_usd <= 0 then
    raise exception 'Investment amount must be positive';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user;

  if v_profile.id is null then
    raise exception 'Profile not found';
  end if;

  if v_profile.account_status = 'suspended' then
    raise exception 'Suspended accounts cannot start investments';
  end if;

  select *
  into v_plan
  from public.investment_plans
  where id = p_plan_id
    and status = 'active'
    and archived_at is null;

  if v_plan.id is null then
    raise exception 'Investment plan is not available';
  end if;

  if p_amount_usd < v_plan.min_deposit_usd then
    raise exception 'Minimum investment for % is %', v_plan.name, v_plan.min_deposit_usd;
  end if;

  if v_plan.max_deposit_usd is not null and p_amount_usd > v_plan.max_deposit_usd then
    raise exception 'Maximum investment for % is %', v_plan.name, v_plan.max_deposit_usd;
  end if;

  select *
  into v_balance
  from public.user_balance_snapshots
  where user_id = v_user
  for update;

  if v_balance.user_id is null then
    raise exception 'Balance snapshot not found';
  end if;

  if v_balance.available_balance_usd < p_amount_usd then
    raise exception 'Insufficient available balance';
  end if;

  v_projected_profit := round(
    p_amount_usd * (v_plan.return_rate_percent / 100.0),
    2
  );
  v_end_at := v_start_at + make_interval(hours => v_plan.duration_hours);

  update public.user_balance_snapshots
  set
    available_balance_usd = available_balance_usd - p_amount_usd,
    locked_balance_usd = locked_balance_usd + p_amount_usd,
    active_plans_count = active_plans_count + 1
  where user_id = v_user;

  insert into public.user_investments (
    user_id,
    plan_id,
    amount_usd,
    projected_profit_usd,
    status,
    start_at,
    end_at
  )
  values (
    v_user,
    v_plan.id,
    p_amount_usd,
    v_projected_profit,
    'active',
    v_start_at,
    v_end_at
  )
  returning * into v_investment;

  insert into public.investment_plan_events (
    plan_id,
    actor_user_id,
    action_type,
    plan_name_snapshot,
    title,
    to_status,
    new_values
  )
  values (
    v_plan.id,
    v_user,
    'plan_subscription_created',
    v_plan.name,
    'User started investment',
    v_plan.status,
    jsonb_build_object(
      'investmentId', v_investment.id,
      'amountUsd', v_investment.amount_usd,
      'projectedProfitUsd', v_investment.projected_profit_usd,
      'endAt', v_investment.end_at
    )
  );

  return v_investment;
end;
$$;

revoke all on function public.user_create_investment(uuid, numeric) from public;
grant execute on function public.user_create_investment(uuid, numeric) to authenticated;
