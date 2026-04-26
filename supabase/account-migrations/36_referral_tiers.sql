-- 36_referral_tiers.sql
-- Catalogue of referral tiers shown on /account/referrals "Commission tiers".
-- Seeded with the three tiers in `lib/referrals.ts` so the UI has stable
-- content from day one. Tier id stays as a short text key (`tier-1`, `tier-2`,
-- `tier-3`) so the React layer can use the same identifier it already does.
--
-- Tier selection is derived: on every read of `user_referral_summary_view`
-- we pick the tier with the highest `min_active_referrals` that the user
-- still qualifies for. Keeping the starter row at `min_active_referrals = 0`
-- guarantees a match for every user, including brand-new ones.
--
-- Readable by every authenticated user; writes are admin-only via SECURITY
-- DEFINER RPCs — no public write policy is created here.

create table public.referral_tiers (
  id text primary key,
  name text not null,
  min_active_referrals integer not null default 0,
  commission_percent numeric(6, 2) not null default 0,
  perks text[] not null default array[]::text[],
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint referral_tiers_name_not_blank check (length(trim(name)) > 0),
  constraint referral_tiers_min_active_non_negative check (min_active_referrals >= 0),
  constraint referral_tiers_commission_non_negative check (commission_percent >= 0),
  constraint referral_tiers_commission_reasonable check (commission_percent <= 100)
);

create index referral_tiers_min_active_idx
on public.referral_tiers (min_active_referrals);

create trigger set_updated_at_referral_tiers
before update on public.referral_tiers
for each row execute function extensions.moddatetime(updated_at);

insert into public.referral_tiers (
  id, name, min_active_referrals, commission_percent, perks, display_order
) values
  (
    'tier-1', 'Starter', 0, 5,
    array[
      '5% commission on referred deposits',
      '$25 signup bonus per verified referral'
    ],
    1
  ),
  (
    'tier-2', 'Tier 2', 3, 12,
    array[
      '12% commission on referred investments',
      '$50 signup bonus per verified referral',
      '2% profit share on active referrals'
    ],
    2
  ),
  (
    'tier-3', 'Pioneer', 15, 20,
    array[
      '20% commission on referred investments',
      '$100 signup bonus per verified referral',
      '5% profit share on active referrals',
      'Early access to new investment plans'
    ],
    3
  )
on conflict (id) do nothing;

alter table public.referral_tiers enable row level security;

create policy "Authenticated users can read referral tiers"
on public.referral_tiers
for select
to authenticated
using (true);
