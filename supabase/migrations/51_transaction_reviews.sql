-- 51_transaction_reviews.sql
-- Admin "mark reviewed" flag for a ledger row. Keyed by (source_type, source_id)
-- so a single table tracks review state across heterogeneous transaction
-- sources (deposits, withdrawals, and later investments/adjustments).

create table public.transaction_reviews (
  id uuid primary key default gen_random_uuid(),
  source_type public.transaction_source_type not null,
  source_id uuid not null,
  reviewed_by uuid references public.admin_users(user_id) on delete set null,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index transaction_reviews_source_key
on public.transaction_reviews (source_type, source_id);

create index transaction_reviews_reviewed_by_idx
on public.transaction_reviews (reviewed_by, reviewed_at desc);

create trigger set_updated_at_transaction_reviews
before update on public.transaction_reviews
for each row execute function extensions.moddatetime(updated_at);

-- RLS ----------------------------------------------------------------------

alter table public.transaction_reviews enable row level security;

create policy "Admins can read transaction reviews"
on public.transaction_reviews
for select
to authenticated
using (public.is_admin());

-- Writes go through admin_mark_transaction_reviewed. No direct insert/update
-- policies are defined.
