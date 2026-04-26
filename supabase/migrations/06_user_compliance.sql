-- 06_user_compliance.sql
-- KYC state, risk, and limits. Source of truth for the KYC Review page.
-- Users do NOT read this table directly. They read my_compliance_summary (below),
-- which exposes only a safe subset of columns.

create table public.user_compliance (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  kyc_status public.kyc_status not null default 'unverified',
  risk_level public.risk_level not null default 'low',
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  withdrawal_limit_usd numeric(18, 2) not null default 0,
  deposit_limit_usd numeric(18, 2),
  flagged_reason text,
  reviewed_by uuid references public.admin_users(user_id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_compliance_kyc_status_idx on public.user_compliance (kyc_status);
create index user_compliance_risk_level_idx on public.user_compliance (risk_level);
create index user_compliance_reviewed_by_idx on public.user_compliance (reviewed_by);

create trigger set_updated_at_user_compliance
before update on public.user_compliance
for each row execute function extensions.moddatetime(updated_at);

-- User-facing safe view ----------------------------------------------------
-- security_invoker = false so the view's own filter (user_id = auth.uid()) is authoritative;
-- the underlying table has no user-side RLS read policy.

create or replace view public.my_compliance_summary
with (security_invoker = false)
as
select
  user_id,
  kyc_status,
  withdrawal_limit_usd,
  deposit_limit_usd,
  updated_at
from public.user_compliance
where user_id = auth.uid();

grant select on public.my_compliance_summary to authenticated;

-- RLS ----------------------------------------------------------------------

alter table public.user_compliance enable row level security;

create policy "Admins can read compliance"
on public.user_compliance
for select
to authenticated
using (public.is_admin());

create policy "Compliance admins can update compliance"
on public.user_compliance
for update
to authenticated
using (public.is_admin_with_role(array['owner', 'admin', 'compliance']::public.admin_role[]))
with check (public.is_admin_with_role(array['owner', 'admin', 'compliance']::public.admin_role[]));
