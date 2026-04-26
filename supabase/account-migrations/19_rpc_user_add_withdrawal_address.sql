-- 19_rpc_user_add_withdrawal_address.sql
-- User RPC: save a new payout destination for /account/withdrawal.
-- New rows become default when requested or when they are the first active
-- address for the selected asset.

create or replace function public.user_add_withdrawal_address(
  p_asset public.deposit_asset,
  p_network text,
  p_label text,
  p_address text,
  p_make_default boolean default false
)
returns public.withdrawal_addresses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_network text := nullif(trim(p_network), '');
  v_label text := nullif(trim(p_label), '');
  v_address text := nullif(trim(p_address), '');
  v_should_default boolean := p_make_default;
  v_existing_default boolean := false;
  v_profile public.profiles;
  v_row public.withdrawal_addresses;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if v_network is null then
    raise exception 'Network is required';
  end if;

  if v_label is null or length(v_label) < 2 then
    raise exception 'Label must be at least 2 characters';
  end if;

  if v_address is null or length(v_address) < 20 then
    raise exception 'Address must be at least 20 characters';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user;

  if v_profile.id is null then
    raise exception 'Profile not found';
  end if;

  if v_profile.account_status = 'suspended' then
    raise exception 'Suspended accounts cannot save withdrawal addresses';
  end if;

  if exists (
    select 1
    from public.withdrawal_addresses wa
    where wa.user_id = v_user
      and wa.asset = p_asset
      and lower(wa.network) = lower(v_network)
      and lower(wa.address) = lower(v_address)
      and wa.archived_at is null
  ) then
    raise exception 'This withdrawal address is already saved';
  end if;

  select exists (
    select 1
    from public.withdrawal_addresses wa
    where wa.user_id = v_user
      and wa.asset = p_asset
      and wa.is_default = true
      and wa.archived_at is null
  ) into v_existing_default;

  if not v_existing_default then
    v_should_default := true;
  end if;

  if v_should_default then
    update public.withdrawal_addresses
    set is_default = false
    where user_id = v_user
      and asset = p_asset
      and archived_at is null;
  end if;

  insert into public.withdrawal_addresses (
    user_id,
    asset,
    network,
    label,
    address,
    is_default
  )
  values (
    v_user,
    p_asset,
    v_network,
    v_label,
    v_address,
    v_should_default
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.user_add_withdrawal_address(public.deposit_asset, text, text, text, boolean) from public;
grant execute on function public.user_add_withdrawal_address(public.deposit_asset, text, text, text, boolean) to authenticated;
