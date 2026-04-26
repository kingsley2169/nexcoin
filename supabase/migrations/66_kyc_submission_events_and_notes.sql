-- 66_kyc_submission_events_and_notes.sql
-- Timeline events and admin-only internal notes for KYC submissions.
-- Users can read non-internal events for their own submission; admins can
-- read and write the full review trail.

create table public.kyc_submission_events (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.kyc_submissions(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_admin_id uuid references public.admin_users(user_id) on delete set null,
  action_type public.admin_action_type not null,
  title text not null,
  from_status public.kyc_submission_status,
  to_status public.kyc_submission_status,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now(),

  constraint kyc_submission_events_title_not_blank check (length(trim(title)) > 0)
);

create index kyc_submission_events_submission_idx
on public.kyc_submission_events (submission_id, created_at desc);

create index kyc_submission_events_actor_admin_idx
on public.kyc_submission_events (actor_admin_id, created_at desc);

create table public.kyc_submission_internal_notes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.kyc_submissions(id) on delete cascade,
  admin_id uuid references public.admin_users(user_id) on delete set null,
  note text not null,
  created_at timestamptz not null default now(),

  constraint kyc_submission_internal_notes_note_not_blank check (length(trim(note)) > 0)
);

create index kyc_submission_internal_notes_submission_idx
on public.kyc_submission_internal_notes (submission_id, created_at desc);

alter table public.kyc_submission_events enable row level security;
alter table public.kyc_submission_internal_notes enable row level security;

create policy "Users can read own kyc submission events"
on public.kyc_submission_events
for select
to authenticated
using (
  exists (
    select 1
    from public.kyc_submissions s
    where s.id = kyc_submission_events.submission_id
      and s.user_id = auth.uid()
  )
  and action_type <> 'kyc_submission_note_added'::public.admin_action_type
  and action_type <> 'kyc_submission_check_updated'::public.admin_action_type
);

create policy "Admins can read kyc submission events"
on public.kyc_submission_events
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert kyc submission events"
on public.kyc_submission_events
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can read kyc submission internal notes"
on public.kyc_submission_internal_notes
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert kyc submission internal notes"
on public.kyc_submission_internal_notes
for insert
to authenticated
with check (public.is_admin());
