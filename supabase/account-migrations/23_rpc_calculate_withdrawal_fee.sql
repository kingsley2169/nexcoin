-- 23_rpc_calculate_withdrawal_fee.sql
-- User RPC: returns the configured withdrawal fee breakdown for an asset and
-- requested amount. The page can call this before submitting
-- create_crypto_withdrawal_request.

create or replace function public.calculate_withdrawal_fee(
  p_asset public.deposit_asset,
  p_amount numeric
)
returns table (
  asset public.deposit_asset,
  symbol text,
  network text,
  amount numeric,
  min_withdrawal numeric,
  fee_flat numeric,
  fee_percent numeric,
  fee_total numeric,
  placeholder_rate_usd numeric,
  fee_total_usd numeric,
  net_amount numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_schedule public.user_withdrawal_fee_schedule;
  v_fee_total numeric;
  v_fee_total_usd numeric;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Withdrawal amount must be positive';
  end if;

  select *
  into v_schedule
  from public.user_withdrawal_fee_schedule
  where asset = p_asset
    and is_active = true;

  if v_schedule.asset is null then
    raise exception 'Withdrawal asset is not available';
  end if;

  if p_amount < v_schedule.min_withdrawal then
    raise exception 'Minimum withdrawal is % %', v_schedule.min_withdrawal, v_schedule.symbol;
  end if;

  v_fee_total := v_schedule.fee_flat + ((p_amount * v_schedule.fee_percent) / 100);
  v_fee_total_usd := v_fee_total * v_schedule.placeholder_rate_usd;

  if p_amount <= v_fee_total then
    raise exception 'Withdrawal amount is too small to cover the fee';
  end if;

  return query
  select
    v_schedule.asset,
    v_schedule.symbol,
    v_schedule.network,
    p_amount,
    v_schedule.min_withdrawal,
    v_schedule.fee_flat,
    v_schedule.fee_percent,
    round(v_fee_total, 8),
    v_schedule.placeholder_rate_usd,
    round(v_fee_total_usd, 2),
    round(p_amount - v_fee_total, 8);
end;
$$;

revoke all on function public.calculate_withdrawal_fee(public.deposit_asset, numeric) from public;
grant execute on function public.calculate_withdrawal_fee(public.deposit_asset, numeric) to authenticated;
