-- 48_notification_preferences.sql
-- Per-user delivery preferences for the notifications inbox.
-- One row per user/category pair.
--
-- This file also seeds defaults for existing users and creates a profile
-- insert trigger so future signups automatically get a full preference set.

create table public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category public.notification_category not null,
  email_enabled boolean not null default false,
  in_app_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (user_id, category)
);

create index notification_preferences_category_idx
on public.notification_preferences (category, user_id);

create trigger set_updated_at_notification_preferences
before update on public.notification_preferences
for each row execute function extensions.moddatetime(updated_at);

alter table public.notification_preferences enable row level security;

create policy "Users can read own notification preferences"
on public.notification_preferences
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read notification preferences"
on public.notification_preferences
for select
to authenticated
using (public.is_admin());

create or replace function public.seed_notification_preferences_for_user(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.notification_preferences (
    user_id,
    category,
    email_enabled,
    in_app_enabled,
    sms_enabled
  )
  values
    (p_user_id, 'transaction', true, true, true),
    (p_user_id, 'investment', true, true, false),
    (p_user_id, 'security', true, true, true),
    (p_user_id, 'support', true, true, false),
    (p_user_id, 'account', false, true, false)
  on conflict (user_id, category) do nothing;
end;
$$;

revoke all on function public.seed_notification_preferences_for_user(uuid) from public;

create or replace function public.handle_new_profile_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_notification_preferences_for_user(new.id);
  return new;
end;
$$;

create trigger create_default_notification_preferences
after insert on public.profiles
for each row execute function public.handle_new_profile_notification_preferences();

select public.seed_notification_preferences_for_user(id)
from public.profiles;
