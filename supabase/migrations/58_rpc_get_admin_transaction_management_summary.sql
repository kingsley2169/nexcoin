-- 58_rpc_get_admin_transaction_management_summary.sql
-- Feeds the summary cards on /nexcoin-admin-priv/transactions.
--
-- Ledger scope in v1: crypto_deposits + crypto_withdrawals. Profits, fees,
-- referrals, and manual adjustments are not yet represented in the DB, so
-- their contribution to inflow/outflow/fees is zero until those tables land.

create or replace function public.get_admin_transaction_management_summary()
returns table (
  ledger_entries bigint,
  pending_processing_count bigint,
  failed_rejected_count bigint,
  total_inflow_usd numeric,
  total_outflow_usd numeric,
  fees_collected_usd numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with ledger as (
    select
      'In'::text as direction,
      d.amount_usd,
      0::numeric as fee_usd,
      d.status::text as status
    from public.crypto_deposits d
    union all
    select
      'Out'::text as direction,
      w.amount_usd,
      w.fee_usd,
      w.status::text as status
    from public.crypto_withdrawals w
  )
  select
    count(*)::bigint as ledger_entries,
    count(*) filter (
      where status in ('pending', 'confirming', 'needs_review', 'aml_review', 'approved', 'processing')
    )::bigint as pending_processing_count,
    count(*) filter (where status = 'rejected')::bigint as failed_rejected_count,
    coalesce(
      sum(amount_usd) filter (where direction = 'In' and status = 'credited'),
      0
    )::numeric as total_inflow_usd,
    coalesce(
      sum(amount_usd) filter (where direction = 'Out' and status = 'completed'),
      0
    )::numeric as total_outflow_usd,
    coalesce(
      sum(fee_usd) filter (where status = 'completed'),
      0
    )::numeric as fees_collected_usd
  from ledger
  where public.is_admin();
$$;
