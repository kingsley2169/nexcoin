-- 55_rpc_admin_add_transaction_note.sql
-- Dispatcher RPC for the Transaction Management page. Adds an internal note
-- against the underlying deposit or withdrawal via the source-specific RPCs
-- so notes stay in a single place per source (deposits/withdrawals pages see
-- the same notes as the transactions page).

create or replace function public.admin_add_transaction_note(
  source_type public.transaction_source_type,
  source_id uuid,
  note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_deposit_note public.crypto_deposit_internal_notes;
  inserted_withdrawal_note public.crypto_withdrawal_internal_notes;
begin
  if source_type = 'crypto_deposit' then
    inserted_deposit_note := public.admin_add_crypto_deposit_note(source_id, note);
    return to_jsonb(inserted_deposit_note);
  elsif source_type = 'crypto_withdrawal' then
    inserted_withdrawal_note := public.admin_add_crypto_withdrawal_note(source_id, note);
    return to_jsonb(inserted_withdrawal_note);
  else
    raise exception 'Unsupported transaction source type %', source_type;
  end if;
end;
$$;
