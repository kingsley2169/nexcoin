-- 45_rpc_user_export_transactions.sql
-- Export helper for /account/transactions.
--
-- The frontend already knows how to turn rows into a CSV file. This RPC keeps
-- the heavy lifting server-side by applying the same filters the page uses and
-- returning a CSV-ready rowset in export column order.
--
-- Supported date ranges:
--   7D, 30D, 90D, 1Y, ALL
--
-- All filter params are optional. Empty strings are treated as null.

create or replace function public.user_export_transactions(
  p_date_range text default '30D',
  p_type text default null,
  p_status text default null,
  p_asset_symbol text default null,
  p_search text default null
)
returns table (
  transaction_date text,
  reference text,
  type text,
  status text,
  asset text,
  amount numeric(28, 8),
  direction text,
  amount_usd numeric(18, 2),
  detail text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_date_range text := upper(coalesce(nullif(trim(p_date_range), ''), '30D'));
  v_type text := lower(nullif(trim(p_type), ''));
  v_status text := lower(nullif(trim(p_status), ''));
  v_asset text := upper(nullif(trim(p_asset_symbol), ''));
  v_search text := lower(nullif(trim(p_search), ''));
  v_cutoff timestamptz := null;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  case v_date_range
    when '7D' then
      v_cutoff := now() - interval '7 days';
    when '30D' then
      v_cutoff := now() - interval '30 days';
    when '90D' then
      v_cutoff := now() - interval '90 days';
    when '1Y' then
      v_cutoff := now() - interval '1 year';
    when 'ALL' then
      v_cutoff := null;
    else
      raise exception 'Unsupported date range: %', v_date_range;
  end case;

  return query
  select
    to_char(ut.created_at at time zone 'UTC', 'YYYY-MM-DD') as transaction_date,
    ut.reference,
    initcap(ut.type) as type,
    initcap(ut.status) as status,
    ut.asset_symbol as asset,
    ut.amount,
    case ut.direction
      when 'in' then 'In'
      else 'Out'
    end as direction,
    ut.amount_usd,
    ut.detail
  from public.user_transactions_view ut
  where (v_cutoff is null or ut.created_at >= v_cutoff)
    and (v_type is null or ut.type = v_type)
    and (v_status is null or ut.status = v_status)
    and (v_asset is null or ut.asset_symbol = v_asset)
    and (
      v_search is null
      or lower(
        concat_ws(
          ' ',
          ut.reference,
          ut.detail,
          ut.asset_symbol,
          coalesce(ut.plan_name, ''),
          coalesce(ut.tx_hash, ''),
          coalesce(ut.full_address, ''),
          coalesce(ut.notes, '')
        )
      ) like ('%' || v_search || '%')
    )
  order by ut.created_at desc, ut.reference desc;
end;
$$;

revoke all on function public.user_export_transactions(text, text, text, text, text) from public;
grant execute on function public.user_export_transactions(text, text, text, text, text) to authenticated;
