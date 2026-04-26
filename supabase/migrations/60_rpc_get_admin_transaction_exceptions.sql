-- 60_rpc_get_admin_transaction_exceptions.sql
-- Feeds the "Ledger exceptions" panel on /nexcoin-admin-priv/transactions.
-- Each open exception row is grouped by `exception_code` so repeat findings
-- collapse into a single card with a count. Title/description/severity come
-- from the most recent open row for that code.

create or replace function public.get_admin_transaction_exceptions()
returns table (
  code text,
  title text,
  description text,
  severity public.transaction_exception_severity,
  count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with open_exceptions as (
    select *
    from public.transaction_exceptions
    where resolved_at is null
      and public.is_admin()
  ),
  latest as (
    select distinct on (exception_code)
      exception_code,
      title,
      description,
      severity,
      created_at
    from open_exceptions
    order by
      exception_code,
      case severity when 'high' then 0 when 'medium' then 1 else 2 end,
      created_at desc
  ),
  counts as (
    select
      exception_code,
      count(*)::bigint as count
    from open_exceptions
    group by exception_code
  )
  select
    l.exception_code as code,
    l.title,
    l.description,
    l.severity,
    c.count
  from latest l
  join counts c on c.exception_code = l.exception_code
  order by
    case l.severity when 'high' then 0 when 'medium' then 1 else 2 end,
    c.count desc;
$$;
