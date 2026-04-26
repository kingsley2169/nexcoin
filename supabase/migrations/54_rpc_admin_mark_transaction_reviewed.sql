-- 54_rpc_admin_mark_transaction_reviewed.sql
-- Marks a ledger row as reviewed. Upserts into `transaction_reviews` so the
-- same transaction can be re-reviewed later (the row carries the latest admin
-- and timestamp).

create or replace function public.admin_mark_transaction_reviewed(
  source_type public.transaction_source_type,
  source_id uuid
)
returns public.transaction_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
  upserted public.transaction_reviews;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if source_type = 'crypto_deposit' then
    select user_id
    into target_user_id
    from public.crypto_deposits
    where id = source_id;
  elsif source_type = 'crypto_withdrawal' then
    select user_id
    into target_user_id
    from public.crypto_withdrawals
    where id = source_id;
  end if;

  if target_user_id is null then
    raise exception 'Transaction not found';
  end if;

  insert into public.transaction_reviews (
    source_type,
    source_id,
    reviewed_by,
    reviewed_at
  )
  values (
    source_type,
    source_id,
    auth.uid(),
    now()
  )
  on conflict (source_type, source_id) do update
  set
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at
  returning * into upserted;

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
    target_user_id,
    'transaction_reviewed',
    'transaction_reviews',
    upserted.id,
    to_jsonb(upserted)
  );

  return upserted;
end;
$$;
