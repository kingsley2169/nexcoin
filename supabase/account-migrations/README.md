# Account Migrations — Build Order

This folder holds the user-facing (`/account`) Supabase SQL. It is separate from `supabase/migrations/` (which is admin-side, files 01–81) so the two concerns stay independent.

Every phase below produces:

- **Tables / views / enums** as needed (RLS scoped to `auth.uid()` — a user only ever sees their own rows).
- **User mutation RPCs** (`SECURITY DEFINER`) so that saving a form, submitting a request, or toggling a setting writes to the correct table. No client-side direct `update` on sensitive columns.
- **Read model / view** for the page, so the React component can do a single `select` and render.

Files will follow the same conventions as `supabase/migrations/`:

- One logical concern per file, run in numeric order.
- `moddatetime` trigger on every table with `updated_at`.
- Enum-extension files commit alone before any RPC that references the new values.
- Lowercase enum values in the DB, capitalized on the way out.

---

## Why this order

Some pages depend on tables introduced by earlier pages, so we build bottom-up:

1. Foundation first — profile fields and compliance view that almost every other page reads.
2. KYC next — because deposit/withdrawal/plan limits are gated on verification tier.
3. Money-movement tables — deposits, withdrawals, and saved wallet destinations (balances or activity are derived from these).
4. Investment flows — plans, then portfolio (portfolio reads from `user_investments`).
5. Ledger-like pages last — transactions (unions every money-movement table), notifications (triggers fire from every source table).
6. Dashboard RPC last of all — it aggregates everything above.

Security and support sit late because they are standalone and unblock nothing.

---

## Phase order

Run these phases top-to-bottom. Inside a phase, run the numbered files in order. Tick each phase when all its files have been pasted into the Supabase SQL Editor and run successfully.

### Phase 1 — Foundation

- [ ] Extend `profiles` (first_name, last_name, dob, address block, preferences, username, referral_code)
- [ ] `my_compliance_summary` view (user-scoped — KYC status, deposit/withdrawal limits)
- [ ] User-facing `update_my_profile` RPC (null-safe field update, locks email/referral_code)

**Unblocks:** every other phase (profile is referenced everywhere, `referral_code` is needed by Phase 8).

### Phase 2 — Verification (`/account/verification`)

- [ ] `user_kyc_submission_view` (current submission + progress for the logged-in user)
- [ ] `user_kyc_documents_view` (one row per required doc type with status)
- [ ] `user_kyc_timeline_view` (non-internal events for own submission)
- [ ] `kyc_tier_limits` table (tier → daily/monthly deposit/withdrawal caps)
- [ ] User RPCs: `user_submit_kyc_document` (uploads storage path + flips check row), `user_resubmit_kyc` (re-opens a rejected submission)

**Reuses:** `kyc_submissions`, `kyc_submission_checks`, `kyc_submission_flags`, `kyc_submission_events`, existing `create_kyc_submission`.

### Phase 3 — Deposit (`/account/deposit`)

- [ ] `user_deposit_assets_view` (active receiving wallets exposed to users, with display metadata + derived min deposit + confirmations)
- [ ] `user_recent_deposits_view` (own rows from `crypto_deposits` with status + reference + last event timestamp)
- [ ] User RPC: `user_mark_deposit_sent` (moves a pending deposit to `confirming`, stores optional tx hash/sender address, and adds timeline event)

**Reuses:** `deposit_receiving_wallets`, `crypto_deposits`, existing `create_crypto_deposit_request`.

### Phase 4 — Withdrawal (`/account/withdrawal`)

- [ ] `user_withdrawal_limits` table (per-user/per-asset limit overrides + optional usage cache)
- [ ] `user_withdrawal_fee_schedule` table (network fee flat + nexcoin fee % + min withdrawal + placeholder rate)
- [ ] `user_withdrawal_summary_view` (one row per asset: fee config, balance snapshot context, pending, limits-used, limits-remaining, saved-address counts)
- [ ] `user_saved_addresses_view` (own rows from `withdrawal_addresses`, with masked address + usage metadata)
- [ ] User RPCs: `user_add_withdrawal_address`, `user_update_withdrawal_address`, `user_remove_withdrawal_address`, `user_set_default_withdrawal_address`, `calculate_withdrawal_fee(asset_id, amount)`

**Reuses:** `withdrawal_addresses`, `crypto_withdrawals`, existing `create_crypto_withdrawal_request`.

### Phase 5 — Wallets (`/account/wallets`)

- [ ] `user_wallets_view` (saved withdrawal wallets for the logged-in user, with display metadata, default state, created_at, and last_used_at)
- [ ] `user_wallet_activity_view` (saved-wallet events + wallet-linked withdrawal usage timeline for own user)

**Reuses:** `withdrawal_addresses`, `crypto_withdrawals`, Phase 4 wallet RPCs (`user_add_withdrawal_address`, `user_remove_withdrawal_address`, `user_set_default_withdrawal_address`).

### Phase 6 — Plans (`/account/plans`)

- [ ] `user_active_investments_view` (own `user_investments` rows joined to plan metadata + progress %)
- [ ] User RPC: `user_create_investment` (debits balance, inserts `user_investments` row, emits `investment_plan_events`)
- [ ] User RPC: `user_cancel_pending_investment` (implemented as a short grace-window cancel on a freshly created active investment, since `user_investments` has no dedicated `pending` status)

**Reuses:** `investment_plans`, `user_investments`, `investment_plan_events`, `user_balance_snapshots`.

### Phase 7 — Portfolio (`/account/portfolio`)

- [ ] `user_portfolio_performance` RPC (range `'30D' | '90D' | '1Y'` → time-series of total value)
- [ ] `user_portfolio_allocation_view` (breakdown by plan tier with % + USD)
- [ ] `user_holdings_view` (live rates × wallet balances)
- [ ] `user_profit_history_view` (sorted credits from `investment_plan_events`)

