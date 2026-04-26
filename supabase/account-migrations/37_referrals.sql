-- 37_referrals.sql
-- Links a referring user to each referee they brought in. One row per
-- referee — a user can only have one referrer, so `referee_user_id` has
-- a unique index.
--
-- `status` progresses:
--   signed_up       -> (KYC approved)        -> verified
--   verified        -> (first investment)    -> active_investor
-- The `invited` enum value is reserved for future pre-signup invite rows
-- (when a referrer shares a link to someone without an account yet). v1
-- signups always start at `signed_up`.
--
-- Cached `amount_invested_usd` and `total_earnings_usd` let the referred-
-- users list render without aggregating every referral earning per row on
-- every page view. They are maintained by the user-facing RPCs and will be
-- kept in sync by future triggers as the referee goes through KYC / invests.

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referee_user_id uuid not null references public.profiles(id) on delete cascade,
  status public.referral_status not null default 'signed_up',
  joined_at timestamptz not null default now(),
  verified_at timestamptz,
  first_invested_at timestamptz,
  amount_invested_usd numeric(18, 2) not null default 0,
  total_earnings_usd numeric(18, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint referrals_referrer_not_self check (referrer_user_id <> referee_user_id),
  constraint referrals_amount_invested_non_negative check (amount_invested_usd >= 0),
  constraint referrals_total_earnings_non_negative check (total_earnings_usd >= 0),
  constraint referrals_verified_timestamp check (
    status not in ('verified', 'active_investor')
    or verified_at is not null
  ),
  constraint referrals_first_invested_timestamp check (
    status <> 'active_investor'
    or first_invested_at is not null
  )
);

create unique index referrals_referee_unique_idx
on public.referrals (referee_user_id);

create index referrals_referrer_idx
on public.referrals (referrer_user_id, joined_at desc);

create index referrals_status_idx
on public.referrals (status);

create trigger set_updated_at_referrals
before update on public.referrals
for each row execute function extensions.moddatetime(updated_at);

alter table public.referrals enable row level security;

create policy "Users can read own referral rows"
on public.referrals
for select
to authenticated
using (
  referrer_user_id = auth.uid()
  or referee_user_id = auth.uid()
);

create policy "Admins can read referrals"
on public.referrals
for select
to authenticated
using (public.is_admin());
