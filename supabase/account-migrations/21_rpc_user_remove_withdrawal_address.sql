-- 21_rpc_user_remove_withdrawal_address.sql
-- User RPC: soft-archive one saved withdrawal address. If the removed row was
-- the default, the most recently used remaining address for that asset becomes
-- the new default automatically.

create or replace function public.user_remove_withdrawal_address(
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
  v_removed_was_default boolean := false;
  v_promoted_id uuid;
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

  v_removed_was_default := v_row.is_default;

  update public.withdrawal_addresses
  set
    archived_at = now(),
    is_default = false,
    status = 'disabled'
  where id = v_row.id
  returning * into v_row;

  if v_removed_was_default then
    select wa.id
    into v_promoted_id
    from public.withdrawal_addresses wa
    where wa.user_id = v_user
      and wa.asset = v_row.asset
      and wa.archived_at is null
      and wa.status = 'active'
    order by
      coalesce(wa.last_used_at, wa.updated_at, wa.created_at) desc,
      wa.created_at desc
    limit 1;

    if v_promoted_id is not null then
      update public.withdrawal_addresses
      set is_default = true
      where id = v_promoted_id;
    end if;
  end if;

  return v_row;
end;
$$;

revoke all on function public.user_remove_withdrawal_address(uuid) from public;
grant execute on function public.user_remove_withdrawal_address(uuid) to authenticated;
