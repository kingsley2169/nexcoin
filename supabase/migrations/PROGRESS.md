# Migration Progress Tracker

Run each file **one at a time** in the Supabase SQL Editor, in the exact order below. Do not concatenate multiple files into a single query — files that extend enums (17, 28, 40) must commit before later files reference the new values.

Tick each box as you run it. If a run fails, stop and fix before moving on.

## Foundation (01 – 16) — User Management

- [ ] 01 — `01_enums.sql` — All enum types (`account_status`, `kyc_status`, `risk_level`, `admin_role`, `admin_action_type`)
- [ ] 02 — `02_extensions.sql` — Enables `moddatetime` extension
- [ ] 03 — `03_profiles.sql` — `profiles` table + indexes + `updated_at` trigger (RLS added in 05)
- [ ] 04 — `04_admin_users.sql` — `admin_users` table + `is_admin` / `is_admin_with_role` helpers + RLS
- [ ] 05 — `05_profiles_rls.sql` — `profiles` RLS policies + admin-only column guard (depends on 04)
- [ ] 06 — `06_user_compliance.sql` — `user_compliance` table + `my_compliance_summary` view + admin RLS
- [ ] 07 — `07_tags.sql` — `tags` + `user_tags` + seed data + RLS
- [ ] 08 — `08_user_balance_snapshots.sql` — Balance snapshot table + RLS
- [ ] 09 — `09_account_status_events.sql` — Account status audit trail + RLS
- [ ] 10 — `10_admin_audit_logs.sql` — Generic admin audit log + RLS
- [ ] 11 — `11_signup_trigger.sql` — `handle_new_user` + `auth.users` trigger (depends on 03, 06, 08)
- [ ] 12 — `12_admin_user_management_view.sql` — `admin_user_management_view` read model
- [ ] 13 — `13_rpc_admin_update_account_status.sql` — RPC: suspend / activate / flag / clear-flag
- [ ] 14 — `14_rpc_admin_assign_user_tag.sql` — RPC: attach tag to user
- [ ] 15 — `15_rpc_admin_remove_user_tag.sql` — RPC: detach tag from user
- [ ] 16 — `16_rpc_get_admin_user_management_summary.sql` — RPC: summary cards + aggregates

## Investment Plans (17 – 27)

- [ ] 17 — `17_investment_enums.sql` — `plan_status`, `plan_risk`, `user_investment_status` + `admin_action_type` extensions (**must commit before 22–27**)
- [ ] 18 — `18_investment_plans.sql` — `investment_plans` catalog table + RLS
- [ ] 19 — `19_user_investments.sql` — `user_investments` table + RLS (empty in v1)
- [ ] 20 — `20_investment_plan_events.sql` — Plan audit log
- [ ] 21 — `21_admin_investment_plan_catalog_view.sql` — Per-plan aggregates view
- [ ] 22 — `22_rpc_admin_create_investment_plan.sql` — RPC: create plan
- [ ] 23 — `23_rpc_admin_update_investment_plan.sql` — RPC: null-safe update
- [ ] 24 — `24_rpc_admin_set_investment_plan_status.sql` — RPC: flip status (active / paused / draft)
- [ ] 25 — `25_rpc_admin_archive_investment_plan.sql` — RPC: soft-delete plan
- [ ] 26 — `26_rpc_get_admin_investment_plan_summary.sql` — RPC: summary cards
- [ ] 27 — `27_rpc_get_admin_investment_plan_activity.sql` — RPC: activity panel

## Deposit Management (28 – 39)

- [ ] 28 — `28_deposit_enums.sql` — `deposit_asset`, `deposit_status` + `admin_action_type` extensions (**must commit before 33–39**)
- [ ] 29 — `29_deposit_receiving_wallets.sql` — Admin-managed receiving wallets + starter rows
- [ ] 30 — `30_crypto_deposits.sql` — User crypto deposit requests + `DP-` sequence
- [ ] 31 — `31_crypto_deposit_events_and_notes.sql` — Timeline events + internal notes
- [ ] 32 — `32_admin_deposit_management_view.sql` — `admin_deposit_management_view` read model
- [ ] 33 — `33_rpc_create_crypto_deposit_request.sql` — User RPC: create pending deposit
- [ ] 34 — `34_rpc_admin_create_receiving_wallet.sql` — Admin RPC: create wallet
- [ ] 35 — `35_rpc_admin_update_receiving_wallet.sql` — Admin RPC: update wallet
- [ ] 36 — `36_rpc_admin_remove_receiving_wallet.sql` — Admin RPC: soft-remove wallet
- [ ] 37 — `37_rpc_admin_update_crypto_deposit_status.sql` — Admin RPC: move deposit through statuses
- [ ] 38 — `38_rpc_admin_add_crypto_deposit_note.sql` — Admin RPC: add internal note
- [ ] 39 — `39_rpc_get_admin_deposit_management_summary.sql` — RPC: summary cards

## Withdrawal Management (40 – 49)

