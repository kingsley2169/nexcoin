-- 39_rpc_get_admin_deposit_management_summary.sql
-- Feeds the summary cards on /nexcoin-admin-priv/deposits-management.

create or replace function public.get_admin_deposit_management_summary()
returns table (
  pending_count bigint,
  pending_usd numeric,
  confirming_count bigint,
  confirming_usd numeric,
  needs_review_count bigint,
  needs_review_usd numeric,
  credited_today_usd numeric,
  rejected_today_usd numeric,
  active_receiving_wallets bigint,
  average_credit_minutes numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where d.status = 'pending')::bigint as pending_count,
    coalesce(sum(d.amount_usd) filter (where d.status = 'pending'), 0)::numeric as pending_usd,
    count(*) filter (where d.status = 'confirming')::bigint as confirming_count,
    coalesce(sum(d.amount_usd) filter (where d.status = 'confirming'), 0)::numeric as confirming_usd,
    count(*) filter (where d.status = 'needs_review')::bigint as needs_review_count,
    coalesce(sum(d.amount_usd) filter (where d.status = 'needs_review'), 0)::numeric as needs_review_usd,
    coalesce(sum(d.amount_usd) filter (where d.status = 'credited' and d.credited_at::date = current_date), 0)::numeric as credited_today_usd,
    coalesce(sum(d.amount_usd) filter (where d.status = 'rejected' and d.rejected_at::date = current_date), 0)::numeric as rejected_today_usd,
    (
      select count(*)::bigint
      from public.deposit_receiving_wallets rw
      where rw.is_active = true
        and rw.archived_at is null
    ) as active_receiving_wallets,
    coalesce(
      avg(extract(epoch from (d.credited_at - d.created_at)) / 60)
        filter (where d.status = 'credited' and d.credited_at is not null),
      0
    )::numeric as average_credit_minutes
  from public.crypto_deposits d
  where public.is_admin();
$$;
