-- 67_admin_kyc_review_view.sql
-- Read model for /nexcoin-admin-priv/kyc-review. One row per submission,
-- with rolled-up checks/flags/notes/timeline JSON columns.
-- Note events and check events are filtered out of the timeline rollup so
-- the UI trail shows status-level changes only.

create or replace view public.admin_kyc_review_view
with (security_invoker = true)
as
with check_rollup as (
  select
    c.submission_id,
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'label', c.label,
        'status', c.status,
        'details', c.details,
        'displayOrder', c.display_order,
        'updatedAt', c.updated_at
      )
      order by c.display_order, c.created_at
    ) as checks
  from public.kyc_submission_checks c
  group by c.submission_id
),
flag_rollup as (
  select
    f.submission_id,
    jsonb_agg(
      jsonb_build_object(
        'code', f.flag_code,
        'label', cat.label,
        'detail', f.detail,
        'display', coalesce(f.detail, cat.label)
      )
      order by cat.display_order, f.created_at
    ) as flags
  from public.kyc_submission_flags f
  join public.kyc_flag_catalog cat on cat.code = f.flag_code
  group by f.submission_id
),
note_rollup as (
  select
    n.submission_id,
    jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'note', n.note,
        'adminId', n.admin_id,
        'createdAt', n.created_at
      )
      order by n.created_at desc
    ) as internal_notes
  from public.kyc_submission_internal_notes n
  group by n.submission_id
),
event_rollup as (
  select
    e.submission_id,
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'label', e.title,
        'actionType', e.action_type,
        'fromStatus', e.from_status,
        'toStatus', e.to_status,
        'createdAt', e.created_at
      )
      order by e.created_at desc
    ) as timeline
  from public.kyc_submission_events e
  where e.action_type <> 'kyc_submission_note_added'::public.admin_action_type
    and e.action_type <> 'kyc_submission_check_updated'::public.admin_action_type
  group by e.submission_id
)
select
  s.id,
  s.reference,
  s.user_id,
  p.full_name as user_name,
  p.email as user_email,
  p.account_status,
  uc.kyc_status,
  s.document_type,
  s.document_number,
  s.document_expiry,
  s.document_front_path,
  s.document_back_path,
  s.selfie_path,
  s.proof_of_address_path,
  s.document_quality,
  s.date_of_birth,
  s.address,
  s.liveness_status,
  s.proof_of_address_status,
  s.status,
  s.current_limit_label,
  s.after_approval_limit_label,
  s.reviewed_by,
  s.reviewed_at,
  s.rejection_reason,
  s.created_at,
  s.updated_at,
  coalesce(cr.checks, '[]'::jsonb) as checks,
  coalesce(fr.flags, '[]'::jsonb) as flags,
  coalesce(nr.internal_notes, '[]'::jsonb) as internal_notes,
  coalesce(er.timeline, '[]'::jsonb) as timeline
from public.kyc_submissions s
join public.profiles p on p.id = s.user_id
left join public.user_compliance uc on uc.user_id = s.user_id
left join check_rollup cr on cr.submission_id = s.id
left join flag_rollup fr on fr.submission_id = s.id
left join note_rollup nr on nr.submission_id = s.id
left join event_rollup er on er.submission_id = s.id
where public.is_admin();
