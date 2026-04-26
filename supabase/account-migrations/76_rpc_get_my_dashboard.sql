-- 76_rpc_get_my_dashboard.sql
-- Final dashboard aggregator for /account.
--
-- Returns the homepage payload in one round-trip:
--   - user header data
--   - account details
--   - metrics
--   - portfolio snapshot
--   - top 3 active plans
--   - 5 recent transactions
--   - unread notification count
--
-- The JSON shape is aligned to components/account/dashboard-overview.tsx so
-- the frontend can swap from piecemeal selects to one RPC response cleanly.

create or replace function public.get_my_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_profile record;
  v_balance record;
  v_compliance record;
  v_active_invested_usd numeric(18, 2) := 0;
  v_total_profit_usd numeric(18, 2) := 0;
  v_total_balance_usd numeric(18, 2) := 0;
  v_available_balance_usd numeric(18, 2) := 0;
  v_locked_balance_usd numeric(18, 2) := 0;
  v_next_payout text := 'Not scheduled';
  v_current_plan text := 'No active plan';
  v_active_plans jsonb := '[]'::jsonb;
  v_recent_activity jsonb := '[]'::jsonb;
  v_unread_notifications integer := 0;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select
    p.full_name,
    p.email,
    p.phone_number,
    p.country,
    p.account_status,
    p.last_active_at,
    p.created_at
  into v_profile
  from public.profiles p
  where p.id = v_user;

  if v_profile.email is null then
    raise exception 'Profile not found';
  end if;

  select
    b.available_balance_usd,
    b.locked_balance_usd,
    b.deposits_usd,
    b.withdrawals_usd,
    b.active_plans_count
  into v_balance
  from public.user_balance_snapshots b
  where b.user_id = v_user;

  select
    c.kyc_status,
    c.withdrawal_limit_usd
  into v_compliance
  from public.my_compliance_summary c
  where c.user_id = v_user;

  select
    coalesce(sum(amount_usd), 0)::numeric(18, 2),
    coalesce(sum(profit_credited_usd), 0)::numeric(18, 2)
  into v_active_invested_usd, v_total_profit_usd
  from public.user_investments
  where user_id = v_user;

  v_available_balance_usd := coalesce(v_balance.available_balance_usd, 0);
  v_locked_balance_usd := coalesce(v_balance.locked_balance_usd, 0);
  v_total_balance_usd := v_available_balance_usd + v_locked_balance_usd;

  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'name', p.plan_name,
          'amount', to_char(p.amount_usd, 'FM$999,999,999,990.00'),
          'expectedReturn', to_char(p.projected_profit_usd, 'FM$999,999,999,990.00'),
          'startDate', to_char(p.start_at, 'Mon FMDD, YYYY'),
          'maturityDate', to_char(p.end_at, 'Mon FMDD, YYYY'),
          'status',
            initcap(replace(p.status::text, '_', ' ')),
          'progress', p.progress_percent
        )
        order by p.end_at asc
      ),
      '[]'::jsonb
    )
  into v_active_plans
  from (
    select *
    from public.user_active_investments_view
    order by end_at asc
    limit 3
  ) p;

  select
    coalesce(min(to_char(end_at, 'Mon FMDD, YYYY')), 'Not scheduled'),
    coalesce(
      (
        select plan_name
        from public.user_active_investments_view
        order by end_at asc
        limit 1
      ),
      'No active plan'
    )
  into v_next_payout, v_current_plan
  from public.user_active_investments_view;

  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'label', ut.detail,
          'type', initcap(ut.type),
          'status', initcap(replace(ut.status, '_', ' ')),
          'date', to_char(ut.created_at, 'Mon FMDD, YYYY'),
          'amount',
            case
              when ut.direction = 'in' then '+' else '-'
            end || to_char(ut.amount_usd, 'FM$999,999,999,990.00')
        )
        order by ut.created_at desc
      ),
      '[]'::jsonb
    )
  into v_recent_activity
  from (
    select *
    from public.user_transactions_view
    order by created_at desc
    limit 5
  ) ut;

  if v_recent_activity = '[]'::jsonb then
    v_recent_activity := jsonb_build_array(
      jsonb_build_object(
        'label', 'Account created',
        'type', 'Account',
        'status', initcap(replace(coalesce(v_profile.account_status::text, 'active'), '_', ' ')),
        'date', to_char(v_profile.created_at, 'Mon FMDD, YYYY'),
        'amount', to_char(0, 'FM$0.00')
      )
    );
  end if;

  select count(*)::integer
  into v_unread_notifications
  from public.notifications
  where user_id = v_user
    and not is_read;

  return jsonb_build_object(
    'user', jsonb_build_object(
      'name', coalesce(v_profile.full_name, v_profile.email),
      'email', v_profile.email
    ),
    'accountDetails', jsonb_build_array(
      jsonb_build_object('label', 'Full Name', 'value', coalesce(v_profile.full_name, v_profile.email)),
      jsonb_build_object('label', 'Email', 'value', v_profile.email),
      jsonb_build_object('label', 'Phone', 'value', coalesce(v_profile.phone_number, 'Not provided')),
      jsonb_build_object('label', 'Country', 'value', coalesce(v_profile.country, 'Not provided')),
      jsonb_build_object('label', 'Status', 'value', initcap(replace(coalesce(v_profile.account_status::text, 'active'), '_', ' '))),
      jsonb_build_object(
        'label', 'Last Active',
        'value', coalesce(to_char(v_profile.last_active_at, 'Mon FMDD, YYYY'), 'Not available')
      )
    ),
    'metrics', jsonb_build_array(
      jsonb_build_object('label', 'Total Balance', 'value', to_char(v_total_balance_usd, 'FM$999,999,999,990.00')),
      jsonb_build_object('label', 'Active Investment', 'value', to_char(coalesce(v_active_invested_usd, 0), 'FM$999,999,999,990.00')),
      jsonb_build_object('label', 'Total Profit', 'value', to_char(coalesce(v_total_profit_usd, 0), 'FM$999,999,999,990.00')),
      jsonb_build_object('label', 'Total Deposits', 'value', to_char(coalesce(v_balance.deposits_usd, 0), 'FM$999,999,999,990.00')),
      jsonb_build_object('label', 'Available Balance', 'value', to_char(v_available_balance_usd, 'FM$999,999,999,990.00')),
      jsonb_build_object('label', 'Active Plans', 'value', coalesce(v_balance.active_plans_count, 0)::text)
    ),
    'portfolioSnapshot', jsonb_build_array(
      jsonb_build_object('label', 'Account Status', 'value', initcap(replace(coalesce(v_profile.account_status::text, 'active'), '_', ' '))),
      jsonb_build_object('label', 'Verification', 'value', initcap(replace(coalesce(v_compliance.kyc_status::text, 'unverified'), '_', ' '))),
      jsonb_build_object('label', 'Current Plan', 'value', v_current_plan),
      jsonb_build_object('label', 'Next Payout', 'value', v_next_payout),
      jsonb_build_object('label', 'Withdrawal Limit', 'value', to_char(coalesce(v_compliance.withdrawal_limit_usd, 0), 'FM$999,999,999,990.00')),
      jsonb_build_object('label', 'Member Since', 'value', to_char(v_profile.created_at, 'Mon FMDD, YYYY'))
    ),
    'activePlans', v_active_plans,
    'recentActivity', v_recent_activity,
    'unreadNotificationCount', v_unread_notifications
  );
end;
$$;

revoke all on function public.get_my_dashboard() from public;
grant execute on function public.get_my_dashboard() to authenticated;
