-- 42_crypto_withdrawals.sql
-- Crypto withdrawal requests created by users and reviewed by admins from
-- /nexcoin-admin-priv/withdrawals-management.

create sequence if not exists public.crypto_withdrawal_reference_seq
start with 1040
increment by 1;

create table public.crypto_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  destination_address_id uuid references public.withdrawal_addresses(id) on delete set null,
  reference text not null unique,
  asset public.deposit_asset not null,
  network text not null,
  amount numeric(28, 8) not null check (amount > 0),
  amount_usd numeric(18, 2) not null check (amount_usd > 0),
  rate_usd numeric(18, 8) not null check (rate_usd > 0),
  fee numeric(28, 8) not null default 0 check (fee >= 0),
  fee_usd numeric(18, 2) not null default 0 check (fee_usd >= 0),
  net_amount numeric(28, 8) not null check (net_amount > 0),
  destination_label_snapshot text not null,
  destination_address_snapshot text not null,
  status public.withdrawal_status not null default 'pending',
  risk_level public.risk_level not null default 'low',
  security_notes text[] not null default array[]::text[],
  tx_hash text,
  reviewed_by uuid references public.admin_users(user_id),
  approved_at timestamptz,
  processing_at timestamptz,
  completed_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint crypto_withdrawals_network_not_blank check (length(trim(network)) > 0),
  constraint crypto_withdrawals_destination_label_not_blank check (length(trim(destination_label_snapshot)) > 0),
  constraint crypto_withdrawals_destination_address_not_blank check (length(trim(destination_address_snapshot)) >= 20),
  constraint crypto_withdrawals_tx_hash_not_blank check (tx_hash is null or length(trim(tx_hash)) > 0),
  constraint crypto_withdrawals_net_amount_lte_amount check (net_amount <= amount),
  constraint crypto_withdrawals_approved_timestamp check (
    (status in ('approved', 'processing', 'completed') and approved_at is not null)
    or status not in ('approved', 'processing', 'completed')
  ),
  constraint crypto_withdrawals_processing_timestamp check (
    (status in ('processing', 'completed') and processing_at is not null)
    or status not in ('processing', 'completed')
  ),
  constraint crypto_withdrawals_completed_timestamp check (
    (status = 'completed' and completed_at is not null)
    or status <> 'completed'
  ),
  constraint crypto_withdrawals_rejected_timestamp check (
    (status = 'rejected' and rejected_at is not null)
    or status <> 'rejected'
  )
);

create unique index crypto_withdrawals_tx_hash_key
on public.crypto_withdrawals (lower(tx_hash))
where tx_hash is not null;

create index crypto_withdrawals_user_idx on public.crypto_withdrawals (user_id, created_at desc);
create index crypto_withdrawals_status_idx on public.crypto_withdrawals (status, created_at desc);
create index crypto_withdrawals_asset_idx on public.crypto_withdrawals (asset, network);
create index crypto_withdrawals_risk_idx on public.crypto_withdrawals (risk_level);
create index crypto_withdrawals_destination_idx on public.crypto_withdrawals (destination_address_id);

create trigger set_updated_at_crypto_withdrawals
before update on public.crypto_withdrawals
for each row execute function extensions.moddatetime(updated_at);

-- RLS ----------------------------------------------------------------------

alter table public.crypto_withdrawals enable row level security;

create policy "Users can read own crypto withdrawals"
on public.crypto_withdrawals
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read all crypto withdrawals"
on public.crypto_withdrawals
for select
to authenticated
using (public.is_admin());

-- Users create withdrawals through create_crypto_withdrawal_request so balance
-- locking, reference generation, and destination snapshotting stay consistent.
-- Admins update status through admin_update_crypto_withdrawal_status.
