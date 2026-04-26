-- 43_crypto_withdrawal_checks_events_notes.sql
-- Admin review checks, timeline events, and internal notes for withdrawals.

create table public.crypto_withdrawal_checks (
  id uuid primary key default gen_random_uuid(),
  withdrawal_id uuid not null references public.crypto_withdrawals(id) on delete cascade,
  label text not null,
  status public.withdrawal_check_status not null,
  details text,
  display_order integer not null default 0,
  updated_by uuid references public.admin_users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint crypto_withdrawal_checks_label_not_blank check (length(trim(label)) > 0)
);

create unique index crypto_withdrawal_checks_label_key
on public.crypto_withdrawal_checks (withdrawal_id, lower(label));

create index crypto_withdrawal_checks_withdrawal_idx
on public.crypto_withdrawal_checks (withdrawal_id, display_order);

create trigger set_updated_at_crypto_withdrawal_checks
before update on public.crypto_withdrawal_checks
for each row execute function extensions.moddatetime(updated_at);

create table public.crypto_withdrawal_events (
  id uuid primary key default gen_random_uuid(),
  withdrawal_id uuid not null references public.crypto_withdrawals(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_admin_id uuid references public.admin_users(user_id) on delete set null,
  action_type public.admin_action_type not null,
  title text not null,
  from_status public.withdrawal_status,
  to_status public.withdrawal_status,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index crypto_withdrawal_events_withdrawal_idx
on public.crypto_withdrawal_events (withdrawal_id, created_at desc);

create index crypto_withdrawal_events_actor_admin_idx
on public.crypto_withdrawal_events (actor_admin_id, created_at desc);

create table public.crypto_withdrawal_internal_notes (
  id uuid primary key default gen_random_uuid(),
  withdrawal_id uuid not null references public.crypto_withdrawals(id) on delete cascade,
  admin_id uuid references public.admin_users(user_id) on delete set null,
  note text not null,
  created_at timestamptz not null default now(),

  constraint crypto_withdrawal_internal_notes_note_not_blank check (length(trim(note)) > 0)
);

create index crypto_withdrawal_internal_notes_withdrawal_idx
on public.crypto_withdrawal_internal_notes (withdrawal_id, created_at desc);

-- RLS ----------------------------------------------------------------------

alter table public.crypto_withdrawal_checks enable row level security;
alter table public.crypto_withdrawal_events enable row level security;
alter table public.crypto_withdrawal_internal_notes enable row level security;

create policy "Admins can read withdrawal checks"
on public.crypto_withdrawal_checks
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert withdrawal checks"
on public.crypto_withdrawal_checks
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update withdrawal checks"
on public.crypto_withdrawal_checks
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users can read own withdrawal events"
on public.crypto_withdrawal_events
for select
to authenticated
using (
  exists (
    select 1
    from public.crypto_withdrawals w
    where w.id = crypto_withdrawal_events.withdrawal_id
      and w.user_id = auth.uid()
  )
  and action_type <> 'withdrawal_note_added'::public.admin_action_type
  and action_type <> 'withdrawal_check_updated'::public.admin_action_type
);

create policy "Admins can read withdrawal events"
on public.crypto_withdrawal_events
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert withdrawal events"
on public.crypto_withdrawal_events
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can read withdrawal internal notes"
on public.crypto_withdrawal_internal_notes
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert withdrawal internal notes"
on public.crypto_withdrawal_internal_notes
for insert
to authenticated
with check (public.is_admin());
