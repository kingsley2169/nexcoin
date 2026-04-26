-- 64_kyc_submission_checks.sql
-- Per-submission review checklist (e.g. "Document readable", "Selfie matches
-- document", "Sanctions / PEP clear"). One row per (submission, label).

create table public.kyc_submission_checks (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.kyc_submissions(id) on delete cascade,
  label text not null,
  status public.kyc_check_status not null,
  details text,
  display_order integer not null default 0,
  updated_by uuid references public.admin_users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kyc_submission_checks_label_not_blank check (length(trim(label)) > 0)
);

create unique index kyc_submission_checks_label_key
on public.kyc_submission_checks (submission_id, lower(label));

create index kyc_submission_checks_submission_idx
on public.kyc_submission_checks (submission_id, display_order);

create trigger set_updated_at_kyc_submission_checks
before update on public.kyc_submission_checks
for each row execute function extensions.moddatetime(updated_at);

alter table public.kyc_submission_checks enable row level security;

create policy "Users can read own kyc submission checks"
on public.kyc_submission_checks
for select
to authenticated
using (
  exists (
    select 1
    from public.kyc_submissions s
    where s.id = kyc_submission_checks.submission_id
      and s.user_id = auth.uid()
  )
);

create policy "Admins can read kyc submission checks"
on public.kyc_submission_checks
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert kyc submission checks"
on public.kyc_submission_checks
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update kyc submission checks"
on public.kyc_submission_checks
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
