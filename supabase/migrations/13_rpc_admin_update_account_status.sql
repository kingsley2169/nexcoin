-- 13_rpc_admin_update_account_status.sql
-- RPC used by the Admin User Management page to suspend / activate / flag / clear-flag a user.
-- Checks admin role, updates profiles.account_status, writes to account_status_events,
-- and appends to admin_audit_logs. All in one transaction.

create or replace function public.admin_update_account_status(
  target_user_id uuid,
  new_status public.account_status,
  reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  old_profile public.profiles;
  updated_profile public.profiles;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select *
  into old_profile
  from public.profiles
  where id = target_user_id
  for update;

  if old_profile.id is null then
    raise exception 'User not found';
  end if;

  update public.profiles
  set account_status = new_status
  where id = target_user_id
  returning * into updated_profile;

  insert into public.account_status_events (
    user_id,
    previous_status,
    new_status,
    reason,
    created_by
  )
  values (
    target_user_id,
    old_profile.account_status,
    new_status,
    reason,
    auth.uid()
  );

  insert into public.admin_audit_logs (
    actor_admin_id,
    target_user_id,
    action_type,
    entity_table,
    entity_id,
    old_values,
    new_values
  )
  values (
    auth.uid(),
    target_user_id,
    case
      when new_status = 'active' and old_profile.account_status = 'flagged' then 'account_flag_cleared'::public.admin_action_type
      when new_status = 'active' then 'account_activated'::public.admin_action_type
      when new_status = 'flagged' then 'account_flagged'::public.admin_action_type
      when new_status = 'suspended' then 'account_suspended'::public.admin_action_type
      else 'account_activated'::public.admin_action_type
    end,
    'profiles',
    target_user_id,
    jsonb_build_object('account_status', old_profile.account_status),
    jsonb_build_object('account_status', new_status, 'reason', reason)
  );

  return updated_profile;
end;
$$;
