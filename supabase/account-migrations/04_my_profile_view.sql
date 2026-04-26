-- 04_my_profile_view.sql
-- Single read model for /account/profile. Shape matches lib/profile.ts Profile type
-- (identity / address / preferences / identifiers / overview).
--
-- security_invoker = false so the view's own auth.uid() filter is authoritative;
-- the user does not need a direct select policy on user_compliance.

create or replace view public.my_profile_view
with (security_invoker = false)
as
select
  p.id,

  -- identity
  p.first_name,
  p.last_name,
  p.email,
  p.phone_number,
  p.country,
  p.timezone,
  p.language,
  p.date_of_birth,

  -- address
  p.address_street,
  p.address_city,
  p.address_state,
  p.address_postal_code,
  p.address_country,

  -- preferences
  p.display_currency,
  p.date_format,
  p.dashboard_density,

  -- identifiers
  p.username,
  p.referral_code,

  -- overview
  p.tier,
  p.created_at as member_since,
  upper(
    coalesce(substr(nullif(trim(p.first_name), ''), 1, 1), '')
    || coalesce(substr(nullif(trim(p.last_name), ''), 1, 1), '')
  ) as avatar_initials,
  case
    when uc.kyc_status = 'approved' then 'verified'
    when uc.kyc_status = 'pending' then 'pending'
    else 'unverified'
  end as verification_status

from public.profiles p
left join public.user_compliance uc on uc.user_id = p.id
where p.id = auth.uid();

grant select on public.my_profile_view to authenticated;
