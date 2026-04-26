-- 03_profiles.sql
-- App profile per auth user. Created for every signup via the trigger in 11_signup_trigger.sql.
-- RLS and the enforce-admin-only-columns trigger live in 05_profiles_rls.sql because they
-- depend on the is_admin helpers defined in 04_admin_users.sql.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone_number text,
  country text,
  account_status public.account_status not null default 'active',
  signup_ip inet,
  signup_user_agent text,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_email_lowercase check (email = lower(email))
);

create unique index profiles_email_key on public.profiles (email);
create index profiles_account_status_idx on public.profiles (account_status);
create index profiles_created_at_idx on public.profiles (created_at desc);
create index profiles_last_active_at_idx on public.profiles (last_active_at desc);
create index profiles_country_idx on public.profiles (country);

create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function extensions.moddatetime(updated_at);
