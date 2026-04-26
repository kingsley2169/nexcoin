-- 54_rpc_user_mark_notification_read.sql
-- Marks one inbox item as read for the authenticated user.

create or replace function public.user_mark_notification_read(
  p_notification_id uuid
)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_notification public.notifications;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  update public.notifications
  set is_read = true
  where id = p_notification_id
    and user_id = v_user
  returning * into v_notification;

  if v_notification.id is null then
    raise exception 'Notification not found';
  end if;

  return v_notification;
end;
$$;

revoke all on function public.user_mark_notification_read(uuid) from public;
grant execute on function public.user_mark_notification_read(uuid) to authenticated;
