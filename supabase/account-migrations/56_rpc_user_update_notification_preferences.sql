-- 56_rpc_user_update_notification_preferences.sql
-- Updates one category row in notification_preferences for the authenticated user.

create or replace function public.user_update_notification_preferences(
  p_category public.notification_category,
  p_email_enabled boolean default null,
  p_in_app_enabled boolean default null,
  p_sms_enabled boolean default null
)
returns public.notification_preferences
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.notification_preferences;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  perform public.seed_notification_preferences_for_user(v_user);

  update public.notification_preferences
  set
    email_enabled = coalesce(p_email_enabled, email_enabled),
    in_app_enabled = coalesce(p_in_app_enabled, in_app_enabled),
    sms_enabled = coalesce(p_sms_enabled, sms_enabled)
  where user_id = v_user
    and category = p_category
  returning * into v_row;

  if v_row.user_id is null then
    raise exception 'Notification preference not found';
  end if;

  return v_row;
end;
$$;

revoke all on function public.user_update_notification_preferences(
  public.notification_category,
  boolean,
  boolean,
  boolean
) from public;
grant execute on function public.user_update_notification_preferences(
  public.notification_category,
  boolean,
  boolean,
  boolean
) to authenticated;
