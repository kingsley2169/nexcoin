-- 69_rpc_admin_update_kyc_submission_status.sql
-- Admin RPC: moves a KYC submission through in_review / needs_resubmission /
-- approved / rejected. Terminal statuses (approved, rejected) cannot be
-- reopened; a new submission must be created instead.
--
-- Also propagates the decision to user_compliance.kyc_status:
--   approved          -> approved
--   rejected          -> rejected
--   in_review         -> pending
--   needs_resubmission -> pending
-- with a paired `kyc_status_changed` audit row when the compliance status
-- actually changes.

create or replace function public.admin_update_kyc_submission_status(
  submission_id uuid,
  new_status public.kyc_submission_status,
  reason text default null
)
returns public.kyc_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  old_submission public.kyc_submissions;
  updated_submission public.kyc_submissions;
  display_title text;
  target_compliance_status public.kyc_status;
  old_compliance public.user_compliance;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'compliance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select *
  into old_submission
  from public.kyc_submissions
  where id = submission_id
  for update;

  if old_submission.id is null then
    raise exception 'KYC submission not found';
  end if;

  if old_submission.status in ('approved', 'rejected') and new_status <> old_submission.status then
    raise exception 'Terminal KYC submissions cannot be reopened; require a new submission';
  end if;

  if old_submission.status = new_status then
    return old_submission;
  end if;

  update public.kyc_submissions
  set
    status = new_status,
    reviewed_by = auth.uid(),
    reviewed_at = case
      when new_status in ('approved', 'rejected', 'needs_resubmission') then coalesce(reviewed_at, now())
      else reviewed_at
    end,
    rejection_reason = case
      when new_status = 'rejected' then reason
      else rejection_reason
    end
  where id = submission_id
  returning * into updated_submission;

  display_title := case new_status
    when 'in_review' then 'Admin review opened'
    when 'approved' then 'KYC approved'
    when 'rejected' then 'KYC rejected'
    when 'needs_resubmission' then 'Resubmission requested'
    when 'pending' then 'KYC marked pending'
    else 'KYC status changed'
  end;

  insert into public.kyc_submission_events (
    submission_id,
    actor_admin_id,
    action_type,
    title,
    from_status,
    to_status,
    old_values,
    new_values
  )
  values (
    submission_id,
    auth.uid(),
    'kyc_submission_status_changed',
    display_title,
    old_submission.status,
    new_status,
    jsonb_build_object('status', old_submission.status),
    jsonb_build_object('status', new_status, 'reason', reason)
  );

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
    updated_submission.user_id,
    'kyc_submission_status_changed',
    'kyc_submissions',
    submission_id,
    jsonb_build_object('status', old_submission.status),
    jsonb_build_object('status', new_status, 'reason', reason)
  );

  target_compliance_status := case new_status
    when 'approved' then 'approved'::public.kyc_status
    when 'rejected' then 'rejected'::public.kyc_status
    when 'needs_resubmission' then 'pending'::public.kyc_status
    when 'in_review' then 'pending'::public.kyc_status
    else null
  end;

  if target_compliance_status is not null then
    select *
    into old_compliance
    from public.user_compliance
    where user_id = updated_submission.user_id
    for update;

    if old_compliance.user_id is null or old_compliance.kyc_status <> target_compliance_status then
      insert into public.user_compliance (user_id, kyc_status, reviewed_by, reviewed_at)
      values (updated_submission.user_id, target_compliance_status, auth.uid(), now())
      on conflict (user_id) do update
        set kyc_status = excluded.kyc_status,
            reviewed_by = excluded.reviewed_by,
            reviewed_at = excluded.reviewed_at;

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
        updated_submission.user_id,
        'kyc_status_changed',
        'user_compliance',
        updated_submission.user_id,
        jsonb_build_object('kycStatus', old_compliance.kyc_status),
        jsonb_build_object('kycStatus', target_compliance_status)
      );
    end if;
  end if;

  return updated_submission;
end;
$$;
