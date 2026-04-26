-- 34_rpc_user_portfolio_performance.sql
-- Time-series RPC for the /account/portfolio performance chart.
--
-- Input:
--   p_range text — '30D' | '90D' | '1Y'
--
-- Output:
--   table (bucket_index integer, bucket_at timestamptz, total_value_usd numeric)
--
-- Each response contains 12 equally-spaced buckets covering the requested
-- range, ending at `now()`. For each bucket the total portfolio value is:
--   total = sum over investments that were open at bucket_at of:
--             amount_usd + accrued profit at bucket_at
--
-- Where `accrued profit at T` is:
--   - projected_profit_usd                              if T >= end_at
--   - 0                                                 if T <= start_at
--   - projected_profit_usd * (T - start_at) / (end_at - start_at)  otherwise
--
-- Cancelled investments are excluded from every bucket. Matured investments
-- stay in the series at their full projected value from end_at onward.

create or replace function public.user_portfolio_performance(
  p_range text
)
returns table (
  bucket_index integer,
  bucket_at timestamptz,
  total_value_usd numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_days integer;
  v_bucket_count integer := 12;
  v_start_at timestamptz;
  v_step interval;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  v_days := case p_range
    when '30D' then 30
    when '90D' then 90
    when '1Y' then 365
    else null
  end;

  if v_days is null then
    raise exception 'Invalid range: %. Expected 30D, 90D, or 1Y', p_range;
  end if;

  v_start_at := now() - make_interval(days => v_days);
  v_step := make_interval(
    secs => ((v_days * 86400.0) / greatest(v_bucket_count - 1, 1))
  );

  return query
  with buckets as (
    select
      g.i::integer as bucket_index,
      v_start_at + (g.i * v_step) as bucket_at
    from generate_series(0, v_bucket_count - 1) as g(i)
  )
  select
    b.bucket_index,
    b.bucket_at,
    coalesce((
      select sum(
        ui.amount_usd
        + case
            when b.bucket_at >= ui.end_at then ui.projected_profit_usd
            when b.bucket_at <= ui.start_at then 0
            else ui.projected_profit_usd
              * (extract(epoch from (b.bucket_at - ui.start_at))
                 / nullif(extract(epoch from (ui.end_at - ui.start_at)), 0))
          end
      )
      from public.user_investments ui
      where ui.user_id = v_user
        and ui.start_at <= b.bucket_at
        and ui.status in ('active', 'matured')
    ), 0)::numeric(18, 2) as total_value_usd
  from buckets b
  order by b.bucket_index;
end;
$$;

revoke all on function public.user_portfolio_performance(text) from public;
grant execute on function public.user_portfolio_performance(text) to authenticated;
