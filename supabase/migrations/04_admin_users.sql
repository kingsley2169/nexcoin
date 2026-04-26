-- 04_admin_users.sql
-- Staff/admin identities + role helpers + RLS.
-- The role helpers are security definer so RLS policies on admin_users can reference
-- them without recursing into admin_users itself.

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index admin_users_role_idx on public.admin_users (role);
create index admin_users_active_idx on public.admin_users (is_active);

create trigger set_updated_at_admin_users
before update on public.admin_users
for each row execute function extensions.moddatetime(updated_at);

-- Role helpers -------------------------------------------------------------

create or replace function public.current_admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = public
as $$
  select au.role
  from public.admin_users au
  where au.user_id = auth.uid()
    and au.is_active = true
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_role() is not null;
$$;

create or replace function public.is_admin_with_role(allowed_roles public.admin_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_role() = any(allowed_roles);
$$;

-- RLS ----------------------------------------------------------------------

alter table public.admin_users enable row level security;

create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

create policy "Owners can manage admin users"
on public.admin_users
for all
to authenticated
using (public.is_admin_with_role(array['owner']::public.admin_role[]))
with check (public.is_admin_with_role(array['owner']::public.admin_role[]));
