-- 29_rpc_user_cancel_pending_investment.sql
-- The current user_investments lifecycle does not have a dedicated "pending"
-- status. For the user plans page, "pending investment" is implemented as a
-- short user grace window immediately after creation while the row is still
-- active and no profit has been credited yet.
--
-- This RPC cancels an investment only when:
--   - it belongs to the caller
--   - it is still active
--   - no profit has been credited
--   - it was created inside the 15-minute cancel window

create or replace function public.user_cancel_pending_investment(
  p_investment_id uuid,
  p_cancel_reason text default null
)
returns public.user_investments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_investment public.user_investments;
  v_balance public.user_balance_snapshots;
  v_reason text := coalesce(
    nullif(trim(p_cancel_reason), ''),
    'Cancelled during user grace window'
  );
  v_plan_name text;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select ui.*
  into v_investment
  from public.user_investments ui
  where ui.id = p_investment_id
    and ui.user_id = v_user
  for update;

  if v_investment.id is null then
    raise exception 'Investment not found';
  end if;

  if v_investment.status <> 'active' then
    raise exception 'Only active investments can be cancelled';
  end if;

  if v_investment.profit_credited_usd > 0 then
    raise exception 'Investments with credited profit cannot be cancelled';
  end if;

  if now() > v_investment.created_at + interval '15 minutes' then
    raise exception 'Investment is outside the cancel window';
  end if;

  select p.name
  into v_plan_name
  from public.investment_plans p
  where p.id = v_investment.plan_id;

  select *
  into v_balance
  from public.user_balance_snapshots
  where user_id = v_user
  for update;

  if v_balance.user_id is null then
    raise exception 'Balance snapshot not found';
  end if;

  update public.user_investments
  set
    status = 'cancelled',
    cancelled_at = now(),
    cancel_reason = v_reason
  where id = v_investment.id
  returning * into v_investment;

  update public.user_balance_snapshots
  set
    available_balance_usd = available_balance_usd + v_investment.amount_usd,
    locked_balance_usd = greatest(locked_balance_usd - v_investment.amount_usd, 0),
    active_plans_count = greatest(active_plans_count - 1, 0)
  where user_id = v_user;

  insert into public.investment_plan_events (
    plan_id,
    actor_user_id,
    action_type,
    plan_name_snapshot,
    title,
    old_values,
    new_values
  )
  values (
    v_investment.plan_id,
    v_user,
    'plan_subscription_cancelled',
    v_plan_name,
    'User cancelled investment during grace window',
    jsonb_build_object(
      'investmentId', v_investment.id,
      'status', 'active'
    ),
    jsonb_build_object(
      'investmentId', v_investment.id,
      'status', 'cancelled',
      'cancelReason', v_investment.cancel_reason
    )
  );

  return v_investment;
end;
$$;

revoke all on function public.user_cancel_pending_investment(uuid, text) from public;
grant execute on function public.user_cancel_pending_investment(uuid, text) to authenticated;
