-- 17_investment_enums.sql
-- Enums for the Investment Plan Management page.
-- Extends admin_action_type with plan-specific actions so admin_audit_logs
-- can record plan changes uniformly with account actions.

create type public.plan_status as enum (
  'active',
  'paused',
  'draft',
  'archived'
);

create type public.plan_risk as enum (
  'conservative',
  'balanced',
  'high'
);

create type public.user_investment_status as enum (
  'active',
  'matured',
  'cancelled',
  'refunded'
);

-- Plan-specific action types added to the shared admin_action_type enum.
-- alter type add value must run outside a transaction that also uses the
-- new value, so these live in their own migration before any RPC references them.
alter type public.admin_action_type add value if not exists 'plan_created';
alter type public.admin_action_type add value if not exists 'plan_updated';
alter type public.admin_action_type add value if not exists 'plan_status_changed';
alter type public.admin_action_type add value if not exists 'plan_archived';
