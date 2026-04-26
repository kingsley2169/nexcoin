-- 73_user_ticket_thread_view.sql
-- Visible conversation/timeline rows for one support ticket on
-- /account/support/[reference].
--
-- Messages and events are flattened into a single ordered stream. Internal
-- notes/events remain hidden by existing RLS and explicit filtering here.

create or replace view public.user_ticket_thread_view
with (security_invoker = true)
as
with visible_messages as (
  select
    t.id as ticket_id,
    t.reference,
    'message'::text as row_type,
    m.id as row_id,
    case m.message_type
      when 'user' then 'user'
      else 'support'
    end as author,
    case m.message_type
      when 'user' then 'You'
      else 'Nexcoin Support'
    end as author_name,
    m.body,
    m.created_at,
    null::text as event_title
  from public.support_tickets t
  join public.support_ticket_messages m
    on m.ticket_id = t.id
  where t.user_id = auth.uid()
    and m.message_type <> 'internal'
),
visible_events as (
  select
    t.id as ticket_id,
    t.reference,
    'event'::text as row_type,
    e.id as row_id,
    'support'::text as author,
    'Nexcoin Support'::text as author_name,
    null::text as body,
    e.created_at,
    e.title as event_title
  from public.support_tickets t
  join public.support_ticket_events e
    on e.ticket_id = t.id
  where t.user_id = auth.uid()
    and not e.is_internal
    and e.action_type in (
      'support_ticket_created'::public.admin_action_type,
      'support_ticket_updated'::public.admin_action_type,
      'support_ticket_assigned'::public.admin_action_type,
      'support_ticket_replied'::public.admin_action_type,
      'support_ticket_resolved'::public.admin_action_type,
      'support_ticket_closed'::public.admin_action_type
    )
)
select *
from (
  select * from visible_messages
  union all
  select * from visible_events
) rows
order by created_at asc, row_type desc;

grant select on public.user_ticket_thread_view to authenticated;
