-- 66_rpc_user_disable_2fa.sql
-- Disables 2FA for the authenticated user and records a security activity row.

create or replace function public.user_disable_2fa()
returns public.user_2fa_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.user_2fa_settings;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  perform public.seed_security_rows_for_user(v_user);

  update public.user_2fa_settings
  set
    enabled = false,
    last_disabled_at = now()
  where user_id = v_user
  returning * into v_row;

  insert into public.user_security_activity (
    user_id,
    activity_type,
    status,
    title,
    device_label,
    location
  )
  values (
    v_user,
    'two_factor_disabled'::public.security_activity_type,
    'review'::public.security_activity_status,
    'Two-factor authentication disabled',
    'Account settings',
    'Nexcoin'
  );

  return v_row;
end;
$$;

revoke all on function public.user_disable_2fa() from public;
grant execute on function public.user_disable_2fa() to authenticated;
