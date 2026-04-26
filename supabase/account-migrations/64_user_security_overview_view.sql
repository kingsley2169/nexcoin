-- 64_user_security_overview_view.sql
-- Single-row read model for /account/security.
-- Returns the full page contract: 2FA, password/cooldown, protections,
-- devices, recent activity, score, and recommendations.

create or replace view public.user_security_overview_view
with (security_invoker = true)
as
with base as (
  select
    p.id as user_id,
    p.email,
    s2.enabled as two_factor_enabled,
    s2.method as two_factor_method,
    s2.recovery_email,
    s2.backup_codes_generated_at,
    ss.password_last_changed_at,
    ss.password_strength,
    ss.withdrawal_cooldown_hours,
    ss.require_2fa_for_withdrawals,
    ss.confirm_new_withdrawal_addresses,
    ss.withdrawal_cooldown_enabled,
    ss.new_device_alerts
  from public.profiles p
  join public.user_2fa_settings s2
    on s2.user_id = p.id
  join public.user_security_settings ss
    on ss.user_id = p.id
  where p.id = auth.uid()
),
device_rows as (
  select
    d.user_id,
    jsonb_agg(
      jsonb_build_object(
        'id', d.id,
        'device', d.device_name,
        'browser', d.browser,
        'ipAddress', host(d.ip_address),
        'location', d.location,
        'lastActiveAt', d.last_active_at,
        'status',
          case d.status
            when 'current' then 'Current'
            when 'trusted' then 'Trusted'
            when 'review' then 'Review'
            when 'revoked' then 'Review'
          end
      )
      order by d.is_current desc, d.last_active_at desc
    ) as devices
  from public.user_devices d
  where d.user_id = auth.uid()
    and d.status <> 'revoked'
  group by d.user_id
),
activity_rows as (
  select
    a.user_id,
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'title', a.title,
        'device', a.device_label,
        'location', a.location,
        'status',
          case a.status
            when 'completed' then 'Completed'
            when 'review' then 'Review'
          end,
        'createdAt', a.created_at
      )
      order by a.created_at desc
    ) as activity
  from (
    select *
    from public.user_security_activity
    where user_id = auth.uid()
    order by created_at desc
    limit 12
  ) a
  group by a.user_id
),
score_row as (
  select *
  from public.user_security_score_view
),
recommendation_rows as (
  select
    b.user_id,
    array_remove(array[
      case when not b.two_factor_enabled then 'Enable two-factor authentication to protect sign-ins and withdrawals.' end,
      case when not b.require_2fa_for_withdrawals then 'Require 2FA for withdrawals so outbound transfers always need a second check.' end,
      case when not b.confirm_new_withdrawal_addresses then 'Keep confirmation on for new withdrawal addresses before they can be used.' end,
      case when not b.new_device_alerts then 'Turn on new-device alerts so unexpected sign-ins are surfaced immediately.' end,
      case when exists (
        select 1
        from public.user_devices d
        where d.user_id = b.user_id
          and d.status = 'review'
      ) then 'Review trusted devices regularly and remove anything you do not recognise.' end,
      'Use a unique password that is not shared with email, exchange, or wallet accounts.',
      'Nexcoin staff will never ask for passwords, private keys, seed phrases, or 2FA codes.'
    ], null) as recommendations
  from base b
)
select
  b.user_id,
  jsonb_build_object(
    'enabled', b.two_factor_enabled,
    'method',
      case b.two_factor_method
        when 'authenticator_app' then 'Authenticator app'
        when 'email' then 'Email'
        when 'sms' then 'SMS'
        else 'Email'
      end,
    'recoveryEmail', coalesce(b.recovery_email, b.email),
    'backupCodesGeneratedAt', coalesce(b.backup_codes_generated_at, now())
  ) as two_factor,
  jsonb_build_object(
    'lastChangedAt', b.password_last_changed_at,
    'strength',
      case b.password_strength
        when 'strong' then 'Strong'
        else 'Needs attention'
      end,
    'withdrawalCooldownHours', b.withdrawal_cooldown_hours
  ) as password,
  coalesce(sr.score, 'Needs attention') as score,
  coalesce(dr.devices, '[]'::jsonb) as devices,
  jsonb_build_array(
    jsonb_build_object(
      'id', 'withdrawal-2fa',
      'label', 'Require 2FA for withdrawals',
      'description', 'Require a second verification step before sending funds out.',
      'enabled', b.require_2fa_for_withdrawals,
      'isLocked', true,
      'channels', jsonb_build_array('In-app', 'Email')
    ),
    jsonb_build_object(
      'id', 'address-confirmation',
      'label', 'Confirm new withdrawal addresses',
      'description', 'Confirm each newly saved withdrawal address before it can be used.',
      'enabled', b.confirm_new_withdrawal_addresses,
      'channels', jsonb_build_array('In-app', 'Email')
    ),
    jsonb_build_object(
      'id', 'cooldown',
      'label', '24-hour security cooldown',
      'description', 'Pause withdrawals after password or 2FA changes.',
      'enabled', b.withdrawal_cooldown_enabled,
      'isLocked', true,
      'channels', jsonb_build_array('In-app')
    ),
    jsonb_build_object(
      'id', 'new-device-alerts',
      'label', 'New device alerts',
      'description', 'Send an alert when a new device signs in.',
      'enabled', b.new_device_alerts,
      'channels', jsonb_build_array('In-app', 'Email', 'SMS')
    )
  ) as protections,
  coalesce(ar.activity, '[]'::jsonb) as activity,
  rr.recommendations
from base b
left join device_rows dr
  on dr.user_id = b.user_id
left join activity_rows ar
  on ar.user_id = b.user_id
left join score_row sr
  on sr.user_id = b.user_id
left join recommendation_rows rr
  on rr.user_id = b.user_id;

grant select on public.user_security_overview_view to authenticated;
