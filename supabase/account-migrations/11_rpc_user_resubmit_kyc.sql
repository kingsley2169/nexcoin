-- 11_rpc_user_resubmit_kyc.sql
-- User RPC: re-queues a KYC submission whose status is 'needs_resubmission'.
-- Runs the "Submit for Review" button on /account/verification after the user
-- has replaced flagged documents via user_submit_kyc_document.
--
-- Validates that the required document paths are present, flips status back to
-- 'pending', clears the prior reviewer/timestamp, and emits a timeline event
-- the user can see.
--
-- After a 'rejected' submission the user must create a NEW submission via
-- create_kyc_submission (admin migration 68) instead of using this RPC.

create or replace function public.user_resubmit_kyc()
returns public.kyc_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.kyc_submissions;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.kyc_submissions
  where user_id = v_user
  order by created_at desc
  limit 1;

  if v_row.id is null then
    raise exception 'No KYC submission to resubmit';
  end if;

  if v_row.status <> 'needs_resubmission' then
    raise exception 'Submission is not awaiting resubmission (current status: %)', v_row.status;
  end if;

  if v_row.document_front_path is null then
    raise exception 'Government ID (front) is required';
  end if;

  if v_row.proof_of_address_path is null then
    raise exception 'Proof of address is required';
  end if;

  if v_row.selfie_path is null then
    raise exception 'Selfie is required';
  end if;

  update public.kyc_submissions
  set
    status = 'pending',
    rejection_reason = null,
    reviewed_by = null,
    reviewed_at = null
  where id = v_row.id
  returning * into v_row;

  update public.user_compliance
  set kyc_status = 'pending'
  where user_id = v_user;

  insert into public.kyc_submission_events (
    submission_id,
    actor_user_id,
    action_type,
    title,
    from_status,
    to_status
  )
  values (
    v_row.id,
    v_user,
    'kyc_submission_status_changed',
    'KYC resubmitted for review',
    'needs_resubmission'::public.kyc_submission_status,
    'pending'::public.kyc_submission_status
  );

  return v_row;
end;
$$;

revoke all on function public.user_resubmit_kyc() from public;
grant execute on function public.user_resubmit_kyc() to authenticated;