- [ ] 40 — `40_withdrawal_enums.sql` — `withdrawal_status`, `withdrawal_check_status`, `withdrawal_address_status` + `admin_action_type` extensions (**must commit before 45–49**)
- [ ] 41 — `41_withdrawal_addresses.sql` — User saved payout destinations + RLS
- [ ] 42 — `42_crypto_withdrawals.sql` — Withdrawal requests + `WD-` sequence
- [ ] 43 — `43_crypto_withdrawal_checks_events_notes.sql` — Review checks, timeline, notes
- [ ] 44 — `44_admin_withdrawal_management_view.sql` — `admin_withdrawal_management_view` read model
- [ ] 45 — `45_rpc_create_crypto_withdrawal_request.sql` — User RPC: create pending withdrawal (locks balance)
- [ ] 46 — `46_rpc_admin_update_crypto_withdrawal_status.sql` — Admin RPC: approve / AML / process / complete / reject
- [ ] 47 — `47_rpc_admin_add_crypto_withdrawal_note.sql` — Admin RPC: add internal note
- [ ] 48 — `48_rpc_admin_upsert_crypto_withdrawal_check.sql` — Admin RPC: AML/security check rows
- [ ] 49 — `49_rpc_get_admin_withdrawal_management_summary.sql` — RPC: summary cards

## Transaction Management (50 – 60)

- [ ] 50 — `50_transaction_enums.sql` — `transaction_source_type`, `transaction_exception_severity` + `admin_action_type` extensions (**must commit before 54–60**)
- [ ] 51 — `51_transaction_reviews.sql` — Per-ledger-row admin "reviewed" flag table + RLS
- [ ] 52 — `52_transaction_exceptions.sql` — Logged ledger exceptions table + RLS
- [ ] 53 — `53_admin_transaction_management_view.sql` — Unified ledger read model (deposits + withdrawals)
- [ ] 54 — `54_rpc_admin_mark_transaction_reviewed.sql` — Admin RPC: upsert review state
- [ ] 55 — `55_rpc_admin_add_transaction_note.sql` — Admin RPC (dispatcher): add note via source-specific RPCs
- [ ] 56 — `56_rpc_admin_log_transaction_exception.sql` — Admin RPC: log an exception row
- [ ] 57 — `57_rpc_admin_resolve_transaction_exception.sql` — Admin RPC: mark exception resolved
- [ ] 58 — `58_rpc_get_admin_transaction_management_summary.sql` — RPC: summary cards
- [ ] 59 — `59_rpc_get_admin_transaction_reconciliation.sql` — RPC: reconciliation buckets (computed on the fly)
- [ ] 60 — `60_rpc_get_admin_transaction_exceptions.sql` — RPC: exceptions grouped by `exception_code`

## KYC Review (61 – 73)

- [x] 61 — `61_kyc_enums.sql` — `kyc_submission_status`, `kyc_document_type`, `kyc_check_status`, `kyc_document_quality` + `admin_action_type` extensions (**must commit before 68–73**)
- [x] 62 — `62_kyc_flag_catalog.sql` — Compliance flag catalog + starter rows + RLS
- [x] 63 — `63_kyc_submissions.sql` — `kyc_submissions` table + document paths + `KYC-` sequence + RLS
- [x] 64 — `64_kyc_submission_checks.sql` — Per-submission checklist + RLS
- [x] 65 — `65_kyc_submission_flags.sql` — Flag assignments + RLS
- [x] 66 — `66_kyc_submission_events_and_notes.sql` — Timeline events + internal notes + RLS
- [x] 67 — `67_admin_kyc_review_view.sql` — `admin_kyc_review_view` read model
- [x] 68 — `68_rpc_create_kyc_submission.sql` — User RPC: create submission, starter checks, and set compliance to pending
- [x] 69 — `69_rpc_admin_update_kyc_submission_status.sql` — Admin RPC: approve/reject/in-review/resubmit + propagate to user_compliance
- [x] 70 — `70_rpc_admin_add_kyc_submission_note.sql` — Admin RPC: add internal note
- [x] 71 — `71_rpc_admin_upsert_kyc_submission_check.sql` — Admin RPC: upsert checklist row
- [x] 72 — `72_rpc_admin_set_kyc_submission_flag.sql` — Admin RPC: assign/remove compliance flag
- [x] 73 — `73_rpc_get_admin_kyc_review_summary.sql` — RPC: summary cards + sidebar flag rollup

## Support Management (74 – 81)

- [ ] 74 — `74_support_enums.sql` — Support enums + `admin_action_type` extensions (**must commit before 78–81**)
- [ ] 75 — `75_support_tickets.sql` — `support_tickets` table + `SUP-` sequence + RLS
- [ ] 76 — `76_support_ticket_messages_events_and_links.sql` — Messages, attachments, linked records, timeline events + RLS
- [ ] 77 — `77_admin_support_management_view.sql` — `admin_support_management_view` read model
- [ ] 78 — `78_rpc_create_support_ticket.sql` — User RPC: create ticket + opening message + optional links
- [ ] 79 — `79_rpc_admin_update_support_ticket.sql` — Admin RPC: assign / reprioritize / change status / update SLA
- [ ] 80 — `80_rpc_admin_reply_support_ticket.sql` — Admin RPC: visible reply or internal note
- [ ] 81 — `81_rpc_get_admin_support_management_summary.sql` — RPC: summary cards + agent workload + issue counts + SLA alerts

## Tips

- **One file per run.** Supabase SQL Editor wraps each run in its own transaction; enum values added in file 17/28/40/50/61/74 are not visible inside the same transaction, which is why later RPC files live separately.
- **If a file errors,** fix the cause and re-run that single file. Most files are idempotent-friendly (`create type`, `create table`, `create index` on fresh schema), but re-running will complain if the object already exists — in that case drop the object or reset the schema (see README.md "Rolling back").
- **Enum-extension gotcha:** `alter type ... add value if not exists` is safe to re-run, but you cannot use a newly added enum value in the same transaction.
- **Seed data** lands in files 07 (`tags`) and 29 (`deposit_receiving_wallets`) — replace placeholder wallet addresses before production.
