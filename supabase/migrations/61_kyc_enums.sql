-- 61_kyc_enums.sql
-- Enums for the KYC Review page and the user KYC submission flow.
-- Must be its own file so the new enum values commit before any RPC
-- references them.

create type public.kyc_submission_status as enum (
  'pending',
  'in_review',
  'needs_resubmission',
  'approved',
  'rejected'
);

create type public.kyc_document_type as enum (
  'passport',
  'national_id',
  'driver_license'
);

create type public.kyc_check_status as enum (
  'passed',
  'review',
  'failed'
);

create type public.kyc_document_quality as enum (
  'clear',
  'blurry',
  'poor'
);

alter type public.admin_action_type add value if not exists 'kyc_submission_created';
alter type public.admin_action_type add value if not exists 'kyc_submission_status_changed';
alter type public.admin_action_type add value if not exists 'kyc_submission_note_added';
alter type public.admin_action_type add value if not exists 'kyc_submission_check_updated';
alter type public.admin_action_type add value if not exists 'kyc_submission_flag_assigned';
alter type public.admin_action_type add value if not exists 'kyc_submission_flag_removed';
