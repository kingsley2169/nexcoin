-- 18_investment_plans.sql
-- Catalog of investment plans managed from /nexcoin-admin-priv/investment-plans.
-- The table is the single source of truth for plan config (deposit range, rate,
-- duration, risk, status). Per-plan aggregates (active investors, invested
-- capital, profit credited) are computed from user_investments at read time.

create table public.investment_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  tag text,
  status public.plan_status not null default 'draft',
  risk public.plan_risk not null default 'balanced',
  min_deposit_usd numeric(18, 2) not null check (min_deposit_usd >= 0),
  max_deposit_usd numeric(18, 2) check (max_deposit_usd is null or max_deposit_usd >= min_deposit_usd),
  return_rate_percent numeric(6, 2) not null check (return_rate_percent >= 0 and return_rate_percent <= 1000),
  duration_hours integer not null check (duration_hours > 0),
  features text[] not null default array[]::text[],
  highlight boolean not null default false,
  display_order integer not null default 0,
  created_by uuid references public.admin_users(user_id),
  updated_by uuid references public.admin_users(user_id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index investment_plans_status_idx on public.investment_plans (status, display_order);
create index investment_plans_risk_idx on public.investment_plans (risk);
create index investment_plans_created_at_idx on public.investment_plans (created_at desc);

create trigger set_updated_at_investment_plans
before update on public.investment_plans
for each row execute function extensions.moddatetime(updated_at);

-- RLS ----------------------------------------------------------------------

alter table public.investment_plans enable row level security;

-- Public (anon + authenticated) can read plans that are currently active.
-- This feeds the marketing /plans page and the user dashboard subscribe page.
create policy "Anyone can read active plans"
on public.investment_plans
for select
to anon, authenticated
using (status = 'active');

-- Admins can read every plan regardless of status (including draft/paused/archived).
create policy "Admins can read all plans"
on public.investment_plans
for select
to authenticated
using (public.is_admin());

-- All writes go through security-definer RPCs. No direct insert/update/delete
-- policies are defined, so non-admin clients cannot mutate this table, and
-- even admins must call the RPCs (which enforce role checks and write audit
-- rows) rather than writing directly.
