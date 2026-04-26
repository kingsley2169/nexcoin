-- 17_user_withdrawal_summary_view.sql
-- Read model for /account/withdrawal. Returns one row per supported asset with
-- fee config, balance snapshot context, saved-address stats, and limit usage.
--
-- security_invoker = false so the auth.uid() filter is authoritative while the
-- view safely joins admin-only tables like user_compliance.

create or replace view public.user_withdrawal_summary_view
with (security_invoker = false)
as
with me as (
  select
    p.id as user_id,
    p.tier
  from public.profiles p
  where p.id = auth.uid()
),
history_usage as (
  select
    w.asset,
    coalesce(sum(case
      when w.created_at >= date_trunc('day', now())
       and w.status <> 'rejected'
      then w.amount_usd
      else 0
    end), 0)::numeric(18, 2) as daily_used_usd,
    coalesce(sum(case
      when w.created_at >= date_trunc('month', now())
       and w.status <> 'rejected'
      then w.amount_usd
      else 0
    end), 0)::numeric(18, 2) as monthly_used_usd,
    coalesce(sum(case
      when w.status in ('pending', 'aml_review', 'approved', 'processing')
      then w.amount_usd
      else 0
    end), 0)::numeric(18, 2) as pending_usd,
    max(w.created_at) as last_withdrawal_at
  from public.crypto_withdrawals w
  where w.user_id = auth.uid()
  group by w.asset
),
address_usage as (
  select
    wa.asset,
    count(*)::integer as saved_address_count,
    bool_or(wa.is_default) as has_default_address,
    max(coalesce(wa.last_used_at, wa.updated_at, wa.created_at)) as last_address_activity_at
  from public.withdrawal_addresses wa
  where wa.user_id = auth.uid()
    and wa.archived_at is null
  group by wa.asset
),
holdings as (
  select
    coalesce(d.asset, w.asset) as asset,
    coalesce(d.amount_in, 0) - coalesce(w.amount_out, 0) as net_amount
  from (
    select asset, sum(amount)::numeric(28, 8) as amount_in
    from public.crypto_deposits
    where user_id = auth.uid()
      and status = 'credited'
    group by asset
  ) d
  full outer join (
    select asset, sum(amount)::numeric(28, 8) as amount_out
    from public.crypto_withdrawals
    where user_id = auth.uid()
      and status = 'completed'
    group by asset
  ) w on w.asset = d.asset
)
select
  cu.user_id,
  fs.asset,
  fs.asset::text as asset_id,
  fs.symbol,
  fs.display_name as name,
  fs.network,
  fs.min_withdrawal,
  fs.fee_flat,
  fs.fee_percent,
  fs.placeholder_rate_usd,
  coalesce(ubs.available_balance_usd, 0)::numeric(18, 2) as available_balance_usd,
  round(greatest(coalesce(h.net_amount, 0), 0), 8) as estimated_available_balance,
  coalesce(
    nullif(uwl.daily_limit_usd, 0),
    nullif(ktl.daily_withdrawal_usd, 0),
    nullif(uc.withdrawal_limit_usd, 0),
    0
  )::numeric(18, 2) as daily_limit_usd,
  coalesce(
    nullif(uwl.monthly_limit_usd, 0),
    nullif(ktl.monthly_withdrawal_usd, 0),
    0
  )::numeric(18, 2) as monthly_limit_usd,
  greatest(
    coalesce(hu.daily_used_usd, 0),
    coalesce(uwl.daily_used_usd, 0)
  )::numeric(18, 2) as daily_used_usd,
  greatest(
    coalesce(hu.monthly_used_usd, 0),
    coalesce(uwl.monthly_used_usd, 0)
  )::numeric(18, 2) as monthly_used_usd,
  greatest(
    coalesce(hu.pending_usd, 0),
    coalesce(uwl.pending_usd, 0)
  )::numeric(18, 2) as pending_usd,
  greatest(
    coalesce(
      nullif(uwl.daily_limit_usd, 0),
      nullif(ktl.daily_withdrawal_usd, 0),
      nullif(uc.withdrawal_limit_usd, 0),
      0
    ) - greatest(coalesce(hu.daily_used_usd, 0), coalesce(uwl.daily_used_usd, 0)),
    0
  )::numeric(18, 2) as daily_remaining_usd,
  greatest(
    coalesce(
      nullif(uwl.monthly_limit_usd, 0),
      nullif(ktl.monthly_withdrawal_usd, 0),
      0
    ) - greatest(coalesce(hu.monthly_used_usd, 0), coalesce(uwl.monthly_used_usd, 0)),
    0
  )::numeric(18, 2) as monthly_remaining_usd,
  coalesce(au.saved_address_count, 0) as saved_address_count,
  coalesce(au.has_default_address, false) as has_default_address,
  coalesce(uwl.processing_time_label, fs.processing_time_label) as processing_time_label,
  hu.last_withdrawal_at,
  au.last_address_activity_at,
  ubs.updated_at as balance_updated_at
from me cu
join public.user_withdrawal_fee_schedule fs
  on fs.is_active = true
left join public.user_balance_snapshots ubs
  on ubs.user_id = cu.user_id
left join public.user_compliance uc
  on uc.user_id = cu.user_id
left join public.kyc_tier_limits ktl
  on ktl.tier = cu.tier
left join public.user_withdrawal_limits uwl
  on uwl.user_id = cu.user_id
 and uwl.asset = fs.asset
left join history_usage hu
  on hu.asset = fs.asset
left join address_usage au
  on au.asset = fs.asset
left join holdings h
  on h.asset = fs.asset
order by fs.display_order, fs.symbol;

grant select on public.user_withdrawal_summary_view to authenticated;
