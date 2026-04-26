-- 61_user_security_activity.sql
-- Recent sign-ins and sensitive account actions for /account/security.

create table public.user_security_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type public.security_activity_type not null,
  status public.security_activity_status not null default 'completed',
  title text not null,
  device_label text not null,
  location text not null default 'Nexcoin',
  source_device_id uuid references public.user_devices(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint user_security_activity_title_not_blank check (length(trim(title)) > 0),
  constraint user_security_activity_device_label_not_blank check (length(trim(device_label)) > 0),
  constraint user_security_activity_location_not_blank check (length(trim(location)) > 0)
);

create index user_security_activity_user_idx
on public.user_security_activity (user_id, created_at desc);

create index user_security_activity_type_idx
on public.user_security_activity (user_id, activity_type, created_at desc);

alter table public.user_security_activity enable row level security;

create policy "Users can read own security activity"
on public.user_security_activity
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read user security activity"
on public.user_security_activity
for select
to authenticated
using (public.is_admin());
