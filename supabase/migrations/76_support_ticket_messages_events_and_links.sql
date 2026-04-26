-- 76_support_ticket_messages_events_and_links.sql
-- Conversation messages, attachments, linked records, and timeline events for
-- support tickets. User-facing reads hide internal notes/events.

create table public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid references public.profiles(id) on delete set null,
  author_admin_id uuid references public.admin_users(user_id) on delete set null,
  message_type public.support_message_type not null,
  body text not null,
  created_at timestamptz not null default now(),

  constraint support_ticket_messages_body_not_blank check (length(trim(body)) > 0),
  constraint support_ticket_messages_author_consistency check (
    (message_type = 'user' and author_user_id is not null and author_admin_id is null)
    or (message_type in ('admin', 'internal') and author_admin_id is not null and author_user_id is null)
  )
);

create index support_ticket_messages_ticket_idx
on public.support_ticket_messages (ticket_id, created_at);

create index support_ticket_messages_author_user_idx
on public.support_ticket_messages (author_user_id, created_at desc);

create index support_ticket_messages_author_admin_idx
on public.support_ticket_messages (author_admin_id, created_at desc);

create table public.support_ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  message_id uuid references public.support_ticket_messages(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  content_type text,
  byte_size bigint,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_by_admin_id uuid references public.admin_users(user_id) on delete set null,
  created_at timestamptz not null default now(),

  constraint support_ticket_attachments_file_name_not_blank check (length(trim(file_name)) > 0),
  constraint support_ticket_attachments_storage_path_not_blank check (length(trim(storage_path)) > 0),
  constraint support_ticket_attachments_size_non_negative check (byte_size is null or byte_size >= 0)
);

create index support_ticket_attachments_ticket_idx
on public.support_ticket_attachments (ticket_id, created_at desc);

create index support_ticket_attachments_message_idx
on public.support_ticket_attachments (message_id);

create table public.support_ticket_links (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  link_type public.support_link_type not null,
  entity_id uuid,
  reference text not null,
  created_by_admin_id uuid references public.admin_users(user_id) on delete set null,
  created_at timestamptz not null default now(),

  constraint support_ticket_links_reference_not_blank check (length(trim(reference)) > 0),
  constraint support_ticket_links_unique_type_reference unique (ticket_id, link_type, reference)
);

create index support_ticket_links_ticket_idx
on public.support_ticket_links (ticket_id, link_type);

create table public.support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_admin_id uuid references public.admin_users(user_id) on delete set null,
  action_type public.admin_action_type not null,
  title text not null,
  from_status public.support_ticket_status,
  to_status public.support_ticket_status,
  old_values jsonb not null default '{}'::jsonb,
  new_values jsonb not null default '{}'::jsonb,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),

  constraint support_ticket_events_title_not_blank check (length(trim(title)) > 0)
);

create index support_ticket_events_ticket_idx
on public.support_ticket_events (ticket_id, created_at desc);

create index support_ticket_events_actor_admin_idx
on public.support_ticket_events (actor_admin_id, created_at desc);

-- RLS ----------------------------------------------------------------------

alter table public.support_ticket_messages enable row level security;
alter table public.support_ticket_attachments enable row level security;
alter table public.support_ticket_links enable row level security;
alter table public.support_ticket_events enable row level security;

create policy "Users can read own non-internal support messages"
on public.support_ticket_messages
for select
to authenticated
using (
  message_type <> 'internal'
  and exists (
    select 1
    from public.support_tickets t
    where t.id = support_ticket_messages.ticket_id
      and t.user_id = auth.uid()
  )
);

create policy "Admins can read support messages"
on public.support_ticket_messages
for select
to authenticated
using (public.is_admin());

create policy "Users can read own support attachments"
on public.support_ticket_attachments
for select
to authenticated
using (
  exists (
    select 1
    from public.support_tickets t
    left join public.support_ticket_messages m on m.id = support_ticket_attachments.message_id
    where t.id = support_ticket_attachments.ticket_id
      and t.user_id = auth.uid()
      and coalesce(m.message_type <> 'internal', true)
  )
);

create policy "Admins can read support attachments"
on public.support_ticket_attachments
for select
to authenticated
using (public.is_admin());

create policy "Users can read own support links"
on public.support_ticket_links
for select
to authenticated
using (
  exists (
    select 1
    from public.support_tickets t
    where t.id = support_ticket_links.ticket_id
      and t.user_id = auth.uid()
  )
);

create policy "Admins can read support links"
on public.support_ticket_links
for select
to authenticated
using (public.is_admin());

create policy "Users can read own non-internal support events"
on public.support_ticket_events
for select
to authenticated
using (
  not is_internal
  and exists (
    select 1
    from public.support_tickets t
    where t.id = support_ticket_events.ticket_id
      and t.user_id = auth.uid()
  )
);

create policy "Admins can read support events"
on public.support_ticket_events
for select
to authenticated
using (public.is_admin());

-- Writes are intentionally routed through RPCs.
