-- 58_user_2fa_settings.sql
-- Per-user 2FA state for /account/security.

create table public.user_2fa_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default false,
  method public.user_2fa_method,
  recovery_email text,
  backup_codes_generated_at timestamptz,
  last_enabled_at timestamptz,
  last_disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_2fa_method_required_when_enabled check (
    not enabled or method is not null
  ),
  constraint user_2fa_recovery_email_not_blank check (
    recovery_email is null or length(trim(recovery_email)) > 0
  )
);

create trigger set_updated_at_user_2fa_settings
before update on public.user_2fa_settings
for each row execute function extensions.moddatetime(updated_at);

alter table public.user_2fa_settings enable row level security;

create policy "Users can read own 2fa settings"
on public.user_2fa_settings
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read user 2fa settings"
on public.user_2fa_settings
for select
to authenticated
using (public.is_admin());
