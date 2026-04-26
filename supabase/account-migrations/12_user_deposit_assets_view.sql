-- 12_user_deposit_assets_view.sql
-- Read model for /account/deposit asset selection. Exposes only active,
-- non-archived receiving wallets plus the user-facing metadata the React page
-- needs: label, symbol, display name, min deposit, confirmation count, and a
-- lightweight placeholder USD rate until live pricing is wired in.
--
-- Why a view instead of selecting deposit_receiving_wallets directly:
--   - the UI wants display-ready strings and per-asset defaults
--   - min_deposit / confirmations are derived business rules, not columns on
--     the admin-managed wallet table
--   - color / display name stay in SQL so the page can `select *` and render

create or replace view public.user_deposit_assets_view
with (security_invoker = true)
as
select
  rw.id as wallet_id,
  rw.asset,
  upper(rw.asset::text) as symbol,
  case rw.asset
    when 'btc' then 'Bitcoin'
    when 'eth' then 'Ethereum'
    when 'usdt' then 'Tether USD'
  end as name,
  rw.network,
  rw.address,
  rw.label,
  case rw.asset
    when 'btc' then '#f0a33a'
    when 'eth' then '#667eea'
    when 'usdt' then '#26a17b'
  end as color,
  case rw.asset
    when 'btc' then 0.0005::numeric
    when 'eth' then 0.01::numeric
    when 'usdt' then 10::numeric
  end as min_deposit,
  case rw.asset
    when 'btc' then 3
    when 'eth' then 12
    when 'usdt' then 20
  end as confirmations_required,
  case rw.asset
    when 'btc' then 64820.5::numeric(18, 8)
    when 'eth' then 3180.25::numeric(18, 8)
    when 'usdt' then 1::numeric(18, 8)
  end as placeholder_rate_usd,
  'active'::text as status,
  rw.updated_at
from public.deposit_receiving_wallets rw
where rw.is_active = true
  and rw.archived_at is null
order by
  case rw.asset
    when 'btc' then 1
    when 'eth' then 2
    when 'usdt' then 3
    else 99
  end,
  rw.updated_at desc;

grant select on public.user_deposit_assets_view to authenticated;
