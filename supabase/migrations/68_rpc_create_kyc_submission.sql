-- 68_rpc_create_kyc_submission.sql
-- User RPC: creates a new KYC submission with an auto-generated KYC- reference
-- and sets user_compliance.kyc_status = 'pending' (creating the compliance
-- row if missing). It also creates starter checklist rows for the admin
-- review modal. The initial "KYC submitted" timeline event is emitted here.

create or replace function public.create_kyc_submission(
  document_type public.kyc_document_type,
  document_number text,
  document_expiry date,
  document_quality public.kyc_document_quality,
  date_of_birth date,
  address text,
  current_limit_label text,
  after_approval_limit_label text,
  document_front_path text default null,
  document_back_path text default null,
  selfie_path text default null,
  proof_of_address_path text default null
)
returns public.kyc_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_submission public.kyc_submissions;
  seq_value bigint;
begin
  if auth.uid() is null then
    raise exception 'Not authorized';
  end if;

  if exists (
    select 1
    from public.kyc_submissions
    where user_id = auth.uid()
      and status in ('pending', 'in_review')
  ) then
    raise exception 'A KYC submission is already under review';
  end if;

  if length(trim(document_number)) < 4 then
    raise exception 'Document number must be at least 4 characters';
  end if;

  if length(trim(address)) = 0 then
    raise exception 'Address cannot be blank';
  end if;

  if document_expiry < current_date then
    raise exception 'Document is already expired';
  end if;

  if date_of_birth > current_date - interval '18 years' then
    raise exception 'User must be at least 18 years old for KYC';
  end if;

  seq_value := nextval('public.kyc_submission_reference_seq');

  insert into public.kyc_submissions (
    user_id,
    reference,
    document_type,
    document_number,
    document_expiry,
    document_front_path,
    document_back_path,
    selfie_path,
    proof_of_address_path,
    document_quality,
    date_of_birth,
    address,
    current_limit_label,
    after_approval_limit_label
  )
  values (
    auth.uid(),
    'KYC-' || seq_value::text,
    document_type,
    trim(document_number),
    document_expiry,
    nullif(trim(document_front_path), ''),
    nullif(trim(document_back_path), ''),
    nullif(trim(selfie_path), ''),
    nullif(trim(proof_of_address_path), ''),
    document_quality,
    date_of_birth,
    trim(address),
    trim(current_limit_label),
    trim(after_approval_limit_label)
  )
  returning * into inserted_submission;

  insert into public.kyc_submission_checks (
    submission_id,
    label,
    status,
    display_order
  )
  values
    (
      inserted_submission.id,
      'Document readable',
      case
        when document_quality = 'clear' then 'passed'::public.kyc_check_status
        when document_quality = 'poor' then 'failed'::public.kyc_check_status
        else 'review'::public.kyc_check_status
      end,
      1
    ),
    (inserted_submission.id, 'Name matches account', 'review', 2),
    (inserted_submission.id, 'Date of birth valid', 'passed', 3),
    (inserted_submission.id, 'Document not expired', 'passed', 4),
    (inserted_submission.id, 'Selfie matches document', 'review', 5),
    (inserted_submission.id, 'Sanctions / PEP clear', 'review', 6);

  insert into public.user_compliance (user_id, kyc_status)
  values (auth.uid(), 'pending')
  on conflict (user_id) do update
    set
      kyc_status = 'pending'::public.kyc_status,
      reviewed_by = null,
      reviewed_at = null;

  insert into public.kyc_submission_events (
    submission_id,
    actor_user_id,
    action_type,
    title,
    to_status,
    new_values
  )
  values (
    inserted_submission.id,
    auth.uid(),
    'kyc_submission_created',
    'KYC submitted',
    inserted_submission.status,
    jsonb_build_object(
      'reference', inserted_submission.reference,
      'documentType', inserted_submission.document_type
    )
  );

  return inserted_submission;
end;
$$;

grant execute on function public.create_kyc_submission(
  public.kyc_document_type,
  text,
  date,
  public.kyc_document_quality,
  date,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;
