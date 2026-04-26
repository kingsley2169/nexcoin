-- 14_rpc_user_mark_deposit_sent.sql
-- User RPC: confirms that the logged-in user has actually broadcast/sent funds
-- for a deposit request previously opened via create_crypto_deposit_request.
--
-- Behavior:
--   - only touches the caller's own deposit row
--   - only allowed while the request is still 'pending'
--   - flips status to 'confirming'
--   - stores tx_hash / sender_address if the client has them
--   - emits a visible timeline event so both the user and admin review modal
--     can see that the deposit was broadcast

create or replace function public.user_mark_deposit_sent(
  p_deposit_id uuid,
  p_tx_hash text default null,
  p_sender_address text default null
)
returns public.crypto_deposits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.crypto_deposits;
  v_tx_hash text := nullif(trim(p_tx_hash), '');
  v_sender_address text := nullif(trim(p_sender_address), '');
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.crypto_deposits
  where id = p_deposit_id
    and user_id = v_user;

  if v_row.id is null then
    raise exception 'Deposit request not found';
  end if;

  if v_row.status <> 'pending' then
    raise exception 'Deposit request is already %', v_row.status;
  end if;

  update public.crypto_deposits
  set
    status = 'confirming',
    tx_hash = coalesce(v_tx_hash, tx_hash),
    sender_address = coalesce(v_sender_address, sender_address)
  where id = v_row.id
  returning * into v_row;

  insert into public.crypto_deposit_events (
    deposit_id,
    actor_user_id,
    action_type,
    title,
    from_status,
    to_status,
    old_values,
    new_values
  )
  values (
    v_row.id,
    v_user,
    'deposit_status_changed',
    'User marked deposit as sent',
    'pending'::public.deposit_status,
    'confirming'::public.deposit_status,
    jsonb_build_object('status', 'pending'),
    jsonb_build_object(
      'status', 'confirming',
      'txHash', v_row.tx_hash,
      'senderAddress', v_row.sender_address
    )
  );

  return v_row;
end;
$$;

revoke all on function public.user_mark_deposit_sent(uuid, text, text) from public;
grant execute on function public.user_mark_deposit_sent(uuid, text, text) to authenticated;
