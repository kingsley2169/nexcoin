-- 80_rpc_admin_reply_support_ticket.sql
-- Admin RPC: add either a visible staff reply or an internal note to a
-- support ticket. Visible replies update first-response timestamps and move
-- the ticket to awaiting_user unless it is already resolved/closed.

create or replace function public.admin_reply_support_ticket(
  ticket_id uuid,
  message_body text,
  message_type public.support_message_type default 'admin'
)
returns public.support_ticket_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  current_ticket public.support_tickets;
  inserted_message public.support_ticket_messages;
  trimmed_body text := trim(message_body);
  next_status public.support_ticket_status;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if message_type not in ('admin', 'internal') then
    raise exception 'Admins may only send admin or internal messages';
  end if;

  if length(trimmed_body) = 0 then
    raise exception 'Message cannot be blank';
  end if;

  select *
  into current_ticket
  from public.support_tickets
  where id = ticket_id;

  if current_ticket.id is null then
    raise exception 'Support ticket not found';
  end if;

  insert into public.support_ticket_messages (
    ticket_id,
    author_admin_id,
    message_type,
    body
  )
  values (
    ticket_id,
    auth.uid(),
    message_type,
    trimmed_body
  )
  returning * into inserted_message;

  if message_type = 'admin' then
    next_status := case
      when current_ticket.status in ('resolved', 'closed') then current_ticket.status
      else 'awaiting_user'::public.support_ticket_status
    end;

    update public.support_tickets
    set
      first_response_at = coalesce(first_response_at, now()),
      last_message_at = inserted_message.created_at,
      status = next_status
    where id = ticket_id;

    insert into public.support_ticket_events (
      ticket_id,
      actor_admin_id,
      action_type,
      title,
      from_status,
      to_status,
      new_values
    )
    values (
      ticket_id,
      auth.uid(),
      'support_ticket_replied',
      'Admin replied',
      current_ticket.status,
      next_status,
      jsonb_build_object('messageId', inserted_message.id)
    );

    insert into public.admin_audit_logs (
      actor_admin_id,
      target_user_id,
      action_type,
      entity_table,
      entity_id,
      new_values
    )
    values (
      auth.uid(),
      current_ticket.user_id,
      'support_ticket_replied',
      'support_ticket_messages',
      inserted_message.id,
      jsonb_build_object('ticketId', ticket_id, 'messageType', message_type)
    );
  else
    insert into public.support_ticket_events (
      ticket_id,
      actor_admin_id,
      action_type,
      title,
      new_values,
      is_internal
    )
    values (
      ticket_id,
      auth.uid(),
      'support_ticket_note_added',
      'Internal note added',
      jsonb_build_object('messageId', inserted_message.id),
      true
    );

    insert into public.admin_audit_logs (
      actor_admin_id,
      target_user_id,
      action_type,
      entity_table,
      entity_id,
      new_values
    )
    values (
      auth.uid(),
      current_ticket.user_id,
      'support_ticket_note_added',
      'support_ticket_messages',
      inserted_message.id,
      jsonb_build_object('ticketId', ticket_id, 'messageType', message_type)
    );
  end if;

  return inserted_message;
end;
$$;
