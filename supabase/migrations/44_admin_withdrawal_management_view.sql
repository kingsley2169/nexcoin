-- 44_admin_withdrawal_management_view.sql
-- Read model for /nexcoin-admin-priv/withdrawals-management.

create or replace view public.admin_withdrawal_management_view
with (security_invoker = true)
as
with check_rollup as (
  select
    c.withdrawal_id,
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'label', c.label,
        'status', c.status,
        'details', c.details,
        'displayOrder', c.display_order,
        'updatedAt', c.updated_at
      )
      order by c.display_order, c.created_at
    ) as checks
  from public.crypto_withdrawal_checks c
  group by c.withdrawal_id
),
note_rollup as (
  select
    n.withdrawal_id,
    jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'note', n.note,
        'adminId', n.admin_id,
        'createdAt', n.created_at
      )
      order by n.created_at desc
    ) as internal_notes
  from public.crypto_withdrawal_internal_notes n
  group by n.withdrawal_id
),
event_rollup as (
  select
    e.withdrawal_id,
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
  from public.crypto_withdrawal_events e
  group by e.withdrawal_id
)
select
  w.id,
  w.reference,
  w.user_id,
  p.full_name as user_name,
  p.email as user_email,
  p.account_status,
  uc.kyc_status,
  w.asset,
  upper(w.asset::text) as asset_symbol,
  w.network,
  w.amount,
  w.amount_usd,
  w.rate_usd,
  w.fee,
  w.fee_usd,
  w.net_amount,
  w.destination_address_id,
  w.destination_label_snapshot as destination_label,
  w.destination_address_snapshot as destination_address,
  w.status,
  w.risk_level as risk,
  w.security_notes,
  w.tx_hash,
  w.reviewed_by,
  w.approved_at,
  w.processing_at,
  w.completed_at,
  w.rejected_at,
  w.rejection_reason,
  w.created_at,
  w.updated_at,
  coalesce(cr.checks, '[]'::jsonb) as checks,
  coalesce(nr.internal_notes, '[]'::jsonb) as internal_notes,
  coalesce(er.timeline, '[]'::jsonb) as timeline
from public.crypto_withdrawals w
join public.profiles p on p.id = w.user_id
left join public.user_compliance uc on uc.user_id = w.user_id
left join check_rollup cr on cr.withdrawal_id = w.id
left join note_rollup nr on nr.withdrawal_id = w.id
left join event_rollup er on er.withdrawal_id = w.id
where public.is_admin();
