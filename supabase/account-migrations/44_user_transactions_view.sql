-- 44_user_transactions_view.sql
-- Shared ledger read model for /account/transactions.
--
-- v1 minimal: only the money-movement sources that already exist are unioned
-- here (deposits, withdrawals, derived withdrawal fees). The investment /
-- profit / referral CTEs below are kept in source for the v2 build but are
-- not unioned yet — those depend on migrations that arrive later (Phases 6-8
-- in this folder). Re-run this file once those phases are in place to enable
-- the remaining sources.
--
-- This view normalises the account activity sources that already exist across
-- earlier phases into one display-ready shape:
--   - crypto_deposits
--   - crypto_withdrawals
--   - derived withdrawal fee rows
-- Pending v2:
--   - user_investments
--   - user_profit_history_view
--   - referral_earnings
--
-- The column names are chosen to line up with the existing
-- `lib/transactions.ts` UI contract so the page can `select('*')` and map
-- directly with minimal frontend glue.
--
-- security_invoker = false is intentional here. The view masks referral-side
-- profile data, which requires joining `profiles`; tenant scoping is enforced
-- explicitly inside each branch with `auth.uid()`.
--
-- v1 note on fee rows:
-- only withdrawal/network fees are emitted as standalone `type = 'fee'` rows,
-- because there is not yet a dedicated plan/platform-fee ledger table. If
-- that arrives later, it can simply UNION into this view.

