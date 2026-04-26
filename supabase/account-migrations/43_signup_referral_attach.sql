-- 43_signup_referral_attach.sql
-- Extends handle_new_user (last set in 03) so that when a signup arrives
-- with `raw_user_meta_data->>'referral_code'`, we look up the referring
-- profile and insert a `referrals` row linking them.
--
-- Must run after 37_referrals.sql so the table exists — and must be the
-- last file in Phase 8 so every dependency is already committed.
--
-- Accepts either the full `NEX-ABC123` code or the bare `ABC123` suffix
-- (landing pages often strip the prefix in their query strings). Case is
-- normalised to uppercase before lookup.
--
-- Silent on errors: if the code does not match any profile, or the
-- referrer is somehow the same user, signup still succeeds — the only
-- thing that is skipped is the referral row. This keeps a bad marketing
-- URL from blocking a legitimate signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incoming_code text;
  v_referrer_id uuid;
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    phone_number,
    country,
    referral_code,
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
    public.generate_referral_code(),
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

  v_incoming_code := nullif(upper(trim(new.raw_user_meta_data->>'referral_code')), '');
  if v_incoming_code is not null then
    if v_incoming_code !~ '^NEX-' then
      v_incoming_code := 'NEX-' || v_incoming_code;
    end if;

    select id
    into v_referrer_id
    from public.profiles
    where referral_code = v_incoming_code
      and id <> new.id
    limit 1;

    if v_referrer_id is not null then
      insert into public.referrals (
        referrer_user_id,
        referee_user_id,
        status,
        joined_at
      )
      values (
        v_referrer_id,
        new.id,
        'signed_up',
        coalesce(new.created_at, now())
      )
      on conflict (referee_user_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;
