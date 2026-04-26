-- 28_deposit_enums.sql
-- Enums for the Deposit Management page and the user crypto deposit flow.
-- Deposits are crypto-only: BTC, ETH, and USDT.
--
-- This file also extends admin_action_type with deposit/wallet actions. Keep
-- these enum additions in their own migration before RPCs reference them.

create type public.deposit_asset as enum (
  'btc',
  'eth',
  'usdt'
);

create type public.deposit_status as enum (
  'pending',
  'confirming',
  'needs_review',
  'credited',
  'rejected'
);

alter type public.admin_action_type add value if not exists 'deposit_request_created';
alter type public.admin_action_type add value if not exists 'deposit_status_changed';
alter type public.admin_action_type add value if not exists 'deposit_note_added';
alter type public.admin_action_type add value if not exists 'receiving_wallet_created';
alter type public.admin_action_type add value if not exists 'receiving_wallet_updated';
alter type public.admin_action_type add value if not exists 'receiving_wallet_status_changed';
alter type public.admin_action_type add value if not exists 'receiving_wallet_removed';
