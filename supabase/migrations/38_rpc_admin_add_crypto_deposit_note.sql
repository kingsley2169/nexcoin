-- 38_rpc_admin_add_crypto_deposit_note.sql
-- Adds an internal staff note to a crypto deposit and records an event/audit row.

create or replace function public.admin_add_crypto_deposit_note(
  deposit_id uuid,
  note text
)
returns public.crypto_deposit_internal_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_deposit public.crypto_deposits;
  inserted_note public.crypto_deposit_internal_notes;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if length(trim(note)) = 0 then
    raise exception 'Note cannot be empty';
  end if;

  select *
  into selected_deposit
  from public.crypto_deposits
  where id = deposit_id;

  if selected_deposit.id is null then
    raise exception 'Deposit not found';
  end if;

  insert into public.crypto_deposit_internal_notes (
    deposit_id,
    admin_id,
    note
  )
  values (
    deposit_id,
    auth.uid(),
    trim(note)
  )
  returning * into inserted_note;

  insert into public.crypto_deposit_events (
    deposit_id,
    actor_admin_id,
    action_type,
    title,
    new_values
  )
  values (
    deposit_id,
    auth.uid(),
    'deposit_note_added',
    'Internal note added',
    to_jsonb(inserted_note)
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
    selected_deposit.user_id,
    'deposit_note_added',
    'crypto_deposit_internal_notes',
    inserted_note.id,
    to_jsonb(inserted_note)
  );

  return inserted_note;
end;
$$;
