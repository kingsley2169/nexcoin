-- 08_user_balance_snapshots.sql
-- Denormalized balance totals for fast admin/user dashboard reads.
-- For v1 the rows are created empty by the signup trigger and stay at zero until
-- the ledger, deposits, withdrawals, and investments tables are wired in.

create table public.user_balance_snapshots (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  available_balance_usd numeric(18, 2) not null default 0,
  locked_balance_usd numeric(18, 2) not null default 0,
  deposits_usd numeric(18, 2) not null default 0,
  withdrawals_usd numeric(18, 2) not null default 0,
  active_plans_count integer not null default 0,
  updated_at timestamptz not null default now(),

  constraint user_balance_snapshots_non_negative check (
    available_balance_usd >= 0
    and locked_balance_usd >= 0
    and deposits_usd >= 0
    and withdrawals_usd >= 0
    and active_plans_count >= 0
  )
);

create index user_balance_snapshots_available_balance_idx
on public.user_balance_snapshots (available_balance_usd desc);

create index user_balance_snapshots_deposits_idx
on public.user_balance_snapshots (deposits_usd desc);

create trigger set_updated_at_user_balance_snapshots
before update on public.user_balance_snapshots
for each row execute function extensions.moddatetime(updated_at);

-- RLS ----------------------------------------------------------------------

alter table public.user_balance_snapshots enable row level security;

create policy "Users can read own balance snapshot"
on public.user_balance_snapshots
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read balance snapshots"
on public.user_balance_snapshots
for select
to authenticated
using (public.is_admin());

create policy "Finance admins can update balance snapshots"
on public.user_balance_snapshots
for update
to authenticated
using (public.is_admin_with_role(array['owner', 'admin', 'finance']::public.admin_role[]))
with check (public.is_admin_with_role(array['owner', 'admin', 'finance']::public.admin_role[]));
