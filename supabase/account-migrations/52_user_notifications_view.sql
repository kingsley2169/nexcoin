-- 52_user_notifications_view.sql
-- Read model for /account/notifications.
-- Returns one row per inbox item with UI-ready channel labels.
 
create or replace view public.user_notifications_view
with (security_invoker = true)
as
select
  n.id,
  n.user_id,
  n.category,
  n.priority,
  n.title,
  n.body,
  n.is_read,
  n.action_href,
  n.action_label,
  n.created_at,
  array(
    select
      case channel
        when 'email'::public.notification_channel then 'Email'
        when 'in_app'::public.notification_channel then 'In-app'
        when 'sms'::public.notification_channel then 'SMS'
      end
    from unnest(n.channels) as channel
  )::text[] as channels,
  n.source_table,
  n.source_id
from public.notifications n
where n.user_id = auth.uid()
order by n.created_at desc;

grant select on public.user_notifications_view to authenticated;
