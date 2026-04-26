-- 70_user_support_ticket_reads.sql
-- Per-user read state for support ticket threads.
--
-- This is what powers the unread dot on /account/support and the
-- user_mark_ticket_read RPC. We track the latest visible message/event the
-- user has seen for each ticket.

create table public.user_support_ticket_reads (
  ticket_id uuid primary key references public.support_tickets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_message_at timestamptz,
  last_read_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_support_ticket_reads_unique unique (ticket_id, user_id)
);

create index user_support_ticket_reads_user_idx
on public.user_support_ticket_reads (user_id, updated_at desc);

create trigger set_updated_at_user_support_ticket_reads
before update on public.user_support_ticket_reads
for each row execute function extensions.moddatetime(updated_at);

alter table public.user_support_ticket_reads enable row level security;

create policy "Users can read own support ticket reads"
on public.user_support_ticket_reads
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read support ticket reads"
on public.user_support_ticket_reads
for select
to authenticated
using (public.is_admin());
