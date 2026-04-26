-- 81_rpc_get_admin_support_management_summary.sql
-- Summary cards + sidebar rollups for /nexcoin-admin-priv/support.
--
-- Returns:
-- {
--   "summary": {
--     "openTickets": bigint,
--     "urgentTickets": bigint,
--     "awaitingUser": bigint,
--     "resolvedToday": bigint,
--     "slaAtRisk": bigint,
--     "averageFirstResponseMinutes": numeric
--   },
--   "agents": [
--     { "id": uuid, "name": text, "active": bigint, "openTickets": bigint }
--   ],
--   "issueCounts": [
--     { "id": text, "label": text, "count": bigint }
--   ],
--   "slaAlerts": [
--     { "id": uuid, "reference": text, "subject": text, "dueAt": timestamptz }
--   ]
-- }

create or replace function public.get_admin_support_management_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  summary jsonb;
  agents jsonb;
  issue_counts jsonb;
  sla_alerts jsonb;
  avg_first_response_minutes numeric;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select avg(extract(epoch from (t.first_response_at - t.created_at)) / 60)
  into avg_first_response_minutes
  from public.support_tickets t
  where t.first_response_at is not null
    and t.created_at >= now() - interval '30 days';

  summary := jsonb_build_object(
    'openTickets', (
      select count(*)
      from public.support_tickets
      where status in ('open', 'pending_admin')
    ),
    'urgentTickets', (
      select count(*)
      from public.support_tickets
      where priority = 'urgent'
        and status not in ('resolved', 'closed')
    ),
    'awaitingUser', (
      select count(*)
      from public.support_tickets
      where status = 'awaiting_user'
    ),
    'resolvedToday', (
      select count(*)
      from public.support_tickets
      where resolved_at::date = current_date
    ),
    'slaAtRisk', (
      select count(*)
      from public.support_tickets
      where status in ('open', 'pending_admin')
        and sla_due_at <= now() + interval '2 hours'
    ),
    'averageFirstResponseMinutes', coalesce(round(avg_first_response_minutes), 0)
  );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', au.user_id,
        'name', coalesce(p.full_name, p.email),
        'active', coalesce(agent_rollup.active_count, 0),
        'openTickets', coalesce(agent_rollup.open_count, 0)
      )
      order by coalesce(agent_rollup.open_count, 0) desc, coalesce(p.full_name, p.email)
    ),
    '[]'::jsonb
  )
  into agents
  from public.admin_users au
  join public.profiles p on p.id = au.user_id
  left join (
    select
      assigned_admin_id,
      count(*) filter (where status in ('open', 'pending_admin', 'awaiting_user'))::bigint as active_count,
      count(*) filter (where status in ('open', 'pending_admin'))::bigint as open_count
    from public.support_tickets
    where assigned_admin_id is not null
    group by assigned_admin_id
  ) agent_rollup on agent_rollup.assigned_admin_id = au.user_id
  where au.role in ('owner', 'admin', 'support');

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', grouped.category_id,
        'label', grouped.category_label,
        'count', grouped.ticket_count
      )
      order by grouped.ticket_count desc, grouped.category_id
    ),
    '[]'::jsonb
  )
  into issue_counts
  from (
    select
      t.category::text as category_id,
      initcap(replace(t.category::text, '_', ' ')) || ' questions' as category_label,
      count(*)::bigint as ticket_count
    from public.support_tickets t
    where t.created_at >= now() - interval '30 days'
    group by t.category
  ) grouped;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'reference', t.reference,
        'subject', t.subject,
        'dueAt', t.sla_due_at
      )
      order by t.sla_due_at
    ),
    '[]'::jsonb
  )
  into sla_alerts
  from (
    select *
    from public.support_tickets
    where status in ('open', 'pending_admin')
      and sla_due_at <= now() + interval '4 hours'
    order by sla_due_at
    limit 8
  ) t;

  return jsonb_build_object(
    'summary', summary,
    'agents', agents,
    'issueCounts', issue_counts,
    'slaAlerts', sla_alerts
  );
end;
$$;
