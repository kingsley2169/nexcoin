# Account Migration Progress Tracker

Run each file **one at a time** in the Supabase SQL Editor, in the exact order below. Enum files (e.g. `01_account_preference_enums.sql`) must commit before any file that uses them as column types.

Tick each box as you run it. If a run fails, stop and fix before moving on.

## Phase 1 — Foundation

- [ ] 01 — `01_account_preference_enums.sql` — `dashboard_density`, `display_currency`, `account_tier` enums
- [ ] 02 — `02_profile_extensions.sql` — new profile columns (identity, address, preferences, identifiers, tier) + `generate_referral_code()` helper + backfill of referral codes for existing rows
- [ ] 03 — `03_profile_admin_guard_and_signup.sql` — updated `enforce_profiles_admin_only_columns` (now also protects `tier` and `referral_code`) + updated `handle_new_user` (auto-generates `referral_code` on signup)
- [ ] 04 — `04_my_profile_view.sql` — `my_profile_view` read model (full shape for `lib/profile.ts` Profile type)
- [ ] 05 — `05_rpc_update_my_profile.sql` — `update_my_profile(...)` user RPC (null-safe, blocks email/referral_code/tier/account_status)

## Phase 2 — Verification (`/account/verification`) 

- [ ] 06 — `06_kyc_tier_limits.sql` — per-tier deposit/withdrawal caps + display labels (seeded for beginner/amateur/advanced/pro)
- [ ] 07 — `07_user_kyc_submission_view.sql` — overview row for the page (latest submission + compliance + current tier + derived `overview_status`)
- [ ] 08 — `08_user_kyc_documents_view.sql` — one row per required doc kind (government_id, proof_of_address, selfie) with derived status
- [ ] 09 — `09_user_kyc_timeline_view.sql` — non-internal events for the user's latest submission (feeds "Review timeline" card)
- [ ] 10 — `10_rpc_user_submit_kyc_document.sql` — attach/replace a single storage path on the current submission (allowed when status is `pending` or `needs_resubmission`)
- [ ] 11 — `11_rpc_user_resubmit_kyc.sql` — flip `needs_resubmission` → `pending` after the user replaces flagged docs; emits a visible timeline event

## Phase 3 — Deposit (`/account/deposit`)

- [ ] 12 — `12_user_deposit_assets_view.sql` — active receiving wallets + user-facing display metadata + derived min deposit / confirmations
- [ ] 13 — `13_user_recent_deposits_view.sql` — own `crypto_deposits` rows with display status + last event timestamp
- [ ] 14 — `14_rpc_user_mark_deposit_sent.sql` — user RPC: `pending` → `confirming`, store optional tx hash / sender address, emit timeline event

## Phase 4 — Withdrawal (`/account/withdrawal`)

- [ ] 15 — `15_user_withdrawal_limits.sql` — per-user/per-asset withdrawal limit overrides + optional usage cache + processing-time label
- [ ] 16 — `16_user_withdrawal_fee_schedule.sql` — seeded fee/minimum/rate config for BTC, ETH, and USDT
- [ ] 17 — `17_user_withdrawal_summary_view.sql` — one row per asset with fee config, balance context, usage, remaining limits, and saved-address counts
- [ ] 18 — `18_user_saved_addresses_view.sql` — own active saved addresses with masked address and withdrawal usage metadata
- [ ] 19 — `19_rpc_user_add_withdrawal_address.sql` — add a new saved address and optionally make it default
- [ ] 20 — `20_rpc_user_update_withdrawal_address.sql` — edit label/address/network on an existing saved address
- [ ] 21 — `21_rpc_user_remove_withdrawal_address.sql` — soft-archive a saved address and auto-promote the next default when needed
- [ ] 22 — `22_rpc_user_set_default_withdrawal_address.sql` — switch the default saved address for an asset
- [ ] 23 — `23_rpc_calculate_withdrawal_fee.sql` — fee breakdown RPC for pre-submit validation and UI preview

## Phase 5 — Wallets (`/account/wallets`)

