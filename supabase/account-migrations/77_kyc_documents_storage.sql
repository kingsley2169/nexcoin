-- 77_kyc_documents_storage.sql
-- Storage bucket + RLS for KYC document uploads triggered from
-- /account/verification.
--
-- Every uploaded path must be laid out as `<auth.uid()>/<kind>-<timestamp>.<ext>`
-- — the RLS policies enforce that prefix so one user can never read or write
-- another user's files. Admin accounts (public.is_admin()) can read every object
-- for compliance review.
--
-- The bucket is private (`public = false`); the app should use short-lived
-- signed URLs whenever a file needs to be displayed to an admin reviewer.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc-documents',
  'kyc-documents',
  false,
  10 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own kyc documents" on storage.objects;
drop policy if exists "Users can read own kyc documents" on storage.objects;
drop policy if exists "Users can update own kyc documents" on storage.objects;
drop policy if exists "Users can remove own kyc documents" on storage.objects;
drop policy if exists "Admins can read all kyc documents" on storage.objects;

create policy "Users can upload own kyc documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'kyc-documents'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read own kyc documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kyc-documents'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own kyc documents"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'kyc-documents'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'kyc-documents'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can remove own kyc documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'kyc-documents'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Admins can read all kyc documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kyc-documents'
  and public.is_admin()
);
