-- 47_rpc_admin_add_crypto_withdrawal_note.sql
-- Admin RPC for internal withdrawal review notes.

create or replace function public.admin_add_crypto_withdrawal_note(
  withdrawal_id uuid,
  note text
)
returns public.crypto_withdrawal_internal_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_withdrawal public.crypto_withdrawals;
  inserted_note public.crypto_withdrawal_internal_notes;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'finance', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  if length(trim(note)) = 0 then
    raise exception 'Note cannot be blank';
  end if;

  select *
  into selected_withdrawal
  from public.crypto_withdrawals
  where id = withdrawal_id;

  if selected_withdrawal.id is null then
    raise exception 'Withdrawal not found';
  end if;

  insert into public.crypto_withdrawal_internal_notes (
    withdrawal_id,
    admin_id,
    note
  )
  values (
    withdrawal_id,
    auth.uid(),
    trim(note)
  )
  returning * into inserted_note;

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
    'withdrawal_note_added',
    'Internal note added',
    jsonb_build_object('noteId', inserted_note.id)
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
    'withdrawal_note_added',
    'crypto_withdrawal_internal_notes',
    inserted_note.id,
    jsonb_build_object('withdrawalId', withdrawal_id)
  );

  return inserted_note;
end;
$$;
