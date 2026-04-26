-- 57_security_enums.sql
-- Enum groundwork for /account/security.
-- Keep this separate so later tables and RPCs can reference the new values.

create type public.user_2fa_method as enum (
  'authenticator_app',
  'email',
  'sms'
);

create type public.user_device_status as enum (
  'current',
  'trusted',
  'review',
  'revoked'
);

create type public.security_activity_status as enum (
  'completed',
  'review'
);

create type public.security_activity_type as enum (
  'sign_in',
  'password_changed',
  'two_factor_enabled',
  'two_factor_disabled',
  'backup_codes_generated',
  'device_revoked',
  'device_review_required',
  'security_settings_updated'
);

create type public.password_strength as enum (
  'needs_attention',
  'strong'
);
