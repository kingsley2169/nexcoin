-- 41_withdrawal_addresses.sql
-- Saved user payout destinations for crypto withdrawals.

create table public.withdrawal_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  asset public.deposit_asset not null,
  network text not null,
  label text not null,
  address text not null,
  status public.withdrawal_address_status not null default 'active',
  is_default boolean not null default false,
  last_used_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint withdrawal_addresses_network_not_blank check (length(trim(network)) > 0),
  constraint withdrawal_addresses_label_not_blank check (length(trim(label)) > 0),
  constraint withdrawal_addresses_address_not_blank check (length(trim(address)) >= 20)
);

create unique index withdrawal_addresses_user_asset_address_key
on public.withdrawal_addresses (user_id, asset, lower(network), lower(address))
where archived_at is null;

create unique index withdrawal_addresses_default_key
on public.withdrawal_addresses (user_id, asset)
where is_default = true and archived_at is null;

create index withdrawal_addresses_user_idx
on public.withdrawal_addresses (user_id, asset, created_at desc);

create trigger set_updated_at_withdrawal_addresses
before update on public.withdrawal_addresses
for each row execute function extensions.moddatetime(updated_at);

-- RLS ----------------------------------------------------------------------

alter table public.withdrawal_addresses enable row level security;

create policy "Users can read own withdrawal addresses"
on public.withdrawal_addresses
for select
to authenticated
using (user_id = auth.uid() and archived_at is null);

create policy "Admins can read withdrawal addresses"
on public.withdrawal_addresses
for select
to authenticated
using (public.is_admin());

create policy "Users can create own withdrawal addresses"
on public.withdrawal_addresses
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own withdrawal addresses"
on public.withdrawal_addresses
for update
to authenticated
using (user_id = auth.uid() and archived_at is null)
with check (user_id = auth.uid());

-- Users should soft-archive addresses from the app instead of deleting them
-- once withdrawal history references them.
