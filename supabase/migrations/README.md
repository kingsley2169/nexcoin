# Supabase Migrations

Each file is a self-contained SQL script. Paste them into the Supabase SQL Editor in numeric order — each file groups one logical concern (a table plus its indexes, triggers, and RLS policies, or a single RPC).

## Order

| # | File | What it does |
| --- | --- | --- |
| 01 | `01_enums.sql` | All enum types (`account_status`, `kyc_status`, `risk_level`, `admin_role`, `admin_action_type`). |
| 02 | `02_extensions.sql` | Enables the `moddatetime` extension for auto-updating `updated_at` columns. |
| 03 | `03_profiles.sql` | `profiles` table, indexes, `updated_at` trigger. No RLS yet — needs the admin helpers first. |
| 04 | `04_admin_users.sql` | `admin_users` table, indexes, `updated_at` trigger, `current_admin_role` / `is_admin` / `is_admin_with_role` helpers, and `admin_users` RLS. |
| 05 | `05_profiles_rls.sql` | `enforce_profiles_admin_only_columns` trigger + all RLS policies on `profiles`. Depends on 04. |
| 06 | `06_user_compliance.sql` | `user_compliance` table, indexes, `updated_at` trigger, safe `my_compliance_summary` view for users, and admin-only RLS. |
| 07 | `07_tags.sql` | `tags` + `user_tags` tables, starter tag seed data, and RLS. |
| 08 | `08_user_balance_snapshots.sql` | Balance snapshot table, indexes, `updated_at` trigger, RLS. Zero-filled for v1. |
| 09 | `09_account_status_events.sql` | Account-status audit trail + RLS. |
| 10 | `10_admin_audit_logs.sql` | Generic admin audit log + RLS. |
| 11 | `11_signup_trigger.sql` | `handle_new_user` function and the `auth.users` insert trigger. Depends on profiles, user_compliance, user_balance_snapshots existing. |
| 12 | `12_admin_user_management_view.sql` | `admin_user_management_view` read model for the Admin User Management page. |
| 13 | `13_rpc_admin_update_account_status.sql` | RPC: suspend / activate / flag / clear-flag a user. Writes audit rows. |
| 14 | `14_rpc_admin_assign_user_tag.sql` | RPC: attach a tag to a user (upsert). |
| 15 | `15_rpc_admin_remove_user_tag.sql` | RPC: detach a tag from a user. |
| 16 | `16_rpc_get_admin_user_management_summary.sql` | RPC feeding the four summary cards + aggregate balances on the page. |

### Investment Plan Management page

| # | File | What it does |
| --- | --- | --- |
| 17 | `17_investment_enums.sql` | `plan_status`, `plan_risk`, `user_investment_status`, plus `alter type` additions to `admin_action_type` for plan events. Must be its own file so the new enum values commit before any RPC references them. |
| 18 | `18_investment_plans.sql` | `investment_plans` catalog table, indexes, `updated_at` trigger, RLS (public reads active plans, admins read all). |
| 19 | `19_user_investments.sql` | `user_investments` table, indexes, `updated_at` trigger, RLS. Stays empty in v1 until the subscribe flow is built. |
| 20 | `20_investment_plan_events.sql` | Plan-specific audit log (create / update / status change / archive). Powers the Plan activity panel. |
| 21 | `21_admin_investment_plan_catalog_view.sql` | `admin_investment_plan_catalog_view` — one row per plan with per-plan aggregates (active investors, total invested, profit credited, maturing today). |
| 22 | `22_rpc_admin_create_investment_plan.sql` | RPC: insert a plan row and emit create event. owner/admin only. |
| 23 | `23_rpc_admin_update_investment_plan.sql` | RPC: null-safe field update (name, description, risk, deposit range, return, duration, features, highlight, display order). Does NOT change status. |
| 24 | `24_rpc_admin_set_investment_plan_status.sql` | RPC: flip `status` between active / paused / draft. Refuses `archived` (use the archive RPC). |
| 25 | `25_rpc_admin_archive_investment_plan.sql` | RPC: soft-delete a plan. Refuses to archive if the plan still has active user investments. |
| 26 | `26_rpc_get_admin_investment_plan_summary.sql` | RPC feeding the four summary cards (active plans, total invested, profit credited, maturing today) + investor counts. |
| 27 | `27_rpc_get_admin_investment_plan_activity.sql` | RPC feeding the Plan activity panel. |

