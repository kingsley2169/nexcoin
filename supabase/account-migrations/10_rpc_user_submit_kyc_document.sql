-- 10_rpc_user_submit_kyc_document.sql
-- User RPC: attaches (or replaces) the storage path for a single document kind
-- on the user's current KYC submission. Used by the per-document file inputs on
-- /account/verification to upload a replacement file without rebuilding the
-- whole submission payload. The initial submission still goes through
-- create_kyc_submission (admin migration 68), which requires all fields at once.
--
-- Allowed kinds:
--   'government_id_front', 'government_id_back', 'proof_of_address', 'selfie'
-- Allowed statuses: 'pending', 'needs_resubmission' — once a submission has
-- moved into review, the user can no longer swap files under the reviewer.

create or replace function public.user_submit_kyc_document(
  p_kind text,
  p_storage_path text
)
returns public.kyc_submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.kyc_submissions;
  v_path text := nullif(trim(p_storage_path), '');
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if v_path is null then
    raise exception 'Storage path is required';
  end if;

  if p_kind not in (
    'government_id_front',
    'government_id_back',
    'proof_of_address',
    'selfie'
  ) then
    raise exception 'Invalid document kind: %', p_kind;
  end if;

  select * into v_row
  from public.kyc_submissions
  where user_id = v_user
  order by created_at desc
  limit 1;

  if v_row.id is null then
    raise exception 'No KYC submission exists yet. Submit your KYC details first.';
  end if;

  if v_row.status not in ('pending', 'needs_resubmission') then
    raise exception 'Documents cannot be changed while submission is %', v_row.status;
  end if;

  update public.kyc_submissions
  set
    document_front_path   = case when p_kind = 'government_id_front' then v_path else document_front_path end,
    document_back_path    = case when p_kind = 'government_id_back'  then v_path else document_back_path end,
    proof_of_address_path = case when p_kind = 'proof_of_address'    then v_path else proof_of_address_path end,
    selfie_path           = case when p_kind = 'selfie'              then v_path else selfie_path end
  where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.user_submit_kyc_document(text, text) from public;
grant execute on function public.user_submit_kyc_document(text, text) to authenticated;
