-- 68_rpc_user_revoke_device.sql
-- Revokes one non-current trusted/review device for the authenticated user.

create or replace function public.user_revoke_device(
  p_device_id uuid
)
returns public.user_devices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.user_devices;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_row
  from public.user_devices
  where id = p_device_id
    and user_id = v_user
  for update;

  if v_row.id is null then
    raise exception 'Device not found';
  end if;

  if v_row.is_current then
    raise exception 'Current device cannot be revoked from this action';
  end if;

  if v_row.status = 'revoked' then
    return v_row;
  end if;

  update public.user_devices
  set
    status = 'revoked',
    revoked_at = now(),
    is_current = false
  where id = p_device_id
  returning * into v_row;

  insert into public.user_security_activity (
    user_id,
    activity_type,
    status,
    title,
    device_label,
    location,
    source_device_id,
    metadata
  )
  values (
    v_user,
    'device_revoked'::public.security_activity_type,
    'completed'::public.security_activity_status,
    'Trusted device removed',
    v_row.browser,
    v_row.location,
    v_row.id,
    jsonb_build_object('deviceName', v_row.device_name, 'ipAddress', host(v_row.ip_address))
  );

  return v_row;
end;
$$;

revoke all on function public.user_revoke_device(uuid) from public;
grant execute on function public.user_revoke_device(uuid) to authenticated;
