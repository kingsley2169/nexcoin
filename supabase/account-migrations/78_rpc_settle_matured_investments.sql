-- 78_rpc_settle_matured_investments.sql
-- Closes the maturity gap: when an investment's end_at has passed but its
-- status is still 'active', this RPC marks it matured, releases the locked
-- principal back to available_balance_usd, credits the projected profit on
-- top, decrements active_plans_count, and emits a `plan_profit_credited`
-- event so the user's transactions/portfolio history shows the payout.
--
-- Safe to call multiple times — the `status = 'active'` filter combined
-- with `for update skip locked` makes concurrent invocations idempotent.
--
-- Two ways to use it:
--   1. Lazy: pages call `settle_matured_investments(auth.uid())` on load so
--      maturity is realised the next time the user visits.
--   2. Background: schedule the no-arg form via pg_cron (or any external
--      scheduler) so users see balances flip even if they never visit:
--        select cron.schedule(
--          'settle-matured-investments',
--          '*/5 * * * *',
--          $$select public.settle_matured_investments()$$
--        );

create or replace function public.settle_matured_investments(
  p_target_user_id uuid default null
)
returns table (
  settled_count integer,
  total_credited_usd numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_target uuid;
  v_investment record;
  v_plan_name text;
  v_count integer := 0;
  v_total numeric := 0;
begin
  -- Authorization: callers can only settle their own investments unless
  -- they are an admin or this is a service-role / cron call (auth.uid() null).
  if p_target_user_id is null then
    if v_caller is not null and not public.is_admin() then
      raise exception 'Not authorized';
    end if;
    v_target := null;
  else
    if v_caller is null then
      raise exception 'Not authenticated';
    end if;
    if v_caller <> p_target_user_id and not public.is_admin() then
      raise exception 'Not authorized';
    end if;
    v_target := p_target_user_id;
  end if;

  for v_investment in
    select ui.*
    from public.user_investments ui
    where ui.status = 'active'
      and ui.end_at <= now()
      and (v_target is null or ui.user_id = v_target)
    for update of ui skip locked
  loop
    update public.user_investments
    set
      status = 'matured',
      matured_at = now(),
      profit_credited_usd = projected_profit_usd
    where id = v_investment.id;

    update public.user_balance_snapshots
    set
      available_balance_usd =
        available_balance_usd + v_investment.amount_usd + v_investment.projected_profit_usd,
      locked_balance_usd =
        greatest(locked_balance_usd - v_investment.amount_usd, 0),
      active_plans_count =
        greatest(active_plans_count - 1, 0)
    where user_id = v_investment.user_id;

    select name into v_plan_name
    from public.investment_plans
    where id = v_investment.plan_id;

    insert into public.investment_plan_events (
      plan_id,
      actor_user_id,
      action_type,
      plan_name_snapshot,
      title,
      new_values
    )
    values (
      v_investment.plan_id,
      v_investment.user_id,
      'plan_profit_credited',
      coalesce(v_plan_name, 'Investment plan'),
      'Plan matured — profit credited',
      jsonb_build_object(
        'investmentId', v_investment.id,
        'amountUsd', v_investment.projected_profit_usd,
        'principalUsd', v_investment.amount_usd
      )
    );

    v_count := v_count + 1;
    v_total := v_total + v_investment.amount_usd + v_investment.projected_profit_usd;
  end loop;

  return query select v_count, v_total;
end;
$$;

revoke all on function public.settle_matured_investments(uuid) from public;
grant execute on function public.settle_matured_investments(uuid) to authenticated;
grant execute on function public.settle_matured_investments(uuid) to service_role;
