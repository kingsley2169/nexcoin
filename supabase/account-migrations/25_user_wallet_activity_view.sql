-- 25_user_wallet_activity_view.sql
-- Activity feed for /account/wallets. Combines:
--   1. "Wallet saved" rows from withdrawal_addresses.created_at
--   2. Withdrawal usage rows for saved destinations from crypto_withdrawals
--
-- The wallet page uses this to show a simple timeline of wallet management and
-- wallet-linked withdrawal activity without reaching into admin-only tables.

create or replace view public.user_wallet_activity_view
with (security_invoker = true)
as
with saved_wallet_activity as (
  select
    wa.id as id,
    wa.user_id,
    upper(wa.asset::text) as asset_symbol,
    wa.created_at,
    'Saved ' || wa.label || ' wallet' as label,
    'WL-' || upper(replace(left(wa.id::text, 8), '-', '')) as reference,
    case
      when wa.status = 'pending_confirmation' then 'Pending'
      else 'Saved'
    end as status,
    'Wallet'::text as type
  from public.withdrawal_addresses wa
  where wa.user_id = auth.uid()
    and wa.archived_at is null
),
withdrawal_usage_activity as (
  select
    w.id,
    w.user_id,
    upper(w.asset::text) as asset_symbol,
    w.created_at,
    case
      when coalesce(nullif(trim(w.destination_label_snapshot), ''), '') <> ''
        then 'Used ' || w.destination_label_snapshot || ' for withdrawal'
      else 'Used saved wallet for withdrawal'
    end as label,
    w.reference,
    case
      when w.status = 'completed' then 'Completed'
      else 'Pending'
    end as status,
    'Withdrawal'::text as type
  from public.crypto_withdrawals w
  where w.user_id = auth.uid()
    and w.destination_address_id is not null
    and w.status in ('pending', 'aml_review', 'approved', 'processing', 'completed')
)
select *
from (
  select * from saved_wallet_activity
  union all
  select * from withdrawal_usage_activity
) activity
order by created_at desc, id desc;

grant select on public.user_wallet_activity_view to authenticated;
