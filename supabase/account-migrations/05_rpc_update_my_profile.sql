-- 05_rpc_update_my_profile.sql
-- User-facing RPC for /account/profile. Allows the caller to update their own
-- profile fields without giving the client direct write access to `profiles`.
--
-- Locked fields (NOT updatable through this RPC):
--   - email
--   - tier
--   - referral_code
--   - account_status
--
-- All parameters are nullable; passing null leaves the existing value alone.
-- Empty strings are treated the same as null so the caller can clear an
-- optional field by passing an empty string when desired (e.g. clearing
-- address fields). full_name is kept in sync with first_name/last_name.

-- Drop any prior version with a different parameter order so PostgREST has a
-- single unambiguous overload to dispatch named-argument calls against.
drop function if exists public.update_my_profile(
  text, text, date, text, text, text, text, text,
  text, text, text, text, text,
  public.display_currency, text, public.dashboard_density
);

create or replace function public.update_my_profile(
  p_first_name text default null,
  p_last_name text default null,
  p_phone_number text default null,
  p_country text default null,
  p_timezone text default null,
  p_language text default null,
  p_date_of_birth date default null,
  p_address_street text default null,
  p_address_city text default null,
  p_address_state text default null,
  p_address_postal_code text default null,
  p_address_country text default null,
  p_username text default null,
  p_display_currency public.display_currency default null,
  p_date_format text default null,
  p_dashboard_density public.dashboard_density default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_existing public.profiles;
  v_updated public.profiles;
  v_new_first text;
  v_new_last text;
  v_new_full text;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_existing
  from public.profiles
  where id = v_user
  for update;

  if v_existing.id is null then
    raise exception 'Profile not found';
  end if;

  v_new_first := coalesce(nullif(trim(p_first_name), ''), v_existing.first_name);
  v_new_last := coalesce(nullif(trim(p_last_name), ''), v_existing.last_name);

  v_new_full := nullif(
    trim(coalesce(v_new_first, '') || ' ' || coalesce(v_new_last, '')),
    ''
  );

  update public.profiles
  set
    first_name = v_new_first,
    last_name = v_new_last,
    full_name = coalesce(v_new_full, full_name),
    phone_number = coalesce(nullif(trim(p_phone_number), ''), phone_number),
    country = coalesce(nullif(trim(p_country), ''), country),
    timezone = coalesce(nullif(trim(p_timezone), ''), timezone),
    language = coalesce(nullif(trim(p_language), ''), language),
    date_of_birth = coalesce(p_date_of_birth, date_of_birth),
    address_street = coalesce(nullif(trim(p_address_street), ''), address_street),
    address_city = coalesce(nullif(trim(p_address_city), ''), address_city),
    address_state = coalesce(nullif(trim(p_address_state), ''), address_state),
    address_postal_code = coalesce(
      nullif(trim(p_address_postal_code), ''),
      address_postal_code
    ),
    address_country = coalesce(
      nullif(trim(p_address_country), ''),
      address_country
    ),
    username = coalesce(
      nullif(lower(trim(p_username)), ''),
      username
    ),
    display_currency = coalesce(p_display_currency, display_currency),
    date_format = coalesce(p_date_format, date_format),
    dashboard_density = coalesce(p_dashboard_density, dashboard_density)
  where id = v_user
  returning * into v_updated;

  return v_updated;
end;
$$;

revoke all on function public.update_my_profile(
  text, text, text, text, text, text, date,
  text, text, text, text, text,
  text,
  public.display_currency, text, public.dashboard_density
) from public;
grant execute on function public.update_my_profile(
  text, text, text, text, text, text, date,
  text, text, text, text, text,
  text,
  public.display_currency, text, public.dashboard_density
) to authenticated;
