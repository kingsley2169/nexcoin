-- 46_rpc_admin_update_crypto_withdrawal_status.sql
-- Admin RPC for Approve / Processing / Complete / Reject actions.

create or replace function public.admin_update_crypto_withdrawal_status(
  withdrawal_id uuid,
  new_status public.withdrawal_status,
  reason text default null,
  payout_tx_hash text default null
)
returns public.crypto_withdrawals
language plpgsql
security definer
set search_path = public
as $$
declare
  old_withdrawal public.crypto_withdrawals;
  updated_withdrawal public.crypto_withdrawals;
  display_title text;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance', 'compliance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select *
  into old_withdrawal
  from public.crypto_withdrawals
  where id = withdrawal_id
  for update;

  if old_withdrawal.id is null then
    raise exception 'Withdrawal not found';
  end if;

  if old_withdrawal.status in ('completed', 'rejected') and new_status <> old_withdrawal.status then
    raise exception 'Terminal withdrawals cannot be changed; create an adjustment instead';
  end if;

  if old_withdrawal.status = new_status and coalesce(payout_tx_hash, '') = '' then
    return old_withdrawal;
  end if;

  if new_status = 'completed' and coalesce(nullif(trim(payout_tx_hash), ''), old_withdrawal.tx_hash) is null then
    raise exception 'Completed withdrawals require a payout tx hash';
  end if;

  update public.crypto_withdrawals
  set
    status = new_status,
    reviewed_by = auth.uid(),
    approved_at = case
      when new_status in ('approved', 'processing', 'completed') then coalesce(approved_at, now())
      else approved_at
    end,
    processing_at = case
      when new_status in ('processing', 'completed') then coalesce(processing_at, now())
      else processing_at
    end,
    completed_at = case when new_status = 'completed' then coalesce(completed_at, now()) else completed_at end,
    rejected_at = case when new_status = 'rejected' then coalesce(rejected_at, now()) else rejected_at end,
    rejection_reason = case when new_status = 'rejected' then reason else rejection_reason end,
    tx_hash = coalesce(nullif(trim(payout_tx_hash), ''), tx_hash)
  where id = withdrawal_id
  returning * into updated_withdrawal;

  if new_status = 'rejected' and old_withdrawal.status <> 'rejected' then
    update public.user_balance_snapshots
    set
      available_balance_usd = available_balance_usd + updated_withdrawal.amount_usd,
      locked_balance_usd = locked_balance_usd - updated_withdrawal.amount_usd
    where user_id = updated_withdrawal.user_id;
  end if;

  if new_status = 'completed' and old_withdrawal.status <> 'completed' then
    update public.user_balance_snapshots
    set
      locked_balance_usd = locked_balance_usd - updated_withdrawal.amount_usd,
      withdrawals_usd = withdrawals_usd + updated_withdrawal.amount_usd
    where user_id = updated_withdrawal.user_id;
  end if;

  display_title := case new_status
    when 'approved' then 'Withdrawal approved'
    when 'processing' then 'Payout processing'
    when 'completed' then 'Withdrawal completed'
    when 'rejected' then 'Withdrawal rejected'
    when 'aml_review' then 'AML review started'
    when 'pending' then 'Withdrawal marked pending'
    else 'Withdrawal status changed'
  end;

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
    withdrawal_id,
    auth.uid(),
    'withdrawal_status_changed',
    display_title,
    old_withdrawal.status,
    new_status,
    jsonb_build_object('status', old_withdrawal.status, 'txHash', old_withdrawal.tx_hash),
    jsonb_build_object('status', new_status, 'reason', reason, 'txHash', updated_withdrawal.tx_hash)
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
    updated_withdrawal.user_id,
    'withdrawal_status_changed',
    'crypto_withdrawals',
    withdrawal_id,
    jsonb_build_object('status', old_withdrawal.status, 'txHash', old_withdrawal.tx_hash),
    jsonb_build_object('status', new_status, 'reason', reason, 'txHash', updated_withdrawal.tx_hash)
  );

  return updated_withdrawal;
end;
$$;
