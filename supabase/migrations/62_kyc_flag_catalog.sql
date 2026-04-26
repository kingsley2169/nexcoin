-- 62_kyc_flag_catalog.sql
-- Catalog of compliance flag codes shown on the KYC Review sidebar.
-- Assignments live in kyc_submission_flags (file 65) with an optional
-- per-submission `detail` string; the catalog holds the canonical label.

create table public.kyc_flag_catalog (
  code text primary key,
  label text not null,
  description text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kyc_flag_catalog_code_not_blank check (length(trim(code)) > 0),
  constraint kyc_flag_catalog_label_not_blank check (length(trim(label)) > 0)
);

create trigger set_updated_at_kyc_flag_catalog
before update on public.kyc_flag_catalog
for each row execute function extensions.moddatetime(updated_at);

insert into public.kyc_flag_catalog (code, label, description, display_order) values
  ('name-mismatch', 'Name mismatch detected', 'Account name differs from uploaded document.', 1),
  ('blurry-upload', 'Blurry document upload', 'Document image quality requires follow-up.', 2),
  ('duplicate-document', 'Multiple accounts share document', 'Same document number on more than one profile.', 3),
  ('withdrawal-waiting', 'Withdrawal waiting on KYC', 'A withdrawal request is pending on this KYC review.', 4)
on conflict (code) do nothing;

alter table public.kyc_flag_catalog enable row level security;

create policy "Admins can read kyc flag catalog"
on public.kyc_flag_catalog
for select
to authenticated
using (public.is_admin());
