-- 11_signup_trigger.sql
-- Whenever a user signs up via Supabase Auth, create the matching app rows:
--   - profiles          (the main account row)
--   - user_compliance   (default unverified / low risk)
--   - user_balance_snapshots (default zeros)
-- Depends on all three of those tables existing, so it runs after 08_user_balance_snapshots.sql.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    phone_number,
    country,
    signup_ip,
    signup_user_agent,
    created_at,
    updated_at
  )
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    nullif(new.raw_user_meta_data->>'phone_number', ''),
    nullif(new.raw_user_meta_data->>'country', ''),
    nullif(new.raw_user_meta_data->>'signup_ip', '')::inet,
    nullif(new.raw_user_meta_data->>'signup_user_agent', ''),
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do nothing;

  insert into public.user_compliance (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_balance_snapshots (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
