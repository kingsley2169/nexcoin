-- 20_investment_plan_events.sql
-- Plan-specific audit trail. Every create / update / status-change / archive
-- writes one row here with a human-readable title, so the "Plan activity"
-- panel on the admin page can render recent events without joining jsonb
-- out of admin_audit_logs.
--
-- admin_audit_logs also receives a matching row (machine-readable old/new
-- values) — this table is the denormalized display-friendly cousin.

create table public.investment_plan_events (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.investment_plans(id) on delete set null,
  actor_admin_id uuid references public.admin_users(user_id),
  action_type public.admin_action_type not null,
  plan_name_snapshot text not null,
  title text not null,
  from_status public.plan_status,
  to_status public.plan_status,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index investment_plan_events_plan_idx on public.investment_plan_events (plan_id, created_at desc);
create index investment_plan_events_actor_idx on public.investment_plan_events (actor_admin_id, created_at desc);
create index investment_plan_events_created_at_idx on public.investment_plan_events (created_at desc);

-- RLS ----------------------------------------------------------------------

alter table public.investment_plan_events enable row level security;

create policy "Admins can read plan events"
on public.investment_plan_events
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert plan events"
on public.investment_plan_events
for insert
to authenticated
with check (public.is_admin());
