-- 24_user_wallets_view.sql
-- Read model for /account/wallets. This page now represents the user's own
-- saved withdrawal destinations, not Nexcoin deposit receiving wallets.
--
-- The view reuses withdrawal_addresses and exposes display-ready fields that
-- match the wallet page contract: label, network, masked/default state, and a
-- lightweight color/name mapping by supported asset.

create or replace view public.user_wallets_view
with (security_invoker = true)
as
with usage_rollup as (
  select
    w.destination_address_id,
    max(w.created_at) as last_withdrawal_at
  from public.crypto_withdrawals w
  where w.user_id = auth.uid()
    and w.destination_address_id is not null
  group by w.destination_address_id
)
select
  wa.id,
  wa.user_id,
  wa.asset,
  upper(wa.asset::text) as symbol,
  case wa.asset
    when 'btc' then 'Bitcoin'
    when 'eth' then 'Ethereum'
    when 'usdt' then 'Tether USD'
  end as name,
  case wa.asset
    when 'btc' then '#f0a33a'
    when 'eth' then '#667eea'
    when 'usdt' then '#26a17b'
  end as color,
  wa.label,
  wa.network,
  wa.address,
  wa.is_default,
  wa.created_at,
  coalesce(wa.last_used_at, ur.last_withdrawal_at, wa.created_at) as last_used_at,
  case
    when wa.status = 'pending_confirmation' then 'Review'
    when wa.is_default then 'Default'
    else 'Active'
  end as status
from public.withdrawal_addresses wa
left join usage_rollup ur
  on ur.destination_address_id = wa.id
where wa.user_id = auth.uid()
  and wa.archived_at is null
order by
  case wa.asset
    when 'btc' then 1
    when 'eth' then 2
    when 'usdt' then 3
    else 99
  end,
  wa.is_default desc,
  coalesce(wa.last_used_at, ur.last_withdrawal_at, wa.created_at) desc;

grant select on public.user_wallets_view to authenticated;
