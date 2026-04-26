-- 36_rpc_admin_remove_receiving_wallet.sql
-- Soft-removes a receiving wallet. Existing deposits keep their receiving
-- address snapshot and wallet_id may remain for history.

create or replace function public.admin_remove_receiving_wallet(
  wallet_id uuid
)
returns public.deposit_receiving_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  old_wallet public.deposit_receiving_wallets;
  updated_wallet public.deposit_receiving_wallets;
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

  update public.deposit_receiving_wallets
  set
    is_active = false,
    archived_at = coalesce(archived_at, now()),
    updated_by = auth.uid()
  where id = wallet_id
  returning * into updated_wallet;

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
    'receiving_wallet_removed',
    'deposit_receiving_wallets',
    wallet_id,
    to_jsonb(old_wallet),
    to_jsonb(updated_wallet)
  );

  return updated_wallet;
end;
$$;
