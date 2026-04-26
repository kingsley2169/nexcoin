-- 79_rpc_admin_update_support_ticket.sql
-- Admin RPC: assign, reprioritize, or change status on a support ticket.
-- Emits timeline and audit rows alongside the ticket update.

create or replace function public.admin_update_support_ticket(
  ticket_id uuid,
  assigned_admin_id uuid default null,
  priority public.support_ticket_priority default null,
  status public.support_ticket_status default null,
  sla_due_at timestamptz default null
)
returns public.support_tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  current_ticket public.support_tickets;
  updated_ticket public.support_tickets;
  effective_status public.support_ticket_status;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select *
  into current_ticket
  from public.support_tickets
  where id = ticket_id;

  if current_ticket.id is null then
    raise exception 'Support ticket not found';
  end if;

  effective_status := coalesce(status, current_ticket.status);

  update public.support_tickets
  set
    assigned_admin_id = coalesce(admin_update_support_ticket.assigned_admin_id, support_tickets.assigned_admin_id),
    priority = coalesce(admin_update_support_ticket.priority, support_tickets.priority),
    status = effective_status,
    sla_due_at = coalesce(admin_update_support_ticket.sla_due_at, support_tickets.sla_due_at),
    resolved_at = case
      when effective_status in ('resolved', 'closed') then coalesce(support_tickets.resolved_at, now())
      else null
    end,
    closed_at = case
      when effective_status = 'closed' then coalesce(support_tickets.closed_at, now())
      else null
    end
  where id = ticket_id
  returning * into updated_ticket;

  if assigned_admin_id is not null and assigned_admin_id is distinct from current_ticket.assigned_admin_id then
    insert into public.support_ticket_events (
      ticket_id,
      actor_admin_id,
      action_type,
      title,
      old_values,
      new_values
    )
    values (
      ticket_id,
      auth.uid(),
      'support_ticket_assigned',
      'Ticket reassigned',
      jsonb_build_object('assignedAdminId', current_ticket.assigned_admin_id),
      jsonb_build_object('assignedAdminId', assigned_admin_id)
    );
  end if;

  if priority is not null and priority is distinct from current_ticket.priority then
    insert into public.support_ticket_events (
      ticket_id,
      actor_admin_id,
      action_type,
      title,
      old_values,
      new_values
    )
    values (
      ticket_id,
      auth.uid(),
      'support_ticket_updated',
      'Priority updated',
      jsonb_build_object('priority', current_ticket.priority),
      jsonb_build_object('priority', priority)
    );
  end if;

  if status is not null and status is distinct from current_ticket.status then
    insert into public.support_ticket_events (
      ticket_id,
      actor_admin_id,
      action_type,
      title,
      from_status,
      to_status,
      old_values,
      new_values
    )
    values (
      ticket_id,
      auth.uid(),
      case
        when status = 'closed' then 'support_ticket_closed'::public.admin_action_type
        when status = 'resolved' then 'support_ticket_resolved'::public.admin_action_type
        else 'support_ticket_updated'::public.admin_action_type
      end,
      case
        when status = 'closed' then 'Ticket closed'
        when status = 'resolved' then 'Ticket resolved'
        else 'Ticket status updated'
      end,
      current_ticket.status,
      status,
      jsonb_build_object('status', current_ticket.status),
      jsonb_build_object('status', status)
    );
  end if;

  insert into public.admin_audit_logs (
    actor_admin_id,
    target_user_id,
    action_type,
    entity_table,
    entity_id,
    old_values,
    new_values
  )
  values (
    auth.uid(),
    current_ticket.user_id,
    case
      when status = 'closed' then 'support_ticket_closed'::public.admin_action_type
      when status = 'resolved' then 'support_ticket_resolved'::public.admin_action_type
      when assigned_admin_id is not null and assigned_admin_id is distinct from current_ticket.assigned_admin_id then 'support_ticket_assigned'::public.admin_action_type
      else 'support_ticket_updated'::public.admin_action_type
    end,
    'support_tickets',
    ticket_id,
    jsonb_build_object(
      'assignedAdminId', current_ticket.assigned_admin_id,
      'priority', current_ticket.priority,
      'status', current_ticket.status,
      'slaDueAt', current_ticket.sla_due_at
    ),
    jsonb_build_object(
      'assignedAdminId', updated_ticket.assigned_admin_id,
      'priority', updated_ticket.priority,
      'status', updated_ticket.status,
      'slaDueAt', updated_ticket.sla_due_at
    )
  );

  return updated_ticket;
end;
$$;