### Deposit Management page

| # | File | What it does |
| --- | --- | --- |
| 28 | `28_deposit_enums.sql` | `deposit_asset`, `deposit_status`, plus `alter type` additions to `admin_action_type` for deposit and receiving-wallet events. Must be its own file so enum values commit before RPCs reference them. |
| 29 | `29_deposit_receiving_wallets.sql` | Admin-managed crypto receiving wallets for BTC, ETH, and USDT, including starter rows, indexes, `updated_at` trigger, and RLS. Users can only read active non-archived wallets; admins can read all. |
| 30 | `30_crypto_deposits.sql` | User crypto deposit requests, reference sequence, indexes, `updated_at` trigger, and RLS. Users read their own rows; admins read all; writes go through RPCs. |
| 31 | `31_crypto_deposit_events_and_notes.sql` | Deposit timeline events and admin-only internal notes. Users can read non-internal-note events for their own deposits; admins can read/write the full review trail. |
| 32 | `32_admin_deposit_management_view.sql` | `admin_deposit_management_view` read model for the admin page: user identity, wallet snapshot, deposit status/risk, notes, and timeline JSON. |
| 33 | `33_rpc_create_crypto_deposit_request.sql` | User RPC: creates a pending crypto deposit against an active receiving wallet, snapshots the receiving address, and generates a `DP-` reference. |
| 34 | `34_rpc_admin_create_receiving_wallet.sql` | Admin RPC: create a BTC/ETH/USDT receiving wallet and audit the action. owner/admin/finance only. |
| 35 | `35_rpc_admin_update_receiving_wallet.sql` | Admin RPC: update receiving wallet label/network/address/active status and audit the change. owner/admin/finance only. |
| 36 | `36_rpc_admin_remove_receiving_wallet.sql` | Admin RPC: soft-remove a receiving wallet by setting `archived_at` and `is_active = false`. owner/admin/finance only. |
| 37 | `37_rpc_admin_update_crypto_deposit_status.sql` | Admin RPC: move deposits through pending/confirming/needs review/rejected/credited. Crediting updates `user_balance_snapshots` once and refuses under-confirmed deposits. |
| 38 | `38_rpc_admin_add_crypto_deposit_note.sql` | Admin RPC: add an internal review note, timeline event, and audit log. owner/admin/finance/compliance/support only. |
| 39 | `39_rpc_get_admin_deposit_management_summary.sql` | RPC feeding the Deposit Management summary cards: queue counts, credited/rejected totals, active receiving wallets, and average credit time. |

### Withdrawal Management page

| # | File | What it does |
| --- | --- | --- |
| 40 | `40_withdrawal_enums.sql` | `withdrawal_status`, `withdrawal_check_status`, `withdrawal_address_status`, plus `alter type` additions to `admin_action_type` for withdrawal events. |
| 41 | `41_withdrawal_addresses.sql` | User saved crypto payout destinations, indexes, `updated_at` trigger, and RLS. Users manage their own active addresses; admins can read all. |
| 42 | `42_crypto_withdrawals.sql` | Crypto withdrawal requests, reference sequence, indexes, `updated_at` trigger, and RLS. Users read own rows; admins read all; writes go through RPCs. |
| 43 | `43_crypto_withdrawal_checks_events_notes.sql` | Admin review checks, timeline events, and internal notes for the withdrawal review modal, with RLS. |
| 44 | `44_admin_withdrawal_management_view.sql` | `admin_withdrawal_management_view` read model for the admin page: user identity, compliance status, payout destination, checks, notes, and timeline JSON. |
| 45 | `45_rpc_create_crypto_withdrawal_request.sql` | User RPC: creates a pending withdrawal against an active saved destination, snapshots the address, generates a `WD-` reference, and locks balance. |
| 46 | `46_rpc_admin_update_crypto_withdrawal_status.sql` | Admin RPC: approve, move to AML review/processing, complete with tx hash, or reject. Completion/rejection settles locked balance. |
| 47 | `47_rpc_admin_add_crypto_withdrawal_note.sql` | Admin RPC: add an internal review note, timeline event, and audit log. owner/admin/finance/compliance/support only. |
| 48 | `48_rpc_admin_upsert_crypto_withdrawal_check.sql` | Admin RPC: create or update AML/security check rows used by the review modal. |
| 49 | `49_rpc_get_admin_withdrawal_management_summary.sql` | RPC feeding the Withdrawal Management summary cards: pending/AML/processing queues, completed/rejected totals, and average processing time. |

