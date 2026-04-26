-- 70_rpc_admin_add_kyc_submission_note.sql
-- Admin RPC for internal KYC review notes. Writes a timeline event and
-- audit log alongside the note row.

create or replace function public.admin_add_kyc_submission_note(
  submission_id uuid,
  note text
)
returns public.kyc_submission_internal_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_submission public.kyc_submissions;
  inserted_note public.kyc_submission_internal_notes;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if length(trim(note)) = 0 then
    raise exception 'Note cannot be blank';
  end if;

  select *
  into selected_submission
  from public.kyc_submissions
  where id = submission_id;

  if selected_submission.id is null then
    raise exception 'KYC submission not found';
  end if;

  insert into public.kyc_submission_internal_notes (
    submission_id,
    admin_id,
    note
  )
  values (
    submission_id,
    auth.uid(),
    trim(note)
  )
  returning * into inserted_note;

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
    'kyc_submission_note_added',
    'Internal note added',
    jsonb_build_object('noteId', inserted_note.id)
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
    'kyc_submission_note_added',
    'kyc_submission_internal_notes',
    inserted_note.id,
    jsonb_build_object('submissionId', submission_id)
  );

  return inserted_note;
end;
$$;
