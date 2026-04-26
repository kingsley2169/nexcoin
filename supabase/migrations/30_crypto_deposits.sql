-- 30_crypto_deposits.sql
-- Crypto deposit requests created by users and reviewed by admins from
-- /nexcoin-admin-priv/deposits-management.

create sequence if not exists public.crypto_deposit_reference_seq
start with 2300
increment by 1;

create table public.crypto_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  receiving_wallet_id uuid references public.deposit_receiving_wallets(id) on delete set null,
  reference text not null unique,
  asset public.deposit_asset not null,
  network text not null,
  amount numeric(28, 8) not null check (amount > 0),
  amount_usd numeric(18, 2) not null check (amount_usd > 0),
  rate_usd numeric(18, 8) not null check (rate_usd > 0),
  confirmations integer not null default 0 check (confirmations >= 0),
  confirmations_required integer not null check (confirmations_required > 0),
  tx_hash text,
  sender_address text,
  receiving_address_snapshot text not null,
  status public.deposit_status not null default 'pending',
  risk_level public.risk_level not null default 'low',
  risk_notes text[] not null default array[]::text[],
  reviewed_by uuid references public.admin_users(user_id),
  credited_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint crypto_deposits_network_not_blank check (length(trim(network)) > 0),
  constraint crypto_deposits_receiving_address_not_blank check (length(trim(receiving_address_snapshot)) >= 20),
  constraint crypto_deposits_tx_hash_not_blank check (tx_hash is null or length(trim(tx_hash)) > 0),
  constraint crypto_deposits_credit_timestamp check (
    (status = 'credited' and credited_at is not null)
    or status <> 'credited'
  ),
  constraint crypto_deposits_reject_timestamp check (
    (status = 'rejected' and rejected_at is not null)
    or status <> 'rejected'
  )
);

create unique index crypto_deposits_tx_hash_key
on public.crypto_deposits (lower(tx_hash))
where tx_hash is not null;

create index crypto_deposits_user_idx on public.crypto_deposits (user_id, created_at desc);
create index crypto_deposits_status_idx on public.crypto_deposits (status, created_at desc);
create index crypto_deposits_asset_idx on public.crypto_deposits (asset, network);
create index crypto_deposits_risk_idx on public.crypto_deposits (risk_level);
create index crypto_deposits_wallet_idx on public.crypto_deposits (receiving_wallet_id);

create trigger set_updated_at_crypto_deposits
before update on public.crypto_deposits
for each row execute function extensions.moddatetime(updated_at);

-- RLS ----------------------------------------------------------------------

alter table public.crypto_deposits enable row level security;

create policy "Users can read own crypto deposits"
on public.crypto_deposits
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read all crypto deposits"
on public.crypto_deposits
for select
to authenticated
using (public.is_admin());

-- Users create deposits through create_crypto_deposit_request so wallet
-- validation, reference generation, and address snapshotting are consistent.
-- Admins update status through admin_update_crypto_deposit_status.
