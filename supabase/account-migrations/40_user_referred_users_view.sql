-- 40_user_referred_users_view.sql
-- Feeds the "Referred users" table on /account/referrals. One row per
-- referral the caller owns, with privacy-preserving masked identity fields
-- so the referrer never sees full PII of people they introduced.
--
-- Masking rules:
--   masked_name  — "First L." (first name + last initial). Falls back to the
--                  first two whitespace-separated tokens of `full_name`, or
--                  the literal string "User" if nothing is known.
--   masked_email — keeps the first two chars, replaces chars 3-4 with **,
--                  keeps everything from position 5 onward. Matches the
--                  `pr**ya.s@gmail.com` shape used in the UI mock.
--
-- `display_status` converts the lowercase enum into the capitalised label
-- the UI renders directly (avoids duplicating the mapping in every consumer).

create or replace view public.user_referred_users_view
with (security_invoker = true)
as
select
  r.id,
  r.referrer_user_id,
  r.referee_user_id,
  case
    when p.first_name is not null and p.last_name is not null then
      p.first_name || ' ' || substr(p.last_name, 1, 1) || '.'
    when p.full_name is not null then
      regexp_replace(p.full_name, '^(\S+)\s+(\S).*$', '\1 \2.')
    when p.first_name is not null then
      p.first_name
    else 'User'
  end as masked_name,
  case
    when p.email is null then ''
    when position('@' in p.email) = 0 then p.email
    when length(p.email) <= 4 then p.email
    else substr(p.email, 1, 2) || '**' || substr(p.email, 5)
  end as masked_email,
  r.status,
  case r.status
    when 'active_investor' then 'Active investor'
    when 'invited' then 'Invited'
    when 'signed_up' then 'Signed up'
    when 'verified' then 'Verified'
  end as display_status,
  r.amount_invested_usd,
  r.total_earnings_usd as earnings_usd,
  r.joined_at,
  r.verified_at,
  r.first_invested_at
from public.referrals r
left join public.profiles p on p.id = r.referee_user_id
where r.referrer_user_id = auth.uid()
order by r.joined_at desc;

grant select on public.user_referred_users_view to authenticated;
