-- 42_rpc_user_claim_pending_referral_earning.sql
-- Claim RPC for the Earnings history card on /account/referrals. Moves a
-- single pending earning to `credited`, credits the caller's available
-- balance by `amount_usd`, bumps the parent `referrals` row's cached
-- `total_earnings_usd`, and writes an audit row.
--
-- Guarded so a user can only claim their own rows, and only rows that are
-- still pending. Uses `for update` to serialize concurrent claim attempts
-- on the same earning.
--
-- Auditing: user-initiated actions do not write to `admin_audit_logs`
-- (that table is actor_admin_id scoped). The earning row itself is the
-- audit trail — `credited_at` + `status` transitions tell the full story.
--
-- If the product later switches to auto-credit, this RPC becomes a no-op
-- (the view will only ever show `Credited` rows) — the UI stays compatible.

create or replace function public.user_claim_pending_referral_earning(
  p_earning_id uuid
)
returns public.referral_earnings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_earning public.referral_earnings;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_earning
  from public.referral_earnings
  where id = p_earning_id
  for update;

  if v_earning.id is null then
    raise exception 'Referral earning not found';
  end if;

  if v_earning.referrer_user_id <> v_user then
    raise exception 'Not authorized to claim this earning';
  end if;

  if v_earning.status <> 'pending' then
    raise exception 'Earning is not pending';
  end if;

  update public.referral_earnings
  set
    status = 'credited',
    credited_at = now()
  where id = p_earning_id
  returning * into v_earning;

  update public.user_balance_snapshots
  set available_balance_usd = available_balance_usd + v_earning.amount_usd
  where user_id = v_user;

  if v_earning.referral_id is not null then
    update public.referrals
    set total_earnings_usd = total_earnings_usd + v_earning.amount_usd
    where id = v_earning.referral_id;
  end if;

  return v_earning;
end;
$$;

revoke all on function public.user_claim_pending_referral_earning(uuid) from public;
grant execute on function public.user_claim_pending_referral_earning(uuid) to authenticated;
