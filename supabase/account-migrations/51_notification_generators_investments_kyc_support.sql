-- 51_notification_generators_investments_kyc_support.sql
-- Trigger-based notification generators for investment maturity,
-- KYC status changes, and visible staff replies on support tickets.

create or replace function public.notify_on_user_investment_maturity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_name text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.status is not distinct from old.status or new.status <> 'matured' then
    return new;
  end if;

  select name
  into v_plan_name
  from public.investment_plans
  where id = new.plan_id;

  perform public.enqueue_notification(
    new.user_id,
    'investment',
    'Investment matured',
    coalesce(v_plan_name, 'Your investment plan')
      || ' has matured. Review the position in your portfolio.',
    'normal',
    '/account/portfolio',
    'View portfolio',
    'investment:' || new.id::text || ':matured',
    'user_investments',
    new.id
  );

  return new;
end;
$$;

create trigger create_notifications_for_user_investments
after update on public.user_investments
for each row execute function public.notify_on_user_investment_maturity();

create or replace function public.notify_on_kyc_submission_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body text;
  v_priority public.notification_priority := 'normal';
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  case new.status
    when 'in_review' then
      v_title := 'Verification under review';
      v_body := 'Your KYC submission ' || new.reference || ' is now being reviewed.';
    when 'approved' then
      v_title := 'Verification approved';
      v_body := 'Your KYC submission ' || new.reference || ' was approved.';
    when 'needs_resubmission' then
      v_title := 'Verification needs updates';
      v_body := 'Your KYC submission ' || new.reference || ' needs updated documents.';
      v_priority := 'high';
    when 'rejected' then
      v_title := 'Verification rejected';
      v_body := 'Your KYC submission ' || new.reference || ' was rejected.';
      v_priority := 'high';
    else
      return new;
  end case;

  perform public.enqueue_notification(
    new.user_id,
    'security',
    v_title,
    v_body,
    v_priority,
    '/account/verification',
    'Open verification',
    'kyc:' || new.id::text || ':' || new.status::text,
    'kyc_submissions',
    new.id
  );

  return new;
end;
$$;

create trigger create_notifications_for_kyc_submissions
after update on public.kyc_submissions
for each row execute function public.notify_on_kyc_submission_status_change();

create or replace function public.notify_on_support_admin_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.support_tickets;
begin
  if new.message_type <> 'admin' or new.author_admin_id is null then
    return new;
  end if;

  select *
  into v_ticket
  from public.support_tickets
  where id = new.ticket_id;

  if v_ticket.id is null then
    return new;
  end if;

  perform public.enqueue_notification(
    v_ticket.user_id,
    'support',
    'Support replied to your ticket',
    'Support replied to ticket ' || v_ticket.reference || '.',
    'normal',
    '/account/support?ref=' || v_ticket.reference,
    'Open ticket',
    'support-reply:' || new.id::text,
    'support_ticket_messages',
    new.id
  );

  return new;
end;
$$;

create trigger create_notifications_for_support_replies
after insert on public.support_ticket_messages
for each row execute function public.notify_on_support_admin_reply();
