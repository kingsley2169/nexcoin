-- 74_support_enums.sql
-- Enums for the Admin Support Management page.
-- Keep this separate so added admin_action_type values commit before later
-- support RPCs and event tables reference them.

create type public.support_ticket_status as enum (
  'open',
  'pending_admin',
  'awaiting_user',
  'resolved',
  'closed'
);

create type public.support_ticket_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

create type public.support_ticket_category as enum (
  'account',
  'deposit',
  'general',
  'investment',
  'kyc',
  'security',
  'withdrawal'
);

create type public.support_message_type as enum (
  'user',
  'admin',
  'internal'
);

create type public.support_link_type as enum (
  'deposit',
  'kyc',
  'transaction',
  'withdrawal'
);

alter type public.admin_action_type add value if not exists 'support_ticket_created';
alter type public.admin_action_type add value if not exists 'support_ticket_updated';
alter type public.admin_action_type add value if not exists 'support_ticket_assigned';
alter type public.admin_action_type add value if not exists 'support_ticket_replied';
alter type public.admin_action_type add value if not exists 'support_ticket_note_added';
alter type public.admin_action_type add value if not exists 'support_ticket_resolved';
alter type public.admin_action_type add value if not exists 'support_ticket_closed';
