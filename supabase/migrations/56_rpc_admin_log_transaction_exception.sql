-- 56_rpc_admin_log_transaction_exception.sql
-- Admin RPC: logs a ledger exception (e.g., duplicate tx hash, amount
-- mismatch, orphan fee). Pass `source_type` + `source_id` when the exception
-- is tied to a specific ledger row, or leave both null for general
-- reconciliation findings.

create or replace function public.admin_log_transaction_exception(
  exception_code text,
  title text,
  description text,
  severity public.transaction_exception_severity default 'medium',
  source_type public.transaction_source_type default null,
  source_id uuid default null
)
returns public.transaction_exceptions
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted public.transaction_exceptions;
  resolved_target_user_id uuid;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance', 'compliance']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if exception_code is null or length(trim(exception_code)) = 0 then
    raise exception 'Exception code is required';
  end if;

  if title is null or length(trim(title)) = 0 then
    raise exception 'Title is required';
  end if;

  if description is null or length(trim(description)) = 0 then
    raise exception 'Description is required';
  end if;

  if (source_type is null) <> (source_id is null) then
    raise exception 'source_type and source_id must be provided together';
  end if;

  if source_type = 'crypto_deposit' then
    select user_id
    into resolved_target_user_id
    from public.crypto_deposits
    where id = source_id;

    if resolved_target_user_id is null then
      raise exception 'Deposit not found';
    end if;
  elsif source_type = 'crypto_withdrawal' then
    select user_id
    into resolved_target_user_id
    from public.crypto_withdrawals
    where id = source_id;

    if resolved_target_user_id is null then
      raise exception 'Withdrawal not found';
    end if;
  end if;

  insert into public.transaction_exceptions (
    source_type,
    source_id,
    exception_code,
    severity,
    title,
    description,
    created_by
  )
  values (
    source_type,
    source_id,
    trim(exception_code),
    severity,
    trim(title),
    trim(description),
    auth.uid()
  )
  returning * into inserted;

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
    resolved_target_user_id,
    'transaction_exception_logged',
    'transaction_exceptions',
    inserted.id,
    to_jsonb(inserted)
  );

  return inserted;
end;
$$;
