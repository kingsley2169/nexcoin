-- 13_user_recent_deposits_view.sql
-- Read model for the "Recent deposits" table on /account/deposit. Returns the
-- logged-in user's deposit rows with display-ready labels and the latest
-- non-internal event timestamp so the page can sort or annotate later without
-- additional joins.

create or replace view public.user_recent_deposits_view
with (security_invoker = true)
as
with latest_event as (
  select
    e.deposit_id,
    max(e.created_at) as last_event_at
  from public.crypto_deposit_events e
  group by e.deposit_id
)
select
  d.id,
  d.reference,
  d.asset,
  upper(d.asset::text) as asset_symbol,
  d.network as method,
  d.amount,
  d.amount_usd,
  d.confirmations,
  d.confirmations_required,
  d.tx_hash,
  d.sender_address,
  d.receiving_address_snapshot as wallet_address,
  d.created_at,
  coalesce(le.last_event_at, d.created_at) as last_event_at,
  case d.status
    when 'pending' then 'Pending'
    when 'confirming' then 'Confirming'
    when 'needs_review' then 'Needs Review'
    when 'credited' then 'Credited'
    when 'rejected' then 'Rejected'
  end as status
from public.crypto_deposits d
left join latest_event le on le.deposit_id = d.id
where d.user_id = auth.uid()
order by d.created_at desc;

grant select on public.user_recent_deposits_view to authenticated;
