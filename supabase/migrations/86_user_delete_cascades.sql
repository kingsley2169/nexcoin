-- 86_user_delete_cascades.sql
-- Make `auth.users` deletion possible end-to-end. Several foreign keys to
-- `profiles` and `admin_users` were created without an ON DELETE action,
-- which means deleting a user (or an admin) causes Postgres to abort with
-- "violates foreign key constraint".
--
-- Fix: switch each blocker to ON DELETE SET NULL so we preserve audit /
-- ownership history with a null reference instead of blocking the delete.

-- 1. profiles target reference in admin audit log
alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_target_user_id_fkey;
alter table public.admin_audit_logs
  add constraint admin_audit_logs_target_user_id_fkey
  foreign key (target_user_id) references public.profiles(id) on delete set null;

-- 2. admin references in admin audit log
alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_actor_admin_id_fkey;
alter table public.admin_audit_logs
  add constraint admin_audit_logs_actor_admin_id_fkey
  foreign key (actor_admin_id) references public.admin_users(user_id) on delete set null;

-- 3. tags catalog
alter table public.tags
  drop constraint if exists tags_assigned_by_fkey;
alter table public.tags
  add constraint tags_assigned_by_fkey
  foreign key (assigned_by) references public.admin_users(user_id) on delete set null;

-- 4. user_compliance reviewer
alter table public.user_compliance
  drop constraint if exists user_compliance_reviewed_by_fkey;
alter table public.user_compliance
  add constraint user_compliance_reviewed_by_fkey
  foreign key (reviewed_by) references public.admin_users(user_id) on delete set null;

-- 5. account status events
alter table public.account_status_events
  drop constraint if exists account_status_events_created_by_fkey;
alter table public.account_status_events
  add constraint account_status_events_created_by_fkey
  foreign key (created_by) references public.admin_users(user_id) on delete set null;

-- 6. investment plan events actor
alter table public.investment_plan_events
  drop constraint if exists investment_plan_events_actor_admin_id_fkey;
alter table public.investment_plan_events
  add constraint investment_plan_events_actor_admin_id_fkey
  foreign key (actor_admin_id) references public.admin_users(user_id) on delete set null;

-- 7. investment plans authorship
alter table public.investment_plans
  drop constraint if exists investment_plans_created_by_fkey;
alter table public.investment_plans
  add constraint investment_plans_created_by_fkey
  foreign key (created_by) references public.admin_users(user_id) on delete set null;

alter table public.investment_plans
  drop constraint if exists investment_plans_updated_by_fkey;
alter table public.investment_plans
  add constraint investment_plans_updated_by_fkey
  foreign key (updated_by) references public.admin_users(user_id) on delete set null;

-- 8. deposit receiving wallets authorship
alter table public.deposit_receiving_wallets
  drop constraint if exists deposit_receiving_wallets_created_by_fkey;
alter table public.deposit_receiving_wallets
  add constraint deposit_receiving_wallets_created_by_fkey
  foreign key (created_by) references public.admin_users(user_id) on delete set null;

alter table public.deposit_receiving_wallets
  drop constraint if exists deposit_receiving_wallets_updated_by_fkey;
alter table public.deposit_receiving_wallets
  add constraint deposit_receiving_wallets_updated_by_fkey
  foreign key (updated_by) references public.admin_users(user_id) on delete set null;

-- 9. crypto deposits reviewer
alter table public.crypto_deposits
  drop constraint if exists crypto_deposits_reviewed_by_fkey;
alter table public.crypto_deposits
  add constraint crypto_deposits_reviewed_by_fkey
  foreign key (reviewed_by) references public.admin_users(user_id) on delete set null;

-- 10. crypto withdrawals reviewer
alter table public.crypto_withdrawals
  drop constraint if exists crypto_withdrawals_reviewed_by_fkey;
alter table public.crypto_withdrawals
  add constraint crypto_withdrawals_reviewed_by_fkey
  foreign key (reviewed_by) references public.admin_users(user_id) on delete set null;

-- 11. support tickets assignee
alter table public.support_tickets
  drop constraint if exists support_tickets_assigned_admin_id_fkey;
alter table public.support_tickets
  add constraint support_tickets_assigned_admin_id_fkey
  foreign key (assigned_admin_id) references public.admin_users(user_id) on delete set null;
