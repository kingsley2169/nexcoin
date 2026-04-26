-- 16_rpc_get_admin_user_management_summary.sql
-- Feeds the four summary cards on the Admin User Management page
-- (total users, active, flagged, pending KYC) plus aggregate balances.
-- Admin-only: the WHERE clause short-circuits for non-admins.

create or replace function public.get_admin_user_management_summary()
returns table (
  total_users bigint,
  active_users bigint,
  flagged_users bigint,
  pending_kyc bigint,
  total_available_balance_usd numeric,
  total_deposits_usd numeric,
  total_withdrawals_usd numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) as total_users,
    count(*) filter (where p.account_status = 'active') as active_users,
    count(*) filter (where p.account_status = 'flagged') as flagged_users,
    count(*) filter (where uc.kyc_status = 'pending') as pending_kyc,
    coalesce(sum(ubs.available_balance_usd), 0) as total_available_balance_usd,
    coalesce(sum(ubs.deposits_usd), 0) as total_deposits_usd,
    coalesce(sum(ubs.withdrawals_usd), 0) as total_withdrawals_usd
  from public.profiles p
  left join public.user_compliance uc on uc.user_id = p.id
  left join public.user_balance_snapshots ubs on ubs.user_id = p.id
  where public.is_admin();
$$;
