-- 07_user_kyc_submission_view.sql
-- Overview row for /account/verification — the logged-in user's latest KYC
-- submission joined to their compliance status and current tier. Always returns
-- one row per user (submission fields are null when no submission has been filed).
--
-- security_invoker = false so auth.uid() resolves to the caller while the view
-- itself bypasses RLS on user_compliance (admin-only table) — the where clause
-- is the authoritative tenant filter.

create or replace view public.user_kyc_submission_view
with (security_invoker = false)
as
select
  p.id as user_id,

  -- latest submission (may be null)
  s.id as submission_id,
  s.reference,
  s.document_type,
  s.document_quality,
  s.status as submission_status,
  s.rejection_reason,
  s.created_at as submitted_at,
  s.reviewed_at,
  s.current_limit_label,
  s.after_approval_limit_label,

  -- compliance + tier
  coalesce(uc.kyc_status, 'unverified'::public.kyc_status) as kyc_status,
  p.tier as current_tier,

  -- derived overview status for the UI pill
  case
    when s.id is null then 'not_submitted'
    when s.status = 'approved' then 'approved'
    when s.status in ('pending', 'in_review') then 'in_review'
    when s.status in ('needs_resubmission', 'rejected') then 'action_required'
  end as overview_status
from public.profiles p
left join lateral (
  select *
  from public.kyc_submissions ks
  where ks.user_id = p.id
  order by ks.created_at desc
  limit 1
) s on true
left join public.user_compliance uc on uc.user_id = p.id
where p.id = auth.uid();

grant select on public.user_kyc_submission_view to authenticated;
