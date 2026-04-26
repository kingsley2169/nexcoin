-- 05_profiles_rls.sql
-- Profiles RLS and the trigger that prevents users from changing their own account_status.
-- Must run after 04_admin_users.sql (depends on is_admin / is_admin_with_role).

create or replace function public.enforce_profiles_admin_only_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.account_status is distinct from old.account_status
     and not public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Only admins may change account_status';
  end if;
  return new;
end;
$$;

create trigger profiles_enforce_admin_only_columns
before update on public.profiles
for each row execute function public.enforce_profiles_admin_only_columns();

-- RLS ----------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]))
with check (public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]));
