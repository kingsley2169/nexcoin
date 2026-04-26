-- 18_user_saved_addresses_view.sql
-- Read model for the "Saved addresses" area on /account/withdrawal. Returns
-- only the logged-in user's active rows with a masked address and lightweight
-- usage metadata from past withdrawals.

create or replace view public.user_saved_addresses_view
with (security_invoker = true)
as
with withdrawal_usage as (
  select
    w.destination_address_id,
    count(*)::integer as usage_count,
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
  wa.asset::text as asset_id,
  upper(wa.asset::text) as asset_symbol,
  wa.network,
  wa.label,
  wa.address,
  case
    when length(wa.address) <= 14 then wa.address
    else left(wa.address, 6) || '...' || right(wa.address, 4)
  end as address_masked,
  wa.status,
  wa.is_default,
  coalesce(wu.usage_count, 0) as usage_count,
  coalesce(wa.last_used_at, wu.last_withdrawal_at) as last_used_at,
  wa.created_at,
  wa.updated_at
from public.withdrawal_addresses wa
left join withdrawal_usage wu
  on wu.destination_address_id = wa.id
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
  coalesce(wa.last_used_at, wu.last_withdrawal_at, wa.created_at) desc;

grant select on public.user_saved_addresses_view to authenticated;
