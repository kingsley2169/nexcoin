-- 01_account_preference_enums.sql
-- Enums used by the user-facing profile page (preferences + account tier).
-- Must commit before 02_profile_extensions.sql, which uses them as column types.

create type public.dashboard_density as enum (
  'comfortable',
  'compact'
);

create type public.display_currency as enum (
  'usd',
  'eur',
  'gbp',
  'ngn'
);

create type public.account_tier as enum (
  'beginner',
  'amateur',
  'advanced',
  'pro'
);
