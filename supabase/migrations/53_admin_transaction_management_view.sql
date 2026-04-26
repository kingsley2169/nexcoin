-- 53_admin_transaction_management_view.sql
-- Unified ledger read model for /nexcoin-admin-priv/transactions.
-- v1 unions crypto deposits and crypto withdrawals. Each row carries
-- `source_type` + `source_id` so admin RPCs (mark reviewed / add note /
-- log exception) can dispatch back to the right underlying row.
--
-- The "Reviewed" status in the UI is synthesized: if a row exists in
-- `transaction_reviews` for this (source_type, source_id), status collapses to
-- 'reviewed' regardless of the source row's native status. Failed and rejected
-- items that admins have formally cleared therefore show as Reviewed.
--
-- `linked_reference` mirrors `reference` in v1 because deposits/withdrawals
-- are their own source of truth. Once a dedicated ledger table exists it will
-- carry `TXN-*` references and link back to the source reference here.

create or replace view public.admin_transaction_management_view
with (security_invoker = true)
as
-- Deposits branch ---------------------------------------------------------
select
  d.id,
  'crypto_deposit'::public.transaction_source_type as source_type,
  d.id as source_id,
  d.reference,
  d.reference as linked_reference,
  d.user_id,
  p.full_name as user_name,
  p.email as user_email,
  'Deposit'::text as type,
  'In'::text as direction,
  case
    when tr.id is not null then 'reviewed'
    when d.status = 'pending' then 'pending'
    when d.status in ('confirming', 'needs_review') then 'processing'
    when d.status = 'credited' then 'credited'
    when d.status = 'rejected' then 'rejected'
  end as status,
  upper(d.asset::text) as asset_symbol,
  d.amount,
  d.amount_usd,
  0::numeric as fee_usd,
  d.network,
  'Crypto deposit'::text as method,
  d.receiving_address_snapshot as wallet_address,
  d.tx_hash,
  tr.id is not null as reviewed,
  tr.reviewed_by,
  tr.reviewed_at,
  ex.exception as exception,
  coalesce(nr.internal_notes, '[]'::jsonb) as internal_notes,
  coalesce(er.timeline, '[]'::jsonb) as timeline,
  d.created_at,
  d.updated_at
from public.crypto_deposits d
join public.profiles p on p.id = d.user_id
left join public.transaction_reviews tr
  on tr.source_type = 'crypto_deposit' and tr.source_id = d.id
left join lateral (
  select string_agg(e.title || ': ' || e.description, '; ') as exception
  from public.transaction_exceptions e
  where e.source_type = 'crypto_deposit'
    and e.source_id = d.id
    and e.resolved_at is null
) ex on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', n.id,
      'note', n.note,
      'adminId', n.admin_id,
      'createdAt', n.created_at
    )
    order by n.created_at desc
  ) as internal_notes
  from public.crypto_deposit_internal_notes n
  where n.deposit_id = d.id
) nr on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'label', e.title,
      'actionType', e.action_type,
      'createdAt', e.created_at
    )
    order by e.created_at desc
  ) as timeline
  from public.crypto_deposit_events e
  where e.deposit_id = d.id
    and e.action_type <> 'deposit_note_added'::public.admin_action_type
) er on true

union all

-- Withdrawals branch ------------------------------------------------------
select
  w.id,
  'crypto_withdrawal'::public.transaction_source_type as source_type,
  w.id as source_id,
  w.reference,
  w.reference as linked_reference,
  w.user_id,
  p.full_name as user_name,
  p.email as user_email,
  'Withdrawal'::text as type,
  'Out'::text as direction,
  case
    when tr.id is not null then 'reviewed'
    when w.status = 'pending' then 'pending'
    when w.status in ('aml_review', 'approved', 'processing') then 'processing'
    when w.status = 'completed' then 'completed'
    when w.status = 'rejected' then 'rejected'
  end as status,
  upper(w.asset::text) as asset_symbol,
  w.amount,
  w.amount_usd,
  w.fee_usd,
  w.network,
  'Crypto withdrawal'::text as method,
  w.destination_address_snapshot as wallet_address,
  w.tx_hash,
  tr.id is not null as reviewed,
  tr.reviewed_by,
  tr.reviewed_at,
  ex.exception as exception,
  coalesce(nr.internal_notes, '[]'::jsonb) as internal_notes,
  coalesce(er.timeline, '[]'::jsonb) as timeline,
  w.created_at,
  w.updated_at
from public.crypto_withdrawals w
join public.profiles p on p.id = w.user_id
left join public.transaction_reviews tr
  on tr.source_type = 'crypto_withdrawal' and tr.source_id = w.id
left join lateral (
  select string_agg(e.title || ': ' || e.description, '; ') as exception
  from public.transaction_exceptions e
  where e.source_type = 'crypto_withdrawal'
    and e.source_id = w.id
    and e.resolved_at is null
) ex on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', n.id,
      'note', n.note,
      'adminId', n.admin_id,
      'createdAt', n.created_at
    )
    order by n.created_at desc
  ) as internal_notes
  from public.crypto_withdrawal_internal_notes n
  where n.withdrawal_id = w.id
) nr on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'label', e.title,
      'actionType', e.action_type,
      'createdAt', e.created_at
    )
    order by e.created_at desc
  ) as timeline
  from public.crypto_withdrawal_events e
  where e.withdrawal_id = w.id
    and e.action_type <> 'withdrawal_note_added'::public.admin_action_type
) er on true;
