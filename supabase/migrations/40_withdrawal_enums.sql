-- 40_withdrawal_enums.sql
-- Enums for the Withdrawal Management page and the user crypto withdrawal flow.
-- Withdrawals use the same crypto assets supported by deposits in v1.

create type public.withdrawal_status as enum (
  'pending',
  'aml_review',
  'approved',
  'processing',
  'completed',
  'rejected'
);

create type public.withdrawal_check_status as enum (
  'passed',
  'warning',
  'failed'
);

create type public.withdrawal_address_status as enum (
  'active',
  'pending_confirmation',
  'disabled'
);

alter type public.admin_action_type add value if not exists 'withdrawal_request_created';
alter type public.admin_action_type add value if not exists 'withdrawal_status_changed';
alter type public.admin_action_type add value if not exists 'withdrawal_note_added';
alter type public.admin_action_type add value if not exists 'withdrawal_check_updated';
alter type public.admin_action_type add value if not exists 'withdrawal_destination_created';
alter type public.admin_action_type add value if not exists 'withdrawal_destination_updated';
