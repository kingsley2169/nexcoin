-- 16_user_withdrawal_fee_schedule.sql
-- User-facing withdrawal pricing/config lookup for /account/withdrawal.
-- v1 stays aligned with the same supported assets as deposits: BTC, ETH, USDT.

create table public.user_withdrawal_fee_schedule (
  asset public.deposit_asset primary key,
  symbol text not null,
  display_name text not null,
  network text not null,
  min_withdrawal numeric(28, 8) not null,
  fee_flat numeric(28, 8) not null default 0,
  fee_percent numeric(8, 4) not null default 0,
  placeholder_rate_usd numeric(18, 8) not null,
  processing_time_label text not null default 'Up to 24 hours on business days',
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_withdrawal_fee_schedule_symbol_not_blank check (length(trim(symbol)) > 0),
  constraint user_withdrawal_fee_schedule_name_not_blank check (length(trim(display_name)) > 0),
  constraint user_withdrawal_fee_schedule_network_not_blank check (length(trim(network)) > 0),
  constraint user_withdrawal_fee_schedule_min_non_negative check (min_withdrawal > 0),
  constraint user_withdrawal_fee_schedule_fee_flat_non_negative check (fee_flat >= 0),
  constraint user_withdrawal_fee_schedule_fee_percent_non_negative check (fee_percent >= 0),
  constraint user_withdrawal_fee_schedule_rate_positive check (placeholder_rate_usd > 0),
  constraint user_withdrawal_fee_schedule_processing_time_not_blank check (
    length(trim(processing_time_label)) > 0
  )
);

create trigger set_updated_at_user_withdrawal_fee_schedule
before update on public.user_withdrawal_fee_schedule
for each row execute function extensions.moddatetime(updated_at);

insert into public.user_withdrawal_fee_schedule (
  asset,
  symbol,
  display_name,
  network,
  min_withdrawal,
  fee_flat,
  fee_percent,
  placeholder_rate_usd,
  processing_time_label,
  display_order
) values
  ('btc', 'BTC', 'Bitcoin', 'Bitcoin', 0.001, 0.0005, 0.5, 64820.5, 'Up to 24 hours on business days', 1),
  ('eth', 'ETH', 'Ethereum', 'Ethereum (ERC-20)', 0.01, 0.003, 0.5, 3180.25, 'Up to 24 hours on business days', 2),
  ('usdt', 'USDT', 'Tether USD', 'Tron (TRC-20)', 10, 1, 0.1, 1, 'Up to 24 hours on business days', 3)
on conflict (asset) do nothing;

alter table public.user_withdrawal_fee_schedule enable row level security;

create policy "Authenticated users can read withdrawal fee schedule"
on public.user_withdrawal_fee_schedule
for select
to authenticated
using (is_active = true);

