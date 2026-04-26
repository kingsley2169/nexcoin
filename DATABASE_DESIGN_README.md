# Nexcoin Database Design README

This document maps the current page data to a Supabase database structure. Each section should review the fields currently used by the page, decide where those fields should live in the database, and include suggested SQL/RLS where useful.

> **Paste target:** the SQL in this document is the design reference. The authoritative paste-ready files live under [`supabase/migrations/`](supabase/migrations/). Paste those into the Supabase SQL Editor in numeric order — see [`supabase/migrations/README.md`](supabase/migrations/README.md) for the full list. Treat that folder as the source of truth; if you change anything here, mirror it there.

## Admin User Management Page

Route: `/nexcoin-admin-priv/users`

Purpose: let admins search signed-up accounts, review status/KYC/risk, inspect balances and activity, and apply account actions like suspend, activate, flag, or clear flag.

### Current Page Data Fields

The current mock data for the page lives in `lib/admin-users.ts`. These fields are currently rendered or used for filtering:

| Current field | Meaning | Recommended source |
| --- | --- | --- |
| `id` | User/account identifier | `profiles.id`, same UUID as `auth.users.id` |
| `name` | User display/full name | `profiles.full_name` |
| `email` | User email | `profiles.email`, copied from `auth.users.email` by trigger |
| `country` | User country | `profiles.country` text column for v1 (full country name). A later migration can normalize this into a `countries` lookup table. |
| `createdAt` | Signup date | `profiles.created_at`, copied from auth signup time |
| `lastActiveAt` | Last app activity | `profiles.last_active_at`, updated by app/session heartbeat |
| `status` | Active, Flagged, Suspended | `profiles.account_status` |
| `kycStatus` | Approved, Pending, Rejected, Unverified | `user_compliance.kyc_status`, later derived from KYC submissions |
| `risk` | High, Medium, Low | `user_compliance.risk_level` |
| `activePlans` | Count of active investments | aggregate from `user_investments` |
| `availableBalanceUsd` | Spendable user balance in USD | aggregate/snapshot from wallet balances or ledger |
| `depositsUsd` | Total credited deposits | aggregate from deposits/ledger |
| `withdrawalsUsd` | Total completed withdrawals | aggregate from withdrawals/ledger |
| Summary `totalUsers` | Total signed-up accounts | count from `profiles` |
| Summary `activeUsers` | Active accounts | count from `profiles where account_status = 'active'` |
| Summary `flaggedUsers` | Flagged accounts | count from `profiles where account_status = 'flagged'` |
| Summary `pendingKyc` | Pending KYC accounts | count from `user_compliance where kyc_status = 'pending'` |

### Design Decision

Use Supabase Auth only for authentication. Do not try to store all user-facing business data inside `auth.users`.

Recommended structure:

- `auth.users`: Supabase-owned signup/login record.
- `public.profiles`: one app profile per auth user. This is the main user account row.
- `public.user_compliance`: KYC state, risk level, limits, review notes.
- `public.tags`: reusable account tags admins can assign.
- `public.user_tags`: many-to-many relationship between users and tags.
- `public.admin_users`: staff/admin identities and roles.
- `public.account_status_events`: audit trail for account status changes.
- `public.admin_audit_logs`: general admin action log.
- `public.user_balance_snapshots`: fast balance totals for admin/user dashboards.
- `public.admin_user_management_view`: read model used by the Admin User Management page.

The Admin User Management page should read mostly from a view, then use RPC/functions for sensitive actions like suspending, flagging, or clearing flags.

### Suggested Migration Order

If this section is later converted into a real Supabase migration, run it in this order:

1. Enum types.
2. `profiles`.
3. `admin_users` and admin role helper functions.
4. `user_compliance`.
5. `tags` and `user_tags`.
6. `user_balance_snapshots`.
7. `account_status_events` and `admin_audit_logs`.
8. `moddatetime` extension and `updated_at` triggers on each table.
9. `enforce_profiles_admin_only_columns` trigger (depends on `is_admin_with_role`).
10. Signup trigger function and trigger.
11. Read views (`admin_user_management_view`, `my_compliance_summary`) and RPC functions.
12. RLS enablement and policies.

The signup trigger is documented early because it explains how signed-up accounts enter the app database, but it should be created only after `user_compliance` and `user_balance_snapshots` exist.

### Enum Types

```sql
create type public.account_status as enum (
  'active',
  'flagged',
  'suspended'
);

create type public.kyc_status as enum (
  'approved',
  'pending',
  'rejected',
  'unverified'
);

create type public.risk_level as enum (
  'low',
  'medium',
  'high'
);

create type public.admin_role as enum (
  'owner',
  'admin',
  'support',
  'compliance',
  'finance',
  'viewer'
);

create type public.admin_action_type as enum (
  'account_activated',
  'account_flagged',
  'account_suspended',
  'account_flag_cleared',
  'tag_assigned',
  'tag_removed',
  'kyc_status_changed',
  'risk_level_changed',
  'note_added'
);
```

Note: DB enum values are lowercase (`'active'`, `'pending'`, `'high'`, etc.), but the current UI types in `lib/admin-users.ts` are PascalCase (`"Active"`, `"Pending"`, `"High"`). When the page is wired to Supabase, lowercase the values before querying and capitalize them for display. A single mapping helper in `lib/admin-users.ts` is enough.

### Updated-At Trigger

Several tables carry an `updated_at` column. Rather than relying on every `UPDATE` to set it manually, use Supabase's built-in `moddatetime` extension to bump it automatically.

```sql
create extension if not exists moddatetime schema extensions;

create trigger set_updated_at_profiles
before update on public.profiles
for each row execute function extensions.moddatetime(updated_at);

create trigger set_updated_at_admin_users
before update on public.admin_users
for each row execute function extensions.moddatetime(updated_at);

create trigger set_updated_at_user_compliance
before update on public.user_compliance
for each row execute function extensions.moddatetime(updated_at);

create trigger set_updated_at_user_balance_snapshots
before update on public.user_balance_snapshots
for each row execute function extensions.moddatetime(updated_at);
```

Create each trigger after the corresponding table exists. Once these are in place, RPCs no longer need `updated_at = now()` in their `SET` clauses.

### Core Signup/Profile Tables

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone_number text,
  country text,
  account_status public.account_status not null default 'active',
  signup_ip inet,
  signup_user_agent text,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_email_lowercase check (email = lower(email))
);

