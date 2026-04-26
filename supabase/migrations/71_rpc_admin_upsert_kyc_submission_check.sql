-- 71_rpc_admin_upsert_kyc_submission_check.sql
-- Admin RPC: create or update a checklist row on a KYC submission. Keyed by
-- (submission_id, lower(label)) so repeated calls with the same label
-- refresh the status rather than creating duplicates.

create or replace function public.admin_upsert_kyc_submission_check(
  submission_id uuid,
  check_label text,
  check_status public.kyc_check_status,
  check_details text default null,
  check_display_order integer default 0
)
returns public.kyc_submission_checks
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_submission public.kyc_submissions;
  upserted_check public.kyc_submission_checks;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if length(trim(check_label)) = 0 then
    raise exception 'Check label cannot be blank';
  end if;

  select *
  into selected_submission
  from public.kyc_submissions
  where id = submission_id;

  if selected_submission.id is null then
    raise exception 'KYC submission not found';
  end if;

  insert into public.kyc_submission_checks (
    submission_id,
    label,
    status,
    details,
    display_order,
    updated_by
  )
  values (
    submission_id,
    trim(check_label),
    check_status,
    nullif(trim(check_details), ''),
    check_display_order,
    auth.uid()
  )
  on conflict (submission_id, (lower(label))) do update
  set
    status = excluded.status,
    details = excluded.details,
    display_order = excluded.display_order,
    updated_by = excluded.updated_by
  returning * into upserted_check;

  insert into public.kyc_submission_events (
    submission_id,
    actor_admin_id,
    action_type,
    title,
    new_values
  )
  values (
    submission_id,
    auth.uid(),
    'kyc_submission_check_updated',
    'KYC check updated',
    jsonb_build_object(
      'label', upserted_check.label,
      'status', upserted_check.status,
      'details', upserted_check.details
    )
  );

  insert into public.admin_audit_logs (
    actor_admin_id,
    target_user_id,
    action_type,
    entity_table,
    entity_id,
    new_values
  )
  values (
    auth.uid(),
    selected_submission.user_id,
    'kyc_submission_check_updated',
    'kyc_submission_checks',
    upserted_check.id,
    jsonb_build_object(
      'submissionId', submission_id,
      'label', upserted_check.label,
      'status', upserted_check.status
    )
  );

  return upserted_check;
end;
$$;
