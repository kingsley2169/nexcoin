-- 78_rpc_create_support_ticket.sql
-- User RPC: create a support ticket, add the opening message, optional
-- linked records, and an initial timeline event.

create or replace function public.create_support_ticket(
  subject text,
  category public.support_ticket_category,
  message_body text,
  priority public.support_ticket_priority default 'medium',
  linked_deposit_reference text default null,
  linked_withdrawal_reference text default null,
  linked_kyc_reference text default null,
  linked_transaction_reference text default null,
  attachment_names text[] default array[]::text[]
)
returns public.support_tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_ticket public.support_tickets;
  trimmed_subject text := trim(subject);
  trimmed_body text := trim(message_body);
  attachment_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if length(trimmed_subject) = 0 then
    raise exception 'Subject cannot be blank';
  end if;

  if length(trimmed_body) = 0 then
    raise exception 'Message cannot be blank';
  end if;

  insert into public.support_tickets (
    user_id,
    subject,
    category,
    priority,
    status
  )
  values (
    auth.uid(),
    trimmed_subject,
    category,
    priority,
    'open'
  )
  returning * into inserted_ticket;

  insert into public.support_ticket_messages (
    ticket_id,
    author_user_id,
    message_type,
    body
  )
  values (
    inserted_ticket.id,
    auth.uid(),
    'user',
    trimmed_body
  );

  if linked_deposit_reference is not null and length(trim(linked_deposit_reference)) > 0 then
    insert into public.support_ticket_links (ticket_id, link_type, reference)
    values (inserted_ticket.id, 'deposit', trim(linked_deposit_reference));
  end if;

  if linked_withdrawal_reference is not null and length(trim(linked_withdrawal_reference)) > 0 then
    insert into public.support_ticket_links (ticket_id, link_type, reference)
    values (inserted_ticket.id, 'withdrawal', trim(linked_withdrawal_reference));
  end if;

  if linked_kyc_reference is not null and length(trim(linked_kyc_reference)) > 0 then
    insert into public.support_ticket_links (ticket_id, link_type, reference)
    values (inserted_ticket.id, 'kyc', trim(linked_kyc_reference));
  end if;

  if linked_transaction_reference is not null and length(trim(linked_transaction_reference)) > 0 then
    insert into public.support_ticket_links (ticket_id, link_type, reference)
    values (inserted_ticket.id, 'transaction', trim(linked_transaction_reference));
  end if;

  foreach attachment_name in array attachment_names loop
    if length(trim(attachment_name)) > 0 then
      insert into public.support_ticket_attachments (
        ticket_id,
        file_name,
        storage_path,
        created_by_user_id
      )
      values (
        inserted_ticket.id,
        trim(attachment_name),
        'support/' || inserted_ticket.id::text || '/' || trim(attachment_name),
        auth.uid()
      );
    end if;
  end loop;

  insert into public.support_ticket_events (
    ticket_id,
    actor_user_id,
    action_type,
    title,
    to_status
  )
  values (
    inserted_ticket.id,
    auth.uid(),
    'support_ticket_created',
    'Ticket created',
    inserted_ticket.status
  );

  return inserted_ticket;
end;
$$;

grant execute on function public.create_support_ticket(
  text,
  public.support_ticket_category,
  text,
  public.support_ticket_priority,
  text,
  text,
  text,
  text,
  text[]
) to authenticated;
