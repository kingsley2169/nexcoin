-- 72_user_tickets_view.sql
-- Ticket list read model for /account/support.
-- Maps admin-side support enums into the simplified user-side page contract.

create or replace view public.user_tickets_view
with (security_invoker = true)
as
with message_rollup as (
  select
    m.ticket_id,
    count(*)::integer as message_count,
    max(m.created_at) as last_message_at,
    (
      array_agg(
        case m.message_type
          when 'user' then 'user'
          else 'support'
        end
        order by m.created_at desc
      )
    )[1] as last_message_from
  from public.support_ticket_messages m
  join public.support_tickets t
    on t.id = m.ticket_id
  where t.user_id = auth.uid()
    and m.message_type <> 'internal'
  group by m.ticket_id
),
staff_latest as (
  select
    m.ticket_id,
    max(m.created_at) as last_staff_message_at
  from public.support_ticket_messages m
  join public.support_tickets t
    on t.id = m.ticket_id
  where t.user_id = auth.uid()
    and m.message_type = 'admin'
  group by m.ticket_id
)
select
  t.id,
  t.reference,
  t.subject,
  case t.category
    when 'account' then 'account'
    when 'deposit' then 'deposits'
    when 'withdrawal' then 'withdrawals'
    when 'kyc' then 'kyc'
    when 'investment' then 'plans'
    when 'security' then 'security'
    when 'general' then 'other'
  end as category,
  case t.priority
    when 'low' then 'low'
    when 'medium' then 'normal'
    when 'high' then 'high'
    when 'urgent' then 'high'
  end as priority,
  case t.status
    when 'open' then 'open'
    when 'pending_admin' then 'open'
    when 'awaiting_user' then 'awaiting_reply'
    when 'resolved' then 'resolved'
    when 'closed' then 'closed'
  end as status,
  t.created_at,
  coalesce(mr.last_message_at, t.last_message_at, t.updated_at) as updated_at,
  coalesce(mr.message_count, 0) as message_count,
  coalesce(mr.last_message_from, 'user') as last_message_from,
  coalesce(
    sl.last_staff_message_at > greatest(
      coalesce(r.last_read_message_at, '-infinity'::timestamptz),
      coalesce(r.last_read_event_at, '-infinity'::timestamptz)
    ),
    false
  ) as unread
from public.support_tickets t
left join message_rollup mr
  on mr.ticket_id = t.id
left join staff_latest sl
  on sl.ticket_id = t.id
left join public.user_support_ticket_reads r
  on r.ticket_id = t.id
 and r.user_id = t.user_id
where t.user_id = auth.uid()
order by coalesce(mr.last_message_at, t.last_message_at, t.updated_at) desc, t.created_at desc;

grant select on public.user_tickets_view to authenticated;
