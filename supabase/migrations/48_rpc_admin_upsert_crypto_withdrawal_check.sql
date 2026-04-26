-- 48_rpc_admin_upsert_crypto_withdrawal_check.sql
-- Admin RPC for updating AML/security check rows in the review modal.

create or replace function public.admin_upsert_crypto_withdrawal_check(
  withdrawal_id uuid,
  check_label text,
  check_status public.withdrawal_check_status,
  check_details text default null,
  check_display_order integer default 0
)
returns public.crypto_withdrawal_checks
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_withdrawal public.crypto_withdrawals;
  upserted_check public.crypto_withdrawal_checks;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if length(trim(check_label)) = 0 then
    raise exception 'Check label cannot be blank';
  end if;

  select *
  into selected_withdrawal
  from public.crypto_withdrawals
  where id = withdrawal_id;

  if selected_withdrawal.id is null then
    raise exception 'Withdrawal not found';
  end if;

  insert into public.crypto_withdrawal_checks (
    withdrawal_id,
    label,
    status,
    details,
    display_order,
    updated_by
  )
  values (
    withdrawal_id,
    trim(check_label),
    check_status,
    nullif(trim(check_details), ''),
    check_display_order,
    auth.uid()
  )
  on conflict (withdrawal_id, (lower(label))) do update
  set
    status = excluded.status,
    details = excluded.details,
    display_order = excluded.display_order,
    updated_by = excluded.updated_by
  returning * into upserted_check;

  insert into public.crypto_withdrawal_events (
    withdrawal_id,
    actor_admin_id,
    action_type,
    title,
    new_values
  )
  values (
    withdrawal_id,
    auth.uid(),
    'withdrawal_check_updated',
    'Withdrawal check updated',
    jsonb_build_object(
      'label', upserted_check.label,
      'status', upserted_check.status,
      'details', upserted_check.details
    )
  );

  insert into public.admin_audit_logs (
    actor_admin_id,
    target_user_id,
    action_type,
    entity_table,
    entity_id,
    new_values
  )
  values (
    auth.uid(),
    selected_withdrawal.user_id,
    'withdrawal_check_updated',
    'crypto_withdrawal_checks',
    upserted_check.id,
    jsonb_build_object(
      'withdrawalId', withdrawal_id,
      'label', upserted_check.label,
      'status', upserted_check.status
    )
  );

  return upserted_check;
end;
$$;
