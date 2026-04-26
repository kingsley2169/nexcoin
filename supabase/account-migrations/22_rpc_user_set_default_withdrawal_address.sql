-- 22_rpc_user_set_default_withdrawal_address.sql
-- User RPC: move the default flag to one of the caller's active saved
-- addresses for the same asset.

create or replace function public.user_set_default_withdrawal_address(
  p_address_id uuid
)
returns public.withdrawal_addresses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.withdrawal_addresses;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.withdrawal_addresses
  where id = p_address_id
    and user_id = v_user
    and archived_at is null
    and status = 'active';

  if v_row.id is null then
    raise exception 'Withdrawal address not available';
  end if;

  update public.withdrawal_addresses
  set is_default = false
  where user_id = v_user
    and asset = v_row.asset
    and archived_at is null;

  update public.withdrawal_addresses
  set is_default = true
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.user_set_default_withdrawal_address(uuid) from public;
grant execute on function public.user_set_default_withdrawal_address(uuid) to authenticated;