### Transaction Management page

| # | File | What it does |
| --- | --- | --- |
| 50 | `50_transaction_enums.sql` | `transaction_source_type`, `transaction_exception_severity`, plus `alter type` additions to `admin_action_type` for transaction review/exception events. Must be its own file so enum values commit before RPCs reference them. |
| 51 | `51_transaction_reviews.sql` | `transaction_reviews` table — per-ledger-row admin "reviewed" flag keyed by (source_type, source_id). Admin-only RLS. |
| 52 | `52_transaction_exceptions.sql` | `transaction_exceptions` table — one row per logged ledger exception (duplicate tx hash, amount mismatch, orphan fee, etc.). Admin-only RLS. |
| 53 | `53_admin_transaction_management_view.sql` | `admin_transaction_management_view` — unified ledger read model (UNION of crypto deposits + crypto withdrawals) with review state, exception rollup, notes, and timeline per row. |
| 54 | `54_rpc_admin_mark_transaction_reviewed.sql` | Admin RPC: upsert a transaction_reviews row for a (source_type, source_id) pair. |
| 55 | `55_rpc_admin_add_transaction_note.sql` | Admin RPC (dispatcher): adds an internal note to the underlying deposit or withdrawal via the source-specific note RPCs. |
| 56 | `56_rpc_admin_log_transaction_exception.sql` | Admin RPC: log a new ledger exception row. owner/admin/finance/compliance only. |
| 57 | `57_rpc_admin_resolve_transaction_exception.sql` | Admin RPC: mark an existing exception resolved. Idempotent. |
| 58 | `58_rpc_get_admin_transaction_management_summary.sql` | RPC feeding the Transaction Management summary cards: ledger entries, pending/processing, failed/rejected, inflow, outflow, fees collected. |
| 59 | `59_rpc_get_admin_transaction_reconciliation.sql` | RPC feeding the Reconciliation queue panel: unmatched deposits, withdrawals missing tx hash, failed transactions needing review, manual adjustments (placeholder). |
| 60 | `60_rpc_get_admin_transaction_exceptions.sql` | RPC feeding the Ledger exceptions panel: open exceptions grouped by `exception_code` with counts. |

### KYC Review page

| # | File | What it does |
| --- | --- | --- |
| 61 | `61_kyc_enums.sql` | `kyc_submission_status`, `kyc_document_type`, `kyc_check_status`, `kyc_document_quality`, plus `alter type` additions to `admin_action_type` for KYC submission events. Must be its own file so new enum values commit before RPCs reference them. |
| 62 | `62_kyc_flag_catalog.sql` | Catalog of compliance flag codes (`name-mismatch`, `blurry-upload`, `duplicate-document`, `withdrawal-waiting`) with starter rows, `updated_at` trigger, and admin-only RLS. |
| 63 | `63_kyc_submissions.sql` | `kyc_submissions` table, uploaded document storage paths, `KYC-` reference sequence, indexes, `updated_at` trigger, and RLS. Users read their own rows; admins read all; writes go through RPCs. |
| 64 | `64_kyc_submission_checks.sql` | Per-submission checklist rows (e.g. "Document readable", "Selfie matches document") keyed by `(submission_id, lower(label))`. Users read their own; admins read/write. |
| 65 | `65_kyc_submission_flags.sql` | Flag assignments joining submissions to `kyc_flag_catalog`, with optional per-submission `detail`. Unique on `(submission_id, flag_code)`. |
| 66 | `66_kyc_submission_events_and_notes.sql` | Timeline events and admin-only internal notes. Users can read non-internal events for their own submission; admins read/write the full review trail. |
| 67 | `67_admin_kyc_review_view.sql` | `admin_kyc_review_view` read model: user identity, document details, checks/flags/notes/timeline JSON, and current compliance status. |
| 68 | `68_rpc_create_kyc_submission.sql` | User RPC: creates a new submission, generates a `KYC-` reference, creates starter checklist rows, and sets `user_compliance.kyc_status = 'pending'`. |
| 69 | `69_rpc_admin_update_kyc_submission_status.sql` | Admin RPC: approve / reject / mark in review / request resubmission. Propagates the decision to `user_compliance.kyc_status` with a paired audit row. owner/admin/compliance only. |
| 70 | `70_rpc_admin_add_kyc_submission_note.sql` | Admin RPC: add an internal review note, timeline event, and audit log. owner/admin/compliance/support only. |
| 71 | `71_rpc_admin_upsert_kyc_submission_check.sql` | Admin RPC: insert or update a checklist row on a submission. Keyed on `(submission_id, lower(label))`. |
| 72 | `72_rpc_admin_set_kyc_submission_flag.sql` | Admin RPC: assign or remove a compliance flag on a submission. Idempotent in both directions. owner/admin/compliance only. |
| 73 | `73_rpc_get_admin_kyc_review_summary.sql` | RPC feeding the summary cards + sidebar flag rollup: pending review, approved today, rejected today, average review minutes, docs expiring within 60 days. |

