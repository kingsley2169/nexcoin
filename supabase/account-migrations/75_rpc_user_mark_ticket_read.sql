-- 75_rpc_user_mark_ticket_read.sql
-- Marks a ticket thread as read up to the latest visible message/event.

create or replace function public.user_mark_ticket_read(
  p_ticket_id uuid
)
returns public.user_support_ticket_reads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ticket public.support_tickets;
  v_latest_message_at timestamptz;
  v_latest_event_at timestamptz;
  v_row public.user_support_ticket_reads;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_ticket
  from public.support_tickets
  where id = p_ticket_id
    and user_id = v_user;

  if v_ticket.id is null then
    raise exception 'Support ticket not found';
  end if;

  select max(created_at)
  into v_latest_message_at
  from public.support_ticket_messages
  where ticket_id = v_ticket.id
    and message_type <> 'internal';

  select max(created_at)
  into v_latest_event_at
  from public.support_ticket_events
  where ticket_id = v_ticket.id
    and not is_internal;

  insert into public.user_support_ticket_reads (
    ticket_id,
    user_id,
    last_read_message_at,
    last_read_event_at
  )
  values (
    v_ticket.id,
    v_user,
    v_latest_message_at,
    v_latest_event_at
  )
  on conflict (ticket_id) do update
  set
    user_id = excluded.user_id,
    last_read_message_at = excluded.last_read_message_at,
    last_read_event_at = excluded.last_read_event_at
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.user_mark_ticket_read(uuid) from public;
grant execute on function public.user_mark_ticket_read(uuid) to authenticated;
