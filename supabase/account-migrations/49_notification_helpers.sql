-- 49_notification_helpers.sql
-- Shared helper used by the trigger-based notification generators.
--
-- The helper:
--   - ensures preference rows exist
--   - expands preference booleans into the stored channel array
--   - skips insert when the user has disabled every delivery channel
--   - deduplicates rows by (user_id, dedupe_key)

create or replace function public.enqueue_notification(
  p_user_id uuid,
  p_category public.notification_category,
  p_title text,
  p_body text,
  p_priority public.notification_priority default 'normal',
  p_action_href text default null,
  p_action_label text default null,
  p_dedupe_key text default null,
  p_source_table text default null,
  p_source_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pref public.notification_preferences;
  v_channels public.notification_channel[] := array[]::public.notification_channel[];
  v_existing_id uuid;
  v_notification_id uuid;
begin
  if p_user_id is null then
    return null;
  end if;

  if p_title is null or length(trim(p_title)) = 0 then
    raise exception 'Notification title cannot be blank';
  end if;

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'Notification body cannot be blank';
  end if;

  perform public.seed_notification_preferences_for_user(p_user_id);

  select *
  into v_pref
  from public.notification_preferences
  where user_id = p_user_id
    and category = p_category;

  if v_pref.user_id is null then
    return null;
  end if;

  if v_pref.in_app_enabled then
    v_channels := array_append(v_channels, 'in_app'::public.notification_channel);
  end if;

  if v_pref.email_enabled then
    v_channels := array_append(v_channels, 'email'::public.notification_channel);
  end if;

  if v_pref.sms_enabled then
    v_channels := array_append(v_channels, 'sms'::public.notification_channel);
  end if;

  if coalesce(array_length(v_channels, 1), 0) = 0 then
    return null;
  end if;

  if p_dedupe_key is not null then
    select id
    into v_existing_id
    from public.notifications
    where user_id = p_user_id
      and dedupe_key = p_dedupe_key
    limit 1;

    if v_existing_id is not null then
      return v_existing_id;
    end if;
  end if;

  insert into public.notifications (
    user_id,
    category,
    priority,
    title,
    body,
    channels,
    action_href,
    action_label,
    dedupe_key,
    source_table,
    source_id
  )
  values (
    p_user_id,
    p_category,
    p_priority,
    trim(p_title),
    trim(p_body),
    v_channels,
    nullif(trim(p_action_href), ''),
    nullif(trim(p_action_label), ''),
    nullif(trim(p_dedupe_key), ''),
    nullif(trim(p_source_table), ''),
    p_source_id
  )
  returning id into v_notification_id;

  return v_notification_id;
end;
$$;

revoke all on function public.enqueue_notification(
  uuid,
  public.notification_category,
  text,
  text,
  public.notification_priority,
  text,
  text,
  text,
  text,
  uuid
) from public;
