-- 41_user_referral_earnings_view.sql
-- Earnings history card on /account/referrals. One row per
-- `referral_earnings` record the caller owns, joined to the referee's
-- profile so each row can display a masked source name.
--
-- `transaction_reference` is what the UI links to on the Transactions page:
-- if the earning has a `source_reference` (the underlying TX-#### of the
-- referee's investment or deposit) we prefer it; otherwise we fall back to
-- the earning's own `RE-####` reference so there is always something to
-- open.

create or replace view public.user_referral_earnings_view
with (security_invoker = true)
as
select
  e.id,
  e.reference,
  e.referrer_user_id,
  e.referee_user_id,
  e.earning_type,
  case e.earning_type
    when 'signup_bonus' then 'Signup bonus'
    when 'investment_commission' then 'Investment commission'
    when 'profit_share' then 'Profit share'
  end as type_label,
  e.amount_usd,
  e.status,
  case e.status
    when 'credited' then 'Credited'
    when 'pending' then 'Pending'
  end as status_label,
  coalesce(e.source_reference, e.reference) as transaction_reference,
  case
    when p.first_name is not null and p.last_name is not null then
      lower(p.first_name) || '.' || lower(substr(p.last_name, 1, 1))
    when p.first_name is not null then
      lower(p.first_name)
    when p.full_name is not null then
      lower(regexp_replace(p.full_name, '^(\S+)\s+(\S).*$', '\1.\2'))
    else 'friend'
  end as source_masked_name,
  e.created_at,
  e.credited_at
from public.referral_earnings e
left join public.profiles p on p.id = e.referee_user_id
where e.referrer_user_id = auth.uid()
order by e.created_at desc;

grant select on public.user_referral_earnings_view to authenticated;
