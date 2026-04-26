-- 32_user_holdings_view.sql
-- Per-asset crypto holdings for the /account/portfolio "Holdings" card.
-- Derived live from the caller's credited deposits minus completed
-- withdrawals (net coin amount), multiplied by the latest known USD rate
-- from either source table.
--
-- v1 note: there is no dedicated rate table yet, so the rate comes from the
-- most recent row for the asset that passed through crypto_deposits or
-- crypto_withdrawals. change_24h_percent is a placeholder (0) until a rate
-- feed / snapshot table exists — the frontend hides the 24h line when it is
-- exactly 0 so this stays visually neutral.
--
-- Assets with a zero or negative net balance are excluded.

create or replace view public.user_holdings_view
with (security_invoker = true)
as
with deposit_totals as (
  select
    user_id,
    asset,
    sum(amount)::numeric(28, 8) as amount_in
  from public.crypto_deposits
  where status = 'credited'
  group by user_id, asset
),
withdrawal_totals as (
  select
    user_id,
    asset,
    sum(amount)::numeric(28, 8) as amount_out
  from public.crypto_withdrawals
  where status = 'completed'
  group by user_id, asset
),
net as (
  select
    coalesce(d.user_id, w.user_id) as user_id,
    coalesce(d.asset, w.asset) as asset,
    coalesce(d.amount_in, 0) - coalesce(w.amount_out, 0) as net_amount
  from deposit_totals d
  full outer join withdrawal_totals w
    on w.user_id = d.user_id and w.asset = d.asset
),
latest_rates as (
  select distinct on (asset)
    asset,
    rate_usd,
    created_at
  from (
    select asset, rate_usd, created_at from public.crypto_deposits
    union all
    select asset, rate_usd, created_at from public.crypto_withdrawals
  ) s
  order by asset, created_at desc
)
select
  n.user_id,
  n.asset,
  upper(n.asset::text) as symbol,
  case n.asset
    when 'btc' then 'Bitcoin'
    when 'eth' then 'Ethereum'
    when 'usdt' then 'Tether'
    else initcap(n.asset::text)
  end as name,
  n.net_amount as amount,
  coalesce(lr.rate_usd, 0)::numeric(18, 8) as rate_usd,
  round(n.net_amount * coalesce(lr.rate_usd, 0), 2)::numeric(18, 2) as value_usd,
  0::numeric(6, 2) as change_24h_percent
from net n
left join latest_rates lr on lr.asset = n.asset
where n.user_id = auth.uid()
  and n.net_amount > 0
order by value_usd desc;

grant select on public.user_holdings_view to authenticated;
