# Nexcoin Crypto Investment Website

This README tracks the pages planned for the crypto investment website. Check each page off as it is designed and built.

## Build Progress

### Core User-Facing Pages

- [x] Home / Landing Page
- [x] About Page
- [x] Investment Plans Page
- [x] How It Works Page
- [x] Market / Crypto Prices Page
- [x] FAQ Page
- [x] Contact Page
- [x] Legal / Terms Page
- [x] Privacy Policy Page
- [x] Risk Disclosure Page

### Authentication Pages

- [x] Login Page
- [x] Signup Page
- [x] Forgot Password Page
- [x] Reset Password Page
- [ ] Email Verification Page
- [ ] Two-Factor Authentication Page

### User Dashboard Pages

- [x] Dashboard Overview
- [x] Portfolio Page
- [x] Deposit Page
- [x] Withdrawal Page
- [x] Investment Plans / Subscribe Page
- [x] Transactions Page
- [x] Wallets Page
- [x] Referrals Page
- [x] Notifications Page
- [x] Profile Page
- [x] Security Settings Page
- [x] KYC / Verification Page
- [x] Support Tickets Page

### Admin Pages

- [x] Admin Login Page
- [x] Admin Dashboard
- [x] User Management Page
- [x] Investment Plan Management Page
- [x] Deposit Management Page
- [x] Withdrawal Management Page
- [x] Transaction Management Page
- [x] KYC Review Page
- [x] Support Management Page

## Page Details

## Core User-Facing Pages

| Page | Purpose | Status |
| --- | --- | --- |
| Home / Landing Page | Introduces Nexcoin, explains the investment offer, shows trust signals, and guides visitors to sign up or log in. | To review |
| About Page | Explains the company, mission, investment approach, and why users should trust the platform. | To review |
| Investment Plans Page | Shows available crypto investment plans, expected returns, duration, limits, and risk notes. | To review |
| How It Works Page | Explains the user journey from signup to deposit, investing, profit tracking, and withdrawal. | To review |
| Market / Crypto Prices Page | Displays major cryptocurrency prices, trends, and possibly market news. | To review |
| FAQ Page | Answers common questions about deposits, withdrawals, plans, security, verification, and fees. | To review |
| Contact Page | Provides a contact form, email, support links, and business contact details. | To review |
| Legal / Terms Page | Covers platform terms, user responsibilities, prohibited activity, and account rules. | To review |
| Privacy Policy Page | Explains how user data is collected, stored, used, and protected. | To review |
| Risk Disclosure Page | Clearly explains crypto volatility, investment risk, and that returns are not guaranteed. | To review |

## Authentication Pages

| Page | Purpose | Status |
| --- | --- | --- |
| Login Page | Allows existing users to access their accounts. | To review |
| Signup Page | Allows new users to create an account. | To review |
| Forgot Password Page | Lets users request a password reset link or code. | To review |
| Reset Password Page | Lets users set a new password after verification. | To review |
| Email Verification Page | Confirms a user's email address after signup. | To review |
| Two-Factor Authentication Page | Adds an optional or required extra security step during login. | To review |

## User Dashboard Pages

| Page | Purpose | Status |
| --- | --- | --- |
| Dashboard Overview | Shows account balance, invested amount, profits, active plans, and recent activity. | To review |
| Portfolio Page | Shows the user's current investments, plan performance, crypto holdings, and profit history. | To review |
| Deposit Page | Lets users fund their account with supported crypto assets. | To review |
| Withdrawal Page | Lets users request withdrawals and manage withdrawal wallet addresses. | To review |
| Investment Plans / Subscribe Page | Lets logged-in users choose and activate an investment plan. | To review |
| Transactions Page | Shows deposits, withdrawals, investments, profits, fees, and status history. | To review |
| Wallets Page | Lets users save, review, set defaults for, and remove withdrawal wallet addresses. | To review |
| Referrals Page | Shows referral link, referred users, bonuses, and referral earnings. | To review |
| Notifications Page | Shows account alerts, investment updates, withdrawal status, and security notices. | To review |
| Profile Page | Lets users manage personal information and account details. | To review |
| Security Settings Page | Lets users change password, enable 2FA, manage sessions, and review login activity. | To review |
| KYC / Verification Page | Lets users submit identity verification if required for compliance or withdrawals. | To review |
| Support Tickets Page | Lets users create and track support requests from inside the dashboard. | To review |

