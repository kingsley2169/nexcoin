-- 59_user_devices.sql
-- Trusted device/session records surfaced on /account/security.
-- Rows are soft-revoked so security activity retains history.

create table public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_name text not null,
  browser text not null,
  ip_address inet,
  location text not null default 'Unknown location',
  status public.user_device_status not null default 'trusted',
  device_fingerprint text,
  is_current boolean not null default false,
  last_active_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_devices_device_name_not_blank check (length(trim(device_name)) > 0),
  constraint user_devices_browser_not_blank check (length(trim(browser)) > 0),
  constraint user_devices_location_not_blank check (length(trim(location)) > 0),
  constraint user_devices_revoked_consistency check (
    (status = 'revoked') = (revoked_at is not null)
  )
);

create index user_devices_user_idx
on public.user_devices (user_id, last_active_at desc);

create index user_devices_status_idx
on public.user_devices (user_id, status, last_active_at desc);

create unique index user_devices_fingerprint_key
on public.user_devices (user_id, device_fingerprint)
where device_fingerprint is not null;

create unique index user_devices_current_key
on public.user_devices (user_id)
where is_current;

create trigger set_updated_at_user_devices
before update on public.user_devices
for each row execute function extensions.moddatetime(updated_at);

alter table public.user_devices enable row level security;

create policy "Users can read own devices"
on public.user_devices
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read user devices"
on public.user_devices
for select
to authenticated
using (public.is_admin());
