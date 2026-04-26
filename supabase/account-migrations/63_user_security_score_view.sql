-- 63_user_security_score_view.sql
-- Derived security score for /account/security.

create or replace view public.user_security_score_view
with (security_invoker = true)
as
with device_rollup as (
  select
    user_id,
    count(*) filter (where status <> 'revoked')::integer as total_devices,
    count(*) filter (where status = 'review')::integer as review_devices
  from public.user_devices
  where user_id = auth.uid()
  group by user_id
),
activity_rollup as (
  select
    user_id,
    count(*) filter (
      where status = 'review'
        and created_at >= now() - interval '30 days'
    )::integer as review_activity_count
  from public.user_security_activity
  where user_id = auth.uid()
  group by user_id
)
select
  p.id as user_id,
  case
    when coalesce(s2.enabled, false)
      and coalesce(ss.require_2fa_for_withdrawals, false)
      and coalesce(ss.confirm_new_withdrawal_addresses, false)
      and coalesce(ss.new_device_alerts, false)
      and coalesce(dr.review_devices, 0) = 0
      and coalesce(ar.review_activity_count, 0) = 0
    then 'Strong'
    else 'Needs attention'
  end as score,
  coalesce(dr.total_devices, 0) as trusted_devices_count,
  coalesce(dr.review_devices, 0) as review_devices_count,
  coalesce(ar.review_activity_count, 0) as review_activity_count,
  (
    (case when coalesce(s2.enabled, false) then 25 else 0 end)
    + (case when coalesce(ss.require_2fa_for_withdrawals, false) then 20 else 0 end)
    + (case when coalesce(ss.confirm_new_withdrawal_addresses, false) then 20 else 0 end)
    + (case when coalesce(ss.new_device_alerts, false) then 15 else 0 end)
    + (case when coalesce(dr.review_devices, 0) = 0 then 10 else 0 end)
    + (case when coalesce(ar.review_activity_count, 0) = 0 then 10 else 0 end)
  )::integer as score_percent
from public.profiles p
left join public.user_2fa_settings s2
  on s2.user_id = p.id
left join public.user_security_settings ss
  on ss.user_id = p.id
left join device_rollup dr
  on dr.user_id = p.id
left join activity_rollup ar
  on ar.user_id = p.id
where p.id = auth.uid();

grant select on public.user_security_score_view to authenticated;
