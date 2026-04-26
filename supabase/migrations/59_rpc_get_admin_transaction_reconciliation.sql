-- 59_rpc_get_admin_transaction_reconciliation.sql
-- Feeds the "Reconciliation queue" panel on /nexcoin-admin-priv/transactions.
-- Buckets are computed on the fly from the underlying deposits/withdrawals
-- rather than stored, so they always reflect current state.
--
-- Bucket codes in v1:
--   unmatched_deposits  — in-flight deposits without a tx_hash
--   missing_tx_hashes   — completed withdrawals without a tx_hash
--   failed_review       — rejected deposits/withdrawals not yet reviewed
--   manual_adjustments  — placeholder, always 0 until an adjustments table ships

create or replace function public.get_admin_transaction_reconciliation()
returns table (
  bucket text,
  label text,
  count bigint,
  value_usd numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from (
    select
      'unmatched_deposits'::text as bucket,
      'Unmatched deposits'::text as label,
      count(*)::bigint as count,
      coalesce(sum(amount_usd), 0)::numeric as value_usd
    from public.crypto_deposits
    where tx_hash is null
      and status in ('pending', 'confirming', 'needs_review')

    union all

    select
      'missing_tx_hashes'::text,
      'Withdrawals missing tx hash'::text,
      count(*)::bigint,
      coalesce(sum(amount_usd), 0)::numeric
    from public.crypto_withdrawals
    where tx_hash is null
      and status = 'completed'

    union all

    select
      'failed_review'::text,
      'Failed transactions needing review'::text,
      (
        (
          select count(*)
          from public.crypto_deposits d
          where d.status = 'rejected'
            and not exists (
              select 1
              from public.transaction_reviews tr
              where tr.source_type = 'crypto_deposit'
                and tr.source_id = d.id
            )
        )
        +
        (
          select count(*)
          from public.crypto_withdrawals w
          where w.status = 'rejected'
            and not exists (
              select 1
              from public.transaction_reviews tr
              where tr.source_type = 'crypto_withdrawal'
                and tr.source_id = w.id
            )
        )
      )::bigint,
      (
        coalesce(
          (
            select sum(amount_usd)
            from public.crypto_deposits d
            where d.status = 'rejected'
              and not exists (
                select 1
                from public.transaction_reviews tr
                where tr.source_type = 'crypto_deposit'
                  and tr.source_id = d.id
              )
          ),
          0
        )
        +
        coalesce(
          (
            select sum(amount_usd)
            from public.crypto_withdrawals w
            where w.status = 'rejected'
              and not exists (
                select 1
                from public.transaction_reviews tr
                where tr.source_type = 'crypto_withdrawal'
                  and tr.source_id = w.id
              )
          ),
          0
        )
      )::numeric

    union all

    select
      'manual_adjustments'::text,
      'Manual adjustments'::text,
      0::bigint,
      0::numeric
  ) buckets
  where public.is_admin();
$$;
