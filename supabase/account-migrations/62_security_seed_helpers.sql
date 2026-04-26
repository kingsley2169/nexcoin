-- 62_security_seed_helpers.sql
-- Default row seeding for /account/security so existing users and future
-- signups always have the required base records.

create or replace function public.seed_security_rows_for_user(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if p_user_id is null then
    return;
  end if;

  select *
  into v_profile
  from public.profiles
  where id = p_user_id;

  if v_profile.id is null then
    return;
  end if;

  insert into public.user_2fa_settings (
    user_id,
    enabled,
    recovery_email
  )
  values (
    p_user_id,
    false,
    v_profile.email
  )
  on conflict (user_id) do nothing;

  insert into public.user_security_settings (
    user_id
  )
  values (
    p_user_id
  )
  on conflict (user_id) do nothing;
end;
$$;

revoke all on function public.seed_security_rows_for_user(uuid) from public;

create or replace function public.handle_new_profile_security_rows()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_security_rows_for_user(new.id);
  return new;
end;
$$;

create trigger create_default_security_rows
after insert on public.profiles
for each row execute function public.handle_new_profile_security_rows();

select public.seed_security_rows_for_user(id)
from public.profiles;
