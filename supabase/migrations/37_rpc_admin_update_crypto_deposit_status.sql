-- 37_rpc_admin_update_crypto_deposit_status.sql
-- Admin RPC for Credit / Reject / Needs Review actions in Deposit Management.
-- When a deposit is credited, this updates user_balance_snapshots for v1.
-- Later, this should post to a proper ledger table and derive balances from
-- ledger entries.

create or replace function public.admin_update_crypto_deposit_status(
  deposit_id uuid,
  new_status public.deposit_status,
  reason text default null
)
returns public.crypto_deposits
language plpgsql
security definer
set search_path = public
as $$
declare
  old_deposit public.crypto_deposits;
  updated_deposit public.crypto_deposits;
  display_title text;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance', 'compliance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select *
  into old_deposit
  from public.crypto_deposits
  where id = deposit_id
  for update;

  if old_deposit.id is null then
    raise exception 'Deposit not found';
  end if;

  if old_deposit.status = new_status then
    return old_deposit;
  end if;

  if old_deposit.status = 'credited' and new_status <> 'credited' then
    raise exception 'Credited deposits cannot be changed; create an adjustment instead';
  end if;

  update public.crypto_deposits
  set
    status = new_status,
    reviewed_by = auth.uid(),
    confirmations = case
      when new_status = 'credited'
        then greatest(confirmations, confirmations_required)
      else confirmations
    end,
    credited_at = case when new_status = 'credited' then now() else credited_at end,
    rejected_at = case when new_status = 'rejected' then now() else rejected_at end
  where id = deposit_id
  returning * into updated_deposit;

  if new_status = 'credited' and old_deposit.status <> 'credited' then
    insert into public.user_balance_snapshots (
      user_id,
      available_balance_usd,
      deposits_usd
    )
    values (
      updated_deposit.user_id,
      updated_deposit.amount_usd,
      updated_deposit.amount_usd
    )
    on conflict (user_id) do update
    set
      available_balance_usd = public.user_balance_snapshots.available_balance_usd + excluded.available_balance_usd,
      deposits_usd = public.user_balance_snapshots.deposits_usd + excluded.deposits_usd;
  end if;

  display_title := case new_status
    when 'credited' then 'Deposit credited'
    when 'rejected' then 'Deposit rejected'
    when 'needs_review' then 'Deposit escalated to review'
    when 'confirming' then 'Deposit marked confirming'
    when 'pending' then 'Deposit marked pending'
    else 'Deposit status changed'
  end;

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
    deposit_id,
    auth.uid(),
    'deposit_status_changed',
    display_title,
    old_deposit.status,
    new_status,
    jsonb_build_object('status', old_deposit.status, 'confirmations', old_deposit.confirmations),
    jsonb_build_object('status', new_status, 'confirmations', updated_deposit.confirmations, 'reason', reason)
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
    updated_deposit.user_id,
    'deposit_status_changed',
    'crypto_deposits',
    deposit_id,
    jsonb_build_object('status', old_deposit.status, 'confirmations', old_deposit.confirmations),
    jsonb_build_object('status', new_status, 'confirmations', updated_deposit.confirmations, 'reason', reason)
  );

  return updated_deposit;
end;
$$;
