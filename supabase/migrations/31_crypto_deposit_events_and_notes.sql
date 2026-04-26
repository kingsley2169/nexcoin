-- 31_crypto_deposit_events_and_notes.sql
-- Display-friendly timeline and internal notes for crypto deposits. These feed
-- the deposit review modal on the admin page.

create table public.crypto_deposit_events (
  id uuid primary key default gen_random_uuid(),
  deposit_id uuid not null references public.crypto_deposits(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_admin_id uuid references public.admin_users(user_id) on delete set null,
  action_type public.admin_action_type not null,
  title text not null,
  from_status public.deposit_status,
  to_status public.deposit_status,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index crypto_deposit_events_deposit_idx
on public.crypto_deposit_events (deposit_id, created_at desc);

create index crypto_deposit_events_actor_admin_idx
on public.crypto_deposit_events (actor_admin_id, created_at desc);

create table public.crypto_deposit_internal_notes (
  id uuid primary key default gen_random_uuid(),
  deposit_id uuid not null references public.crypto_deposits(id) on delete cascade,
  admin_id uuid references public.admin_users(user_id) on delete set null,
  note text not null,
  created_at timestamptz not null default now(),

  constraint crypto_deposit_internal_notes_note_not_blank check (length(trim(note)) > 0)
);

create index crypto_deposit_internal_notes_deposit_idx
on public.crypto_deposit_internal_notes (deposit_id, created_at desc);

-- RLS ----------------------------------------------------------------------

alter table public.crypto_deposit_events enable row level security;
alter table public.crypto_deposit_internal_notes enable row level security;

create policy "Users can read own deposit events"
on public.crypto_deposit_events
for select
to authenticated
using (
  exists (
    select 1
    from public.crypto_deposits d
    where d.id = crypto_deposit_events.deposit_id
      and d.user_id = auth.uid()
  )
  and action_type <> 'deposit_note_added'::public.admin_action_type
);

create policy "Admins can read deposit events"
on public.crypto_deposit_events
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert deposit events"
on public.crypto_deposit_events
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can read deposit internal notes"
on public.crypto_deposit_internal_notes
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert deposit internal notes"
on public.crypto_deposit_internal_notes
for insert
to authenticated
with check (public.is_admin());
