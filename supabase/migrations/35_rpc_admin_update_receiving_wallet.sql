-- 35_rpc_admin_update_receiving_wallet.sql
-- Null-safe update for receiving wallet label/network/address/active status.

create or replace function public.admin_update_receiving_wallet(
  wallet_id uuid,
  new_label text default null,
  new_network text default null,
  new_address text default null,
  new_is_active boolean default null
)
returns public.deposit_receiving_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  old_wallet public.deposit_receiving_wallets;
  updated_wallet public.deposit_receiving_wallets;
  action public.admin_action_type;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select *
  into old_wallet
  from public.deposit_receiving_wallets
  where id = wallet_id
  for update;

  if old_wallet.id is null then
    raise exception 'Receiving wallet not found';
  end if;

  if old_wallet.archived_at is not null then
    raise exception 'Cannot update removed receiving wallet';
  end if;

  update public.deposit_receiving_wallets
  set
    label = coalesce(nullif(trim(new_label), ''), label),
    network = coalesce(nullif(trim(new_network), ''), network),
    address = coalesce(nullif(trim(new_address), ''), address),
    is_active = coalesce(new_is_active, is_active),
    updated_by = auth.uid()
  where id = wallet_id
  returning * into updated_wallet;

  action := case
    when new_is_active is not null and new_is_active is distinct from old_wallet.is_active
      then 'receiving_wallet_status_changed'::public.admin_action_type
    else 'receiving_wallet_updated'::public.admin_action_type
  end;

  insert into public.admin_audit_logs (
    actor_admin_id,
    action_type,
    entity_table,
    entity_id,
    old_values,
    new_values
  )
  values (
    auth.uid(),
    action,
    'deposit_receiving_wallets',
    wallet_id,
    to_jsonb(old_wallet),
    to_jsonb(updated_wallet)
  );

  return updated_wallet;
end;
$$;
