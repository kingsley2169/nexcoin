-- 74_rpc_user_reply_support_ticket.sql
-- Append a user reply to an existing ticket.
-- If the ticket was resolved, replying re-opens it. Closed tickets stay closed.

create or replace function public.user_reply_support_ticket(
  p_ticket_id uuid,
  p_message_body text
)
returns public.support_ticket_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ticket public.support_tickets;
  v_message public.support_ticket_messages;
  v_body text := trim(p_message_body);
  v_next_status public.support_ticket_status;
  v_latest_message_at timestamptz;
  v_latest_event_at timestamptz;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if length(v_body) = 0 then
    raise exception 'Reply cannot be blank';
  end if;

  select *
  into v_ticket
  from public.support_tickets
  where id = p_ticket_id
    and user_id = v_user
  for update;

  if v_ticket.id is null then
    raise exception 'Support ticket not found';
  end if;

  if v_ticket.status = 'closed' then
    raise exception 'Closed tickets cannot be replied to';
  end if;

  insert into public.support_ticket_messages (
    ticket_id,
    author_user_id,
    message_type,
    body
  )
  values (
    v_ticket.id,
    v_user,
    'user',
    v_body
  )
  returning * into v_message;

  v_next_status := case
    when v_ticket.status = 'resolved' then 'open'::public.support_ticket_status
    else 'pending_admin'::public.support_ticket_status
  end;

  update public.support_tickets
  set
    status = v_next_status,
    resolved_at = case when v_next_status = 'resolved' then resolved_at else null end,
    closed_at = case when v_next_status = 'closed' then closed_at else null end,
    last_message_at = v_message.created_at
  where id = v_ticket.id;

  insert into public.support_ticket_events (
    ticket_id,
    actor_user_id,
    action_type,
    title,
    from_status,
    to_status,
    new_values
  )
  values (
    v_ticket.id,
    v_user,
    'support_ticket_replied',
    case
      when v_ticket.status = 'resolved' then 'User replied and re-opened ticket'
      else 'User replied'
    end,
    v_ticket.status,
    v_next_status,
    jsonb_build_object('messageId', v_message.id)
  );

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
    last_read_event_at = excluded.last_read_event_at;

  return v_message;
end;
$$;

revoke all on function public.user_reply_support_ticket(uuid, text) from public;
grant execute on function public.user_reply_support_ticket(uuid, text) to authenticated;
