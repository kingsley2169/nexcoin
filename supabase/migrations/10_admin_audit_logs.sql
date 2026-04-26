-- 10_admin_audit_logs.sql
-- Generic admin action log, reusable across admin pages.
-- Written by RPCs whenever a sensitive admin action is performed.

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid references public.admin_users(user_id),
  target_user_id uuid references public.profiles(id),
  action_type public.admin_action_type not null,
  entity_table text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_actor_idx on public.admin_audit_logs (actor_admin_id, created_at desc);
create index admin_audit_logs_target_user_idx on public.admin_audit_logs (target_user_id, created_at desc);
create index admin_audit_logs_action_type_idx on public.admin_audit_logs (action_type);

-- RLS ----------------------------------------------------------------------

alter table public.admin_audit_logs enable row level security;

create policy "Admins can read audit logs"
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin_with_role(array['owner', 'admin', 'compliance']::public.admin_role[]));

create policy "Admins can insert audit logs"
on public.admin_audit_logs
for insert
to authenticated
with check (public.is_admin());
