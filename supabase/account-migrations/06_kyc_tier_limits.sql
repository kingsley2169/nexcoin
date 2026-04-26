-- 06_kyc_tier_limits.sql
-- Per-tier KYC limits shown on /account/verification "Verification benefits".
-- Primary key = account_tier enum value (from 01_account_preference_enums.sql).
-- Columns hold both numeric caps (later used to enforce withdrawal/deposit) and
-- pre-formatted display strings so the UI doesn't reformat on every render.
--
-- Readable by every authenticated user; writes are admin-only (no write policy,
-- so only SECURITY DEFINER RPCs or the admin role can mutate the table).

create table public.kyc_tier_limits (
  tier public.account_tier primary key,
  display_label text not null,
  daily_deposit_usd numeric(18, 2) not null default 0,
  monthly_deposit_usd numeric(18, 2) not null default 0,
  daily_withdrawal_usd numeric(18, 2) not null default 0,
  monthly_withdrawal_usd numeric(18, 2) not null default 0,
  daily_deposit_label text not null,
  monthly_deposit_label text not null,
  daily_withdrawal_label text not null,
  monthly_withdrawal_label text not null,
  large_withdrawal_label text not null,
  support_routing_label text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kyc_tier_limits_display_label_not_blank check (length(trim(display_label)) > 0)
);

create trigger set_updated_at_kyc_tier_limits
before update on public.kyc_tier_limits
for each row execute function extensions.moddatetime(updated_at);

insert into public.kyc_tier_limits (
  tier, display_label,
  daily_deposit_usd, monthly_deposit_usd, daily_withdrawal_usd, monthly_withdrawal_usd,
  daily_deposit_label, monthly_deposit_label, daily_withdrawal_label, monthly_withdrawal_label,
  large_withdrawal_label, support_routing_label, display_order
) values
  ('beginner', 'Tier 1 verification',
   1000, 10000, 500, 5000,
   '$1,000 daily deposits', '$10,000 monthly deposits', '$500 daily withdrawals', '$5,000 monthly withdrawals',
   'Manual review', 'Standard support', 1),
  ('amateur', 'Tier 2 verification',
   5000, 50000, 2500, 25000,
   '$5,000 daily deposits', '$50,000 monthly deposits', '$2,500 daily withdrawals', '$25,000 monthly withdrawals',
   '48h review', 'Standard support', 2),
  ('advanced', 'Tier 3 verification',
   25000, 250000, 10000, 100000,
   '$25,000 daily deposits', '$250,000 monthly deposits', '$10,000 daily withdrawals', '$100,000 monthly withdrawals',
   '24h priority review', 'Priority support', 3),
  ('pro', 'Pro verification',
   100000, 1000000, 50000, 500000,
   '$100,000 daily deposits', '$1,000,000 monthly deposits', '$50,000 daily withdrawals', '$500,000 monthly withdrawals',
   'Same-day review', 'Dedicated verification desk', 4)
on conflict (tier) do nothing;

alter table public.kyc_tier_limits enable row level security;

create policy "Authenticated users can read kyc tier limits"
on public.kyc_tier_limits
for select
to authenticated
using (true);
