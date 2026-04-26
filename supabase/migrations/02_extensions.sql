-- 02_extensions.sql
-- Supabase extensions used by the schema.
-- moddatetime auto-updates `updated_at` columns via BEFORE UPDATE triggers.

create extension if not exists moddatetime schema extensions;
