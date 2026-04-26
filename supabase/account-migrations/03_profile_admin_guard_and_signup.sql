-- 03_profile_admin_guard_and_signup.sql
-- Two changes in one file because they both touch existing functions:
--
--   1. Extend enforce_profiles_admin_only_columns so users cannot self-promote tier
--      and cannot mutate their own referral_code once generated.
--   2. Extend handle_new_user so every new signup immediately gets a referral_code.
--      Other new profile columns (first_name, last_name, address block, preferences)
--      keep their defaults or null and are filled in via update_my_profile.
--
-- Must run after 02_profile_extensions.sql so the referral_code / tier columns exist.

-- 1) Admin-only column guard --------------------------------------------------------

create or replace function public.enforce_profiles_admin_only_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.account_status is distinct from old.account_status
     and not public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Only admins may change account_status';
  end if;

  if new.tier is distinct from old.tier
     and not public.is_admin_with_role(array['owner', 'admin', 'compliance']::public.admin_role[]) then
    raise exception 'Only admins may change account tier';
  end if;

  if new.referral_code is distinct from old.referral_code
     and old.referral_code is not null
     and not public.is_admin_with_role(array['owner', 'admin']::public.admin_role[]) then
    raise exception 'referral_code is immutable once set';
  end if;

  return new;
end;
$$;

-- 2) Signup trigger -----------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    phone_number,
    country,
    referral_code,
    signup_ip,
    signup_user_agent,
    created_at,
    updated_at
  )
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    nullif(new.raw_user_meta_data->>'phone_number', ''),
    nullif(new.raw_user_meta_data->>'country', ''),
    public.generate_referral_code(),
    nullif(new.raw_user_meta_data->>'signup_ip', '')::inet,
    nullif(new.raw_user_meta_data->>'signup_user_agent', ''),
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do nothing;

  insert into public.user_compliance (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_balance_snapshots (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
