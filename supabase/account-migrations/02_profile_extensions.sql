-- 02_profile_extensions.sql
-- Adds user-facing profile fields required by /account/profile:
--   identity:      first_name, last_name, date_of_birth, timezone, language
--   address:       address_street, address_city, address_state, address_postal_code, address_country
--   preferences:   display_currency, date_format, dashboard_density
--   identifiers:   username (unique), referral_code (unique, immutable after signup)
--   overview:      tier (admin-managed — protected in 03_profile_admin_guard.sql)
--
-- full_name is preserved for backward compatibility with existing admin views.
-- update_my_profile (05) keeps full_name in sync whenever first_name / last_name change.

alter table public.profiles
  add column first_name text,
  add column last_name text,
  add column date_of_birth date,
  add column timezone text,
  add column language text,
  add column address_street text,
  add column address_city text,
  add column address_state text,
  add column address_postal_code text,
  add column address_country text,
  add column username text,
  add column referral_code text,
  add column tier public.account_tier not null default 'beginner',
  add column display_currency public.display_currency not null default 'usd',
  add column date_format text not null default 'MM/DD/YYYY',
  add column dashboard_density public.dashboard_density not null default 'comfortable';

-- Normalisation / format constraints -------------------------------------------------

alter table public.profiles
  add constraint profiles_username_lowercase
    check (username is null or username = lower(username)),
  add constraint profiles_username_format
    check (username is null or username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  add constraint profiles_referral_code_format
    check (referral_code is null or referral_code ~ '^NEX-[A-Z0-9]{6}$'),
  add constraint profiles_date_format_allowed
    check (date_format in ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
  add constraint profiles_language_allowed
    check (
      language is null
      or language in ('English', 'French', 'German', 'Portuguese', 'Spanish')
    );

-- Uniqueness -------------------------------------------------------------------------

create unique index profiles_username_key
  on public.profiles (username)
  where username is not null;

create unique index profiles_referral_code_key
  on public.profiles (referral_code)
  where referral_code is not null;

create index profiles_tier_idx on public.profiles (tier);

-- Referral code generator ------------------------------------------------------------
-- Returns 'NEX-XXXXXX' where XXXXXX is 6 uppercase alphanumerics. Loops until unique.

create or replace function public.generate_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_attempts integer := 0;
begin
  loop
    v_code := 'NEX-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.profiles where referral_code = v_code);
    v_attempts := v_attempts + 1;
    if v_attempts > 10 then
      raise exception 'Could not generate unique referral code after 10 attempts';
    end if;
  end loop;
  return v_code;
end;
$$;

revoke all on function public.generate_referral_code() from public;

-- Backfill referral_code for any existing rows --------------------------------------

update public.profiles
set referral_code = public.generate_referral_code()
where referral_code is null;
