-- 47_notifications.sql
-- User notification inbox for /account/notifications.
--
-- Rows represent in-app/email/SMS-worthy events that belong to one user.
-- `channels` stores the actual delivery destinations enabled at creation time,
-- while user-level defaults live in notification_preferences (48).
--
-- `dedupe_key` is optional but important for trigger-based generators so a
-- repeated status update does not spam duplicate rows.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category public.notification_category not null,
  priority public.notification_priority not null default 'normal',
  title text not null,
  body text not null,
  channels public.notification_channel[] not null default array['in_app']::public.notification_channel[],
  action_href text,
  action_label text,
  is_read boolean not null default false,
  dedupe_key text,
  source_table text,
  source_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notifications_title_not_blank check (length(trim(title)) > 0),
  constraint notifications_body_not_blank check (length(trim(body)) > 0),
  constraint notifications_action_href_not_blank check (
    action_href is null or length(trim(action_href)) > 0
  ),
  constraint notifications_action_label_not_blank check (
    action_label is null or length(trim(action_label)) > 0
  ),
  constraint notifications_action_pair_consistency check (
    (action_href is null and action_label is null)
    or (action_href is not null and action_label is not null)
  ),
  constraint notifications_channels_non_empty check (
    coalesce(array_length(channels, 1), 0) > 0
  )
);

create index notifications_user_idx
on public.notifications (user_id, created_at desc);

create index notifications_user_read_idx
on public.notifications (user_id, is_read, created_at desc);

create index notifications_category_idx
on public.notifications (user_id, category, created_at desc);

create unique index notifications_user_dedupe_key_idx
on public.notifications (user_id, dedupe_key)
where dedupe_key is not null;

create trigger set_updated_at_notifications
before update on public.notifications
for each row execute function extensions.moddatetime(updated_at);

alter table public.notifications enable row level security;

create policy "Users can read own notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read notifications"
on public.notifications
for select
to authenticated
using (public.is_admin());
