-- 77_admin_support_management_view.sql
-- Read model for /nexcoin-admin-priv/support. One row per support ticket,
-- with rolled-up messages, notes, attachments, links, and timeline JSON.
-- Internal notes are derived from internal messages so support agents can keep
-- a private case log without a separate notes table.

create or replace view public.admin_support_management_view
with (security_invoker = true)
as
with message_rollup as (
  select
    m.ticket_id,
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'author', coalesce(admin_profile.full_name, user_profile.full_name, 'Admin User'),
        'body', m.body,
        'createdAt', m.created_at,
        'type', m.message_type
      )
      order by m.created_at
    ) as messages
  from public.support_ticket_messages m
  left join public.profiles user_profile on user_profile.id = m.author_user_id
  left join public.profiles admin_profile on admin_profile.id = m.author_admin_id
  group by m.ticket_id
),
internal_note_rollup as (
  select
    m.ticket_id,
    jsonb_agg(m.body order by m.created_at desc) as internal_notes
  from public.support_ticket_messages m
  where m.message_type = 'internal'
  group by m.ticket_id
),
attachment_rollup as (
  select
    a.ticket_id,
    jsonb_agg(a.file_name order by a.created_at) as attachments
  from public.support_ticket_attachments a
  group by a.ticket_id
),
link_rollup as (
  select
    l.ticket_id,
    jsonb_object_agg(l.link_type::text, l.reference) as linked_records
  from public.support_ticket_links l
  group by l.ticket_id
),
event_rollup as (
  select
    e.ticket_id,
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'label', e.title,
        'createdAt', e.created_at
      )
      order by e.created_at desc
    ) as timeline
  from public.support_ticket_events e
  where not e.is_internal
  group by e.ticket_id
)
select
  t.id,
  t.reference,
  t.user_id,
  user_profile.full_name as user_name,
  user_profile.email as user_email,
  coalesce(agent_profile.full_name, 'Unassigned') as agent,
  initcap(replace(t.category::text, '_', ' ')) as category,
  initcap(replace(t.priority::text, '_', ' ')) as priority,
  initcap(replace(t.status::text, '_', ' ')) as status,
  t.subject,
  t.sla_due_at,
  t.last_message_at,
  t.created_at,
  coalesce(ar.attachments, '[]'::jsonb) as attachments,
  coalesce(lr.linked_records, '{}'::jsonb) as linked_records,
  coalesce(mr.messages, '[]'::jsonb) as messages,
  coalesce(inr.internal_notes, '[]'::jsonb) as internal_notes,
  coalesce(er.timeline, '[]'::jsonb) as timeline
from public.support_tickets t
join public.profiles user_profile on user_profile.id = t.user_id
left join public.profiles agent_profile on agent_profile.id = t.assigned_admin_id
left join message_rollup mr on mr.ticket_id = t.id
left join internal_note_rollup inr on inr.ticket_id = t.id
left join attachment_rollup ar on ar.ticket_id = t.id
left join link_rollup lr on lr.ticket_id = t.id
left join event_rollup er on er.ticket_id = t.id
where public.is_admin();
