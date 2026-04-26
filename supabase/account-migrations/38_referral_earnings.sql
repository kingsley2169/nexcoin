-- 38_referral_earnings.sql
-- One row per commission/bonus a referrer has (or will) earn. Individual
-- rows rather than a single rollup so the UI can show the granular Earnings
-- history card + so Phase 9 (Transactions) can UNION these into the ledger.
--
-- `reference` is a user-visible handle (`RE-3000`, `RE-3001`, …) generated
-- from the sequence created in 35. `source_reference` optionally pins the
-- underlying transaction (e.g. the `TX-####` of the referee's first
-- investment) so the link on the UI row resolves against the transactions
-- view.
--
-- Status transitions: every earning is created as `pending`. It flips to
-- `credited` either automatically (future payout worker) or via
-- `user_claim_pending_referral_earning` when payouts are claim-based.

create table public.referral_earnings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default (
    'RE-' || nextval('public.referral_earning_reference_seq')::text
  ),
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referee_user_id uuid not null references public.profiles(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete set null,
  earning_type public.referral_earning_type not null,
  amount_usd numeric(18, 2) not null check (amount_usd >= 0),
  status public.referral_earning_status not null default 'pending',
  source_reference text,
  created_at timestamptz not null default now(),
  credited_at timestamptz,
  updated_at timestamptz not null default now(),

  constraint referral_earnings_credited_timestamp check (
    status <> 'credited' or credited_at is not null
  ),
  constraint referral_earnings_not_self check (referrer_user_id <> referee_user_id)
);

create index referral_earnings_referrer_idx
on public.referral_earnings (referrer_user_id, created_at desc);

create index referral_earnings_referee_idx
on public.referral_earnings (referee_user_id, created_at desc);

create index referral_earnings_status_idx
on public.referral_earnings (status);

create trigger set_updated_at_referral_earnings
before update on public.referral_earnings
for each row execute function extensions.moddatetime(updated_at);

alter table public.referral_earnings enable row level security;

create policy "Users can read own referral earnings"
on public.referral_earnings
for select
to authenticated
using (referrer_user_id = auth.uid());

create policy "Admins can read referral earnings"
on public.referral_earnings
for select
to authenticated
using (public.is_admin());
