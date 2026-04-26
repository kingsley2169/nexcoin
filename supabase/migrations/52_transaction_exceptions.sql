-- 52_transaction_exceptions.sql
-- Ledger exception records surfaced in the "Ledger exceptions" panel of the
-- Transaction Management page. Each row is one occurrence of an integrity
-- issue (duplicate tx hash, amount mismatch, orphan fee, etc.). The
-- exceptions RPC groups these by `exception_code` for the summary UI.
--
-- `source_type` and `source_id` are nullable because some exceptions are not
-- tied to a specific ledger row (e.g., scheduled reconciliation failures).

create table public.transaction_exceptions (
  id uuid primary key default gen_random_uuid(),
  source_type public.transaction_source_type,
  source_id uuid,
  exception_code text not null,
  severity public.transaction_exception_severity not null default 'medium',
  title text not null,
  description text not null,
  resolved_by uuid references public.admin_users(user_id) on delete set null,
  resolved_at timestamptz,
  created_by uuid references public.admin_users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint transaction_exceptions_code_not_blank check (length(trim(exception_code)) > 0),
  constraint transaction_exceptions_title_not_blank check (length(trim(title)) > 0),
  constraint transaction_exceptions_description_not_blank check (length(trim(description)) > 0),
  constraint transaction_exceptions_source_consistency check (
    (source_type is null and source_id is null)
    or (source_type is not null and source_id is not null)
  )
);

create index transaction_exceptions_source_idx
on public.transaction_exceptions (source_type, source_id)
where source_id is not null;

create index transaction_exceptions_code_idx
on public.transaction_exceptions (exception_code);

create index transaction_exceptions_open_idx
on public.transaction_exceptions (severity, created_at desc)
where resolved_at is null;

create trigger set_updated_at_transaction_exceptions
before update on public.transaction_exceptions
for each row execute function extensions.moddatetime(updated_at);

-- RLS ----------------------------------------------------------------------

alter table public.transaction_exceptions enable row level security;

create policy "Admins can read transaction exceptions"
on public.transaction_exceptions
for select
to authenticated
using (public.is_admin());

-- Writes go through admin_log_transaction_exception and
-- admin_resolve_transaction_exception. No direct insert/update policies.
