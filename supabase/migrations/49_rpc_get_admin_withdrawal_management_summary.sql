-- 49_rpc_get_admin_withdrawal_management_summary.sql
-- Feeds the summary cards on /nexcoin-admin-priv/withdrawals-management.

create or replace function public.get_admin_withdrawal_management_summary()
returns table (
  pending_count bigint,
  pending_usd numeric,
  aml_review_count bigint,
  aml_review_usd numeric,
  processing_count bigint,
  processing_usd numeric,
  completed_today_usd numeric,
  rejected_today_usd numeric,
  average_processing_hours numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where w.status = 'pending')::bigint as pending_count,
    coalesce(sum(w.amount_usd) filter (where w.status = 'pending'), 0)::numeric as pending_usd,
    count(*) filter (where w.status = 'aml_review')::bigint as aml_review_count,
    coalesce(sum(w.amount_usd) filter (where w.status = 'aml_review'), 0)::numeric as aml_review_usd,
    count(*) filter (where w.status = 'processing')::bigint as processing_count,
    coalesce(sum(w.amount_usd) filter (where w.status = 'processing'), 0)::numeric as processing_usd,
    coalesce(sum(w.amount_usd) filter (where w.status = 'completed' and w.completed_at::date = current_date), 0)::numeric as completed_today_usd,
    coalesce(sum(w.amount_usd) filter (where w.status = 'rejected' and w.rejected_at::date = current_date), 0)::numeric as rejected_today_usd,
    coalesce(
      avg(extract(epoch from (w.completed_at - w.created_at)) / 3600)
        filter (where w.status = 'completed' and w.completed_at is not null),
      0
    )::numeric as average_processing_hours
  from public.crypto_withdrawals w
  where public.is_admin();
$$;
