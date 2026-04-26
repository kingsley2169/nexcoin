-- 35_referral_enums.sql
-- Enum groundwork for Phase 8. Must commit alone before any later referral
-- file references these values (Postgres does not see newly-added enum values
-- in the same transaction they were added in).
--
-- `referral_status` mirrors the four display states on /account/referrals
-- (Invited / Signed up / Verified / Active investor). `invited` is kept in
-- the enum for future pre-signup invite flows even though v1 signups always
-- start at `signed_up`.
--
-- `referral_earning_type` / `referral_earning_status` match the payout rows
-- on the Earnings history card.
--
-- The new `admin_action_type` values are used by the signup trigger and the
-- claim RPC so referral activity threads through `admin_audit_logs` the same
-- way every other domain does.
--
-- A dedicated reference sequence lets earnings rows surface on the shared
-- transactions ledger (Phase 9) with a stable `RE-####` handle.

create type public.referral_status as enum (
  'invited',
  'signed_up',
  'verified',
  'active_investor'
);

create type public.referral_earning_type as enum (
  'signup_bonus',
  'investment_commission',
  'profit_share'
);

create type public.referral_earning_status as enum (
  'pending',
  'credited'
);

alter type public.admin_action_type add value if not exists 'referral_attached';
alter type public.admin_action_type add value if not exists 'referral_status_changed';
alter type public.admin_action_type add value if not exists 'referral_earning_recorded';
alter type public.admin_action_type add value if not exists 'referral_earning_credited';

create sequence if not exists public.referral_earning_reference_seq
as integer
start with 3000
increment by 1
minvalue 1;
