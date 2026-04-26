-- 07_tags.sql
-- Account tags for admin filtering and staff context.
-- tags: catalog of reusable tags. user_tags: many-to-many link to users.

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  color text not null default '#5F9EA0',
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.user_tags (
  user_id uuid not null references public.profiles(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  assigned_by uuid references public.admin_users(user_id),
  note text,
  created_at timestamptz not null default now(),
  primary key (user_id, tag_id)
);

create index user_tags_user_id_idx on public.user_tags (user_id);
create index user_tags_tag_id_idx on public.user_tags (tag_id);

-- Starter tags -------------------------------------------------------------

insert into public.tags (slug, label, color, description, is_system)
values
  ('vip', 'VIP', '#5F9EA0', 'High value or priority account.', true),
  ('watchlist', 'Watchlist', '#b1423a', 'Account requires staff monitoring.', true),
  ('withdrawal-hold', 'Withdrawal Hold', '#a66510', 'Withdrawals should be reviewed manually.', true),
  ('needs-kyc', 'Needs KYC', '#a66510', 'User must complete verification.', true),
  ('support-priority', 'Support Priority', '#3c7f80', 'Support should prioritize this account.', true)
on conflict (slug) do nothing;

-- RLS ----------------------------------------------------------------------

alter table public.tags enable row level security;
alter table public.user_tags enable row level security;

create policy "Authenticated users can read tags"
on public.tags
for select
to authenticated
using (true);

create policy "Admins can manage tags"
on public.tags
for all
to authenticated
using (public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]))
with check (public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]));

create policy "Users can read own tags"
on public.user_tags
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read user tags"
on public.user_tags
for select
to authenticated
using (public.is_admin());

create policy "Admins can manage user tags"
on public.user_tags
for all
to authenticated
using (public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]))
with check (public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]));