create or replace view public.user_transactions_view
with (security_invoker = false)
as
with deposit_rows as (
  select
    ('deposit-' || d.id::text) as id,
    d.id as source_id,
    'crypto_deposit'::text as source_kind,
    'deposit'::text as type,
    case d.status
      when 'pending' then 'pending'
      when 'confirming' then 'processing'
      when 'needs_review' then 'processing'
      when 'credited' then 'completed'
      when 'rejected' then 'failed'
    end as status,
    'in'::text as direction,
    d.amount::numeric(28, 8) as amount,
    d.amount_usd::numeric(18, 2) as amount_usd,
    upper(d.asset::text) as asset_symbol,
    d.reference,
    ('Deposit from ' || d.network)::text as detail,
    null::text as plan_name,
    null::numeric(28, 8) as fee,
    null::text as fee_asset,
    d.receiving_address_snapshot as full_address,
    d.tx_hash,
    case
      when d.status = 'rejected' and coalesce(array_length(d.risk_notes, 1), 0) > 0 then
        'Review notes: ' || array_to_string(d.risk_notes, '; ')
      when d.status = 'rejected' then
        'Deposit was rejected during review.'
      when d.status = 'needs_review' and coalesce(array_length(d.risk_notes, 1), 0) > 0 then
        'Review notes: ' || array_to_string(d.risk_notes, '; ')
      else null
    end as notes,
    d.created_at
  from public.crypto_deposits d
  where d.user_id = auth.uid()
),
withdrawal_rows as (
  select
    ('withdrawal-' || w.id::text) as id,
    w.id as source_id,
    'crypto_withdrawal'::text as source_kind,
    'withdrawal'::text as type,
    case w.status
      when 'pending' then 'pending'
      when 'aml_review' then 'pending'
      when 'approved' then 'processing'
      when 'processing' then 'processing'
      when 'completed' then 'completed'
      when 'rejected' then 'failed'
    end as status,
    'out'::text as direction,
    w.amount::numeric(28, 8) as amount,
    w.amount_usd::numeric(18, 2) as amount_usd,
    upper(w.asset::text) as asset_symbol,
    w.reference,
    ('Withdrawal to ' || w.destination_label_snapshot)::text as detail,
    null::text as plan_name,
    w.fee::numeric(28, 8) as fee,
    upper(w.asset::text) as fee_asset,
    w.destination_address_snapshot as full_address,
    w.tx_hash,
    case
      when w.status = 'rejected' then
        coalesce(nullif(trim(w.rejection_reason), ''), 'Withdrawal was rejected during review.')
      when w.status in ('aml_review', 'approved', 'processing')
        and coalesce(array_length(w.security_notes, 1), 0) > 0 then
        'Security notes: ' || array_to_string(w.security_notes, '; ')
      else null
    end as notes,
    w.created_at
  from public.crypto_withdrawals w
  where w.user_id = auth.uid()
),
withdrawal_fee_rows as (
  select
    ('withdrawal-fee-' || w.id::text) as id,
    w.id as source_id,
    'crypto_withdrawal_fee'::text as source_kind,
    'fee'::text as type,
    case w.status
      when 'pending' then 'pending'
      when 'aml_review' then 'pending'
      when 'approved' then 'processing'
      when 'processing' then 'processing'
      when 'completed' then 'completed'
      when 'rejected' then 'failed'
    end as status,
    'out'::text as direction,
    w.fee::numeric(28, 8) as amount,
    w.fee_usd::numeric(18, 2) as amount_usd,
    upper(w.asset::text) as asset_symbol,
    ('FEE-' || w.reference)::text as reference,
    ('Network fee on withdrawal ' || w.reference)::text as detail,
    null::text as plan_name,
    null::numeric(28, 8) as fee,
    null::text as fee_asset,
    null::text as full_address,
    null::text as tx_hash,
    null::text as notes,
    w.created_at
  from public.crypto_withdrawals w
  where w.user_id = auth.uid()
    and (
      w.fee > 0
    or w.fee_usd > 0
    )
),
_unused_pending_v2 as (
  select null::text as placeholder
)
/*
investment_rows as (
  select
    ('investment-' || ui.id::text) as id,
    ui.id as source_id,
    'user_investment'::text as source_kind,
    'investment'::text as type,
    case
      when ui.status in ('active', 'matured') then 'completed'
      else 'failed'
    end as status,
    'out'::text as direction,
    ui.amount_usd::numeric(28, 8) as amount,
    ui.amount_usd::numeric(18, 2) as amount_usd,
    'USDT'::text as asset_symbol,
    ('INV-' || upper(left(replace(ui.id::text, '-', ''), 8)))::text as reference,
    ('Subscribed to ' || p.name)::text as detail,
    p.name::text as plan_name,
    null::numeric(28, 8) as fee,
    null::text as fee_asset,
    null::text as full_address,
    null::text as tx_hash,
    nullif(trim(ui.cancel_reason), '') as notes,
    ui.created_at
  from public.user_investments ui
  join public.investment_plans p
    on p.id = ui.plan_id
  where ui.user_id = auth.uid()
),
profit_rows as (
  select
    ('profit-' || ph.id) as id,
    ph.investment_id as source_id,
    'investment_profit'::text as source_kind,
    'profit'::text as type,
    lower(ph.display_status) as status,
    'in'::text as direction,
    ph.amount_usd::numeric(28, 8) as amount,
    ph.amount_usd::numeric(18, 2) as amount_usd,
    'USDT'::text as asset_symbol,
    (
      case ph.display_status
        when 'Credited' then 'PRF-'
        when 'Accruing' then 'ACR-'
        else 'PEN-'
      end
      || upper(left(replace(ph.investment_id::text, '-', ''), 8))
    )::text as reference,
    ('Daily accrual on ' || ph.plan_name)::text as detail,
    ph.plan_name::text as plan_name,
    null::numeric(28, 8) as fee,
    null::text as fee_asset,
    null::text as full_address,
    null::text as tx_hash,
    null::text as notes,
    ph.occurred_at as created_at
  from public.user_profit_history_view ph
),
referral_rows as (
  select
    ('referral-' || e.id::text) as id,
    e.id as source_id,
    'referral_earning'::text as source_kind,
    'referral'::text as type,
    e.status::text as status,
    'in'::text as direction,
    e.amount_usd::numeric(28, 8) as amount,
    e.amount_usd::numeric(18, 2) as amount_usd,
    'USDT'::text as asset_symbol,
    e.reference,
    case e.earning_type
      when 'signup_bonus' then 'Referral bonus from ' || coalesce(masked.friend_name, 'friend')
      when 'investment_commission' then 'Investment commission from ' || coalesce(masked.friend_name, 'friend')
      when 'profit_share' then 'Profit share from ' || coalesce(masked.friend_name, 'friend')
    end as detail,
    null::text as plan_name,
    null::numeric(28, 8) as fee,
    null::text as fee_asset,
    null::text as full_address,
    null::text as tx_hash,
    null::text as notes,
    coalesce(e.credited_at, e.created_at) as created_at
  from public.referral_earnings e
  left join lateral (
    select
      case
        when p.first_name is not null and p.last_name is not null then
          lower(p.first_name) || '.' || lower(substr(p.last_name, 1, 1))
        when p.first_name is not null then
          lower(p.first_name)
        when p.full_name is not null then
          lower(regexp_replace(p.full_name, '^(\S+)\s+(\S).*$', '\1.\2'))
        else 'friend'
      end as friend_name
    from public.profiles p
    where p.id = e.referee_user_id
  ) masked on true
  where e.referrer_user_id = auth.uid()
)
*/
select *
from (
  select * from deposit_rows
  union all
  select * from withdrawal_rows
  union all
  select * from withdrawal_fee_rows
) ledger
order by created_at desc, reference desc;

grant select on public.user_transactions_view to authenticated;
