-- 72_rpc_admin_set_kyc_submission_flag.sql
-- Admin RPC: assign or remove a compliance flag on a KYC submission.
--   assigned = true   -> upsert the flag (refreshes `detail` if provided)
--   assigned = false  -> remove the flag (returns null if not assigned)
-- Idempotent in both directions.

create or replace function public.admin_set_kyc_submission_flag(
  submission_id uuid,
  flag_code text,
  assigned boolean,
  detail text default null
)
returns public.kyc_submission_flags
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_submission public.kyc_submissions;
  catalog_row public.kyc_flag_catalog;
  upserted_flag public.kyc_submission_flags;
  removed_flag public.kyc_submission_flags;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'compliance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select *
  into selected_submission
  from public.kyc_submissions
  where id = submission_id;

  if selected_submission.id is null then
    raise exception 'KYC submission not found';
  end if;

  select *
  into catalog_row
  from public.kyc_flag_catalog
  where code = flag_code;

  if catalog_row.code is null then
    raise exception 'Unknown flag code: %', flag_code;
  end if;

  if assigned then
    insert into public.kyc_submission_flags (
      submission_id,
      flag_code,
      detail,
      assigned_by
    )
    values (
      submission_id,
      flag_code,
      nullif(trim(detail), ''),
      auth.uid()
    )
    on conflict (submission_id, flag_code) do update
    set
      detail = excluded.detail,
      assigned_by = excluded.assigned_by
    returning * into upserted_flag;

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
      'kyc_submission_flag_assigned',
      'Flag assigned: ' || catalog_row.label,
      jsonb_build_object('code', flag_code, 'detail', upserted_flag.detail)
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
      'kyc_submission_flag_assigned',
      'kyc_submission_flags',
      upserted_flag.id,
      jsonb_build_object('submissionId', submission_id, 'code', flag_code)
    );

    return upserted_flag;
  else
    delete from public.kyc_submission_flags
    where submission_id = admin_set_kyc_submission_flag.submission_id
      and flag_code = admin_set_kyc_submission_flag.flag_code
    returning * into removed_flag;

    if removed_flag.id is null then
      return null;
    end if;

    insert into public.kyc_submission_events (
      submission_id,
      actor_admin_id,
      action_type,
      title,
      old_values
    )
    values (
      submission_id,
      auth.uid(),
      'kyc_submission_flag_removed',
      'Flag removed: ' || catalog_row.label,
      jsonb_build_object('code', flag_code)
    );

    insert into public.admin_audit_logs (
      actor_admin_id,
      target_user_id,
      action_type,
      entity_table,
      entity_id,
      old_values
    )
    values (
      auth.uid(),
      selected_submission.user_id,
      'kyc_submission_flag_removed',
      'kyc_submission_flags',
      removed_flag.id,
      jsonb_build_object('submissionId', submission_id, 'code', flag_code)
    );

    return removed_flag;
  end if;
end;
$$;
