-- 34_rpc_admin_create_receiving_wallet.sql
-- RPC used by the Admin Deposit Management "Add Wallet" modal.

create or replace function public.admin_create_receiving_wallet(
  asset public.deposit_asset,
  network text,
  label text,
  address text,
  is_active boolean default true
)
returns public.deposit_receiving_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted public.deposit_receiving_wallets;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  insert into public.deposit_receiving_wallets (
    asset,
    network,
    label,
    address,
    is_active,
    created_by,
    updated_by
  )
  values (
    asset,
    trim(network),
    trim(label),
    trim(address),
    is_active,
    auth.uid(),
    auth.uid()
  )
  returning * into inserted;

  insert into public.admin_audit_logs (
    actor_admin_id,
    action_type,
    entity_table,
    entity_id,
    new_values
  )
  values (
    auth.uid(),
    'receiving_wallet_created',
    'deposit_receiving_wallets',
    inserted.id,
    to_jsonb(inserted)
  );

  return inserted;
end;
$$;
