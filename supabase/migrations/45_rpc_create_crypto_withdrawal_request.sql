-- 45_rpc_create_crypto_withdrawal_request.sql
-- User-facing RPC used by /account/withdrawal. Creates a pending withdrawal,
-- snapshots the destination, and locks the requested USD amount.

create or replace function public.create_crypto_withdrawal_request(
  destination_address_id uuid,
  amount numeric,
  amount_usd numeric,
  rate_usd numeric,
  fee numeric default 0,
  fee_usd numeric default 0
)
returns public.crypto_withdrawals
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_address public.withdrawal_addresses;
  inserted public.crypto_withdrawals;
  next_reference text;
  computed_net_amount numeric;
  current_balance public.user_balance_snapshots;
  request_profile public.profiles;
  request_compliance public.user_compliance;
  initial_risk public.risk_level := 'low';
  initial_notes text[] := array[]::text[];
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into request_profile
  from public.profiles
  where id = auth.uid();

  if request_profile.id is null then
    raise exception 'Profile not found';
  end if;

  if request_profile.account_status = 'suspended' then
    raise exception 'Suspended accounts cannot request withdrawals';
  end if;

  select *
  into request_compliance
  from public.user_compliance
  where user_id = auth.uid();

  select *
  into selected_address
  from public.withdrawal_addresses
  where id = destination_address_id
    and user_id = auth.uid()
    and status = 'active'
    and archived_at is null;

  if selected_address.id is null then
    raise exception 'Withdrawal address not available';
  end if;

  if amount <= 0 or amount_usd <= 0 or rate_usd <= 0 or fee < 0 or fee_usd < 0 then
    raise exception 'Withdrawal amount and rate must be positive';
  end if;

  computed_net_amount := amount - fee;

  if computed_net_amount <= 0 then
    raise exception 'Withdrawal fee cannot exceed amount';
  end if;

  if request_profile.account_status = 'flagged' then
    initial_risk := 'medium';
    initial_notes := array_append(initial_notes, 'Account is flagged.');
  end if;

  if coalesce(request_compliance.kyc_status, 'unverified'::public.kyc_status) <> 'approved' then
    initial_risk := 'medium';
    initial_notes := array_append(initial_notes, 'KYC is not approved.');
  end if;

  if request_compliance.withdrawal_limit_usd is not null
     and request_compliance.withdrawal_limit_usd > 0
     and amount_usd > request_compliance.withdrawal_limit_usd then
    initial_risk := 'high';
    initial_notes := array_append(initial_notes, 'Amount exceeds current withdrawal limit.');
  end if;

  select *
  into current_balance
  from public.user_balance_snapshots
  where user_id = auth.uid()
  for update;

  if current_balance.user_id is null then
    raise exception 'Balance snapshot not found';
  end if;

  if current_balance.available_balance_usd < amount_usd then
    raise exception 'Insufficient available balance';
  end if;

  update public.user_balance_snapshots
  set
    available_balance_usd = available_balance_usd - amount_usd,
    locked_balance_usd = locked_balance_usd + amount_usd
  where user_id = auth.uid();

  next_reference := 'WD-' || lpad(nextval('public.crypto_withdrawal_reference_seq')::text, 4, '0');

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
    risk_level,
    security_notes
  )
  values (
    auth.uid(),
    selected_address.id,
    next_reference,
    selected_address.asset,
    selected_address.network,
    amount,
    amount_usd,
    rate_usd,
    fee,
    fee_usd,
    computed_net_amount,
    selected_address.label,
    selected_address.address,
    'pending',
    initial_risk,
    initial_notes
  )
  returning * into inserted;

  update public.withdrawal_addresses
  set last_used_at = now()
  where id = selected_address.id;

  insert into public.crypto_withdrawal_events (
    withdrawal_id,
    actor_user_id,
    action_type,
    title,
    to_status,
    new_values
  )
  values (
    inserted.id,
    auth.uid(),
    'withdrawal_request_created',
    'Withdrawal requested',
    inserted.status,
    jsonb_build_object(
      'reference', inserted.reference,
      'asset', inserted.asset,
      'amount', inserted.amount,
      'amountUsd', inserted.amount_usd
    )
  );

  return inserted;
end;
$$;
