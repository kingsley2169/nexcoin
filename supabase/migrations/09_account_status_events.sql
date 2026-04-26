-- 09_account_status_events.sql
-- Audit trail for account_status changes (suspend, activate, flag, clear flag).
-- Written by the admin_update_account_status RPC (see 13_rpc_admin_update_account_status.sql).

create table public.account_status_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  previous_status public.account_status,
  new_status public.account_status not null,
  reason text,
  created_by uuid references public.admin_users(user_id),
  created_at timestamptz not null default now()
);

create index account_status_events_user_id_idx on public.account_status_events (user_id, created_at desc);
create index account_status_events_created_by_idx on public.account_status_events (created_by);

-- RLS ----------------------------------------------------------------------

alter table public.account_status_events enable row level security;

create policy "Users can read own account status events"
on public.account_status_events
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read account status events"
on public.account_status_events
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert account status events"
on public.account_status_events
for insert
to authenticated
with check (public.is_admin());