create unique index profiles_email_key on public.profiles (email);
create index profiles_account_status_idx on public.profiles (account_status);
create index profiles_created_at_idx on public.profiles (created_at desc);
create index profiles_last_active_at_idx on public.profiles (last_active_at desc);
create index profiles_country_idx on public.profiles (country);
```

Why `email` is copied into `profiles`: client-side queries cannot safely depend on direct reads from `auth.users`. Supabase Auth owns that table. A profile row gives the app a normal RLS-protected source for user/admin screens.

Users must not be able to change their own `account_status`. Enforce this with a trigger rather than embedding a subquery in the RLS `with check` clause (which is brittle and depends on statement visibility rules). The `is_admin` check below is defined further down in the Admin Users section; create this trigger after that function exists.

```sql
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
```

### Auth Signup Trigger

This creates the app profile whenever a user signs up.

```sql
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
    created_at,
    updated_at
  )
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
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
```

### Admin Users And Role Checks

```sql
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index admin_users_role_idx on public.admin_users (role);
create index admin_users_active_idx on public.admin_users (is_active);
```

Use a `security definer` helper for RLS checks. This avoids recursive policies where `admin_users` policies query `admin_users`.

```sql
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
```

### Compliance, KYC State, And Risk

For the User Management page, KYC and risk should not be stored as loose text on the profile. Put them in a compliance table so the KYC Review page can update the same source.

```sql
create table public.user_compliance (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  kyc_status public.kyc_status not null default 'unverified',
  risk_level public.risk_level not null default 'low',
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  withdrawal_limit_usd numeric(18, 2) not null default 0,
  deposit_limit_usd numeric(18, 2),
  flagged_reason text,
  reviewed_by uuid references public.admin_users(user_id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_compliance_kyc_status_idx on public.user_compliance (kyc_status);
create index user_compliance_risk_level_idx on public.user_compliance (risk_level);
create index user_compliance_reviewed_by_idx on public.user_compliance (reviewed_by);
```

User-facing safe view. Exposes only fields a user may see about themselves. `security_invoker = true` means it runs under the caller's RLS — but since user RLS on `user_compliance` is removed, access is granted via this view definition plus a grant.

```sql
create or replace view public.my_compliance_summary
with (security_invoker = false)
as
select
  user_id,
  kyc_status,
  withdrawal_limit_usd,
  deposit_limit_usd,
  updated_at
from public.user_compliance
where user_id = auth.uid();

grant select on public.my_compliance_summary to authenticated;
```

### Account Tags

Tags are useful for admin filtering and staff context. Examples: `vip`, `watchlist`, `withdrawal-hold`, `needs-kyc`, `high-value`, `support-priority`.

```sql
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
```

Starter tags:

```sql
insert into public.tags (slug, label, color, description, is_system)
values
  ('vip', 'VIP', '#5F9EA0', 'High value or priority account.', true),
  ('watchlist', 'Watchlist', '#b1423a', 'Account requires staff monitoring.', true),
  ('withdrawal-hold', 'Withdrawal Hold', '#a66510', 'Withdrawals should be reviewed manually.', true),
  ('needs-kyc', 'Needs KYC', '#a66510', 'User must complete verification.', true),
  ('support-priority', 'Support Priority', '#3c7f80', 'Support should prioritize this account.', true)
on conflict (slug) do nothing;
```

### Balance Snapshot For Fast Page Reads

The best long-term source of balances is a ledger/transactions table. For the User Management page, use a snapshot table or materialized view so admins can filter quickly without recalculating every ledger row.

```sql
create table public.user_balance_snapshots (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  available_balance_usd numeric(18, 2) not null default 0,
  locked_balance_usd numeric(18, 2) not null default 0,
  deposits_usd numeric(18, 2) not null default 0,
  withdrawals_usd numeric(18, 2) not null default 0,
  active_plans_count integer not null default 0,
  updated_at timestamptz not null default now(),

  constraint user_balance_snapshots_non_negative check (
    available_balance_usd >= 0
    and locked_balance_usd >= 0
    and deposits_usd >= 0
    and withdrawals_usd >= 0
    and active_plans_count >= 0
  )
);

create index user_balance_snapshots_available_balance_idx
on public.user_balance_snapshots (available_balance_usd desc);

create index user_balance_snapshots_deposits_idx
on public.user_balance_snapshots (deposits_usd desc);
```

Later, this table can be updated by database functions whenever deposits, withdrawals, investments, profits, or fees are posted to the ledger.

For v1 — before the ledger, deposits, withdrawals, and investments tables exist — `user_balance_snapshots` will be created with default zeros and left unpopulated. The User Management page will render `$0` for balances/deposits/withdrawals and `0` active plans until those sources are wired up. The signup trigger already inserts the placeholder row for every new user, so no extra backfill is needed when the real updaters land.

### Account Status Events

The current page can suspend, activate, flag, and clear flag. Those changes should be auditable.

```sql
create table public.account_status_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  previous_status public.account_status,
  new_status public.account_status not null,
  reason text,
  created_by uuid references public.admin_users(user_id),
  created_at timestamptz not null default now()
);

create index account_status_events_user_id_idx on public.account_status_events (user_id, created_at desc);
create index account_status_events_created_by_idx on public.account_status_events (created_by);
```

### Admin Audit Logs

This gives you a general parent audit system for admin actions. Other admin pages can reuse it.

```sql
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid references public.admin_users(user_id),
  target_user_id uuid references public.profiles(id),
  action_type public.admin_action_type not null,
  entity_table text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_actor_idx on public.admin_audit_logs (actor_admin_id, created_at desc);
create index admin_audit_logs_target_user_idx on public.admin_audit_logs (target_user_id, created_at desc);
create index admin_audit_logs_action_type_idx on public.admin_audit_logs (action_type);
```

### Admin User Management Read View

This view gives the page the exact shape it needs without letting the client manually join many tables.

```sql
create or replace view public.admin_user_management_view
with (security_invoker = true)
as
select
  p.id,
  p.full_name as name,
  p.email,
  p.country,
  p.account_status as status,
  p.created_at,
  p.last_active_at,
  uc.kyc_status,
  uc.risk_level as risk,
  uc.risk_score,
  uc.flagged_reason,
  coalesce(ubs.available_balance_usd, 0) as available_balance_usd,
  coalesce(ubs.locked_balance_usd, 0) as locked_balance_usd,
  coalesce(ubs.deposits_usd, 0) as deposits_usd,
  coalesce(ubs.withdrawals_usd, 0) as withdrawals_usd,
  coalesce(ubs.active_plans_count, 0) as active_plans,
  coalesce(
    jsonb_agg(
      distinct jsonb_build_object(
        'id', t.id,
        'slug', t.slug,
        'label', t.label,
        'color', t.color
      )
    ) filter (where t.id is not null),
    '[]'::jsonb
  ) as tags
from public.profiles p
left join public.user_compliance uc on uc.user_id = p.id
left join public.user_balance_snapshots ubs on ubs.user_id = p.id
left join public.user_tags ut on ut.user_id = p.id
left join public.tags t on t.id = ut.tag_id
group by
  p.id,
  uc.user_id,
  ubs.user_id;
```

Page query: filter the view from the app using PostgREST. Do not interpolate SQL strings. Use Supabase filters:

- `.ilike('email', '%search%')`
- `.eq('status', 'flagged')`
- `.eq('kyc_status', 'pending')`
- `.eq('risk', 'high')`
- `.order('created_at', { ascending: false })`

### Summary Query For The Cards

The current summary cards can be fetched from one RPC.

```sql
create or replace function public.get_admin_user_management_summary()
returns table (
  total_users bigint,
  active_users bigint,
  flagged_users bigint,
  pending_kyc bigint,
  total_available_balance_usd numeric,
  total_deposits_usd numeric,
  total_withdrawals_usd numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) as total_users,
    count(*) filter (where p.account_status = 'active') as active_users,
    count(*) filter (where p.account_status = 'flagged') as flagged_users,
    count(*) filter (where uc.kyc_status = 'pending') as pending_kyc,
    coalesce(sum(ubs.available_balance_usd), 0) as total_available_balance_usd,
    coalesce(sum(ubs.deposits_usd), 0) as total_deposits_usd,
    coalesce(sum(ubs.withdrawals_usd), 0) as total_withdrawals_usd
  from public.profiles p
  left join public.user_compliance uc on uc.user_id = p.id
  left join public.user_balance_snapshots ubs on ubs.user_id = p.id
  where public.is_admin();
$$;
```

### RPC For Account Status Actions

Do not let the client update `profiles.account_status` directly from the admin page. Use an RPC that checks admin role, writes the status change, and logs the audit event.

```sql
create or replace function public.admin_update_account_status(
  target_user_id uuid,
  new_status public.account_status,
  reason text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  old_profile public.profiles;
  updated_profile public.profiles;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select *
  into old_profile
  from public.profiles
  where id = target_user_id
  for update;

  if old_profile.id is null then
    raise exception 'User not found';
  end if;

  update public.profiles
  set
    account_status = new_status,
    updated_at = now()
  where id = target_user_id
  returning * into updated_profile;

  insert into public.account_status_events (
    user_id,
    previous_status,
    new_status,
    reason,
    created_by
  )
  values (
    target_user_id,
    old_profile.account_status,
    new_status,
    reason,
    auth.uid()
  );

  insert into public.admin_audit_logs (
    actor_admin_id,
    target_user_id,
    action_type,
    entity_table,
    entity_id,
    old_values,
    new_values
  )
  values (
    auth.uid(),
    target_user_id,
    case
      when new_status = 'active' and old_profile.account_status = 'flagged' then 'account_flag_cleared'::public.admin_action_type
      when new_status = 'active' then 'account_activated'::public.admin_action_type
      when new_status = 'flagged' then 'account_flagged'::public.admin_action_type
      when new_status = 'suspended' then 'account_suspended'::public.admin_action_type
      else 'account_activated'::public.admin_action_type
    end,
    'profiles',
    target_user_id,
    jsonb_build_object('account_status', old_profile.account_status),
    jsonb_build_object('account_status', new_status, 'reason', reason)
  );

  return updated_profile;
end;
$$;
```

### RPC For Assigning Tags

```sql
create or replace function public.admin_assign_user_tag(
  target_user_id uuid,
  tag_slug text,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_tag_id uuid;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select id into selected_tag_id
  from public.tags
  where slug = tag_slug;

  if selected_tag_id is null then
    raise exception 'Tag not found';
  end if;

  insert into public.user_tags (user_id, tag_id, assigned_by, note)
  values (target_user_id, selected_tag_id, auth.uid(), note)
  on conflict (user_id, tag_id) do update
  set
    assigned_by = excluded.assigned_by,
    note = excluded.note,
    created_at = now();

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
    target_user_id,
    'tag_assigned',
    'user_tags',
    selected_tag_id,
    jsonb_build_object('tag_slug', tag_slug, 'note', note)
  );
end;
$$;
```

### RPC For Removing Tags

```sql
create or replace function public.admin_remove_user_tag(
  target_user_id uuid,
  tag_slug text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_tag_id uuid;
  deleted_count integer;
begin
  if not public.is_admin_with_role(array['owner', 'admin', 'compliance', 'support']::public.admin_role[]) then
    raise exception 'Not authorized';
  end if;

  select id into selected_tag_id
  from public.tags
  where slug = tag_slug;

  if selected_tag_id is null then
    raise exception 'Tag not found';
  end if;

  delete from public.user_tags
  where user_id = target_user_id
    and tag_id = selected_tag_id;

  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    return;
  end if;

  insert into public.admin_audit_logs (
    actor_admin_id,
    target_user_id,
    action_type,
    entity_table,
    entity_id,
    old_values
  )
  values (
    auth.uid(),
    target_user_id,
    'tag_removed',
    'user_tags',
    selected_tag_id,
    jsonb_build_object('tag_slug', tag_slug)
  );
end;
$$;
```

### RLS

Enable RLS on all app tables:

```sql
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.user_compliance enable row level security;
alter table public.tags enable row level security;
alter table public.user_tags enable row level security;
alter table public.user_balance_snapshots enable row level security;
alter table public.account_status_events enable row level security;
alter table public.admin_audit_logs enable row level security;
```

Profiles:

```sql
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
```

Admin users:

```sql
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
```

Compliance:

Users should not read `user_compliance` directly — it holds internal fields like `risk_level`, `risk_score`, and `flagged_reason` that should not be exposed. Users read a safe subset through `public.my_compliance_summary` (defined below). Only admins can read the underlying table.

```sql
create policy "Admins can read compliance"
on public.user_compliance
for select
to authenticated
using (public.is_admin());

create policy "Compliance admins can update compliance"
on public.user_compliance
for update
to authenticated
using (public.is_admin_with_role(array['owner', 'admin', 'compliance']::public.admin_role[]))
with check (public.is_admin_with_role(array['owner', 'admin', 'compliance']::public.admin_role[]));
```

Tags:

```sql
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
```

Balance snapshots:

```sql
create policy "Users can read own balance snapshot"
on public.user_balance_snapshots
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read balance snapshots"
on public.user_balance_snapshots
for select
to authenticated
using (public.is_admin());

create policy "Finance admins can update balance snapshots"
on public.user_balance_snapshots
for update
to authenticated
using (public.is_admin_with_role(array['owner', 'admin', 'finance']::public.admin_role[]))
with check (public.is_admin_with_role(array['owner', 'admin', 'finance']::public.admin_role[]));
```

Status events and audit logs:

```sql
create policy "Users can read own account status events"
on public.account_status_events
for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can read account status events"
on public.account_status_events
for select
to authenticated
using (public.is_admin());

create policy "Admins can insert account status events"
on public.account_status_events
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can read audit logs"
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin_with_role(array['owner', 'admin', 'compliance']::public.admin_role[]));

create policy "Admins can insert audit logs"
on public.admin_audit_logs
for insert
to authenticated
with check (public.is_admin());
```

### Recommended App Data Fetch

For the Admin User Management page, fetch:

1. Summary cards:

```ts
const { data: summary } = await supabase.rpc(
  "get_admin_user_management_summary",
);
```

2. Account rows (keyset-paginated on `created_at` + `id`):

```ts
const PAGE_SIZE = 50;

let query = supabase
  .from("admin_user_management_view")
  .select("*")
  .order("created_at", { ascending: false })
  .order("id", { ascending: false })
  .limit(PAGE_SIZE);

if (statusFilter !== "all") query = query.eq("status", statusFilter);
if (kycFilter !== "all") query = query.eq("kyc_status", kycFilter);
if (riskFilter !== "all") query = query.eq("risk", riskFilter);

if (searchTerm) {
  query = query.or(
    `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`,
  );
}

// For page N+1, pass the last row's createdAt and id from the previous page:
if (cursor) {
  query = query.or(
    `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
  );
}

const { data: users } = await query;
```

Prefer keyset over `.range(from, to)` — offset-based paging degrades at scale and gives inconsistent results when rows are inserted between page loads. The `id` tiebreaker protects against same-millisecond `created_at` collisions.

3. Suspend, activate, flag, clear flag:

```ts
await supabase.rpc("admin_update_account_status", {
  target_user_id: userId,
  new_status: "suspended",
  reason: "Manual admin action from User Management",
});
```

4. Assign tag:

```ts
await supabase.rpc("admin_assign_user_tag", {
  target_user_id: userId,
  tag_slug: "watchlist",
  note: "Large withdrawal after new device login",
});
```

5. Remove tag:

```ts
await supabase.rpc("admin_remove_user_tag", {
  target_user_id: userId,
  tag_slug: "watchlist",
});
```

### Notes For Future Pages

These fields should be finalized when we design the related admin pages:

- `active_plans_count` should eventually come from `user_investments`.
- `deposits_usd` should eventually come from deposits or ledger entries.
- `withdrawals_usd` should eventually come from withdrawals or ledger entries.
- `kyc_status` should eventually be synchronized from `kyc_submissions`.
- `risk_level` should be influenced by compliance checks, security events, KYC status, and transaction behavior.
- `last_active_at` can be updated by the app on login, dashboard load, or a lightweight activity endpoint.

## Admin Investment Plan Management Page

Route: `/nexcoin-admin-priv/investment-plans`

Purpose: let admins create, edit, pause, activate, and archive investment plans, and monitor aggregate exposure (active investors, total invested, profit credited, plans maturing today).

### Current Page Data Fields

The current mock lives in `lib/admin-investment-plans.ts` and `components/neocoin-admin-priv/admin-investment-plans.tsx`.

Plan row fields:

| Current field | Meaning | Recommended source |
| --- | --- | --- |
| `id` | Plan id | `investment_plans.id` |
| `name` | Display name | `investment_plans.name` |
| `description` | Short tagline | `investment_plans.description` |
| `status` | `Active` / `Paused` / `Draft` | `investment_plans.status` (lowercase in DB) |
| `risk` | `Conservative` / `Balanced` / `High` | `investment_plans.risk` (lowercase in DB) |
| `minDepositUsd` | Deposit floor | `investment_plans.min_deposit_usd` |
| `maxDepositUsd` | Deposit ceiling or `null` | `investment_plans.max_deposit_usd` |
| `returnRatePercent` | Projected return | `investment_plans.return_rate_percent` |
| `durationHours` | Cycle duration | `investment_plans.duration_hours` |
| `updatedAt` | Last edited | `investment_plans.updated_at` (moddatetime trigger) |
| `activeInvestors` | Distinct users with an active investment | aggregate from `user_investments` |
| `totalInvestedUsd` | Active capital in this plan | aggregate from `user_investments` |
| `profitCreditedUsd` | Profit paid out to investors of this plan | aggregate from `user_investments` |

Summary cards:

| Card | Derivation |
| --- | --- |
| Active plans | `count(investment_plans where status = 'active')` |
| Total invested | `sum(user_investments.amount_usd where status = 'active')` |
| Profit credited | `sum(user_investments.profit_credited_usd)` |
| Maturing today | `count(user_investments where status = 'active' and end_at::date = current_date)` |

Plan activity feed:

| Field | Source |
| --- | --- |
| `id` | `investment_plan_events.id` |
| `planName` | `investment_plan_events.plan_name_snapshot` (denormalized so archived/renamed plans still render) |
| `status` | `investment_plan_events.to_status` |
| `title` | `investment_plan_events.title` (e.g. "Plan paused", "Return rate reviewed by admin") |
| `createdAt` | `investment_plan_events.created_at` |

> **UI note:** the per-plan "Investors" tile was removed from `admin-investment-plans.tsx`. `activeInvestors` is still needed for the summary card hint (`{totals.activeInvestors} active investors`) and the Plan exposure chart totals.

### Design Decision

Split the problem into two tables plus an audit log:

- `public.investment_plans` — catalog config (status, risk, deposit range, rate, duration, features, display order). Admins mutate this through security-definer RPCs.
- `public.user_investments` — one row per subscribed cycle. The admin page never writes here; the future Subscribe / Deposit flows will. All aggregates on the admin page come from this table.
- `public.investment_plan_events` — denormalized audit log for the Plan activity panel. Writes in the same transaction as `admin_audit_logs` from every plan RPC.

Reads:

- Public landing `/plans` and user dashboard use the `investment_plans` table directly (RLS allows `select` when `status = 'active'`).
- Admin page reads from `admin_investment_plan_catalog_view` (joined aggregates) + calls `get_admin_investment_plan_summary` for summary cards + `get_admin_investment_plan_activity` for the activity panel.

Writes (all admin actions go through RPCs, not direct table writes):

- `admin_create_investment_plan`
- `admin_update_investment_plan` (null-safe patch of name/description/risk/deposit range/return/duration/features/highlight/display order)
- `admin_set_investment_plan_status` (active / paused / draft; rejects `archived`)
- `admin_archive_investment_plan` (soft-delete; refuses if any active `user_investments` still reference the plan)

### Enum Additions

```sql
create type public.plan_status as enum ('active', 'paused', 'draft', 'archived');
create type public.plan_risk as enum ('conservative', 'balanced', 'high');
create type public.user_investment_status as enum ('active', 'matured', 'cancelled', 'refunded');

-- extend the existing admin_action_type for plan events
alter type public.admin_action_type add value if not exists 'plan_created';
alter type public.admin_action_type add value if not exists 'plan_updated';
alter type public.admin_action_type add value if not exists 'plan_status_changed';
alter type public.admin_action_type add value if not exists 'plan_archived';
```

DB enum values are lowercase. The UI types in `lib/admin-investment-plans.ts` (PascalCase `Active` / `Paused` / `Draft` / `Conservative` / `Balanced` / `High`) must be lowercased on the way in and capitalized on the way out, same convention as the Admin User Management page.

`alter type ... add value` cannot be used by statements in the same transaction that added it. Migration `17_investment_enums.sql` is therefore its own file so the new enum values are committed before any RPC references them.

### Suggested Migration Order

If the Admin User Management migrations (01–16) are already in place, continue with:

17. Plan enums + admin_action_type additions.
18. `investment_plans` + RLS.
19. `user_investments` + RLS.
20. `investment_plan_events` + RLS.
21. `admin_investment_plan_catalog_view`.
22. `admin_create_investment_plan` RPC.
23. `admin_update_investment_plan` RPC.
24. `admin_set_investment_plan_status` RPC.
25. `admin_archive_investment_plan` RPC.
26. `get_admin_investment_plan_summary` RPC.
27. `get_admin_investment_plan_activity` RPC.

Paste-ready files live under `supabase/migrations/17_*.sql` through `27_*.sql`. See `supabase/migrations/README.md` for the index.

### Key Columns Explained

`investment_plans.status`:

- `draft` — visible only to admins. Used while assembling a plan before launch.
- `active` — visible to the public and accepting new subscriptions.
- `paused` — visible to admins, hidden from the public plans page. Existing `user_investments` keep running; no new subscriptions.
- `archived` — soft-deleted. Hidden everywhere except admin archived filters. Set only via `admin_archive_investment_plan`, which also writes `archived_at`.

`investment_plans.max_deposit_usd` is nullable; `null` means "no upper cap" (e.g. the Pro plan). The admin update RPC has a dedicated `clear_max_deposit` boolean so clients can explicitly set it back to `null` — `coalesce` alone can't distinguish "leave unchanged" from "clear".

`user_investments.projected_profit_usd` is stored at subscription time so rate changes to the parent plan don't retroactively change payouts for existing investors. `profit_credited_usd` moves up over the lifecycle as profit is credited.

`user_investments.status` transitions:

- `active` → `matured` when `end_at` passes and profit is fully credited.
- `active` → `cancelled` if the user or an admin cancels before maturity. Sets `cancelled_at` and `cancel_reason`.
- `cancelled` → `refunded` if money is returned to the user's balance.

A partial index `user_investments_active_idx on (plan_id) where status = 'active'` keeps the "active investors per plan" aggregate cheap.

### v1 Data Expectations

- `investment_plans` is seeded by admins through `admin_create_investment_plan`. No SQL seed data — plans are created from the UI.
- `user_investments` starts empty. The Subscribe / Deposit flow is not part of this migration set; when it lands, subscribe actions will insert rows here. Until then, summary aggregates read zero — the page still renders correctly because every aggregate uses `coalesce(..., 0)`.
- `investment_plan_events` fills up as admins work on plans; the activity panel will show "No activity yet" for a fresh database.

### RLS Summary

| Table / view | Anon read | Authenticated user read | Admin read | Direct write |
| --- | --- | --- | --- | --- |
| `investment_plans` | `status = 'active'` | `status = 'active'` | all rows | via RPC only |
| `user_investments` | none | own rows | all rows | via future subscribe RPCs only |
| `investment_plan_events` | none | none | all rows | admin inserts (via RPC) |
| `admin_investment_plan_catalog_view` | none | own-scoped aggregates (use RPCs instead) | all plans | read-only |

### Example Admin Calls

1. Create a plan:

```ts
await supabase.rpc("admin_create_investment_plan", {
  slug: "beginner",
  name: "Beginner",
  description: "Starter access for smaller deposits and first-cycle investors.",
  tag: "Starter",
  status: "draft",
  risk: "conservative",
  min_deposit_usd: 100,
  max_deposit_usd: 999,
  return_rate_percent: 8,
  duration_hours: 24,
  features: ["Starter plan access", "Limited reinvestment"],
  highlight: false,
  display_order: 1,
});
```

2. Edit deposit range + return rate:

```ts
await supabase.rpc("admin_update_investment_plan", {
  plan_id: planId,
  new_min_deposit_usd: 150,
  new_max_deposit_usd: 1099,
  new_return_rate_percent: 9,
});
```

3. Remove the upper cap on a plan (use `clear_max_deposit`):

```ts
await supabase.rpc("admin_update_investment_plan", {
  plan_id: planId,
  clear_max_deposit: true,
});
```

4. Pause a plan:

```ts
await supabase.rpc("admin_set_investment_plan_status", {
  plan_id: planId,
  new_status: "paused",
  reason: "Rate review",
});
```

5. Archive a plan:

```ts
await supabase.rpc("admin_archive_investment_plan", {
  plan_id: planId,
  reason: "Replaced by Pro Plus",
});
```

6. Summary + activity feed:

```ts
const [{ data: summary }, { data: activity }] = await Promise.all([
  supabase.rpc("get_admin_investment_plan_summary"),
  supabase.rpc("get_admin_investment_plan_activity", { limit_count: 10 }),
]);
```

### Notes For Future Work

- `user_investments` writes are stubbed for v1; the Subscribe / Deposit flow design will bring back concrete insert paths (and a `credit_user_investment_profit` RPC that bumps `profit_credited_usd` and optionally settles the row).
- If non-admin users ever need per-plan "social proof" stats (e.g. "412 investors") on the public `/plans` page, add a separate `public_investment_plan_stats_view` — do not relax RLS on `user_investments`.
- A future `plan_rate_changes` table could freeze historical rates if rate changes need to apply only to new subscriptions; today the design stores `projected_profit_usd` on each `user_investments` row, which achieves the same thing without the extra table.

## Admin Deposit Management Page

Route: `/nexcoin-admin-priv/deposits-management`

Related user route: `/account/deposit`

Purpose: let admins manage crypto-only deposit intake, review pending/confirming deposits, credit approved deposits to user balances, reject suspicious deposits, add internal review notes, and maintain the BTC/ETH/USDT receiving wallets shown to users.

### Current Page Data Fields

The current mock/data contract lives in `lib/admin-deposits-management.ts` and the page UI lives in `components/neocoin-admin-priv/admin-deposits-management.tsx`.

Deposit queue fields:

| Current field | Meaning | Recommended source |
| --- | --- | --- |
| `id` | Deposit id | `crypto_deposits.id` |
| `reference` | Human-friendly deposit reference | `crypto_deposits.reference`, generated from `crypto_deposit_reference_seq` as `DP-000001` style values |
| `userName` | Customer display name | `profiles.full_name` through `admin_deposit_management_view` |
| `userEmail` | Customer email | `profiles.email` through `admin_deposit_management_view` |
| `assetSymbol` | BTC / ETH / USDT display label | `crypto_deposits.asset`, mapped from lowercase enum |
| `network` | Blockchain/network label | `crypto_deposits.network` |
| `amount` | Crypto amount | `crypto_deposits.amount` |
| `amountUsd` | USD equivalent at request time | `crypto_deposits.amount_usd` |
| `confirmations` | Current observed confirmations | `crypto_deposits.confirmations` |
| `confirmationsRequired` | Required confirmations before crediting | `crypto_deposits.confirmations_required` |
| `txHash` | Blockchain transaction hash | `crypto_deposits.tx_hash` |
| `walletAddress` | Receiving address shown to the user | `crypto_deposits.receiving_address_snapshot` |
| `status` | Pending, Confirming, Needs Review, Credited, Rejected | `crypto_deposits.status` |
| `risk` | Low, Medium, High | `crypto_deposits.risk_level` |
| `riskNotes` | Risk/review flags displayed in the modal | `crypto_deposits.risk_notes` |
| `internalNotes` | Admin-only review notes | `crypto_deposit_internal_notes` aggregated by the admin view |
| `timeline` | Deposit event timeline | `crypto_deposit_events` aggregated by the admin view |
| `createdAt` | Request time | `crypto_deposits.created_at` |

Receiving wallet fields:

| Current field | Meaning | Recommended source |
| --- | --- | --- |
| `id` | Receiving wallet id | `deposit_receiving_wallets.id` |
| `asset` | BTC / ETH / USDT | `deposit_receiving_wallets.asset` |
| `network` | Bitcoin, Ethereum, TRC-20, or another supported network label | `deposit_receiving_wallets.network` |
| `label` | Admin-facing wallet label | `deposit_receiving_wallets.label` |
| `address` | Crypto receiving address | `deposit_receiving_wallets.address` |
| `isActive` | Whether users can choose this address | `deposit_receiving_wallets.is_active` |
| `updatedAt` | Last edit time | `deposit_receiving_wallets.updated_at` |

Summary card fields:

| Card | Derivation |
| --- | --- |
| Pending review | `count/sum crypto_deposits where status in ('pending', 'confirming', 'needs_review')` |
| Credited today | `sum(amount_usd where status = 'credited' and credited_at::date = current_date)` |
| Needs review | `count crypto_deposits where status = 'needs_review'` |
| Active receiving wallets | `count deposit_receiving_wallets where is_active = true and archived_at is null` |
| Average credit time | average minutes between `created_at` and `credited_at` for credited deposits |

### Design Decision

Deposits are crypto-only for v1. Do not store PayPal, bank transfer, cash, or e-currency methods in this flow.

Recommended structure:

- `public.deposit_receiving_wallets` — admin-managed wallet addresses that users can deposit into. Rows are soft-archived instead of deleted so old deposits can still show the wallet label/address history.
- `public.crypto_deposits` — one row per user deposit request. This snapshots the receiving address and network at request time so later wallet edits do not rewrite old deposit records.
- `public.crypto_deposit_events` — timeline rows for user/admin actions and status changes.
- `public.crypto_deposit_internal_notes` — admin-only notes from the review modal.
- `public.admin_deposit_management_view` — admin read model that joins user profile, receiving wallet data, internal notes, and timeline events.
- `public.user_balance_snapshots` — v1 balance aggregate updated when a deposit is credited. Later, a proper ledger should become the source of truth and this snapshot should be derived from ledger entries.
- `public.admin_audit_logs` — general audit log for wallet changes, deposit status changes, and internal notes.

Reads:

- User deposit page reads active, non-archived `deposit_receiving_wallets`.
- User deposit history reads own `crypto_deposits` and own non-internal timeline events.
- Admin deposit page reads `admin_deposit_management_view`, `deposit_receiving_wallets`, and `get_admin_deposit_management_summary`.

Writes:

- Users create deposit requests only through `create_crypto_deposit_request`.
- Admins create/update/remove receiving wallets only through wallet RPCs.
- Admins change deposit status only through `admin_update_crypto_deposit_status`.
- Admins add notes only through `admin_add_crypto_deposit_note`.

### Suggested Migration Order

If migrations 01–27 are already in place, continue with:

28. Deposit enums + `admin_action_type` additions.
29. `deposit_receiving_wallets` + starter BTC/ETH/USDT rows + RLS.
30. `crypto_deposits` + reference sequence + RLS.
31. `crypto_deposit_events` and `crypto_deposit_internal_notes` + RLS.
32. `admin_deposit_management_view`.
33. `create_crypto_deposit_request` user RPC.
34. `admin_create_receiving_wallet` RPC.
35. `admin_update_receiving_wallet` RPC.
36. `admin_remove_receiving_wallet` RPC.
37. `admin_update_crypto_deposit_status` RPC.
38. `admin_add_crypto_deposit_note` RPC.
39. `get_admin_deposit_management_summary` RPC.

Paste-ready SQL files live under `supabase/migrations/28_*.sql` through `39_*.sql`. See `supabase/migrations/README.md` for the exact index.

### Enum Additions

```sql
create type public.deposit_asset as enum ('btc', 'eth', 'usdt');

create type public.deposit_status as enum (
  'pending',
  'confirming',
  'needs_review',
  'credited',
  'rejected'
);

alter type public.admin_action_type add value if not exists 'deposit_request_created';
alter type public.admin_action_type add value if not exists 'deposit_status_changed';
alter type public.admin_action_type add value if not exists 'deposit_note_added';
alter type public.admin_action_type add value if not exists 'receiving_wallet_created';
alter type public.admin_action_type add value if not exists 'receiving_wallet_updated';
alter type public.admin_action_type add value if not exists 'receiving_wallet_status_changed';
alter type public.admin_action_type add value if not exists 'receiving_wallet_removed';
```

DB values are lowercase. The UI can continue displaying `BTC`, `ETH`, `USDT`, `Pending`, `Needs Review`, etc. through mapping helpers.

### Key Tables

`deposit_receiving_wallets`:

- `asset`: limited to `btc`, `eth`, `usdt`.
- `network`: flexible text because USDT can be TRC-20, ERC-20, BEP-20, etc.
- `address`: unique per active/non-archived `asset + network + address`.
- `is_active`: controls whether users can choose the wallet.
- `archived_at`: soft-delete marker. Removed wallets are hidden from new deposits but remain available for historical admin review.
- `created_by` / `updated_by`: references `admin_users` for accountability.

`crypto_deposits`:

- `reference`: unique admin/user-facing value like `DP-002301`.
- `receiving_wallet_id`: nullable FK because wallets are soft-archived and could eventually be hard-deleted in a maintenance pass.
- `receiving_address_snapshot`: immutable-ish address shown to the user when the request was created.
- `amount`, `amount_usd`, `rate_usd`: store the crypto amount, USD amount, and conversion rate at request time.
- `confirmations` and `confirmations_required`: allow the admin queue to show whether the deposit can be credited.
- `tx_hash`: unique when present, preventing the same blockchain transaction from being credited twice.
- `status`: starts as `pending`, then can move to `confirming`, `needs_review`, `credited`, or `rejected`.
- `risk_level` and `risk_notes`: v1 manual/computed review flags used by the modal.
- `credited_at` / `rejected_at`: required by check constraints when the matching status is used.

`crypto_deposit_events`:

- Stores display-friendly timeline entries.
- User-created deposit requests have `actor_user_id`.
- Admin actions have `actor_admin_id`.
- Status changes store `from_status`, `to_status`, and JSON before/after values.

`crypto_deposit_internal_notes`:

- Admin-only notes shown in the review modal.
- Users do not read these rows, and user-visible event policies hide the internal-note event type.

### RLS Summary

| Table / view | Anon read | Authenticated user read | Admin read | Direct write |
| --- | --- | --- | --- | --- |
| `deposit_receiving_wallets` | none | active non-archived rows | all rows | RPC only |
| `crypto_deposits` | none | own rows | all rows | RPC only |
| `crypto_deposit_events` | none | own non-internal events | all rows | admin insert policy + RPCs |
| `crypto_deposit_internal_notes` | none | none | all rows | admin insert policy + RPC |
| `admin_deposit_management_view` | none | none; view filters with `public.is_admin()` | all rows through underlying admin RLS | read-only |

Role expectations:

- Wallet management: `owner`, `admin`, `finance`.
- Deposit credit/reject/review: `owner`, `admin`, `finance`, `compliance`.
- Internal notes: `owner`, `admin`, `finance`, `compliance`, `support`.
- View-only admins can read the queue because `public.is_admin()` allows admin reads, but they cannot mutate deposits or wallets through RPCs.

### Example App Calls

Create a user deposit request:

```ts
await supabase.rpc("create_crypto_deposit_request", {
  wallet_id: selectedWalletId,
  amount: 0.025,
  amount_usd: 1625,
  rate_usd: 65000,
});
```

Fetch admin page data:

```ts
const [{ data: deposits }, { data: wallets }, { data: summary }] = await Promise.all([
  supabase.from("admin_deposit_management_view").select("*").order("created_at", { ascending: false }),
  supabase.from("deposit_receiving_wallets").select("*").order("updated_at", { ascending: false }),
  supabase.rpc("get_admin_deposit_management_summary"),
]);
```

Create a receiving wallet from the admin modal:

```ts
await supabase.rpc("admin_create_receiving_wallet", {
  wallet_asset: "usdt",
  wallet_network: "TRC-20",
  wallet_label: "USDT Operations Wallet",
  wallet_address: "TXv...",
  wallet_is_active: true,
});
```

Update a receiving wallet:

```ts
await supabase.rpc("admin_update_receiving_wallet", {
  wallet_id: walletId,
  new_label: "USDT Treasury Wallet",
  new_is_active: false,
});
```

Credit a confirmed deposit:

```ts
await supabase.rpc("admin_update_crypto_deposit_status", {
  deposit_id: depositId,
  new_status: "credited",
  reason: "Confirmed on-chain",
});
```

Add an internal review note:

```ts
await supabase.rpc("admin_add_crypto_deposit_note", {
  deposit_id: depositId,
  note: "Hash matches user proof. No duplicate tx_hash found.",
});
```

### v1 Data Expectations

- `deposit_receiving_wallets` starts with starter BTC, ETH, and USDT rows so the UI has immediately testable data. Replace those placeholder addresses with real treasury addresses before production.
- `crypto_deposits` starts empty. Rows are created by the user deposit flow.
- `confirmations` starts at `0`; in v1 an admin or later blockchain watcher can update it through a dedicated future RPC. The current credit RPC refuses to credit if confirmations are below the required threshold.
- Crediting a deposit increments `user_balance_snapshots.available_balance_usd` and `user_balance_snapshots.deposits_usd` once. A credited deposit cannot be moved backward by the status RPC because that would require a formal adjustment/reversal flow.

### Notes For Future Work

- Add a `deposit_blockchain_observations` table when a real watcher is introduced. That table should store chain, tx hash, block height, confirmations, observed amount, and raw webhook payload.
- Add a `wallet_ledger_entries` or `account_ledger_entries` table before withdrawals and investment subscriptions become live-money features. `user_balance_snapshots` is acceptable for v1 UI state, but a ledger should become the financial source of truth.
- Add explicit adjustment RPCs for support/finance corrections instead of editing credited deposits.
- Consider per-network address validation in the wallet RPCs once production chains are finalized. The v1 constraints only require non-blank plausible-length addresses.

## Admin Withdrawal Management Page

Route: `/nexcoin-admin-priv/withdrawals-management`

Related user route: `/account/withdrawal`

Purpose: let admins review crypto withdrawal requests, confirm KYC/security checks, approve requests, move payouts through processing, complete payouts with a blockchain tx hash, reject risky withdrawals, and record internal notes.

### Current Page Data Fields

The current mock/data contract lives in `lib/admin-withdrawals-management.ts` and the page UI lives in `components/neocoin-admin-priv/admin-withdrawals-management.tsx`.

Withdrawal queue fields:

| Current field | Meaning | Recommended source |
| --- | --- | --- |
| `id` | Withdrawal id | `crypto_withdrawals.id` |
| `reference` | Human-friendly withdrawal reference | `crypto_withdrawals.reference`, generated from `crypto_withdrawal_reference_seq` as `WD-1040` style values |
| `userName` | Customer display name | `profiles.full_name` through `admin_withdrawal_management_view` |
| `userEmail` | Customer email | `profiles.email` through `admin_withdrawal_management_view` |
| `accountStatus` | Active, Flagged, Suspended | `profiles.account_status` |
| `kycStatus` | Approved, Pending, Rejected, Unverified | `user_compliance.kyc_status` |
| `assetSymbol` | BTC / ETH / USDT display label | `crypto_withdrawals.asset`, mapped from lowercase enum |
| `network` | Blockchain/network label | `crypto_withdrawals.network` |
| `amount` | Requested crypto amount | `crypto_withdrawals.amount` |
| `amountUsd` | USD value locked for the request | `crypto_withdrawals.amount_usd` |
| `fee` | Crypto withdrawal/network fee | `crypto_withdrawals.fee` |
| `netAmount` | Amount user receives after fee | `crypto_withdrawals.net_amount` |
| `destinationLabel` | Saved wallet label at request time | `crypto_withdrawals.destination_label_snapshot` |
| `destinationAddress` | Saved wallet address at request time | `crypto_withdrawals.destination_address_snapshot` |
| `status` | Pending, AML Review, Approved, Processing, Completed, Rejected | `crypto_withdrawals.status` |
| `risk` | Low, Medium, High | `crypto_withdrawals.risk_level` |
| `securityNotes` | Risk/security notes displayed in the modal | `crypto_withdrawals.security_notes` |
| `checks` | AML/KYC/security check rows | `crypto_withdrawal_checks` aggregated by the admin view |
| `timeline` | Withdrawal event timeline | `crypto_withdrawal_events` aggregated by the admin view |
| `internalNotes` | Admin-only review notes | `crypto_withdrawal_internal_notes` aggregated by the admin view |
| `txHash` | Blockchain payout tx hash | `crypto_withdrawals.tx_hash` |
| `createdAt` | Request time | `crypto_withdrawals.created_at` |

Summary card fields:

| Card | Derivation |
| --- | --- |
| Pending withdrawals | `count/sum crypto_withdrawals where status = 'pending'` |
| AML review | `count/sum crypto_withdrawals where status = 'aml_review'` |
| Processing | `count/sum crypto_withdrawals where status = 'processing'` |
| Paid out | `sum(amount_usd where status = 'completed' and completed_at::date = current_date)` |
| Rejected | `sum(amount_usd where status = 'rejected' and rejected_at::date = current_date)` |
| SLA | average hours between `created_at` and `completed_at` for completed withdrawals |

### Design Decision

Withdrawals should be modeled as a money-control workflow, not just a status list. The key rule is that a user request locks available balance immediately, then either releases it on rejection or settles it on completion.

Recommended structure:

- `public.withdrawal_addresses` — user saved crypto payout destinations. These are the source for the user withdrawal form.
- `public.crypto_withdrawals` — one row per withdrawal request, with destination snapshots so old requests still show the exact wallet label/address used at creation time.
- `public.crypto_withdrawal_checks` — admin review checks such as KYC approved, 2FA confirmed, new device login, amount threshold, deposit-method alignment.
- `public.crypto_withdrawal_events` — display-friendly timeline entries for request creation and admin status changes.
- `public.crypto_withdrawal_internal_notes` — admin-only notes from the review modal.
- `public.admin_withdrawal_management_view` — admin read model that joins profile, compliance, checks, notes, and timeline.
- `public.user_balance_snapshots` — v1 balance aggregate. Request creation moves USD from available to locked; rejection reverses that lock; completion removes locked funds and increments `withdrawals_usd`.
- `public.admin_audit_logs` — general audit log for sensitive admin withdrawal actions.

Reads:

- User withdrawal page reads own `withdrawal_addresses`, own `crypto_withdrawals`, and own non-internal timeline events.
- Admin withdrawal page reads `admin_withdrawal_management_view` and `get_admin_withdrawal_management_summary`.

Writes:

- Users create withdrawal requests only through `create_crypto_withdrawal_request`.
- Admins change withdrawal status only through `admin_update_crypto_withdrawal_status`.
- Admins add internal notes only through `admin_add_crypto_withdrawal_note`.
- Admins update review checks only through `admin_upsert_crypto_withdrawal_check`.

### Suggested Migration Order

If migrations 01–39 are already in place, continue with:

40. Withdrawal enums + `admin_action_type` additions.
41. `withdrawal_addresses` + RLS.
42. `crypto_withdrawals` + reference sequence + RLS.
43. `crypto_withdrawal_checks`, `crypto_withdrawal_events`, `crypto_withdrawal_internal_notes` + RLS.
44. `admin_withdrawal_management_view`.
45. `create_crypto_withdrawal_request` user RPC.
46. `admin_update_crypto_withdrawal_status` RPC.
47. `admin_add_crypto_withdrawal_note` RPC.
48. `admin_upsert_crypto_withdrawal_check` RPC.
49. `get_admin_withdrawal_management_summary` RPC.

Paste-ready SQL files live under `supabase/migrations/40_*.sql` through `49_*.sql`.

### Enum Additions

```sql
create type public.withdrawal_status as enum (
  'pending',
  'aml_review',
  'approved',
  'processing',
  'completed',
  'rejected'
);

create type public.withdrawal_check_status as enum ('passed', 'warning', 'failed');

create type public.withdrawal_address_status as enum (
  'active',
  'pending_confirmation',
  'disabled'
);

alter type public.admin_action_type add value if not exists 'withdrawal_request_created';
alter type public.admin_action_type add value if not exists 'withdrawal_status_changed';
alter type public.admin_action_type add value if not exists 'withdrawal_note_added';
alter type public.admin_action_type add value if not exists 'withdrawal_check_updated';
alter type public.admin_action_type add value if not exists 'withdrawal_destination_created';
alter type public.admin_action_type add value if not exists 'withdrawal_destination_updated';
```

Withdrawal assets use the existing `public.deposit_asset` enum for v1 (`btc`, `eth`, `usdt`) so withdrawals stay aligned with crypto deposit support. If the user withdrawal UI keeps Solana or other assets later, add those assets intentionally in a separate migration and update deposit/withdrawal rules together.

### Key Tables

`withdrawal_addresses`:

- `user_id`: owner of the saved payout destination.
- `asset`: BTC/ETH/USDT in v1.
- `network`: flexible text because USDT can be TRC-20, ERC-20, etc.
- `label` and `address`: user-facing destination metadata.
- `status`: active, pending confirmation, or disabled.
- `is_default`: one default address per user and asset, enforced by a partial unique index.
- `archived_at`: soft-delete marker. Addresses should not be hard-deleted once history references them.

`crypto_withdrawals`:

- `reference`: unique admin/user-facing value like `WD-1041`.
- `destination_address_id`: nullable FK to the saved address.
- `destination_label_snapshot` and `destination_address_snapshot`: preserve what the user selected at request time.
- `amount`, `amount_usd`, `rate_usd`: crypto amount, USD value, and conversion rate at request time.
- `fee`, `fee_usd`, `net_amount`: payout economics. `net_amount` must be less than or equal to `amount`.
- `status`: starts as `pending`, then can move through `aml_review`, `approved`, `processing`, `completed`, or `rejected`.
- `risk_level` and `security_notes`: queue/moderation signals used by the review modal.
- `tx_hash`: required by the admin status RPC when marking a payout completed.
- `approved_at`, `processing_at`, `completed_at`, `rejected_at`: status timestamps protected by check constraints.

`crypto_withdrawal_checks`:

- One row per review check label per withdrawal.
- Admins can upsert checks through `admin_upsert_crypto_withdrawal_check`.
- Typical labels: KYC approved, 2FA confirmed, Destination address saved, Recent password change, New device login, Amount threshold, Deposit method alignment.

`crypto_withdrawal_events`:

- User-created withdrawal requests have `actor_user_id`.
- Admin actions have `actor_admin_id`.
- User RLS hides internal-note and check-update events.

`crypto_withdrawal_internal_notes`:

- Admin-only notes shown in the review modal.
- Users never read these rows.

### Balance Flow

1. User creates a withdrawal request through `create_crypto_withdrawal_request`.
2. The RPC blocks suspended accounts, snapshots the saved destination, and adds initial risk notes for flagged accounts, unapproved KYC, or amounts above the compliance withdrawal limit.
3. The RPC checks `user_balance_snapshots.available_balance_usd >= amount_usd`.
4. The RPC moves `amount_usd` from `available_balance_usd` to `locked_balance_usd`.
5. If an admin rejects the withdrawal, `admin_update_crypto_withdrawal_status` moves the locked USD back to available.
6. If an admin completes the withdrawal, the RPC removes locked USD and increments `withdrawals_usd`.
7. `completed` and `rejected` are terminal states. Changing them later should happen through a future adjustment/reversal flow, not by editing the withdrawal row.

### RLS Summary

| Table / view | Anon read | Authenticated user read | Admin read | Direct write |
| --- | --- | --- | --- | --- |
| `withdrawal_addresses` | none | own non-archived rows | all rows | users can insert/update own addresses |
| `crypto_withdrawals` | none | own rows | all rows | RPC only |
| `crypto_withdrawal_checks` | none | none | all rows | admin insert/update policy + RPC |
| `crypto_withdrawal_events` | none | own non-internal events | all rows | admin insert policy + RPCs |
| `crypto_withdrawal_internal_notes` | none | none | all rows | admin insert policy + RPC |
| `admin_withdrawal_management_view` | none | none; view filters with `public.is_admin()` | all rows through underlying admin RLS | read-only |

Role expectations:

- Status review/approval/completion/rejection: `owner`, `admin`, `finance`, `compliance`.
- Internal notes and review checks: `owner`, `admin`, `finance`, `compliance`, `support`.
- View-only admins can read the queue because `public.is_admin()` allows admin reads, but they cannot mutate withdrawals through RPCs.

### Example App Calls

Create a withdrawal request:

```ts
await supabase.rpc("create_crypto_withdrawal_request", {
  destination_address_id: addressId,
  amount: 0.018,
  amount_usd: 1166.77,
  rate_usd: 64820.5,
  fee: 0.0005,
  fee_usd: 32.41,
});
```

Fetch admin page data:

```ts
const [{ data: withdrawals }, { data: summary }] = await Promise.all([
  supabase.from("admin_withdrawal_management_view").select("*").order("created_at", { ascending: false }),
  supabase.rpc("get_admin_withdrawal_management_summary"),
]);
```

Approve or escalate a withdrawal:

```ts
await supabase.rpc("admin_update_crypto_withdrawal_status", {
  withdrawal_id: withdrawalId,
  new_status: "approved",
  reason: "KYC, 2FA, and destination checks passed",
});
```

Complete a payout:

```ts
await supabase.rpc("admin_update_crypto_withdrawal_status", {
  withdrawal_id: withdrawalId,
  new_status: "completed",
  reason: "Payout broadcast and confirmed",
  payout_tx_hash: "0x...",
});
```

Reject a withdrawal:

```ts
await supabase.rpc("admin_update_crypto_withdrawal_status", {
  withdrawal_id: withdrawalId,
  new_status: "rejected",
  reason: "Destination failed AML review",
});
```

Add an internal note:

```ts
await supabase.rpc("admin_add_crypto_withdrawal_note", {
  withdrawal_id: withdrawalId,
  note: "Hold until support confirms the new-device login.",
});
```

Update a review check:

```ts
await supabase.rpc("admin_upsert_crypto_withdrawal_check", {
  withdrawal_id: withdrawalId,
  check_label: "New device login",
  check_status: "warning",
  check_details: "New device sign-in detected within 24 hours.",
  check_display_order: 3,
});
```

### v1 Data Expectations

- `withdrawal_addresses` starts empty and fills from the user withdrawal page.
- `crypto_withdrawals` starts empty and fills from `create_crypto_withdrawal_request`.
- Review checks can be created by the app when a request is opened or by admins through the check upsert RPC.
- The current user withdrawal mock includes SOL, but the database migration intentionally keeps withdrawal assets aligned with deposit support: BTC, ETH, and USDT.

### Notes For Future Work

- Add an account ledger before production money movement. This withdrawal design carefully updates `user_balance_snapshots`, but a ledger should become the financial source of truth.
- Add a `withdrawal_payout_batches` table if finance batches multiple USDT/TRC-20 or BTC payouts into one operational run.
- Add a blockchain observation/webhook table for completed withdrawal confirmations and failed transaction monitoring.
- Add strict per-network address validation once the production asset/network list is final.

## Admin Transaction Management Page

Route: `/nexcoin-admin-priv/transactions`

Purpose: let admins inspect every deposit, withdrawal, investment, profit, fee, referral, and manual adjustment across the platform ledger, filter the queue, mark rows as reviewed, add internal notes, and log/resolve reconciliation exceptions.

### Current Page Data Fields

The current data contract lives in `lib/admin-transactions.ts` and the page UI lives in `components/neocoin-admin-priv/admin-transactions.tsx`.

Ledger row fields:

| Current field | Meaning | Recommended source |
| --- | --- | --- |
| `id` | Ledger row id | `admin_transaction_management_view.id`, same UUID as the underlying `crypto_deposits.id` / `crypto_withdrawals.id` |
| `reference` | Human-friendly transaction reference | `admin_transaction_management_view.reference`; v1 reuses the source reference (`DP-*` / `WD-*`) |
| `linkedReference` | Reference of the linked plan/investment/source | `admin_transaction_management_view.linked_reference`; v1 mirrors `reference` until a dedicated ledger table ships |
| `userName` | Customer display name | `profiles.full_name` via the view |
| `userEmail` | Customer email | `profiles.email` via the view |
| `type` | Deposit, Withdrawal, Investment, Profit, Fee, Referral, Adjustment | synthesized in the view from `source_type` (`Deposit` / `Withdrawal` in v1) |
| `direction` | In / Out | synthesized (`In` for deposits, `Out` for withdrawals) |
| `amount` | Crypto amount | `crypto_deposits.amount` / `crypto_withdrawals.amount` |
| `amountUsd` | USD value at entry time | `amount_usd` on the source row |
| `assetSymbol` | BTC / ETH / USDT display label | `upper(asset::text)` via the view |
| `network` | Blockchain/network label | `network` on the source row |
| `method` | Crypto deposit / Crypto withdrawal / Automated profit / etc. | synthesized in the view |
| `feeUsd` | USD fee retained by the platform | `0` for deposits, `fee_usd` for withdrawals |
| `status` | Completed, Credited, Failed, Pending, Processing, Rejected, Reviewed | synthesized from the source status, with `transaction_reviews` collapsing to `reviewed` |
| `reviewed` | Has the row been formally reviewed | `true` when a `transaction_reviews` row exists for this (source_type, source_id) |
| `txHash` | Blockchain tx hash | `tx_hash` on the source row |
| `walletAddress` | Snapshot of the relevant wallet | receiving address (deposits) / destination address (withdrawals) |
| `exception` | Short summary of any open exceptions attached to this row | rolled up from `transaction_exceptions` with `resolved_at is null` |
| `internalNotes` | Admin-only notes | rolled up from the source-specific internal notes tables (`crypto_deposit_internal_notes` / `crypto_withdrawal_internal_notes`) |
| `timeline` | Display-friendly event timeline | rolled up from the source-specific events tables, excluding note-added rows |
| `createdAt` | Ledger entry time | `created_at` on the source row |

Summary card fields:

| Card | Derivation |
| --- | --- |
| Total inflow | `sum(amount_usd where direction = 'In' and status = 'credited')` |
| Total outflow | `sum(amount_usd where direction = 'Out' and status = 'completed')` |
| Pending / processing | `count` of rows in pending/confirming/needs_review/aml_review/approved/processing |
| Failed / rejected | `count` of rows with status = 'rejected' |
| Fees collected | `sum(fee_usd where status = 'completed')` |
| Ledger entries | `count(*)` across deposits + withdrawals |

Reconciliation queue buckets are computed on the fly from the underlying tables — see `get_admin_transaction_reconciliation`. Ledger exceptions are admin-logged rows grouped by `exception_code` — see `get_admin_transaction_exceptions`.

### Design Decision

The transactions page is a unified **ledger view**, not a new source of truth. Every row is already owned by another feature (deposits, withdrawals, and later investments/profits/adjustments), so v1 reads from a `UNION` view rather than copying data into a `transactions` table. Two small side tables hold the only state that is transaction-page-specific:

- `public.transaction_reviews` — per-row "reviewed" flag keyed by `(source_type, source_id)` so the same design works when new sources are added later.
- `public.transaction_exceptions` — per-occurrence ledger integrity findings (duplicate tx hash, amount mismatch, orphan fee). Grouped by `exception_code` in the UI.

Recommended structure:

- `public.admin_transaction_management_view` — unified read model. v1 unions `crypto_deposits` + `crypto_withdrawals`; later unions extend it for investments, profits, fees, referrals, and manual adjustments.
- `public.transaction_reviews` — admin mark-reviewed state.
- `public.transaction_exceptions` — logged ledger exceptions.
- `public.admin_audit_logs` — general audit log for transaction actions.

Reads:

- Admin transactions page reads `admin_transaction_management_view`, `get_admin_transaction_management_summary`, `get_admin_transaction_reconciliation`, and `get_admin_transaction_exceptions`.

Writes:

- Admins mark reviewed only through `admin_mark_transaction_reviewed`.
- Admins add internal notes only through `admin_add_transaction_note` (dispatches to the source-specific note RPC so notes stay in one place per source).
- Admins log/resolve exceptions only through `admin_log_transaction_exception` / `admin_resolve_transaction_exception`.
- No direct table writes from the client.

### Suggested Migration Order

If migrations 01–49 are already in place, continue with:

50. Transaction enums + `admin_action_type` additions.
51. `transaction_reviews` + RLS.
52. `transaction_exceptions` + RLS.
53. `admin_transaction_management_view`.
54. `admin_mark_transaction_reviewed` RPC.
55. `admin_add_transaction_note` dispatcher RPC.
56. `admin_log_transaction_exception` RPC.
57. `admin_resolve_transaction_exception` RPC.
58. `get_admin_transaction_management_summary` RPC.
59. `get_admin_transaction_reconciliation` RPC.
60. `get_admin_transaction_exceptions` RPC.

Paste-ready SQL files live under `supabase/migrations/50_*.sql` through `60_*.sql`.

### Enum Additions

```sql
create type public.transaction_source_type as enum (
  'crypto_deposit',
  'crypto_withdrawal'
);

create type public.transaction_exception_severity as enum (
  'high',
  'medium',
  'low'
);

alter type public.admin_action_type add value if not exists 'transaction_reviewed';
alter type public.admin_action_type add value if not exists 'transaction_exception_logged';
alter type public.admin_action_type add value if not exists 'transaction_exception_resolved';
```

`transaction_source_type` is designed to grow. As new ledger sources ship (investments, profits, fees, referrals, manual adjustments) extend the enum in a new migration, then add their branch to the UNION in `admin_transaction_management_view`.

### Key Tables

`transaction_reviews`:

- Unique by `(source_type, source_id)` — one review state per ledger row.
- `reviewed_by` / `reviewed_at` capture the most recent admin who marked the row reviewed. Re-calling the RPC updates these in place (idempotent re-review).
- Drives the synthetic `reviewed` status in the admin view.

`transaction_exceptions`:

- One row per occurrence, not per bucket. The exceptions RPC groups by `exception_code` so repeat findings collapse into a single card with a count.
- `source_type` and `source_id` are nullable so general reconciliation findings (not tied to a specific ledger row) can also be logged.
- `resolved_at` / `resolved_by` track the admin who cleared the finding. The list RPC filters to rows where `resolved_at is null`.

### Status Mapping

The admin view collapses source statuses into the page's UI status vocabulary:

| Source | Source status | View status |
| --- | --- | --- |
| Deposit | `pending` | `pending` |
| Deposit | `confirming`, `needs_review` | `processing` |
| Deposit | `credited` | `credited` |
| Deposit | `rejected` | `rejected` |
| Withdrawal | `pending` | `pending` |
| Withdrawal | `aml_review`, `approved`, `processing` | `processing` |
| Withdrawal | `completed` | `completed` |
| Withdrawal | `rejected` | `rejected` |
| Any | any native status, with a `transaction_reviews` row | `reviewed` |

### RLS Summary

| Table / view | Anon read | Authenticated user read | Admin read | Direct write |
| --- | --- | --- | --- | --- |
| `transaction_reviews` | none | none | all rows | RPC only |
| `transaction_exceptions` | none | none | all rows | RPC only |
| `admin_transaction_management_view` | none | none; view filters through underlying deposit/withdrawal admin RLS | all rows | read-only |

Role expectations:

- Mark reviewed and add notes: `owner`, `admin`, `finance`, `compliance`, `support`.
- Log and resolve exceptions: `owner`, `admin`, `finance`, `compliance`.

### Example App Calls

Fetch admin page data:

```ts
const [
  { data: transactions },
  { data: summary },
  { data: reconciliation },
  { data: exceptions },
] = await Promise.all([
  supabase.from("admin_transaction_management_view").select("*").order("created_at", { ascending: false }),
  supabase.rpc("get_admin_transaction_management_summary"),
  supabase.rpc("get_admin_transaction_reconciliation"),
  supabase.rpc("get_admin_transaction_exceptions"),
]);
```

Mark a ledger row reviewed:

```ts
await supabase.rpc("admin_mark_transaction_reviewed", {
  source_type: "crypto_withdrawal",
  source_id: withdrawalId,
});
```

Add an internal note (dispatches to the underlying source):

```ts
await supabase.rpc("admin_add_transaction_note", {
  source_type: "crypto_deposit",
  source_id: depositId,
  note: "Matched to on-chain hash after third confirmation.",
});
```

Log a ledger exception:

```ts
await supabase.rpc("admin_log_transaction_exception", {
  exception_code: "duplicate_tx_hash",
  title: "Duplicate transaction hash",
  description: "Same on-chain hash appears on more than one ledger entry.",
  severity: "high",
  source_type: "crypto_deposit",
  source_id: depositId,
});
```

Resolve an exception once the underlying issue is fixed:

```ts
await supabase.rpc("admin_resolve_transaction_exception", {
  exception_id: exceptionId,
});
```

### v1 Data Expectations

- `admin_transaction_management_view` returns whatever `crypto_deposits` + `crypto_withdrawals` currently hold. Until other sources (investments, profits, fees, referrals, adjustments) have their own tables, those transaction types never appear on the page.
- `transaction_reviews` and `transaction_exceptions` start empty and fill through admin action.
- `manual_adjustments` in the reconciliation RPC always returns `0` until an adjustments table exists. The bucket is kept so the UI layout matches the final design.
- The ledger `reference` in v1 is the underlying `DP-*` / `WD-*` reference. Once a real ledger table ships, that column will become a `TXN-*` reference and `linked_reference` will point back to the source reference.

### Notes For Future Work

- Build a true `transactions` ledger table once deposits/withdrawals move to an event-sourced flow. The view in this design is the migration target — the column names already match the production shape.
- Add an automated reconciliation job that logs `transaction_exceptions` for duplicate hashes, amount mismatches, orphan fees, and profit-without-active-plan findings.
- Extend `transaction_source_type` and the view UNION branches as investments, profits, fees, referrals, and manual adjustments land.
- Replace the "dispatcher" `admin_add_transaction_note` with a single generic `transaction_notes` table once more than two sources exist — the dispatcher scales poorly past 3–4 branches.

## Admin KYC Review Page

Route: `/nexcoin-admin-priv/kyc-review`

Related user route: `/account/verification`

Purpose: let admins review identity submissions, inspect document quality, run/check verification steps, approve or reject KYC, request resubmission, add internal notes, and keep the shared `user_compliance.kyc_status` source in sync.

### Current Page Data Fields

The current data contract lives in `lib/admin-kyc-review.ts` and the page UI lives in `components/neocoin-admin-priv/admin-kyc-review.tsx`.

The KYC Review UI intentionally does **not** use country or risk fields. Those were removed from the page data and should not be added back to this page-specific read model.

Submission row fields:

| Current field | Meaning | Recommended source |
| --- | --- | --- |
| `id` | KYC submission id | `kyc_submissions.id` |
| `reference` | Human-friendly KYC reference | `kyc_submissions.reference`, generated from `kyc_submission_reference_seq` as `KYC-2050` style values |
| `userName` | Customer display name | `profiles.full_name` via `admin_kyc_review_view` |
| `userEmail` | Customer email | `profiles.email` via `admin_kyc_review_view` |
| `accountStatus` | Active, Flagged, Restricted | `profiles.account_status`; map DB `suspended` to UI restricted if needed |
| `status` | Pending, In Review, Needs Resubmission, Approved, Rejected | `kyc_submissions.status` |
| `kycStatus` | Shared account KYC state | `user_compliance.kyc_status` |
| `documentType` | Passport, National ID, Driver License | `kyc_submissions.document_type` |
| `documentNumber` | Masked/entered document number | `kyc_submissions.document_number` |
| `documentExpiry` | Document expiry date | `kyc_submissions.document_expiry` |
| `documentQuality` | Clear, Blurry, Poor | `kyc_submissions.document_quality` |
| `dateOfBirth` | Customer date of birth | `kyc_submissions.date_of_birth` |
| `address` | Address entered/proved by the user | `kyc_submissions.address` |
| `livenessStatus` | Selfie/liveness check status | `kyc_submissions.liveness_status` |
| `proofOfAddressStatus` | Proof-of-address check status | `kyc_submissions.proof_of_address_status` |
| `accountLimits.current` | Limit label before approval | `kyc_submissions.current_limit_label` |
| `accountLimits.afterApproval` | Limit label after approval | `kyc_submissions.after_approval_limit_label` |
| `checks` | Review checklist rows | `kyc_submission_checks` aggregated by the admin view |
| `flags` | Compliance flag text shown in queue/modal | `kyc_submission_flags` joined to `kyc_flag_catalog` |
| `internalNotes` | Admin-only notes | `kyc_submission_internal_notes` aggregated by the admin view |
| `timeline` | Status-level timeline | `kyc_submission_events` aggregated by the admin view |
| `createdAt` | Submission time | `kyc_submissions.created_at` |

Document file fields:

| Field | Purpose |
| --- | --- |
| `document_front_path` | Supabase Storage path for ID front / primary identity document |
| `document_back_path` | Supabase Storage path for ID back, when required |
| `selfie_path` | Supabase Storage path for selfie/liveness image |
| `proof_of_address_path` | Supabase Storage path for utility bill / proof of address, when required |

Summary card fields:

| Card | Derivation |
| --- | --- |
| Pending review | `count kyc_submissions where status in ('pending', 'in_review')` |
| Approved today | `count kyc_submissions where status = 'approved' and reviewed_at::date = current_date` |
| Rejected today | `count kyc_submissions where status in ('rejected', 'needs_resubmission') and reviewed_at::date = current_date` |
| Average review | average minutes between `created_at` and `reviewed_at` over the last 30 days |
| Docs expiring | `count kyc_submissions where document_expiry` is within the next 60 days and status is pending / in review / approved |
| Compliance flags | grouped counts from active `kyc_flag_catalog` rows joined to open review submissions |

### Design Decision

Split KYC into a submission workflow and a shared compliance summary:

- `public.kyc_submissions` — one row per user submission or resubmission. This stores document metadata, file paths, address, DOB, liveness/proof statuses, decision status, and limit labels.
- `public.kyc_submission_checks` — checklist rows used by the admin review modal.
- `public.kyc_flag_catalog` — stable flag definitions shown in the sidebar.
- `public.kyc_submission_flags` — flag assignments per submission.
- `public.kyc_submission_events` — display-friendly status timeline.
- `public.kyc_submission_internal_notes` — admin-only notes.
- `public.admin_kyc_review_view` — admin read model with user identity and JSON rollups.
- `public.user_compliance` — shared account-level KYC status used by user management, withdrawals, and other pages.
- `public.admin_audit_logs` — general audit log for sensitive admin KYC decisions.

Reads:

- User verification page reads own `kyc_submissions`, own checks, own flags, and own non-internal events.
- Admin KYC page reads `admin_kyc_review_view` and `get_admin_kyc_review_summary`.

Writes:

- Users create a submission only through `create_kyc_submission`.
- Admins change status only through `admin_update_kyc_submission_status`.
- Admins add internal notes only through `admin_add_kyc_submission_note`.
- Admins update checklist rows only through `admin_upsert_kyc_submission_check`.
- Admins assign/remove flags only through `admin_set_kyc_submission_flag`.

### Suggested Migration Order

If migrations 01–60 are already in place, continue with:

61. KYC enums + `admin_action_type` additions.
62. `kyc_flag_catalog` + starter flags + RLS.
63. `kyc_submissions` + document storage paths + reference sequence + RLS.
64. `kyc_submission_checks` + RLS.
65. `kyc_submission_flags` + RLS.
66. `kyc_submission_events` and `kyc_submission_internal_notes` + RLS.
67. `admin_kyc_review_view`.
68. `create_kyc_submission` user RPC.
69. `admin_update_kyc_submission_status` RPC.
70. `admin_add_kyc_submission_note` RPC.
71. `admin_upsert_kyc_submission_check` RPC.
72. `admin_set_kyc_submission_flag` RPC.
73. `get_admin_kyc_review_summary` RPC.

Paste-ready SQL files live under `supabase/migrations/61_*.sql` through `73_*.sql`.

### Enum Additions

```sql
create type public.kyc_submission_status as enum (
  'pending',
  'in_review',
  'needs_resubmission',
  'approved',
  'rejected'
);

create type public.kyc_document_type as enum (
  'passport',
  'national_id',
  'driver_license'
);

create type public.kyc_check_status as enum (
  'passed',
  'review',
  'failed'
);

create type public.kyc_document_quality as enum (
  'clear',
  'blurry',
  'poor'
);

alter type public.admin_action_type add value if not exists 'kyc_submission_created';
alter type public.admin_action_type add value if not exists 'kyc_submission_status_changed';
alter type public.admin_action_type add value if not exists 'kyc_submission_note_added';
alter type public.admin_action_type add value if not exists 'kyc_submission_check_updated';
alter type public.admin_action_type add value if not exists 'kyc_submission_flag_assigned';
alter type public.admin_action_type add value if not exists 'kyc_submission_flag_removed';
```

### Key Tables

`kyc_submissions`:

- `reference`: unique admin/user-facing value like `KYC-2050`.
- `document_type`, `document_number`, `document_expiry`, `document_quality`: identity document metadata.
- `document_front_path`, `document_back_path`, `selfie_path`, `proof_of_address_path`: Supabase Storage paths for uploaded files. Keep file binaries in Storage, not Postgres.
- `date_of_birth`: validated by the create RPC so the user must be at least 18.
- `address`: user-entered/proved address text. The current KYC review UI does not use country as a separate field.
- `liveness_status` and `proof_of_address_status`: summary statuses used by the document workspace.
- `current_limit_label` and `after_approval_limit_label`: v1 display labels for the account limit tiles.
- `reviewed_by`, `reviewed_at`, `rejection_reason`: admin decision metadata.

`kyc_submission_checks`:

- One row per checklist label per submission.
- The create RPC inserts starter rows: Document readable, Name matches account, Date of birth valid, Document not expired, Selfie matches document, Sanctions / PEP clear.
- Admins can upsert checklist rows through `admin_upsert_kyc_submission_check`.

`kyc_flag_catalog` and `kyc_submission_flags`:

- Catalog stores reusable flag labels such as name mismatch, blurry upload, duplicate document, and withdrawal waiting on KYC.
- Assignments store the specific flags attached to a submission.
- Flags do not carry severity/risk in this design because the UI no longer uses risk.

`kyc_submission_events`:

- User-created submissions have `actor_user_id`.
- Admin actions have `actor_admin_id`.
- User RLS hides internal-note and check-update events.

`kyc_submission_internal_notes`:

- Admin-only notes shown in the review modal.
- Users never read these rows.

### Status Flow

1. User creates a submission through `create_kyc_submission`.
2. The RPC blocks duplicate active submissions if the user already has a `pending` or `in_review` submission.
3. The RPC generates a `KYC-*` reference, inserts starter checklist rows, emits a timeline event, and sets `user_compliance.kyc_status = 'pending'`.
4. Admin can mark the submission `in_review`.
5. Admin can request `needs_resubmission`; this maps `user_compliance.kyc_status` to `pending`.
6. Admin can mark `approved`; this maps `user_compliance.kyc_status` to `approved`.
7. Admin can mark `rejected`; this maps `user_compliance.kyc_status` to `rejected`.
8. `approved` and `rejected` are terminal states. A user should create a new submission for future updates/resubmissions.

### RLS Summary

| Table / view | Anon read | Authenticated user read | Admin read | Direct write |
| --- | --- | --- | --- | --- |
| `kyc_submissions` | none | own rows | all rows | RPC only |
| `kyc_submission_checks` | none | own submission checks | all rows | admin insert/update policy + RPC |
| `kyc_flag_catalog` | none | none | active/all catalog rows | admin seed/DB-only in v1 |
| `kyc_submission_flags` | none | own submission flags | all rows | admin policies + RPC |
| `kyc_submission_events` | none | own non-internal events | all rows | admin insert policy + RPCs |
| `kyc_submission_internal_notes` | none | none | all rows | admin insert policy + RPC |
| `admin_kyc_review_view` | none | none; view filters with `public.is_admin()` | all rows through underlying admin RLS | read-only |

Role expectations:

- Status decisions and flag assignment: `owner`, `admin`, `compliance`.
- Notes and checklist updates: `owner`, `admin`, `compliance`, `support`.
- View-only admins can read the queue because `public.is_admin()` allows admin reads, but they cannot mutate submissions through RPCs.

### Example App Calls

Create a user KYC submission:

```ts
await supabase.rpc("create_kyc_submission", {
  document_type: "passport",
  document_number: "P739123442",
  document_expiry: "2030-03-01",
  document_quality: "clear",
  date_of_birth: "1991-06-14",
  address: "142 King Street",
  current_limit_label: "$2,000 daily withdrawals",
  after_approval_limit_label: "$50,000 daily withdrawals",
  document_front_path: "kyc/user-id/passport-front.jpg",
  document_back_path: "kyc/user-id/passport-back.jpg",
  selfie_path: "kyc/user-id/selfie.jpg",
  proof_of_address_path: "kyc/user-id/address.pdf",
});
```

Fetch admin page data:

```ts
const [{ data: submissions }, { data: summary }] = await Promise.all([
  supabase.from("admin_kyc_review_view").select("*").order("created_at", { ascending: false }),
  supabase.rpc("get_admin_kyc_review_summary"),
]);
```

Update status:

```ts
await supabase.rpc("admin_update_kyc_submission_status", {
  submission_id: submissionId,
  new_status: "approved",
  reason: "Document, liveness, and sanctions checks passed.",
});
```

Add an internal note:

```ts
await supabase.rpc("admin_add_kyc_submission_note", {
  submission_id: submissionId,
  note: "Asked support to confirm legal name spelling.",
});
```

Update a checklist row:

```ts
await supabase.rpc("admin_upsert_kyc_submission_check", {
  submission_id: submissionId,
  check_label: "Selfie matches document",
  check_status: "passed",
  check_details: "Manual face comparison passed.",
  check_display_order: 5,
});
```

Assign or remove a compliance flag:

```ts
await supabase.rpc("admin_set_kyc_submission_flag", {
  submission_id: submissionId,
  flag_code: "blurry-upload",
  assigned: true,
  detail: "Passport image is readable but soft around the document number.",
});
```

### v1 Data Expectations

- KYC tables start empty except `kyc_flag_catalog`, which is seeded with starter flag labels.
- File uploads should go to Supabase Storage first; the KYC RPC stores only paths.
- The admin view returns lowercase enum values. The UI should map them to display labels like `Needs Resubmission`, `Driver License`, and `Clear`.
- No country or risk fields are part of this page-specific schema.

### Notes For Future Work

- Add storage bucket policies for KYC files so users can upload their own files and admins can read them.
- Add automated document/liveness provider webhook tables if a real KYC vendor is integrated.
- Add document hash/fingerprint columns if duplicate-document detection needs to be automated rather than flag-driven.
- Consider replacing formatted limit labels with numeric limit columns once account limit rules are finalized.

## Admin Support Management Page

Route: `/nexcoin-admin-priv/support`

Related user route: `/account/support`

Purpose: let admins triage support inbox volume, inspect ticket threads, add internal notes, respond to users, manage ownership/SLAs, and link operational records like deposits, withdrawals, transactions, and KYC submissions.

### Current Page Data Fields

The current data contract lives in `lib/admin-support.ts` and the page UI lives in `components/neocoin-admin-priv/admin-support.tsx`.

Ticket row / modal fields:

| Current field | Meaning | Recommended source |
| --- | --- | --- |
| `id` | Ticket UUID | `support_tickets.id` |
| `reference` | Human-friendly support reference | `support_tickets.reference`, generated from `support_ticket_reference_seq` as `SUP-1208` style values |
| `subject` | Ticket title | `support_tickets.subject` |
| `userName` | Customer display name | `profiles.full_name` via `admin_support_management_view` |
| `userEmail` | Customer email | `profiles.email` via `admin_support_management_view` |
| `agent` | Assigned support/admin owner | `support_tickets.assigned_admin_id -> profiles.full_name` via `admin_support_management_view` |
| `category` | Account, Deposit, KYC, Security, etc. | `support_tickets.category` |
| `priority` | Low, Medium, High, Urgent | `support_tickets.priority` |
| `status` | Open, Pending Admin, Awaiting User, Resolved, Closed | `support_tickets.status` |
| `createdAt` | Ticket creation time | `support_tickets.created_at` |
| `lastMessageAt` | Most recent thread activity time | `support_tickets.last_message_at` |
| `slaDueAt` | SLA deadline | `support_tickets.sla_due_at` |
| `attachments` | File names shown in the modal | `support_ticket_attachments` aggregated by the admin view |
| `linkedRecords.deposit` | Linked deposit reference | `support_ticket_links` where `link_type = 'deposit'` |
| `linkedRecords.withdrawal` | Linked withdrawal reference | `support_ticket_links` where `link_type = 'withdrawal'` |
| `linkedRecords.transaction` | Linked transaction reference | `support_ticket_links` where `link_type = 'transaction'` |
| `linkedRecords.kyc` | Linked KYC reference | `support_ticket_links` where `link_type = 'kyc'` |
| `messages` | Full visible/admin/internal thread | `support_ticket_messages` aggregated by the admin view |
| `internalNotes` | Admin-only note list | internal `support_ticket_messages` aggregated by the admin view |
| `timeline` | Ticket lifecycle history | `support_ticket_events` aggregated by the admin view |

Sidebar / summary fields:

| Card / panel | Derivation |
| --- | --- |
| Open tickets | `count support_tickets where status in ('open', 'pending_admin')` |
| Urgent tickets | `count support_tickets where priority = 'urgent' and status not in ('resolved', 'closed')` |
| Awaiting user | `count support_tickets where status = 'awaiting_user'` |
| Resolved today | `count support_tickets where resolved_at::date = current_date` |
| SLA at risk | `count support_tickets where status in ('open', 'pending_admin') and sla_due_at <= now() + interval '2 hours'` |
| Avg response | average minutes between `created_at` and `first_response_at` over the last 30 days |
| Agent workload | grouped counts by `support_tickets.assigned_admin_id` |
| Common issues | grouped counts by `support_tickets.category` over the last 30 days |
| SLA alerts | earliest tickets due within the next 4 hours, ordered by `sla_due_at` |

### Design Decision

Support is modeled as a ticket plus surrounding thread artifacts:

- `public.support_tickets` — one row per user issue with subject, status, priority, SLA fields, assigned admin, and timestamps.
- `public.support_ticket_messages` — conversation entries. `message_type` distinguishes `user`, `admin`, and `internal`.
- `public.support_ticket_attachments` — attachment metadata only; actual binaries should live in Supabase Storage.
- `public.support_ticket_links` — flexible record links for deposit / withdrawal / transaction / KYC references without hard-coding many nullable foreign-key columns into the main ticket table.
- `public.support_ticket_events` — display-friendly timeline of ticket lifecycle events and staff actions.
- `public.admin_support_management_view` — admin read model with user identity plus JSON rollups used directly by the page.
- `public.admin_audit_logs` — sensitive support assignment / reply / close actions.

Reads:

- User support page should eventually read `support_tickets`, `support_ticket_messages`, `support_ticket_attachments`, `support_ticket_links`, and non-internal `support_ticket_events` for `auth.uid()`.
- Admin support page reads `admin_support_management_view` and `get_admin_support_management_summary`.

Writes:

- Users create tickets only through `create_support_ticket`.
- Admins update assignment/priority/status/SLA only through `admin_update_support_ticket`.
- Admins add visible replies or internal notes only through `admin_reply_support_ticket`.

### Suggested Migration Order

If migrations 01–73 are already in place, continue with:

74. Support enums + `admin_action_type` additions.
75. `support_tickets` + reference sequence + RLS.
76. `support_ticket_messages`, `support_ticket_attachments`, `support_ticket_links`, and `support_ticket_events` + RLS.
77. `admin_support_management_view`.
78. `create_support_ticket` user RPC.
79. `admin_update_support_ticket` RPC.
80. `admin_reply_support_ticket` RPC.
81. `get_admin_support_management_summary` RPC.

Paste-ready SQL files live under `supabase/migrations/74_*.sql` through `81_*.sql`.

### Enum Additions

```sql
create type public.support_ticket_status as enum (
  'open',
  'pending_admin',
  'awaiting_user',
  'resolved',
  'closed'
);

create type public.support_ticket_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

create type public.support_ticket_category as enum (
  'account',
  'deposit',
  'general',
  'investment',
  'kyc',
  'security',
  'withdrawal'
);

create type public.support_message_type as enum (
  'user',
  'admin',
  'internal'
);

create type public.support_link_type as enum (
  'deposit',
  'kyc',
  'transaction',
  'withdrawal'
);

alter type public.admin_action_type add value if not exists 'support_ticket_created';
alter type public.admin_action_type add value if not exists 'support_ticket_updated';
alter type public.admin_action_type add value if not exists 'support_ticket_assigned';
alter type public.admin_action_type add value if not exists 'support_ticket_replied';
alter type public.admin_action_type add value if not exists 'support_ticket_note_added';
alter type public.admin_action_type add value if not exists 'support_ticket_resolved';
alter type public.admin_action_type add value if not exists 'support_ticket_closed';
```

### Key Tables

`support_tickets`:

- `reference`: unique admin/user-facing value like `SUP-1208`.
- `status`, `priority`, `category`: lowercase enums mapped to the UI labels.
- `assigned_admin_id`: current owner; nullable so new tickets can sit unassigned.
- `sla_due_at`: queue deadline for dashboard alerting.
- `first_response_at`: used for support response-time reporting.
- `resolved_at` and `closed_at`: support lifecycle timestamps.
- `last_message_at`: keeps inbox sorting cheap.

`support_ticket_messages`:

- Stores the full conversation and internal notes in one table.
- `message_type = 'internal'` means the row is admin-only.
- `author_user_id` and `author_admin_id` are mutually exclusive by check constraint.

`support_ticket_attachments`:

- Stores metadata only: file name, storage path, content type, byte size.
- A future upload flow should write files to Storage and then store only the path here.

`support_ticket_links`:

- Lets support staff attach deposit / withdrawal / transaction / KYC references without schema churn.
- `reference` is stored directly because the current UI uses display refs like `WD-1041` and `KYC-2041`.

`support_ticket_events`:

- Lifecycle and workflow timeline for created, assigned, replied, noted, resolved, and closed actions.
- `is_internal = true` hides note events from user-facing reads.

### Status Flow

1. User creates a ticket through `create_support_ticket`.
2. The RPC creates the `support_tickets` row, opening user message, optional links/attachments, and a `support_ticket_created` event.
3. Admin can assign the ticket and adjust priority/SLA through `admin_update_support_ticket`.
4. Admin can send a visible reply through `admin_reply_support_ticket`; this sets `first_response_at` on the first staff reply and usually moves the ticket to `awaiting_user`.
5. Admin can add an internal note through the same reply RPC using `message_type = 'internal'`.
6. Admin can mark the ticket `resolved` once the issue is handled.
7. Admin can mark the ticket `closed` for fully completed/inactive threads.
8. A later user reply flow can reopen a ticket by moving it back to `open` or `pending_admin`.

### RLS Summary

| Table / view | Anon read | Authenticated user read | Admin read | Direct write |
| --- | --- | --- | --- | --- |
| `support_tickets` | none | own rows | all rows | RPC only |
| `support_ticket_messages` | none | own non-internal messages | all rows | RPC only |
| `support_ticket_attachments` | none | own non-internal ticket attachments | all rows | RPC only |
| `support_ticket_links` | none | own rows | all rows | RPC only |
| `support_ticket_events` | none | own non-internal events | all rows | RPC only |
| `admin_support_management_view` | none | none; view filters with `public.is_admin()` | all rows through underlying admin RLS | read-only |

Role expectations:

- Support queue reads: any admin role via `public.is_admin()`.
- Assignment, replies, notes, status changes: `owner`, `admin`, `support`.
- Future finance/compliance escalation can continue through linked references and shared admin note access in deposit/withdrawal/KYC modules.

### Example App Calls

Create a user support ticket:

```ts
await supabase.rpc("create_support_ticket", {
  subject: "Withdrawal delayed after approval",
  category: "withdrawal",
  message_body: "My withdrawal says approved but I have not received the funds yet.",
  priority: "high",
  linked_withdrawal_reference: "WD-1041",
  linked_transaction_reference: "TXN-2081",
  linked_kyc_reference: "KYC-2041",
  attachment_names: ["withdrawal-confirmation.png", "wallet-address.txt"],
});
```

Fetch admin page data:

```ts
const [{ data: tickets }, { data: summary }] = await Promise.all([
  supabase.from("admin_support_management_view").select("*").order("last_message_at", { ascending: false }),
  supabase.rpc("get_admin_support_management_summary"),
]);
```

Assign and reprioritize a ticket:

```ts
await supabase.rpc("admin_update_support_ticket", {
  ticket_id: ticketId,
  assigned_admin_id: adminUserId,
  priority: "urgent",
  status: "pending_admin",
});
```

Send a visible support reply:

```ts
await supabase.rpc("admin_reply_support_ticket", {
  ticket_id: ticketId,
  message_body: "We are checking the payout status and your verification hold.",
  message_type: "admin",
});
```

Add an internal note:

```ts
await supabase.rpc("admin_reply_support_ticket", {
  ticket_id: ticketId,
  message_body: "Hold reply until KYC review completes.",
  message_type: "internal",
});
```

### v1 Data Expectations

- Support tables start empty.
- The admin page should map lowercase enums back to UI labels like `Pending Admin` and `Awaiting User`.
- Attachments are metadata rows only in v1; actual files should live in Supabase Storage.
- The current user support page is still mock data, but this schema is ready for wiring when that flow moves off fixtures.

### Notes For Future Work

- Add a user reply RPC that reopens resolved tickets safely and emits timeline rows.
- Add message read receipts / seen timestamps if the UI needs unread counters.
- Add assignment rules, routing queues, or auto-SLA policies by category or priority.
- Add attachment bucket policies and virus-scanning hooks before production uploads.
