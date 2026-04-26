-- 60_user_security_settings.sql
-- User-controlled security toggles and password-related metadata for
-- /account/security.

create table public.user_security_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  require_2fa_for_withdrawals boolean not null default true,
  confirm_new_withdrawal_addresses boolean not null default true,
  withdrawal_cooldown_enabled boolean not null default true,
  withdrawal_cooldown_hours integer not null default 24,
  new_device_alerts boolean not null default true,
  password_last_changed_at timestamptz not null default now(),
  password_strength public.password_strength not null default 'strong',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_security_settings_cooldown_hours_positive check (
    withdrawal_cooldown_hours > 0 and withdrawal_cooldown_hours <= 168
  )
);

create trigger set_updated_at_user_security_settings
before update on public.user_security_settings
for each row execute function extensions.moddatetime(updated_at);

alter table public.user_security_settings enable row level security;

create policy "Users can read own security settings"
on public.user_security_settings
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read user security settings"
on public.user_security_settings
for select
to authenticated
using (public.is_admin());
