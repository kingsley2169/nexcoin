-- 39_user_referral_summary_view.sql
-- Overview row for /account/referrals — one row per authenticated user.
-- Powers the header badge, share card, stats row, and the tier progress bar.
--
-- `referral_link` is constructed from the caller's referral_code with a
-- hardcoded base. If the landing domain ever changes, the only change is
-- here. The suffix after `NEX-` is lowercased because the marketing URLs
-- in `lib/referrals.ts` use that shape (`?ref=alex2169`).
--
-- Tier selection is the highest tier whose `min_active_referrals` is less
-- than or equal to the caller's active referral count. The starter tier at
-- 0 guarantees a match; if the user is already at the top tier, `next_tier_*`
-- columns are null and the UI hides the progress bar.

create or replace view public.user_referral_summary_view
with (security_invoker = true)
as
with me as (
  select id, referral_code
  from public.profiles
  where id = auth.uid()
),
counts as (
  select
    count(*) filter (where true)::integer as total_referred,
    count(*) filter (where status = 'active_investor')::integer as active_investors,
    count(*) filter (where status = 'verified')::integer as verified_count,
    count(*) filter (where status = 'signed_up')::integer as signed_up_count
  from public.referrals
  where referrer_user_id = auth.uid()
),
earnings_totals as (
  select
    coalesce(sum(amount_usd) filter (where status = 'credited'), 0)::numeric(18, 2) as total_earned_usd,
    coalesce(sum(amount_usd) filter (where status = 'pending'), 0)::numeric(18, 2) as pending_usd
  from public.referral_earnings
  where referrer_user_id = auth.uid()
),
current_tier as (
  select t.*
  from public.referral_tiers t, counts c
  where t.min_active_referrals <= c.active_investors
  order by t.min_active_referrals desc
  limit 1
),
next_tier as (
  select t.*
  from public.referral_tiers t, counts c
  where t.min_active_referrals > c.active_investors
  order by t.min_active_referrals asc
  limit 1
)
select
  me.id as user_id,
  me.referral_code,
  'https://nexcoin.com/signup?ref='
    || lower(coalesce(split_part(me.referral_code, '-', 2), '')) as referral_link,
  ct.id as current_tier_id,
  ct.name as current_tier_name,
  ct.commission_percent as current_tier_commission_percent,
  ct.perks as current_tier_perks,
  nt.id as next_tier_id,
  nt.name as next_tier_name,
  nt.min_active_referrals as next_tier_target,
  c.active_investors as next_tier_current,
  c.total_referred,
  c.active_investors as active_investors_count,
  c.verified_count,
  c.signed_up_count,
  et.total_earned_usd,
  et.pending_usd,
  '/legal#referrals'::text as program_terms_url
from me
cross join counts c
cross join earnings_totals et
left join current_tier ct on true
left join next_tier nt on true;

grant select on public.user_referral_summary_view to authenticated;
