-- 65_kyc_submission_flags.sql
-- Flag assignments per KYC submission. Joins to kyc_flag_catalog for the
-- canonical label. Optional `detail` holds per-submission free-form text
-- shown on the review queue card; otherwise the catalog label is used.

create table public.kyc_submission_flags (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.kyc_submissions(id) on delete cascade,
  flag_code text not null references public.kyc_flag_catalog(code) on delete restrict,
  detail text,
  assigned_by uuid references public.admin_users(user_id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index kyc_submission_flags_unique
on public.kyc_submission_flags (submission_id, flag_code);

create index kyc_submission_flags_code_idx
on public.kyc_submission_flags (flag_code);

alter table public.kyc_submission_flags enable row level security;

create policy "Users can read own kyc submission flags"
on public.kyc_submission_flags
for select
to authenticated
using (
  exists (
    select 1
    from public.kyc_submissions s
    where s.id = kyc_submission_flags.submission_id
      and s.user_id = auth.uid()
  )
);

create policy "Admins can read kyc submission flags"
on public.kyc_submission_flags
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert kyc submission flags"
on public.kyc_submission_flags
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update kyc submission flags"
on public.kyc_submission_flags
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete kyc submission flags"
on public.kyc_submission_flags
for delete
to authenticated
using (public.is_admin());
