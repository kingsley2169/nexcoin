-- 53_user_notification_preferences_view.sql
-- Read model for the "Delivery settings" panel on /account/notifications.
-- Labels and descriptions are centralised here so the frontend does not have
-- to duplicate the mapping logic.

create or replace view public.user_notification_preferences_view
with (security_invoker = true)
as
select
  np.user_id,
  np.category,
  case np.category
    when 'transaction' then 'transactions'
    when 'investment' then 'investments'
    when 'security' then 'security'
    when 'support' then 'support'
    when 'account' then 'account'
  end as id,
  case np.category
    when 'transaction' then 'Transaction updates'
    when 'investment' then 'Investment updates'
    when 'security' then 'Security alerts'
    when 'support' then 'Support messages'
    when 'account' then 'Account updates'
  end as label,
  case np.category
    when 'transaction' then 'Deposits, withdrawals, fees, and wallet confirmation updates.'
    when 'investment' then 'Profit credits, plan maturity, active plan progress, and reinvestment reminders.'
    when 'security' then 'New sign-ins, password changes, verification requests, and sensitive account events.'
    when 'support' then 'Replies from support, ticket status changes, and document review messages.'
    when 'account' then 'Profile, referral, and general account-level updates.'
  end as description,
  np.email_enabled as email,
  np.in_app_enabled as in_app,
  np.sms_enabled as sms
from public.notification_preferences np
where np.user_id = auth.uid()
order by
  case np.category
    when 'transaction' then 1
    when 'investment' then 2
    when 'security' then 3
    when 'support' then 4
    when 'account' then 5
  end;

grant select on public.user_notification_preferences_view to authenticated;
