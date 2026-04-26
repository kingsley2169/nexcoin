-- 19_user_investments.sql
-- A user's subscription to an investment plan. One row per active/past
-- investment cycle. The admin Investment Plan Management page reads
-- aggregates from this table (active investors, total invested, profit
-- credited, maturing today).
--
-- v1 note: no ledger wiring yet. This table may stay empty until the
-- Subscribe / Deposit flows are built, at which point subscribe actions
-- will insert a row here and profit crediting will update profit_credited_usd.

create table public.user_investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.investment_plans(id) on delete restrict,
  amount_usd numeric(18, 2) not null check (amount_usd > 0),
  projected_profit_usd numeric(18, 2) not null check (projected_profit_usd >= 0),
  profit_credited_usd numeric(18, 2) not null default 0 check (profit_credited_usd >= 0),
  status public.user_investment_status not null default 'active',
  start_at timestamptz not null default now(),
  end_at timestamptz not null,
  cancelled_at timestamptz,
  cancel_reason text,
  matured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_investments_duration_ck check (end_at > start_at),
  constraint user_investments_cancel_consistency_ck check (
    (status = 'cancelled') = (cancelled_at is not null)
  )
);

create index user_investments_user_idx on public.user_investments (user_id, created_at desc);
create index user_investments_plan_idx on public.user_investments (plan_id, status);
create index user_investments_status_idx on public.user_investments (status);
create index user_investments_end_at_idx on public.user_investments (end_at);
create index user_investments_active_idx
  on public.user_investments (plan_id)
  where status = 'active';

create trigger set_updated_at_user_investments
before update on public.user_investments
for each row execute function extensions.moddatetime(updated_at);

-- RLS ----------------------------------------------------------------------

alter table public.user_investments enable row level security;

create policy "Users can read own investments"
on public.user_investments
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read all investments"
on public.user_investments
for select
to authenticated
using (public.is_admin());

-- No direct write policies. Inserts/updates happen through the future
-- subscribe / profit-crediting RPCs and back-office tooling (which will run
-- as security definer). The admin Investment Plan Management page does not
-- write to this table.
