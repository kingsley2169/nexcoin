-- 29_deposit_receiving_wallets.sql
-- Admin-managed receiving wallets shown to users when they create crypto
-- deposits. Only BTC, ETH, and USDT are allowed by the deposit_asset enum.

create table public.deposit_receiving_wallets (
  id uuid primary key default gen_random_uuid(),
  asset public.deposit_asset not null,
  network text not null,
  label text not null,
  address text not null,
  is_active boolean not null default true,
  created_by uuid references public.admin_users(user_id),
  updated_by uuid references public.admin_users(user_id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint deposit_receiving_wallets_address_not_blank check (length(trim(address)) >= 20),
  constraint deposit_receiving_wallets_network_not_blank check (length(trim(network)) > 0),
  constraint deposit_receiving_wallets_label_not_blank check (length(trim(label)) > 0)
);

create unique index deposit_receiving_wallets_asset_network_address_key
on public.deposit_receiving_wallets (asset, lower(network), lower(address))
where archived_at is null;

create index deposit_receiving_wallets_active_idx
on public.deposit_receiving_wallets (asset, network, is_active)
where archived_at is null;

create index deposit_receiving_wallets_created_at_idx
on public.deposit_receiving_wallets (created_at desc);

create trigger set_updated_at_deposit_receiving_wallets
before update on public.deposit_receiving_wallets
for each row execute function extensions.moddatetime(updated_at);

-- Starter wallets matching the current mock UI data. Replace these addresses
-- before production if they are placeholders.
insert into public.deposit_receiving_wallets (
  asset,
  network,
  label,
  address,
  is_active
)
values
  ('btc', 'Bitcoin', 'Primary BTC', 'bc1qnxcn92h8r6m4q7ty3f5jz0wkvnlua62rdg8f7s', true),
  ('eth', 'Ethereum', 'Primary ETH', '0x742d35Cc6634C0532925a3b8D4C4B6E7Dd45Fb58', true),
  ('usdt', 'TRC-20', 'USDT TRC-20', 'TXv9m6JnF4qH81sKc2Bx7RwzP5uE3aLq9Nc', true)
on conflict do nothing;

-- RLS ----------------------------------------------------------------------

alter table public.deposit_receiving_wallets enable row level security;

-- Logged-in users need to read active wallets so the account Deposit page can
-- show the correct address. Archived/inactive wallets are hidden from users.
create policy "Authenticated users can read active receiving wallets"
on public.deposit_receiving_wallets
for select
to authenticated
using (is_active = true and archived_at is null);

-- Admins can read all active, inactive, and archived receiving wallets.
create policy "Admins can read all receiving wallets"
on public.deposit_receiving_wallets
for select
to authenticated
using (public.is_admin());

-- Writes go through security-definer RPCs. No direct insert/update/delete
-- policies are defined.
