-- 12_admin_user_management_view.sql
-- Read model for the Admin User Management page.
-- security_invoker = true means RLS on the underlying tables applies:
--   - users see only their own row (via profiles RLS).
--   - admins see all rows.

create or replace view public.admin_user_management_view
with (security_invoker = true)
as
select
  p.id,
  p.full_name as name,
  p.email,
  p.country,
  p.account_status as status,
  p.created_at,
  p.last_active_at,
  uc.kyc_status,
  uc.risk_level as risk,
  uc.risk_score,
  uc.flagged_reason,
  coalesce(ubs.available_balance_usd, 0) as available_balance_usd,
  coalesce(ubs.locked_balance_usd, 0) as locked_balance_usd,
  coalesce(ubs.deposits_usd, 0) as deposits_usd,
  coalesce(ubs.withdrawals_usd, 0) as withdrawals_usd,
  coalesce(ubs.active_plans_count, 0) as active_plans,
  coalesce(
    jsonb_agg(
      distinct jsonb_build_object(
        'id', t.id,
        'slug', t.slug,
        'label', t.label,
        'color', t.color
      )
    ) filter (where t.id is not null),
    '[]'::jsonb
  ) as tags
from public.profiles p
left join public.user_compliance uc on uc.user_id = p.id
left join public.user_balance_snapshots ubs on ubs.user_id = p.id
left join public.user_tags ut on ut.user_id = p.id
left join public.tags t on t.id = ut.tag_id
group by
  p.id,
  uc.user_id,
  ubs.user_id;
