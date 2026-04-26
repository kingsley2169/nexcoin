-- 55_rpc_user_mark_all_notifications_read.sql
-- Bulk-mark every unread inbox item as read for the authenticated user.

create or replace function public.user_mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_rows integer := 0;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  update public.notifications
  set is_read = true
  where user_id = v_user
    and not is_read;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function public.user_mark_all_notifications_read() from public;
grant execute on function public.user_mark_all_notifications_read() to authenticated;
