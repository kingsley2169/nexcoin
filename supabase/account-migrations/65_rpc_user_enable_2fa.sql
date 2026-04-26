-- 65_rpc_user_enable_2fa.sql
-- Enables 2FA for the authenticated user and records a security activity row.

create or replace function public.user_enable_2fa(
  p_method public.user_2fa_method,
  p_recovery_email text default null
)
returns public.user_2fa_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.profiles;
  v_row public.user_2fa_settings;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  perform public.seed_security_rows_for_user(v_user);

  select *
  into v_profile
  from public.profiles
  where id = v_user;

  update public.user_2fa_settings
  set
    enabled = true,
    method = p_method,
    recovery_email = coalesce(nullif(trim(p_recovery_email), ''), email, recovery_email),
    backup_codes_generated_at = coalesce(backup_codes_generated_at, now()),
    last_enabled_at = now()
  from (select v_profile.email as email) profile_email
  where user_id = v_user
  returning public.user_2fa_settings.* into v_row;

  insert into public.user_security_activity (
    user_id,
    activity_type,
    status,
    title,
    device_label,
    location,
    metadata
  )
  values (
    v_user,
    'two_factor_enabled'::public.security_activity_type,
    'completed'::public.security_activity_status,
    'Two-factor authentication enabled',
    'Account settings',
    'Nexcoin',
    jsonb_build_object('method', p_method)
  );

  return v_row;
end;
$$;

revoke all on function public.user_enable_2fa(public.user_2fa_method, text) from public;
grant execute on function public.user_enable_2fa(public.user_2fa_method, text) to authenticated;
