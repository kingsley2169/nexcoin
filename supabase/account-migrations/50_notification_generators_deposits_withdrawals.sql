-- 50_notification_generators_deposits_withdrawals.sql
-- Trigger-based notification generators for deposit and withdrawal activity.

create or replace function public.notify_on_crypto_deposit_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body text;
  v_priority public.notification_priority := 'normal';
begin
  if tg_op = 'INSERT' then
    v_title := upper(new.asset::text) || ' deposit request opened';
    v_body := 'Your ' || new.reference || ' deposit request was created for '
      || new.network || '. Mark it as sent once you broadcast funds.';

    perform public.enqueue_notification(
      new.user_id,
      'transaction',
      v_title,
      v_body,
      'normal',
      '/account/deposit',
      'Open deposit',
      'deposit:' || new.id::text || ':created',
      'crypto_deposits',
      new.id
    );

    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  case new.status
    when 'confirming' then
      v_title := upper(new.asset::text) || ' deposit confirming';
      v_body := 'Your deposit ' || new.reference || ' is now waiting for network confirmations.';
    when 'needs_review' then
      v_title := 'Deposit under review';
      v_body := 'Deposit ' || new.reference || ' needs manual review before it can be credited.';
      v_priority := 'high';
    when 'credited' then
      v_title := upper(new.asset::text) || ' deposit credited';
      v_body := 'Deposit ' || new.reference || ' was credited to your balance.';
    when 'rejected' then
      v_title := 'Deposit rejected';
      v_body := 'Deposit ' || new.reference || ' was rejected during review.';
      v_priority := 'high';
    else
      return new;
  end case;

  perform public.enqueue_notification(
    new.user_id,
    'transaction',
    v_title,
    v_body,
    v_priority,
    '/account/transactions?ref=' || new.reference,
    'View transaction',
    'deposit:' || new.id::text || ':' || new.status::text,
    'crypto_deposits',
    new.id
  );

  return new;
end;
$$;

create trigger create_notifications_for_crypto_deposits
after insert or update on public.crypto_deposits
for each row execute function public.notify_on_crypto_deposit_change();

create or replace function public.notify_on_crypto_withdrawal_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body text;
  v_priority public.notification_priority := 'normal';
begin
  if tg_op = 'INSERT' then
    v_title := 'Withdrawal request submitted';
    v_body := 'Your ' || new.reference || ' withdrawal request for '
      || new.amount::text || ' ' || upper(new.asset::text)
      || ' was submitted to ' || new.destination_label_snapshot || '.';

    perform public.enqueue_notification(
      new.user_id,
      'transaction',
      v_title,
      v_body,
      'normal',
      '/account/withdrawal',
      'Review withdrawal',
      'withdrawal:' || new.id::text || ':created',
      'crypto_withdrawals',
      new.id
    );

    return new;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  case new.status
    when 'aml_review' then
      v_title := 'Withdrawal request under review';
      v_body := 'Withdrawal ' || new.reference || ' is pending AML/security review.';
      v_priority := 'high';
    when 'approved' then
      v_title := 'Withdrawal approved';
      v_body := 'Withdrawal ' || new.reference || ' was approved and is queued for processing.';
    when 'processing' then
      v_title := 'Withdrawal processing';
      v_body := 'Withdrawal ' || new.reference || ' is being broadcast to the network.';
    when 'completed' then
      v_title := 'Withdrawal completed';
      v_body := 'Withdrawal ' || new.reference || ' completed successfully.';
    when 'rejected' then
      v_title := 'Withdrawal rejected';
      v_body := 'Withdrawal ' || new.reference || ' was rejected during review.';
      v_priority := 'high';
    else
      return new;
  end case;

  perform public.enqueue_notification(
    new.user_id,
    'transaction',
    v_title,
    v_body,
    v_priority,
    '/account/transactions?ref=' || new.reference,
    'View transaction',
    'withdrawal:' || new.id::text || ':' || new.status::text,
    'crypto_withdrawals',
    new.id
  );

  return new;
end;
$$;

create trigger create_notifications_for_crypto_withdrawals
after insert or update on public.crypto_withdrawals
for each row execute function public.notify_on_crypto_withdrawal_change();
