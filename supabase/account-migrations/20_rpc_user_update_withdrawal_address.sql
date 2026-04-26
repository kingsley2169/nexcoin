-- 20_rpc_user_update_withdrawal_address.sql
-- User RPC: edit an existing saved address. This keeps the row id stable so
-- past withdrawals can continue to point at the same destination record.

create or replace function public.user_update_withdrawal_address(
  p_address_id uuid,
  p_label text default null,
  p_address text default null,
  p_network text default null
)
returns public.withdrawal_addresses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.withdrawal_addresses;
  v_label text := nullif(trim(p_label), '');
  v_address text := nullif(trim(p_address), '');
  v_network text := nullif(trim(p_network), '');
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.withdrawal_addresses
  where id = p_address_id
    and user_id = v_user
    and archived_at is null;

  if v_row.id is null then
    raise exception 'Withdrawal address not found';
  end if;

  if p_label is not null and (v_label is null or length(v_label) < 2) then
    raise exception 'Label must be at least 2 characters';
  end if;

  if p_address is not null and (v_address is null or length(v_address) < 20) then
    raise exception 'Address must be at least 20 characters';
  end if;

  if p_network is not null and v_network is null then
    raise exception 'Network is required';
  end if;

  if exists (
    select 1
    from public.withdrawal_addresses wa
    where wa.user_id = v_user
      and wa.asset = v_row.asset
      and wa.id <> v_row.id
      and lower(wa.network) = lower(coalesce(v_network, v_row.network))
      and lower(wa.address) = lower(coalesce(v_address, v_row.address))
      and wa.archived_at is null
  ) then
    raise exception 'Another saved address already uses this network and address';
  end if;

  update public.withdrawal_addresses
  set
    label = coalesce(v_label, label),
    address = coalesce(v_address, address),
    network = coalesce(v_network, network)
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.user_update_withdrawal_address(uuid, text, text, text) from public;
grant execute on function public.user_update_withdrawal_address(uuid, text, text, text) to authenticated;