### Support Management page

| # | File | What it does |
| --- | --- | --- |
| 74 | `74_support_enums.sql` | `support_ticket_status`, `support_ticket_priority`, `support_ticket_category`, `support_message_type`, `support_link_type`, plus `alter type` additions to `admin_action_type` for support events. Must be its own file so new enum values commit before 78–81 reference them. |
| 75 | `75_support_tickets.sql` | `support_tickets` table, `SUP-` reference sequence, indexes, `updated_at` trigger, and RLS. Users read own tickets; admins read all; writes go through RPCs. |
| 76 | `76_support_ticket_messages_events_and_links.sql` | Ticket messages, attachments, linked records, and timeline events with RLS. Users read their own non-internal thread items; admins read the full thread. |
| 77 | `77_admin_support_management_view.sql` | `admin_support_management_view` read model for the admin page: user identity, assigned agent, attachments, linked records, conversation JSON, internal notes, and timeline. |
| 78 | `78_rpc_create_support_ticket.sql` | User RPC: create a ticket, opening message, optional linked references, attachments, and initial timeline event. |
| 79 | `79_rpc_admin_update_support_ticket.sql` | Admin RPC: assign an agent, change status, reprioritize, or move SLA due time while emitting timeline and audit rows. owner/admin/support only. |
| 80 | `80_rpc_admin_reply_support_ticket.sql` | Admin RPC: add a visible support reply or internal note. Visible replies set first-response time and move tickets to `awaiting_user`. owner/admin/support only. |
| 81 | `81_rpc_get_admin_support_management_summary.sql` | RPC feeding the summary cards + sidebar rollups: queue counts, urgent/SLA-risk tickets, first-response average, agent workload, issue counts, and upcoming SLA alerts. |

## Conventions

- Every table that carries an `updated_at` column also gets a `moddatetime` trigger in its own file. No RPC needs to set `updated_at` manually.
- RLS is always in the same file as the table it protects, except for `profiles` (split to 05 because its policies reference `is_admin_with_role`).
- All admin-write paths go through `SECURITY DEFINER` RPCs, not direct table writes. The client should never update `account_status` directly.
- Enum values in the DB are lowercase. The current UI types in `lib/admin-users.ts` are PascalCase — lowercase on the way in, capitalize on the way out.

## Running

Two options:

1. **Supabase SQL Editor** (simplest) — open each file, paste, run. Do them in order.
2. **Supabase CLI** — if you decide to adopt the CLI later, rename files to its timestamp format (`20260422130000_enums.sql`, etc.) and run `supabase db push`. The contents don't need to change.

## Rolling back

There is no down-migration file. If you need to reset during development, drop and recreate the schema:

```sql
drop schema public cascade;
create schema public;
grant all on schema public to postgres, anon, authenticated, service_role;
```

Then paste the files again from 01.
