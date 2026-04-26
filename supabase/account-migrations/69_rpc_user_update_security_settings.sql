-- 69_rpc_user_update_security_settings.sql
-- Updates the user-controlled protection toggles on /account/security.

create or replace function public.user_update_security_settings(
  p_confirm_new_withdrawal_addresses boolean default null,
  p_new_device_alerts boolean default null,
  p_password_strength public.password_strength default null,
  p_password_last_changed_at timestamptz default null
)
returns public.user_security_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_before public.user_security_settings;
  v_row public.user_security_settings;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  perform public.seed_security_rows_for_user(v_user);

  select *
  into v_before
  from public.user_security_settings
  where user_id = v_user;

  update public.user_security_settings
  set
    confirm_new_withdrawal_addresses = coalesce(
      p_confirm_new_withdrawal_addresses,
      confirm_new_withdrawal_addresses
    ),
    new_device_alerts = coalesce(
      p_new_device_alerts,
      new_device_alerts
    ),
    password_strength = coalesce(
      p_password_strength,
      password_strength
    ),
    password_last_changed_at = coalesce(
      p_password_last_changed_at,
      password_last_changed_at
    )
  where user_id = v_user
  returning * into v_row;

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
    (case
      when p_password_last_changed_at is not null then 'password_changed'
      else 'security_settings_updated'
    end)::public.security_activity_type,
    'completed'::public.security_activity_status,
    case
      when p_password_last_changed_at is not null then 'Password changed'
      else 'Security settings updated'
    end,
    'Account settings',
    'Nexcoin',
    jsonb_build_object(
      'before', jsonb_build_object(
        'confirmNewWithdrawalAddresses', v_before.confirm_new_withdrawal_addresses,
        'newDeviceAlerts', v_before.new_device_alerts,
        'passwordStrength', v_before.password_strength
      ),
      'after', jsonb_build_object(
        'confirmNewWithdrawalAddresses', v_row.confirm_new_withdrawal_addresses,
        'newDeviceAlerts', v_row.new_device_alerts,
        'passwordStrength', v_row.password_strength
      )
    )
  );

  return v_row;
end;
$$;

revoke all on function public.user_update_security_settings(
  boolean,
  boolean,
  public.password_strength,
  timestamptz
) from public;
grant execute on function public.user_update_security_settings(
  boolean,
  boolean,
  public.password_strength,
  timestamptz
) to authenticated;