- [ ] 24 — `24_user_wallets_view.sql` — saved withdrawal wallets read model with display name/color, default state, created_at, and last_used_at
- [ ] 25 — `25_user_wallet_activity_view.sql` — wallet saves + wallet-linked withdrawal usage timeline for the logged-in user

## Phase 6 — Plans (`/account/plans`)

- [ ] 26 — `26_user_investment_event_extensions.sql` — extend shared investment events for user-originated subscription/cancel actions
- [ ] 27 — `27_user_active_investments_view.sql` — own active investments joined to plan metadata with progress and payout calculations
- [ ] 28 — `28_rpc_user_create_investment.sql` — debit balance, create active investment row, increment active plan count, emit event
- [ ] 29 — `29_rpc_user_cancel_pending_investment.sql` — cancel a newly created active investment during the 15-minute grace window, refund balance, emit event

## Phase 7 — Portfolio (`/account/portfolio`)

- [ ] 30 — `30_portfolio_event_extensions.sql` — extend `admin_action_type` with `plan_profit_credited` so credit events have a dedicated action type (**must commit before 33**)
- [ ] 31 — `31_user_portfolio_allocation_view.sql` — per-tier breakdown of active invested capital with percent-of-total + color hint
- [ ] 32 — `32_user_holdings_view.sql` — per-asset net holdings from credited deposits minus completed withdrawals, valued at the latest known rate
- [ ] 33 — `33_user_profit_history_view.sql` — recent profit credits (Credited events) plus Accruing/Pending rows derived from `user_investments`
- [ ] 34 — `34_rpc_user_portfolio_performance.sql` — time-series RPC (`30D` / `90D` / `1Y`) returning 12 buckets of total portfolio value

## Phase 8 — Referrals (`/account/referrals`)

- [ ] 35 — `35_referral_enums.sql` — `referral_status`, `referral_earning_type`, `referral_earning_status` enums + 4 new `admin_action_type` values + `referral_earning_reference_seq` (**must commit before 37/38/42/43**)
- [ ] 36 — `36_referral_tiers.sql` — seeded `referral_tiers` catalogue (Starter / Tier 2 / Pioneer) with min-active thresholds, commission %, and perks array
- [ ] 37 — `37_referrals.sql` — referrer → referee links (one row per referee, unique index), status progression, cached invested/earnings totals
- [ ] 38 — `38_referral_earnings.sql` — individual earning rows with `RE-####` references, type + status, optional source transaction reference
- [ ] 39 — `39_user_referral_summary_view.sql` — one-row overview: referral link, current tier, next-tier progress, lifetime totals
- [ ] 40 — `40_user_referred_users_view.sql` — masked referee list for the Referred users table (first-name + last-initial, `pr**ya.s@gmail.com` email shape)
- [ ] 41 — `41_user_referral_earnings_view.sql` — earnings history card rows with type/status labels, source masked name, and transaction_reference for ledger links
- [ ] 42 — `42_rpc_user_claim_pending_referral_earning.sql` — flip a pending earning to credited, credit available balance, bump referral totals
- [ ] 43 — `43_signup_referral_attach.sql` — extends `handle_new_user` to attach `referrer_user_id` when signup metadata carries `referral_code` (**must run after 37**)

## Phase 9 — Transactions (`/account/transactions`)

- [ ] 44 — `44_user_transactions_view.sql` — shared ledger view combining deposits, withdrawals, derived withdrawal fee rows, investments, profit history, and referral earnings into one UI-ready transaction shape
- [ ] 45 — `45_rpc_user_export_transactions.sql` — export RPC returning CSV-ready rows with date-range/type/status/asset/search filters

## Phase 10 — Notifications (`/account/notifications`)

