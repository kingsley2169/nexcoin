-- 01_enums.sql
-- Enum types used across the app schema.
-- Must run before any table that references them.

create type public.account_status as enum (
  'active',
  'flagged',
  'suspended'
);

create type public.kyc_status as enum (
  'approved',
  'pending',
  'rejected',
  'unverified'
);

create type public.risk_level as enum (
  'low',
  'medium',
  'high'
);

create type public.admin_role as enum (
  'owner',
  'admin',
  'support',
  'compliance',
  'finance',
  'viewer'
);

create type public.admin_action_type as enum (
  'account_activated',
  'account_flagged',
  'account_suspended',
  'account_flag_cleared',
  'tag_assigned',
  'tag_removed',
  'kyc_status_changed',
  'risk_level_changed',
  'note_added'
);
