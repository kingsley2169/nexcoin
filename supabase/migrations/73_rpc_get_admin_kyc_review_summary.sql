-- 73_rpc_get_admin_kyc_review_summary.sql
-- Summary cards + compliance flag rollup for /nexcoin-admin-priv/kyc-review.
--
-- Returns a single JSON payload:
--   {
--     "summary": {
--       "pendingReview": bigint,
--       "approvedToday": bigint,
--       "rejectedToday": bigint,
--       "averageReviewMinutes": numeric,
--       "documentsExpiring": bigint
--     },
--     "flags": [
--       { "code": text, "label": text, "count": bigint }
--     ]
--   }
--
-- Notes:
--   - `rejectedToday` counts both `rejected` and `needs_resubmission`
--     submissions decided today, since the UI surfaces both as "failed
--     checks today".
--   - `averageReviewMinutes` averages over the last 30 days to smooth spikes.
--   - `documentsExpiring` counts submissions whose document expires within
--     60 days, limited to active statuses (pending / in_review / approved).

create or replace function public.get_admin_kyc_review_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  summary jsonb;
  flags jsonb;
  today date := current_date;
  expiry_window_end date := current_date + interval '60 days';
  average_minutes numeric;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select avg(extract(epoch from (s.reviewed_at - s.created_at)) / 60)
  into average_minutes
  from public.kyc_submissions s
  where s.reviewed_at is not null
    and s.reviewed_at >= now() - interval '30 days';

  summary := jsonb_build_object(
    'pendingReview', (
      select count(*)
      from public.kyc_submissions
      where status in ('pending', 'in_review')
    ),
    'approvedToday', (
      select count(*)
      from public.kyc_submissions
      where status = 'approved'
        and reviewed_at::date = today
    ),
    'rejectedToday', (
      select count(*)
      from public.kyc_submissions
      where status in ('rejected', 'needs_resubmission')
        and reviewed_at::date = today
    ),
    'averageReviewMinutes', coalesce(round(average_minutes), 0),
    'documentsExpiring', (
      select count(*)
      from public.kyc_submissions
      where document_expiry between today and expiry_window_end
        and status in ('pending', 'in_review', 'approved')
    )
  );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'code', cat.code,
        'label', cat.label,
        'count', coalesce(f.count, 0)
      )
      order by cat.display_order
    ),
    '[]'::jsonb
  )
  into flags
  from public.kyc_flag_catalog cat
  left join (
    select flag_code, count(*)::bigint as count
    from public.kyc_submission_flags f
    join public.kyc_submissions s on s.id = f.submission_id
    where s.status in ('pending', 'in_review', 'needs_resubmission')
    group by flag_code
  ) f on f.flag_code = cat.code
  where cat.is_active;

  return jsonb_build_object(
    'summary', summary,
    'flags', flags
  );
end;
$$;
