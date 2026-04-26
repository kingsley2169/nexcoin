-- 46_notification_enums.sql
-- Enum groundwork for /account/notifications.
-- Keep this separate so the new enum values commit before later tables,
-- triggers, views, and RPCs reference them.

create type public.notification_category as enum (
  'account',
  'investment',
  'security',
  'support',
  'transaction'
);

create type public.notification_priority as enum (
  'normal',
  'high'
);

create type public.notification_channel as enum (
  'email',
  'in_app',
  'sms'
);
