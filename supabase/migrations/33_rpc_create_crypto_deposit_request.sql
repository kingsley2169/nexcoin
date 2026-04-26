-- 33_rpc_create_crypto_deposit_request.sql
-- User-facing RPC used by /account/deposit. Creates a pending crypto deposit
-- request against an active receiving wallet and snapshots the address shown
-- to the user at creation time.

create or replace function public.create_crypto_deposit_request(
  wallet_id uuid,
  amount numeric,
  amount_usd numeric,
  rate_usd numeric,
  confirmations_required integer default null
)
returns public.crypto_deposits
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_wallet public.deposit_receiving_wallets;
  inserted public.crypto_deposits;
  next_reference text;
  required_confirmations integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into selected_wallet
  from public.deposit_receiving_wallets
  where id = wallet_id
    and is_active = true
    and archived_at is null;

  if selected_wallet.id is null then
    raise exception 'Receiving wallet not available';
  end if;

  if amount <= 0 or amount_usd <= 0 or rate_usd <= 0 then
    raise exception 'Deposit amount must be positive';
  end if;

  required_confirmations := coalesce(
    confirmations_required,
    case selected_wallet.asset
      when 'btc' then 3
      when 'eth' then 12
      when 'usdt' then 20
      else 12
    end
  );

  next_reference := 'DP-' || lpad(nextval('public.crypto_deposit_reference_seq')::text, 6, '0');

  insert into public.crypto_deposits (
    user_id,
    receiving_wallet_id,
    reference,
    asset,
    network,
    amount,
    amount_usd,
    rate_usd,
    confirmations_required,
    receiving_address_snapshot,
    status,
    risk_level,
    risk_notes
  )
  values (
    auth.uid(),
    selected_wallet.id,
    next_reference,
    selected_wallet.asset,
    selected_wallet.network,
    amount,
    amount_usd,
    rate_usd,
    required_confirmations,
    selected_wallet.address,
    'pending',
    'low',
    array[]::text[]
  )
  returning * into inserted;

  insert into public.crypto_deposit_events (
    deposit_id,
    actor_user_id,
    action_type,
    title,
    to_status,
    new_values
  )
  values (
    inserted.id,
    auth.uid(),
    'deposit_request_created',
    'Deposit opened',
    inserted.status,
    to_jsonb(inserted)
  );

  return inserted;
end;
$$;
