-- 57_rpc_admin_resolve_transaction_exception.sql
-- Admin RPC: marks a logged transaction exception as resolved. Idempotent —
-- calling it on an already-resolved exception returns the existing row
-- unchanged.

create or replace function public.admin_resolve_transaction_exception(
  exception_id uuid
)
returns public.transaction_exceptions
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.transaction_exceptions;
  updated public.transaction_exceptions;
  resolved_target_user_id uuid;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance', 'compliance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select *
  into existing
  from public.transaction_exceptions
  where id = exception_id
  for update;

  if existing.id is null then
    raise exception 'Exception not found';
  end if;

  if existing.resolved_at is not null then
    return existing;
  end if;

  update public.transaction_exceptions
  set
    resolved_by = auth.uid(),
    resolved_at = now()
  where id = exception_id
  returning * into updated;

  if updated.source_type = 'crypto_deposit' then
    select user_id
    into resolved_target_user_id
    from public.crypto_deposits
    where id = updated.source_id;
  elsif updated.source_type = 'crypto_withdrawal' then
    select user_id
    into resolved_target_user_id
    from public.crypto_withdrawals
    where id = updated.source_id;
  end if;

  insert into public.admin_audit_logs (
    actor_admin_id,
    target_user_id,
    action_type,
    entity_table,
    entity_id,
    old_values,
    new_values
  )
  values (
    auth.uid(),
    resolved_target_user_id,
    'transaction_exception_resolved',
    'transaction_exceptions',
    exception_id,
    to_jsonb(existing),
    to_jsonb(updated)
  );

  return updated;
end;
$$;
