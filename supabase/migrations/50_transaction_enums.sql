-- 50_transaction_enums.sql
-- Enums for the Transaction Management page ledger view.
-- v1 scope: deposits and withdrawals are the only ledger sources. Later we can
-- extend `transaction_source_type` to cover investments, profits, fees,
-- referrals, and manual adjustments.
--
-- This file also extends `admin_action_type` with transaction actions. Keep
-- these enum additions in their own migration before RPCs reference them.

create type public.transaction_source_type as enum (
  'crypto_deposit',
  'crypto_withdrawal'
);

create type public.transaction_exception_severity as enum (
  'high',
  'medium',
  'low'
);

alter type public.admin_action_type add value if not exists 'transaction_reviewed';
alter type public.admin_action_type add value if not exists 'transaction_exception_logged';
alter type public.admin_action_type add value if not exists 'transaction_exception_resolved';