**Reuses:** `user_investments`, `investment_plans`, `investment_plan_events`, `user_balance_snapshots`.

### Phase 8 — Referrals (`/account/referrals`)

- [ ] `referral_tiers` table (name, min_active_referrals, commission_percent, perks, starter rows)
- [ ] `referrals` table (referrer_user_id, referee_user_id, status, joined_at)
- [ ] `referral_earnings` table (earning_type, amount_usd, status, reference)
- [ ] `user_referral_summary_view` (current tier, totals, next-tier progress)
- [ ] `user_referred_users_view` (masked referee list with earnings per row)
- [ ] User RPC: `user_claim_pending_referral_earning` (optional, if payouts are claim-based)
- [ ] Signup-time trigger extension: attach `referrer_user_id` from `referral_code` on signup

**Depends on:** `profiles.referral_code` from Phase 1.

### Phase 9 — Transactions (`/account/transactions`)

- [ ] `user_transactions_view` (UNION of crypto_deposits + crypto_withdrawals + derived withdrawal-fee rows + user_investments + Phase 7 profit history + referral_earnings, with standardized columns: `type, status, direction, amount, amount_usd, asset_symbol, reference, detail, created_at`, plus detail fields like `plan_name`, `tx_hash`, `full_address`, `notes`)
- [ ] `user_export_transactions` RPC (CSV-ready rowset with the same filters the page uses: date range, type, status, asset, free-text search)

**Depends on:** Phases 3, 4, 6, 7, 8 (profit rows reuse the Phase 7 read model).

### Phase 10 — Notifications (`/account/notifications`)

- [ ] `notification_category` enum
- [ ] `notifications` table (user_id, title, body, category, priority, is_read, channels, action_href, action_label, dedupe/source metadata)
- [ ] `notification_preferences` table (user_id × category → email/sms/in_app bool, plus default seeding for existing/future users)
- [ ] Generator triggers: on `crypto_deposits` insert/status-change, on `crypto_withdrawals`, on `user_investments` maturity, on `kyc_submissions` status-change, on `support_tickets` admin reply
- [ ] `user_notifications_view` (read model for inbox rows with UI-ready channel labels)
- [ ] `user_notification_preferences_view` (read model for the delivery-settings panel with labels/descriptions)
- [ ] User RPCs: `user_mark_notification_read`, `user_mark_all_notifications_read`, `user_update_notification_preferences`

**Depends on:** every other table it references (builds near the end).

### Phase 11 — Security (`/account/security`)

- [ ] `user_2fa_settings` table (enabled, method, recovery_email, backup_codes_generated_at)
- [ ] `user_devices` table (device_name, browser, ip, location, last_active_at, status, current/revoked state)
- [ ] `user_security_settings` table (withdrawal protection flags plus password-last-changed and password-strength metadata for the page)
- [ ] `user_security_activity` table (sign-ins, password changes, 2FA changes, backup-code regeneration, device revokes)
- [ ] seed helper for existing users and future profiles
- [ ] `user_security_score_view` (derived security score + counts)
- [ ] `user_security_overview_view` (single-row read model for 2FA, password/cooldown, protections, devices, recent activity, score, recommendations)
- [ ] User RPCs: `user_enable_2fa`, `user_disable_2fa`, `user_regenerate_backup_codes`, `user_revoke_device`, `user_update_security_settings`

**Standalone** — could be built anytime, placed here because nothing else depends on it.

### Phase 12 — Support (`/account/support`)

- [ ] `user_support_ticket_reads` table (per-ticket read state so unread dots and `mark read` are real)
- [ ] `user_support_summary_view` (summary cards: open, awaiting reply, resolved this month, avg response time)
- [ ] `user_tickets_view` (own `support_tickets` + last message preview + unread flag)
- [ ] `user_ticket_thread_view` (non-internal messages + visible events for one ticket)
- [ ] User RPC: `user_reply_support_ticket` (append a message, re-open if resolved)
- [ ] User RPC: `user_mark_ticket_read`

**Reuses:** `support_tickets`, `support_ticket_messages`, existing `create_support_ticket`.

### Phase 13 — Dashboard (`/account`)

- [ ] `get_my_dashboard` RPC — single call returning the dashboard payload: profile, account details, balances/metrics, compliance snapshot, top 3 active plans, 5 recent transactions, and unread notification count. Feeds `components/account/dashboard-overview.tsx` in one round-trip.

**Depends on:** every phase above. Built last.

---

## Numbering

Files are assigned one shared sequence across the folder as they are written. Current blocks:

- Phase 1: `01_` through `05_`
- Phase 2: `06_` through `11_`
- Phase 3: `12_` through `14_`
- Phase 4: `15_` through `23_`
- Phase 5: `24_` through `25_`
- Phase 6: `26_` through `29_`
- Phase 7: `30_` through `34_`
- Phase 8: `35_` through `43_`
- Phase 9: `44_` through `45_`
- Phase 10: `46_` through `56_`
- Phase 11: `57_` through `69_`
- Phase 12: `70_` through `75_`
- Phase 13: `76_`

Later phases should continue from `77_` onward.

## Rolling back

Same approach as the admin migrations — if you need to reset during development, drop the new account-specific tables (not the admin tables, which your existing users rely on):

```sql
drop table if exists user_2fa_settings, user_devices, user_security_settings, user_security_activity,
  notifications, notification_preferences,
  referrals, referral_tiers, referral_earnings,
  user_withdrawal_limits, user_withdrawal_fee_schedule, kyc_tier_limits
  cascade;
```

Then re-run the account-migrations folder from Phase 1.
