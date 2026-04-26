-- 15_rpc_admin_remove_user_tag.sql
-- RPC used by the Admin User Management page to detach a tag from a user.
-- Writes a 'tag_removed' entry to admin_audit_logs only if a row was actually deleted.

create or replace function public.admin_remove_user_tag(
  target_user_id uuid,
  tag_slug text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_tag_id uuid;
  deleted_count integer;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select id into selected_tag_id
  from public.tags
  where slug = tag_slug;

  if selected_tag_id is null then
    raise exception 'Tag not found';
  end if;

  delete from public.user_tags
  where user_id = target_user_id
    and tag_id = selected_tag_id;

  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    return;
  end if;

  insert into public.admin_audit_logs (
    actor_admin_id,
    target_user_id,
    action_type,
    entity_table,
    entity_id,
    old_values
  )
  values (
    auth.uid(),
    target_user_id,
    'tag_removed',
    'user_tags',
    selected_tag_id,
    jsonb_build_object('tag_slug', tag_slug)
  );
end;
$$;
