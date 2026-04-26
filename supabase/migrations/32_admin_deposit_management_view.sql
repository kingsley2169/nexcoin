-- 32_admin_deposit_management_view.sql
-- Read model for /nexcoin-admin-priv/deposits-management.
-- One row per crypto_deposit with user identity, wallet details, timeline,
-- and internal notes pre-shaped for the admin page.

create or replace view public.admin_deposit_management_view
with (security_invoker = true)
as
with note_rollup as (
  select
    n.deposit_id,
    jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'note', n.note,
        'adminId', n.admin_id,
        'createdAt', n.created_at
      )
      order by n.created_at desc
    ) as internal_notes
  from public.crypto_deposit_internal_notes n
  group by n.deposit_id
),
event_rollup as (
  select
    e.deposit_id,
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'label', e.title,
        'actionType', e.action_type,
        'fromStatus', e.from_status,
        'toStatus', e.to_status,
        'createdAt', e.created_at
      )
      order by e.created_at desc
    ) as timeline
  from public.crypto_deposit_events e
  group by e.deposit_id
)
select
  d.id,
  d.reference,
  d.user_id,
  p.full_name as user_name,
  p.email as user_email,
  d.asset,
  upper(d.asset::text) as asset_symbol,
  d.network,
  d.amount,
  d.amount_usd,
  d.rate_usd,
  d.confirmations,
  d.confirmations_required,
  d.tx_hash,
  d.sender_address,
  d.receiving_address_snapshot as wallet_address,
  d.status,
  d.risk_level as risk,
  d.risk_notes,
  d.reviewed_by,
  d.credited_at,
  d.rejected_at,
  d.created_at,
  d.updated_at,
  rw.id as receiving_wallet_id,
  rw.label as receiving_wallet_label,
  coalesce(nr.internal_notes, '[]'::jsonb) as internal_notes,
  coalesce(er.timeline, '[]'::jsonb) as timeline
from public.crypto_deposits d
join public.profiles p on p.id = d.user_id
left join public.deposit_receiving_wallets rw on rw.id = d.receiving_wallet_id
left join note_rollup nr on nr.deposit_id = d.id
left join event_rollup er on er.deposit_id = d.id
where public.is_admin();