## Admin Pages

These may be needed if the platform will have staff managing users, transactions, and investment plans.

| Page | Purpose | Status |
| --- | --- | --- |
| Admin Login Page | Allows staff or administrators to access the admin area. | To review |
| Admin Dashboard | Shows platform totals, users, deposits, withdrawals, revenue, and alerts. | To review |
| User Management Page | Lets admins view, search, suspend, verify, or update user accounts. | To review |
| Investment Plan Management Page | Lets admins create, edit, enable, or disable investment plans. | To review |
| Deposit Management Page | Lets admins review and confirm user deposits. | To review |
| Withdrawal Management Page | Lets admins approve, reject, or process withdrawal requests. | To review |
| Transaction Management Page | Lets admins inspect all financial activity across the platform. | To review |
| KYC Review Page | Lets admins approve or reject submitted identity documents. | To review |
| Support Management Page | Lets admins respond to user support tickets. | To review |

## Admin Dashboard Testing Flow

This is the next testing flow after KYC review. The goal is to verify that the admin dashboard is trustworthy as a control surface, not just that it renders.

### Scope

- Admin authentication and access guards
- Dashboard summary cards and data integrity
- Navigation handoff into the admin queues
- Reflection of state changes from KYC, deposits, withdrawals, and support
- Empty states, error states, and visual sanity

### Checklist

- [x] Admin user can log in and reach the dashboard
- [x] Logged-out users are redirected to admin login
- [x] Non-admin users are blocked from admin routes
- [x] Admin layout, sidebar, and dashboard shell load without permission errors
- [x] All summary cards render without crashing
- [x] Each dashboard count matches its real backing table, view, or RPC
- [x] Zero-value cards and empty datasets show a clean empty state
- [x] No dashboard card is still using mock or placeholder data
- [x] Each dashboard card or CTA opens the correct admin page
- [x] Destination pages load with the expected default filters or tabs
- [x] Recent activity blocks show the correct order, status, and links
- [x] KYC actions already tested are reflected correctly on the dashboard
- [x] Pending deposit counts match the deposit management page
- [x] Pending withdrawal counts match the withdrawal management page
- [x] Open support counts match the support management page
- [x] Dashboard values update correctly after admin actions and refresh
- [x] Long values, large counts, and empty tables do not break the layout
- [x] One empty or failing data source does not create a confusing dashboard state

### Recommended Test Order

1. Admin login and access guards
2. Dashboard shell and initial load
3. Summary cards and source-of-truth validation
4. Dashboard navigation links
5. Deposit handoff
6. Withdrawal handoff
7. Support handoff
8. Final refresh and consistency check

### Working Method

For each dashboard widget we test, confirm three things:

1. What exact query, view, or RPC feeds it
2. Whether the dashboard value matches the downstream admin page
3. Whether the value changes correctly after an admin action

## Recommended Minimum Version

For a first version, the essential pages would be:

- Home / Landing Page
- Signup Page
- Login Page
- Dashboard Overview
- Investment Plans Page
- Deposit Page
- Withdrawal Page
- Transactions Page
- Profile Page
- Contact Page
- Terms Page
- Privacy Policy Page
- Risk Disclosure Page

## Notes

- Crypto investment platforms should be very clear about risk, fees, withdrawal rules, and whether returns are guaranteed.
- Legal, privacy, and risk pages are important before launch, especially if users will deposit real funds.
- KYC and admin pages depend on the business model, jurisdiction, and compliance requirements.




Branding
Logo color -- #5F9EA0
Name collor -- #576363
slogan color -- #5d6163