- [ ] 46 — `46_notification_enums.sql` — `notification_category`, `notification_priority`, and `notification_channel` enums
- [ ] 47 — `47_notifications.sql` — notification inbox table with read state, delivery channels, action link metadata, and dedupe support
- [ ] 48 — `48_notification_preferences.sql` — per-user delivery preferences table + default seeding for existing users and new profiles
- [ ] 49 — `49_notification_helpers.sql` — shared `enqueue_notification(...)` helper used by generator triggers
- [ ] 50 — `50_notification_generators_deposits_withdrawals.sql` — deposit and withdrawal insert/status-change notification triggers
- [ ] 51 — `51_notification_generators_investments_kyc_support.sql` — plan maturity, KYC status-change, and support-reply notification triggers
- [ ] 52 — `52_user_notifications_view.sql` — inbox read model with UI-ready channel labels
- [ ] 53 — `53_user_notification_preferences_view.sql` — delivery-settings read model with labels and descriptions
- [ ] 54 — `54_rpc_user_mark_notification_read.sql` — mark a single inbox item as read
- [ ] 55 — `55_rpc_user_mark_all_notifications_read.sql` — mark every unread inbox item as read
- [ ] 56 — `56_rpc_user_update_notification_preferences.sql` — update one category row in notification preferences

## Phase 11 — Security (`/account/security`)

- [ ] 57 — `57_security_enums.sql` — 2FA method, device status, security activity status/type, and password strength enums
- [ ] 58 — `58_user_2fa_settings.sql` — per-user 2FA table with recovery email and backup-code timestamps
- [ ] 59 — `59_user_devices.sql` — trusted device/session table with current/review/revoked states
- [ ] 60 — `60_user_security_settings.sql` — withdrawal protection toggles plus password-last-changed and password-strength metadata
- [ ] 61 — `61_user_security_activity.sql` — sign-ins and sensitive account-change activity log
- [ ] 62 — `62_security_seed_helpers.sql` — seed helper + profile trigger for default security rows
- [ ] 63 — `63_user_security_score_view.sql` — derived score and security counts
- [ ] 64 — `64_user_security_overview_view.sql` — single-row page read model with 2FA, password, protections, devices, activity, score, and recommendations
- [ ] 65 — `65_rpc_user_enable_2fa.sql` — enable 2FA and log activity
- [ ] 66 — `66_rpc_user_disable_2fa.sql` — disable 2FA and log activity
- [ ] 67 — `67_rpc_user_regenerate_backup_codes.sql` — refresh backup-code timestamp and log activity
- [ ] 68 — `68_rpc_user_revoke_device.sql` — revoke one non-current device and log activity
- [ ] 69 — `69_rpc_user_update_security_settings.sql` — update user-controlled protection toggles / password metadata and log activity

## Phase 12 — Support (`/account/support`)

- [ ] 70 — `70_user_support_ticket_reads.sql` — per-ticket read state for unread dots and mark-read behavior
- [ ] 71 — `71_user_support_summary_view.sql` — support summary cards for the list page
- [ ] 72 — `72_user_tickets_view.sql` — ticket inbox read model with mapped user-facing status/category/priority values and unread flag
- [ ] 73 — `73_user_ticket_thread_view.sql` — visible message/event thread for a single ticket
- [ ] 74 — `74_rpc_user_reply_support_ticket.sql` — append a user reply and re-open resolved tickets
- [ ] 75 — `75_rpc_user_mark_ticket_read.sql` — mark a ticket thread as read up to the latest visible message/event

## Phase 13 — Dashboard (`/account`)

- [ ] 76 — `76_rpc_get_my_dashboard.sql` — single dashboard RPC returning account details, metrics, portfolio snapshot, top active plans, recent activity, and unread notification count

## Tips

- **One file per run.** Supabase SQL Editor wraps each run in its own transaction; enum values added in `01` are not visible inside the same transaction, which is why `02` is a separate file.
- **If a file errors,** fix the cause and re-run that single file.
- **Do not re-run `02` after it has succeeded once** — `alter table ... add column` without `if not exists` will fail on the second run. If you need to reset during development, drop and recreate the new columns, or reset the whole schema (see `supabase/migrations/README.md` "Rolling back").
- **Existing users** — file 02 backfills a `referral_code` for every row already in `profiles`. New signups get one via the updated trigger in file 03 (later extended in file 43 to also attach a referrer when the signup metadata carries `referral_code`).
- **Enum-extension files (`35`)** must commit alone before any file that uses the new values. Same reason as `01` → `02` above.
