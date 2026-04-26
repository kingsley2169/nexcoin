-- 83_rpc_admin_adjust_user_transaction.sql
-- Privileged "edit amount" RPC for the User Management → Manage Transactions modal.
--
-- Lets admin/owner roles correct the recorded asset amount and USD amount on a
-- deposit or withdrawal. If the row is currently in a balance-affecting
-- terminal state (credited deposit, completed withdrawal), the diff between
-- the old and new amount_usd is applied to user_balance_snapshots so the
-- user's account reflects the correction immediately.

create or replace function public.admin_adjust_user_transaction(
  p_source_type public.transaction_source_type,
  p_source_id uuid,
  p_new_amount numeric,
  p_new_amount_usd numeric,
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
  delta_usd numeric;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if p_new_amount is null or p_new_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_new_amount_usd is null or p_new_amount_usd <= 0 then
    raise exception 'USD amount must be greater than zero';
  end if;

  if p_source_type = 'crypto_deposit' then
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
      amount = p_new_amount,
      amount_usd = p_new_amount_usd,
      reviewed_by = auth.uid()
    where id = p_source_id
    returning * into updated_deposit;

    if old_deposit.status = 'credited' then
      delta_usd := p_new_amount_usd - old_deposit.amount_usd;

      if delta_usd > 0 then
        update public.user_balance_snapshots
        set
          available_balance_usd = available_balance_usd + delta_usd,
          deposits_usd = deposits_usd + delta_usd
        where user_id = old_deposit.user_id;
      elsif delta_usd < 0 then
        update public.user_balance_snapshots
        set
          available_balance_usd = greatest(available_balance_usd + delta_usd, 0),
          deposits_usd = greatest(deposits_usd + delta_usd, 0)
        where user_id = old_deposit.user_id;
      end if;
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
      'Deposit amount adjusted by admin',
      old_deposit.status,
      old_deposit.status,
      jsonb_build_object('amount', old_deposit.amount, 'amount_usd', old_deposit.amount_usd),
      jsonb_build_object('amount', p_new_amount, 'amount_usd', p_new_amount_usd, 'reason', p_reason)
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
      jsonb_build_object('amount', old_deposit.amount, 'amount_usd', old_deposit.amount_usd),
      jsonb_build_object('amount', p_new_amount, 'amount_usd', p_new_amount_usd, 'reason', p_reason, 'adjustment', true)
    );

  elsif p_source_type = 'crypto_withdrawal' then
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
      amount = p_new_amount,
      amount_usd = p_new_amount_usd,
      reviewed_by = auth.uid()
    where id = p_source_id
    returning * into updated_withdrawal;

    if old_withdrawal.status = 'completed' then
      delta_usd := p_new_amount_usd - old_withdrawal.amount_usd;

      if delta_usd > 0 then
        update public.user_balance_snapshots
        set
          available_balance_usd = greatest(available_balance_usd - delta_usd, 0),
          withdrawals_usd = withdrawals_usd + delta_usd
        where user_id = old_withdrawal.user_id;
      elsif delta_usd < 0 then
        update public.user_balance_snapshots
        set
          available_balance_usd = available_balance_usd - delta_usd,
          withdrawals_usd = greatest(withdrawals_usd + delta_usd, 0)
        where user_id = old_withdrawal.user_id;
      end if;
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
      'Withdrawal amount adjusted by admin',
      old_withdrawal.status,
      old_withdrawal.status,
      jsonb_build_object('amount', old_withdrawal.amount, 'amount_usd', old_withdrawal.amount_usd),
      jsonb_build_object('amount', p_new_amount, 'amount_usd', p_new_amount_usd, 'reason', p_reason)
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
      jsonb_build_object('amount', old_withdrawal.amount, 'amount_usd', old_withdrawal.amount_usd),
      jsonb_build_object('amount', p_new_amount, 'amount_usd', p_new_amount_usd, 'reason', p_reason, 'adjustment', true)
    );

  else
    raise exception 'Unsupported transaction source type: %', p_source_type;
  end if;
end;
$$;
