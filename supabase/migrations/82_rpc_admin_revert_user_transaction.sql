-- 82_rpc_admin_revert_user_transaction.sql
-- Privileged "backtrack" RPC for the User Management → Manage Transactions modal.
--
-- Unlike admin_update_crypto_deposit_status / admin_update_crypto_withdrawal_status
-- (which protect terminal states with "Credited deposits cannot be changed" /
-- "Terminal withdrawals cannot be changed" guards), this RPC is intentionally
-- permissive: it lets admin/owner roles move a transaction from any status to
-- any status, and rebalances user_balance_snapshots accordingly.
--
-- Use carefully — every call writes to admin_audit_logs.

create or replace function public.admin_revert_user_transaction(
  p_source_type public.transaction_source_type,
  p_source_id uuid,
  p_new_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_deposit public.crypto_deposits;
  updated_deposit public.crypto_deposits;
  old_withdrawal public.crypto_withdrawals;
  updated_withdrawal public.crypto_withdrawals;
  new_deposit_status public.deposit_status;
  new_withdrawal_status public.withdrawal_status;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if p_source_type = 'crypto_deposit' then
    new_deposit_status := p_new_status::public.deposit_status;

    select *
    into old_deposit
    from public.crypto_deposits
    where id = p_source_id
    for update;

    if old_deposit.id is null then
      raise exception 'Deposit not found';
    end if;

    update public.crypto_deposits
    set
      status = new_deposit_status,
      reviewed_by = auth.uid(),
      credited_at = case
        when new_deposit_status = 'credited' then coalesce(credited_at, now())
        else null
      end,
      rejected_at = case
        when new_deposit_status = 'rejected' then coalesce(rejected_at, now())
        else null
      end
    where id = p_source_id
    returning * into updated_deposit;

    if old_deposit.status = 'credited' and new_deposit_status <> 'credited' then
      update public.user_balance_snapshots
      set
        available_balance_usd = greatest(available_balance_usd - old_deposit.amount_usd, 0),
        deposits_usd = greatest(deposits_usd - old_deposit.amount_usd, 0)
      where user_id = old_deposit.user_id;
    end if;

    if old_deposit.status <> 'credited' and new_deposit_status = 'credited' then
      insert into public.user_balance_snapshots (
        user_id,
        available_balance_usd,
        deposits_usd
      )
      values (
        old_deposit.user_id,
        updated_deposit.amount_usd,
        updated_deposit.amount_usd
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
      from_status,
      to_status,
      old_values,
      new_values
    )
    values (
      p_source_id,
      auth.uid(),
      'deposit_status_changed',
      'Deposit reverted by admin',
      old_deposit.status,
      new_deposit_status,
      jsonb_build_object('status', old_deposit.status),
      jsonb_build_object('status', new_deposit_status, 'reason', p_reason, 'revert', true)
    );

    insert into public.admin_audit_logs (
      actor_admin_id,
      target_user_id,
      action_type,
      entity_table,
      entity_id,
      old_values,
      new_values
    )
    values (
      auth.uid(),
      old_deposit.user_id,
      'deposit_status_changed',
      'crypto_deposits',
      p_source_id,
      jsonb_build_object('status', old_deposit.status, 'amount_usd', old_deposit.amount_usd),
      jsonb_build_object('status', new_deposit_status, 'reason', p_reason, 'revert', true)
    );

  elsif p_source_type = 'crypto_withdrawal' then
    new_withdrawal_status := p_new_status::public.withdrawal_status;

    select *
    into old_withdrawal
    from public.crypto_withdrawals
    where id = p_source_id
    for update;

    if old_withdrawal.id is null then
      raise exception 'Withdrawal not found';
    end if;

    update public.crypto_withdrawals
    set
      status = new_withdrawal_status,
      reviewed_by = auth.uid(),
      completed_at = case
        when new_withdrawal_status = 'completed' then coalesce(completed_at, now())
        else null
      end,
      rejected_at = case
        when new_withdrawal_status = 'rejected' then coalesce(rejected_at, now())
        else null
      end,
      rejection_reason = case
        when new_withdrawal_status = 'rejected' then p_reason
        else null
      end
    where id = p_source_id
    returning * into updated_withdrawal;

    if old_withdrawal.status = 'completed' and new_withdrawal_status <> 'completed' then
      update public.user_balance_snapshots
      set
        available_balance_usd = available_balance_usd + old_withdrawal.amount_usd,
        withdrawals_usd = greatest(withdrawals_usd - old_withdrawal.amount_usd, 0)
      where user_id = old_withdrawal.user_id;
    end if;

    if old_withdrawal.status <> 'completed' and new_withdrawal_status = 'completed' then
      update public.user_balance_snapshots
      set
        available_balance_usd = greatest(available_balance_usd - old_withdrawal.amount_usd, 0),
        withdrawals_usd = withdrawals_usd + old_withdrawal.amount_usd
      where user_id = old_withdrawal.user_id;
    end if;

    insert into public.crypto_withdrawal_events (
      withdrawal_id,
      actor_admin_id,
      action_type,
      title,
      from_status,
      to_status,
      old_values,
      new_values
    )
    values (
      p_source_id,
      auth.uid(),
      'withdrawal_status_changed',
      'Withdrawal reverted by admin',
      old_withdrawal.status,
      new_withdrawal_status,
      jsonb_build_object('status', old_withdrawal.status),
      jsonb_build_object('status', new_withdrawal_status, 'reason', p_reason, 'revert', true)
    );

    insert into public.admin_audit_logs (
      actor_admin_id,
      target_user_id,
      action_type,
      entity_table,
      entity_id,
      old_values,
      new_values
    )
    values (
      auth.uid(),
      old_withdrawal.user_id,
      'withdrawal_status_changed',
      'crypto_withdrawals',
      p_source_id,
      jsonb_build_object('status', old_withdrawal.status, 'amount_usd', old_withdrawal.amount_usd),
      jsonb_build_object('status', new_withdrawal_status, 'reason', p_reason, 'revert', true)
    );

  else
    raise exception 'Unsupported transaction source type: %', p_source_type;
  end if;
end;
$$;
