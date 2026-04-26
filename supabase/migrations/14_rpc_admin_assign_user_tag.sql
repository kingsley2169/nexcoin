-- 14_rpc_admin_assign_user_tag.sql
-- RPC used by the Admin User Management page to attach a tag to a user.
-- Upserts user_tags and writes a 'tag_assigned' entry to admin_audit_logs.

create or replace function public.admin_assign_user_tag(
  target_user_id uuid,
  tag_slug text,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_tag_id uuid;
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

  insert into public.user_tags (user_id, tag_id, assigned_by, note)
  values (target_user_id, selected_tag_id, auth.uid(), note)
  on conflict (user_id, tag_id) do update
  set
    assigned_by = excluded.assigned_by,
    note = excluded.note,
    created_at = now();

  insert into public.admin_audit_logs (
    actor_admin_id,
    target_user_id,
    action_type,
    entity_table,
    entity_id,
    new_values
  )
  values (
    auth.uid(),
    target_user_id,
    'tag_assigned',
    'user_tags',
    selected_tag_id,
    jsonb_build_object('tag_slug', tag_slug, 'note', note)
  );
end;
$$;
