-- 09_user_kyc_timeline_view.sql
-- Non-internal timeline for the user's latest submission. Feeds the "Review
-- timeline" card on /account/verification. Mirrors the user-side select policy
-- on kyc_submission_events (defined in admin migration 66): admin-only events
-- like note_added and check_updated are filtered out.

create or replace view public.user_kyc_timeline_view
with (security_invoker = false)
as
with latest as (
  select id
  from public.kyc_submissions
  where user_id = auth.uid()
  order by created_at desc
  limit 1
)
select
  e.id,
  e.submission_id,
  e.action_type,
  e.title,
  e.from_status,
  e.to_status,
  e.created_at
from public.kyc_submission_events e
join latest l on l.id = e.submission_id
where e.action_type not in (
  'kyc_submission_note_added'::public.admin_action_type,
  'kyc_submission_check_updated'::public.admin_action_type
);

grant select on public.user_kyc_timeline_view to authenticated;
