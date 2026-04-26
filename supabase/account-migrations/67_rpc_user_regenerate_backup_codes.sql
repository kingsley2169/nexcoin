-- 67_rpc_user_regenerate_backup_codes.sql
-- Refreshes the backup-code timestamp for the authenticated user.

create or replace function public.user_regenerate_backup_codes()
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
  set backup_codes_generated_at = now()
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
    'backup_codes_generated'::public.security_activity_type,
    'completed'::public.security_activity_status,
    'Backup codes generated',
    'Account settings',
    'Nexcoin'
  );

  return v_row;
end;
$$;

revoke all on function public.user_regenerate_backup_codes() from public;
grant execute on function public.user_regenerate_backup_codes() to authenticated;
