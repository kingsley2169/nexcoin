-- 15_user_withdrawal_limits.sql
-- Optional per-user, per-asset withdrawal overrides for /account/withdrawal.
-- This table can store tighter limits or precomputed usage if operations wants
-- to pin a value without changing the user's KYC tier globally.
--
-- The user-facing summary view still derives usage from crypto_withdrawals and
-- falls back to tier/compliance defaults when no override row exists.

create table public.user_withdrawal_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  asset public.deposit_asset not null,
  daily_limit_usd numeric(18, 2),
  monthly_limit_usd numeric(18, 2),
  daily_used_usd numeric(18, 2) not null default 0,
  monthly_used_usd numeric(18, 2) not null default 0,
  pending_usd numeric(18, 2) not null default 0,
  processing_time_label text not null default 'Up to 24 hours on business days',
  usage_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (user_id, asset),
  constraint user_withdrawal_limits_daily_limit_non_negative check (
    daily_limit_usd is null or daily_limit_usd >= 0
  ),
  constraint user_withdrawal_limits_monthly_limit_non_negative check (
    monthly_limit_usd is null or monthly_limit_usd >= 0
  ),
  constraint user_withdrawal_limits_daily_used_non_negative check (daily_used_usd >= 0),
  constraint user_withdrawal_limits_monthly_used_non_negative check (monthly_used_usd >= 0),
  constraint user_withdrawal_limits_pending_non_negative check (pending_usd >= 0),
  constraint user_withdrawal_limits_processing_time_not_blank check (
    length(trim(processing_time_label)) > 0
  )
);

create index user_withdrawal_limits_asset_idx
on public.user_withdrawal_limits (asset, updated_at desc);

create trigger set_updated_at_user_withdrawal_limits
before update on public.user_withdrawal_limits
for each row execute function extensions.moddatetime(updated_at);

alter table public.user_withdrawal_limits enable row level security;

create policy "Users can read own withdrawal limits"
on public.user_withdrawal_limits
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read withdrawal limits"
on public.user_withdrawal_limits
for select
to authenticated
using (public.is_admin());
