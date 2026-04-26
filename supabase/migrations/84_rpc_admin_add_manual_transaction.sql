-- 84_rpc_admin_add_manual_transaction.sql
-- Privileged RPC for the User Management → Manage Transactions modal.
-- Lets admin/owner/finance roles back-date or fabricate a deposit or
-- withdrawal row for a user (e.g. to record an off-platform transfer or
-- correct historical state) and rebalances user_balance_snapshots
-- automatically when the new row lands in a balance-affecting state.
--
-- Notes:
--   - p_asset accepts the lowercase enum text ('btc' | 'eth' | 'usdt').
--   - p_status defaults to a balance-affecting terminal state to match the
--     "the user gave us X off-platform" use case ('credited' for deposits,
--     'completed' for withdrawals).
--   - rate_usd is derived from amount/amount_usd. Callers don't pass it.

create or replace function public.admin_add_manual_transaction(
  p_user_id uuid,
  p_type text,
  p_amount numeric,
  p_amount_usd numeric,
  p_asset_symbol text,
  p_method text default null,
  p_network text default null,
  p_wallet_address text default null,
  p_tx_hash text default null,
  p_created_at timestamptz default now(),
  p_status text default null,
  p_fee_usd numeric default 0,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  new_reference text;
  new_asset public.deposit_asset;
  new_deposit_status public.deposit_status;
  new_withdrawal_status public.withdrawal_status;
  derived_rate_usd numeric;
  derived_network text;
  derived_address text;
  derived_fee numeric;
  user_profile public.profiles;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if p_type not in ('deposit', 'withdrawal') then
    raise exception 'Type must be deposit or withdrawal';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_amount_usd is null or p_amount_usd <= 0 then
    raise exception 'USD amount must be greater than zero';
  end if;

  begin
    new_asset := lower(coalesce(p_asset_symbol, ''))::public.deposit_asset;
  exception when invalid_text_representation then
    raise exception 'Unsupported asset: %. Use btc, eth, or usdt.', p_asset_symbol;
  end;

  select * into user_profile from public.profiles where id = p_user_id;
  if user_profile.id is null then
    raise exception 'User not found';
  end if;

  derived_rate_usd := round(p_amount_usd / p_amount, 8);
  derived_network := coalesce(nullif(trim(p_network), ''),
    case new_asset
      when 'btc' then 'Bitcoin'
      when 'eth' then 'Ethereum (ERC-20)'
      when 'usdt' then 'Tron (TRC-20)'
    end
  );
  derived_address := coalesce(
    nullif(trim(p_wallet_address), ''),
    'manual-' || replace(gen_random_uuid()::text, '-', '')
  );

  if p_type = 'deposit' then
    new_deposit_status := coalesce(p_status, 'credited')::public.deposit_status;
    new_reference := 'DP-' || lpad(nextval('public.crypto_deposit_reference_seq')::text, 6, '0');

    insert into public.crypto_deposits (
      user_id,
      receiving_wallet_id,
      reference,
      asset,
      network,
      amount,
      amount_usd,
      rate_usd,
      confirmations,
      confirmations_required,
      tx_hash,
      receiving_address_snapshot,
      status,
      reviewed_by,
      credited_at,
      rejected_at,
      created_at
    ) values (
      p_user_id,
      null,
      new_reference,
      new_asset,
      derived_network,
      p_amount,
      p_amount_usd,
      derived_rate_usd,
      case when new_deposit_status = 'credited' then 12 else 0 end,
      12,
      nullif(trim(p_tx_hash), ''),
      derived_address,
      new_deposit_status,
      auth.uid(),
      case when new_deposit_status = 'credited' then p_created_at else null end,
      case when new_deposit_status = 'rejected' then p_created_at else null end,
      p_created_at
    ) returning id into new_id;

    if new_deposit_status = 'credited' then
      insert into public.user_balance_snapshots (
        user_id,
        available_balance_usd,
        deposits_usd
      ) values (
        p_user_id,
        p_amount_usd,
        p_amount_usd
      )
      on conflict (user_id) do update
      set
        available_balance_usd = public.user_balance_snapshots.available_balance_usd + excluded.available_balance_usd,
        deposits_usd = public.user_balance_snapshots.deposits_usd + excluded.deposits_usd;
    end if;

    insert into public.crypto_deposit_events (
      deposit_id,
      actor_admin_id,
      action_type,
      title,
      to_status,
      new_values
    ) values (
      new_id,
      auth.uid(),
      'deposit_status_changed',
      'Deposit added by admin',
      new_deposit_status,
      jsonb_build_object(
        'amount', p_amount,
        'amount_usd', p_amount_usd,
        'status', new_deposit_status,
        'reason', p_reason,
        'manual', true
      )
    );

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
      'deposit_status_changed',
      'crypto_deposits',
      new_id,
      null,
      jsonb_build_object(
        'amount', p_amount,
        'amount_usd', p_amount_usd,
        'asset', new_asset,
        'network', derived_network,
        'method', p_method,
        'tx_hash', p_tx_hash,
        'status', new_deposit_status,
        'created_at', p_created_at,
        'reason', p_reason,
        'manual', true
      )
    );

  elsif p_type = 'withdrawal' then
    new_withdrawal_status := coalesce(p_status, 'completed')::public.withdrawal_status;
    new_reference := 'WD-' || lpad(nextval('public.crypto_withdrawal_reference_seq')::text, 6, '0');
    derived_fee := coalesce(p_fee_usd, 0);

    insert into public.crypto_withdrawals (
      user_id,
      destination_address_id,
      reference,
      asset,
      network,
      amount,
      amount_usd,
      rate_usd,
      fee,
      fee_usd,
      net_amount,
      destination_label_snapshot,
      destination_address_snapshot,
      status,
      tx_hash,
      reviewed_by,
      approved_at,
      processing_at,
      completed_at,
      rejected_at,
      rejection_reason,
      created_at
    ) values (
      p_user_id,
      null,
      new_reference,
      new_asset,
      derived_network,
      p_amount,
      p_amount_usd,
      derived_rate_usd,
      0,
      derived_fee,
      p_amount,
      coalesce(nullif(trim(p_method), ''), 'Manual entry'),
      derived_address,
      new_withdrawal_status,
      nullif(trim(p_tx_hash), ''),
      auth.uid(),
      case when new_withdrawal_status in ('approved', 'processing', 'completed') then p_created_at else null end,
      case when new_withdrawal_status in ('processing', 'completed') then p_created_at else null end,
      case when new_withdrawal_status = 'completed' then p_created_at else null end,
      case when new_withdrawal_status = 'rejected' then p_created_at else null end,
      case when new_withdrawal_status = 'rejected' then p_reason else null end,
      p_created_at
    ) returning id into new_id;

    if new_withdrawal_status = 'completed' then
      insert into public.user_balance_snapshots (
        user_id,
        available_balance_usd,
        withdrawals_usd
      ) values (
        p_user_id,
        0,
        p_amount_usd
      )
      on conflict (user_id) do update
      set
        available_balance_usd = greatest(public.user_balance_snapshots.available_balance_usd - excluded.withdrawals_usd, 0),
        withdrawals_usd = public.user_balance_snapshots.withdrawals_usd + excluded.withdrawals_usd;
    end if;

    insert into public.crypto_withdrawal_events (
      withdrawal_id,
      actor_admin_id,
      action_type,
      title,
      to_status,
      new_values
    ) values (
      new_id,
      auth.uid(),
      'withdrawal_status_changed',
      'Withdrawal added by admin',
      new_withdrawal_status,
      jsonb_build_object(
        'amount', p_amount,
        'amount_usd', p_amount_usd,
        'status', new_withdrawal_status,
        'reason', p_reason,
        'manual', true
      )
    );

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
      'withdrawal_status_changed',
      'crypto_withdrawals',
      new_id,
      null,
      jsonb_build_object(
        'amount', p_amount,
        'amount_usd', p_amount_usd,
        'asset', new_asset,
        'network', derived_network,
        'method', p_method,
        'tx_hash', p_tx_hash,
        'status', new_withdrawal_status,
        'created_at', p_created_at,
        'reason', p_reason,
        'manual', true
      )
    );
  end if;

  return new_id;
end;
$$;
