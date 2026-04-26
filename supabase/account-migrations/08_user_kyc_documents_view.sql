-- 08_user_kyc_documents_view.sql
-- One row per required document kind (government_id, proof_of_address, selfie)
-- for the user's latest submission. The React component (account-verification.tsx)
-- iterates this list to render the "Required documents" card without extra logic.
--
-- status is derived from the storage-path column plus the submission's status,
-- so the UI gets a stable small vocabulary: not_uploaded / in_review / needs_update / approved.

create or replace view public.user_kyc_documents_view
with (security_invoker = false)
as
with latest as (
  select *
  from public.kyc_submissions
  where user_id = auth.uid()
  order by created_at desc
  limit 1
),
kinds(kind, title, description, display_order) as (
  values
    ('government_id',
     'Government ID',
     'Passport, national ID, or driver''s license. Front and back may be required.',
     1),
    ('proof_of_address',
     'Proof of address',
     'Recent utility bill, bank statement, or official address document.',
     2),
    ('selfie',
     'Selfie check',
     'A clear selfie used to match your submitted identity document.',
     3)
)
select
  auth.uid() as user_id,
  k.kind,
  k.title,
  k.description,
  k.display_order,
  case k.kind
    when 'government_id'     then l.document_front_path
    when 'proof_of_address'  then l.proof_of_address_path
    when 'selfie'            then l.selfie_path
  end as storage_path,
  case k.kind
    when 'government_id' then l.document_back_path
    else null
  end as secondary_storage_path,
  l.updated_at as last_updated_at,
  case
    when l.id is null then 'not_uploaded'
    when (case k.kind
            when 'government_id'    then l.document_front_path
            when 'proof_of_address' then l.proof_of_address_path
            when 'selfie'           then l.selfie_path
          end) is null then 'not_uploaded'
    when l.status = 'approved' then 'approved'
    when l.status in ('rejected', 'needs_resubmission') then 'needs_update'
    else 'in_review'
  end as status
from kinds k
left join latest l on true;

grant select on public.user_kyc_documents_view to authenticated;
