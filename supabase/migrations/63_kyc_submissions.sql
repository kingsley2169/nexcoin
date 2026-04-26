-- 63_kyc_submissions.sql
-- One row per user KYC submission. Users can have multiple submissions over
-- time (resubmissions after rejection or a resubmit request). The latest row
-- per user drives the KYC Review queue.
--
-- `current_limit_label` and `after_approval_limit_label` are pre-formatted
-- display strings snapshotted at submission time (e.g. "$2,000 daily
-- withdrawals"). v2 may replace these with numeric columns plus formatting
-- in the app layer.

create sequence if not exists public.kyc_submission_reference_seq
start with 2050
increment by 1;

create table public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reference text not null unique,
  document_type public.kyc_document_type not null,
  document_number text not null,
  document_expiry date not null,
  document_front_path text,
  document_back_path text,
  selfie_path text,
  proof_of_address_path text,
  document_quality public.kyc_document_quality not null default 'clear',
  date_of_birth date not null,
  address text not null,
  liveness_status public.kyc_check_status not null default 'review',
  proof_of_address_status public.kyc_check_status not null default 'review',
  status public.kyc_submission_status not null default 'pending',
  current_limit_label text not null,
  after_approval_limit_label text not null,
  reviewed_by uuid references public.admin_users(user_id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kyc_submissions_document_number_not_blank check (length(trim(document_number)) >= 4),
  constraint kyc_submissions_document_front_path_not_blank check (document_front_path is null or length(trim(document_front_path)) > 0),
  constraint kyc_submissions_document_back_path_not_blank check (document_back_path is null or length(trim(document_back_path)) > 0),
  constraint kyc_submissions_selfie_path_not_blank check (selfie_path is null or length(trim(selfie_path)) > 0),
  constraint kyc_submissions_proof_of_address_path_not_blank check (proof_of_address_path is null or length(trim(proof_of_address_path)) > 0),
  constraint kyc_submissions_address_not_blank check (length(trim(address)) > 0),
  constraint kyc_submissions_current_limit_not_blank check (length(trim(current_limit_label)) > 0),
  constraint kyc_submissions_after_approval_limit_not_blank check (length(trim(after_approval_limit_label)) > 0),
  constraint kyc_submissions_reviewed_timestamp check (
    (status in ('approved', 'rejected', 'needs_resubmission') and reviewed_at is not null)
    or status in ('pending', 'in_review')
  )
);

create index kyc_submissions_user_idx on public.kyc_submissions (user_id, created_at desc);
create index kyc_submissions_status_idx on public.kyc_submissions (status, created_at desc);
create index kyc_submissions_document_type_idx on public.kyc_submissions (document_type);
create index kyc_submissions_reviewed_by_idx on public.kyc_submissions (reviewed_by);
create index kyc_submissions_document_expiry_idx on public.kyc_submissions (document_expiry);

create trigger set_updated_at_kyc_submissions
before update on public.kyc_submissions
for each row execute function extensions.moddatetime(updated_at);

alter table public.kyc_submissions enable row level security;

create policy "Users can read own kyc submissions"
on public.kyc_submissions
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read all kyc submissions"
on public.kyc_submissions
for select
to authenticated
using (public.is_admin());
