-- 26_user_investment_event_extensions.sql
-- Phase 6 needs user-originated investment events to be recorded in the shared
-- investment_plan_events table. The original admin-side design only tracked an
-- admin actor and admin plan lifecycle actions, so this file extends that
-- shared structure before any user RPC references the new action types.

alter type public.admin_action_type add value if not exists 'plan_subscription_created';
alter type public.admin_action_type add value if not exists 'plan_subscription_cancelled';

alter table public.investment_plan_events
add column if not exists actor_user_id uuid references public.profiles(id) on delete set null;

create index if not exists investment_plan_events_actor_user_idx
on public.investment_plan_events (actor_user_id, created_at desc);
