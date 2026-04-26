-- 71_user_support_summary_view.sql
-- Summary cards for /account/support.

create or replace view public.user_support_summary_view
with (security_invoker = true)
as
with my_tickets as (
  select *
  from public.support_tickets
  where user_id = auth.uid()
),
first_responses as (
  select
    id,
    extract(
      epoch from (
        coalesce(first_response_at, last_message_at) - created_at
      )
    ) / 3600.0 as response_hours
  from my_tickets
  where first_response_at is not null
)
select
  auth.uid() as user_id,
  count(*) filter (where status in ('open', 'pending_admin'))::integer as open,
  count(*) filter (where status = 'awaiting_user')::integer as awaiting_reply,
  count(*) filter (
    where status in ('resolved', 'closed')
      and coalesce(resolved_at, closed_at, updated_at) >= now() - interval '30 days'
  )::integer as resolved_this_month,
  coalesce(round(avg(response_hours)::numeric, 1), 0)::numeric(8, 1) as avg_response_hours
from my_tickets
left join first_responses fr
  on fr.id = my_tickets.id;

grant select on public.user_support_summary_view to authenticated;
