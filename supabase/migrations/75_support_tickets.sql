-- 75_support_tickets.sql
-- Primary support ticket table for user/account issues and the admin inbox.
-- Conversations, links, attachments, and timeline entries live in 76.

create sequence if not exists public.support_ticket_reference_seq
as integer
start with 1200
increment by 1
minvalue 1;

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default (
    'SUP-' || nextval('public.support_ticket_reference_seq')::text
  ),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  category public.support_ticket_category not null default 'general',
  priority public.support_ticket_priority not null default 'medium',
  status public.support_ticket_status not null default 'open',
  assigned_admin_id uuid references public.admin_users(user_id),
  sla_due_at timestamptz not null default (now() + interval '4 hours'),
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint support_tickets_subject_not_blank check (length(trim(subject)) > 0),
  constraint support_tickets_resolution_consistency check (
    (status in ('resolved', 'closed') and resolved_at is not null)
    or (status not in ('resolved', 'closed'))
  ),
  constraint support_tickets_closed_consistency check (
    (status = 'closed' and closed_at is not null)
    or (status <> 'closed')
  )
);

create index support_tickets_user_id_idx
on public.support_tickets (user_id, created_at desc);

create index support_tickets_status_idx
on public.support_tickets (status, last_message_at desc);

create index support_tickets_priority_idx
on public.support_tickets (priority, sla_due_at);

create index support_tickets_category_idx
on public.support_tickets (category, created_at desc);

create index support_tickets_assigned_admin_idx
on public.support_tickets (assigned_admin_id, status);

create index support_tickets_sla_due_at_idx
on public.support_tickets (sla_due_at)
where status in ('open', 'pending_admin');

create trigger set_updated_at_support_tickets
before update on public.support_tickets
for each row execute function extensions.moddatetime(updated_at);

-- RLS ----------------------------------------------------------------------

alter table public.support_tickets enable row level security;

create policy "Users can read own support tickets"
on public.support_tickets
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read support tickets"
on public.support_tickets
for select
to authenticated
using (public.is_admin());

-- Writes are intentionally routed through RPCs so ticket status changes,
-- replies, notes, timeline events, and audit rows stay consistent.
