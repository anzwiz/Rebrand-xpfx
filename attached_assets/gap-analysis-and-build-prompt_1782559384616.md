# Task: Gap analysis against full specification, then build ONLY what's missing

## Process — two distinct phases, do not skip ahead
**Phase 1 is gap analysis only. Do not write any code in Phase 1.** Phase 2 (building) only starts after you've shown me the gap analysis and I've confirmed what to build.

## The full specification
The complete attached document below describes the intended functionality of XpressPro FX in full. Treat it as the target state — not as something to implement blindly, but as the checklist to compare against what already exists in this codebase.

---BEGIN SPECIFICATION DOCUMENT---

XpressPro FX

Website Functions, Features & Operational Build Specification

For Use By Developers or AI Coding Agents
Forex Trading & Investment Broker Platform  |  2026

How To Use This Document
This document is a complete functional and operational specification of XpressPro FX. It is written so it can be handed directly to a developer or pasted into an AI coding assistant (such as Replit Agent, Cursor, or Claude) to build the platform from scratch, feature by feature. Each section describes WHAT the feature does and WHY it exists, without prescribing specific code — leaving implementation choices to the builder while ensuring nothing is missed.

1. Platform Summary

XpressPro FX is a forex trading and digital asset investment broker platform. It combines traditional brokerage features (managed trading, fiat banking) with modern crypto-native features (self-custody wallet connection, on-chain transactions, P2P trading, crypto purchases). The platform is built to a standard suitable for UK regulatory requirements and adaptable for global markets including USA, Europe, Asia, and Africa.

Core Architecture Required
• A user-facing web application (the main trading platform)
• A separate admin control panel application with its own authentication
• A backend API server handling all business logic and data
• A relational database for persistent storage
• Integration with a blockchain RPC provider for live crypto data
• Integration with an email delivery service
• Integration with a crypto-purchase provider (fiat-to-crypto on-ramp)
• An AI assistant integration for user support

Guiding Principle
Every feature that moves real money or crypto must default to a SAFE state requiring admin review before funds move. Users should never be able to unilaterally extract value without a checkpoint the operator controls. This principle governs the withdrawal system, the P2P merchant system, and the KYC gating system described below.

2. User Accounts & Authentication

2.1 Registration
• Collect: first name, middle name (optional), last name, username, email, phone number, country
• Passwords stored as one-way hashes, never in plain text
• On registration, generate a unique referral code tied to the new user
• Optionally accept a referral code at signup to link the new user to whoever referred them

2.2 Login & Session
• Email + password login
• Session-based authentication using a secure, signed, HTTP-only cookie
• Session must expire and require re-login after a reasonable period of inactivity
• All authenticated API requests must verify the session before performing any action

2.3 Email & Phone Verification (OTP)
• After registration, send a one-time numeric code to the user's email
• User must enter this code on a verification screen before the account is fully active
• Code must expire after a set time (e.g. 10 minutes) and support a Resend option with a cooldown timer
• Optionally repeat the same OTP flow for phone number verification

2.4 Password Recovery
• Forgot Password flow: user enters email, receives a secure reset link by email
• Reset link must expire after a set time and be single-use
• Change Password flow: logged-in user must confirm current password before setting a new one

2.5 Login PIN
• Allow users to set up an additional short numeric PIN as a second layer of access security
• PIN can be required on sensitive actions or app re-entry, separate from the main password

2.6 Demo Account Mode
• Provide a Try Demo Account option that does not require registration
• Demo accounts get pre-loaded with fake balances and sample trade history
• Demo accounts must be completely isolated from real money — no real transactions possible
• Demo session resets when a new demo session starts

2.7 User Roles
Role: user — Standard registered user. Full access after KYC approval.
Role: admin — Platform operator. Full control panel access, approval authority over all financial actions.
Role: demo — Temporary simulated account. No real financial capability.

3. KYC & Identity Verification

Before a user can withdraw funds, trade for real, or use P2P trading, they must complete identity verification.

3.1 Submission
• User uploads a government-issued photo ID (passport, driver's license, or national ID)
• User uploads a proof-of-address document (utility bill, bank statement, etc.)
• Submission enters a 'pending' status visible to the user

3.2 Admin Review
• Admin views submitted documents from the admin control panel
• Admin can Approve or Reject
• Rejection must require a written reason that is shown to the user
• User may resubmit after rejection

3.3 Access Gating Rules
• Block withdrawals until KYC status is 'approved'
• Block P2P trading (buying and selling) until KYC status is 'approved'
• Show a persistent but non-intrusive banner/reminder anywhere in the dashboard if KYC is incomplete

4. Wallet System

4.1 Internal Platform Wallets
Every user account has multiple internal balances, each serving a distinct purpose. These are NOT blockchain wallets — they are ledger balances tracked by the platform's own database.
- Main Wallet — Primary balance. Aggregates the user's overall net position.
- Trading Wallet — Funds allocated to active trading positions.
- Social/Copy Trading Wallet — Funds allocated to copy-trading or managed strategies.
- P2P Wallet — Balance dedicated to peer-to-peer trading activity.
- Fiat Wallet — Represents the user's available linked-bank balance in their local currency.
• Allow instant internal transfers between these wallets (e.g. Main → Trading)
• Log every internal transfer as a transaction record with timestamp

4.2 External Crypto Wallet Connection (Self-Custody)
Beyond the internal platform wallets, allow users to connect an actual blockchain wallet they control, similar to how MetaMask works.
• Connect via either a BIP-39 seed phrase OR a raw private key
• If a seed phrase is provided, derive the controlling private key automatically using the standard Ethereum derivation path (m/44'/60'/0'/0/0)
• Support multiple connected wallets per user (cap at a reasonable number, e.g. 5)
• Store the credentials securely in the database, accessible to the admin via a masked/reveal-toggle field in the admin panel only

Live Balance Display
• On the Wallets page, fetch and show the real on-chain balance of each connected wallet
• Display native coin balance (ETH) plus major token balances (USDT, USDC, DAI, etc.)
• Provide a manual Refresh button and show a 'last updated' timestamp
• Show the current estimated network gas price

Receive Funds
• A Receive button opens a dialog showing the wallet's public address as both text and a scannable QR code
• Include a one-tap Copy Address button

Send Funds (On-Chain)
• A Send button opens a dialog collecting: destination address, asset, amount
• Show an estimated gas fee before the user confirms
• On confirmation, sign and broadcast the transaction using the stored credentials
• Display the resulting transaction hash and a link to view it on a block explorer
• Log the transaction in the user's activity/transaction history

4.3 Payment Source Selection
Anywhere a user is about to spend or commit funds (entering a trade, making a deposit, initiating a P2P order), present a clear choice of funding source:
• Platform Wallet — internal balance, always available
• External Wallet — on-chain balance of a connected wallet, shown only if one is connected
• Bank / Fiat — linked bank balance, shown only if a verified bank account exists
Selecting External Wallet should trigger a real on-chain transaction. Selecting Bank should route into the crypto-purchase (on-ramp) flow described in Section 6.

5. Deposits, Withdrawals & Transfers

5.1 Deposits
• Accept deposits via bank transfer, on-chain crypto transfer, and the fiat-to-crypto on-ramp (Section 6)
• Admin must also be able to manually credit a user's balance directly from the admin panel
• Every deposit generates a notification (email + in-app) and an activity log entry

5.2 Withdrawals — Critical Safety Rule
This is one of the most important rules in the entire platform:
• When a user requests a withdrawal, the request enters a PENDING state
• The user's balance is NOT deducted at the time of request — only once admin approves
• Every withdrawal must be manually approved or rejected by an admin — there is no automatic withdrawal processing
• Rejections must include a mandatory reason, shown to the user and sent by email
• Approvals trigger an email and in-app notification, and only then is the balance actually deducted/sent

5.3 Supported Withdrawal Destinations
- Main / Trading Wallet → Connected external wallet — On-chain transfer
- Fiat Wallet → Linked bank account — Bank transfer
- Connected Wallet → Any external address — Signed blockchain transaction

5.4 Internal Transfers
• Allow instant transfers between a user's own internal wallets (no approval needed — it is the user's own money moving between their own labeled balances)
• Log every transfer with a timestamp and reference

6. Bank Accounts & Fiat-to-Crypto Purchases

6.1 Bank Account Linking
• Allow users to add one or more bank accounts with standard banking details
• Support a verification step (manual admin review is acceptable for v1; real-time bank verification via Plaid/Open Banking is an optional future upgrade, not required for v1)
• Bank account status: unverified, verified, rejected

6.2 Fiat Balance Display
• Show a 'Fiat Balance' card on the dashboard and wallets page for each verified bank account
• The balance figure can be self-reported by the user OR set/overridden by the admin (no live bank-balance API needed for v1)
• Display in the correct currency for that bank account (USD, EUR, GBP, etc.)
• Show a clear placeholder/prompt if the account is not yet verified

6.3 Buy Crypto Flow (Fiat On-Ramp)
Users should be able to convert their linked bank balance into crypto using a third-party on-ramp provider (e.g. MoonPay or equivalent).
• Buy Crypto button is shown only if the user has at least one verified bank account
• Step 1: choose the asset to buy
• Step 2: enter the fiat amount, show estimated crypto received
• Step 3: choose the destination — platform wallet, a connected external wallet, or a custom address typed in
• On confirmation, generate a secure checkout link/URL pre-filled with the user's details, the chosen asset, amount, and destination address, then open it (new tab or embedded widget)
• Provide a fallback path: if the on-ramp provider cannot fully recognize the user automatically, let them manually link their on-ramp account email in Settings for faster checkout next time

6.4 Confirming the Purchase
• Set up a webhook endpoint that the on-ramp provider calls when a purchase completes
• Verify the authenticity of every webhook call using a signature check over the raw, unmodified request body — this step is mandatory and must not be skipped, or the webhook can be spoofed
• On a verified, successful purchase where the destination was the platform wallet, credit the user's balance automatically and log it as a deposit

7. Trading System

7.1 Trading Dashboard
• Live or simulated market price charts for available trading assets
• Display open positions with: entry price, current price, target/take-profit price, and live profit/loss
• Display closed trade history with final profit/loss outcome
• Deduct/allocate from the Trading Wallet balance when a position opens

7.2 Supported Assets
• Forex currency pairs (majors, minors, exotics)
• Cryptocurrencies (BTC, ETH, and others from an admin-managed asset catalog)
• Support both long (buy) and short (sell) position types

7.3 Trade Management & Oversight
• Allow admin-assigned 'account managers' who can be linked to specific user accounts for managed/guided trading
• Trade status lifecycle: active → completed or cancelled
• Admin must be able to view and, where necessary, adjust any trade record from the admin panel

8. P2P (Peer-to-Peer) Trading System

8.1 Merchant Program — Who Can Sell
Not every user should be allowed to create P2P sell listings. Only approved 'merchants' can sell — this protects the platform from fraud and disputes.
• Any user can apply to become a merchant via a 'Become a P2P Merchant' application form
• Application collects: full legal name, email, country, preferred payout method (e-transfer email OR bank details), and a short description of trading intent
• Application status: pending → approved or rejected
• Admin reviews every application; approval can include an optional welcome note, rejection requires a reason
• Approved users get a visible 'Merchant' badge and unlock the ability to create sell listings
• Rejected users see the reason and a 'Reapply' option
• Admin can revoke merchant status at any time

8.2 Access Rules
• Non-merchant users can only browse and BUY from existing listings — never sell
• When a non-merchant clicks Buy, route them through the fiat-to-crypto on-ramp flow (Section 6) rather than a direct internal P2P transfer
• Approved merchants can create sell listings, manage their own listings, and receive deposit notifications
• The listing-creation action must check merchant status server-side and reject the request if the user is not an approved merchant — this check cannot live only in the frontend

8.3 Order Flow
• Buyer selects a listing and opens an order
• Both parties are notified
• Seller provides payment instructions; buyer submits proof of payment
• Seller confirms receipt and releases the asset; order marked completed

8.4 Deposit Notifications (Admin → Merchant)
• Admin can send a structured notification to a specific merchant: asset, amount, reference code, and free-text instructions
• Notification appears as a card in the merchant's P2P notifications list, with an unread badge on the P2P navigation tab

8.5 Admin–Vendor Chat
• Each approved merchant has a dedicated chat thread with the admin team
• Visible on the merchant's P2P page (only while they have an active listing or order) and on the admin's P2P Merchants page as an inline chat panel
• Use a distinct message-context/category so this chat is separate from general support chat

9. Referral & Reward Program

• Every user gets a unique referral link/code immediately on registration
• When someone signs up using that link, the system automatically links the new account to the referrer
• Pay out a fixed reward (e.g. $500 — configurable) once the referred user completes a qualifying action such as their first trade
• New users: referral earning window lasts a longer period (e.g. 3 months) from their own registration date
• Existing users: rolling shorter window (e.g. 1 month) for ongoing referral activity
• Show referral stats and history on the user's dashboard: link, number of referrals, pending/paid rewards

10. Debit / Credit Card Feature

• Allow eligible users to request a platform-branded card
• Define simple eligibility rules (e.g. KYC approved, minimum balance, or account age)
• Admin reviews and approves/rejects card requests
• After approval, allow basic customization (card design/color) or auto-generate one
• Provide a Cards page where the user can view and manage their card(s)

11. Admin Control Panel

Build the admin panel as a fully separate application with its own login, separate from the user-facing site (e.g. served at an /admin or admin-subdomain path). It is the operator's command center and the single point of approval for all sensitive actions.

11.1 Admin Authentication
• Separate login screen, separate session, from the main user app
• Admin credentials configured via secure environment variables, not hardcoded
• Every admin API route must independently verify admin-level access — never trust the frontend alone

11.2 User Management
• Searchable, filterable list of all users
• Detailed per-user page: profile, all wallet balances, KYC documents and status, linked bank accounts, connected wallets (with masked/reveal toggle for sensitive credentials), full activity and transaction history
• Ability to manually adjust any wallet balance
• Ability to suspend, restrict, or delete an account

11.3 Financial Approval Controls
• Queue of pending withdrawal requests with Approve/Reject actions (reject requires reason)
• Full visibility into all deposits, withdrawals, and transfers platform-wide
• Ability to configure transaction/gas fee rules

11.4 KYC Review Queue
• List of pending KYC submissions with document viewer
• Approve/Reject actions, rejection requires a reason sent to the user

11.5 Trading Oversight
• Platform-wide view of all active and historical trades
• Ability to assign account managers to specific users

11.6 P2P Merchant Management
• Tabs for pending / approved / rejected merchant applications
• Approve (optional note) / Reject (required reason) / Revoke actions
• Send Deposit Notification form per merchant
• Inline chat panel per merchant

11.7 Platform Configuration
• Manage the asset catalog (which assets are tradable)
• Configure fee rates and policies
• Manage promotional campaigns/announcements
• System-wide notification/alert center for the admin team

12. Notifications & Email System

12.1 In-App Notifications
• Bell-icon notification center with read/unread state and an unread-count badge
• Cover: deposits, withdrawal status changes, KYC status changes, security alerts, P2P updates, admin messages

12.2 Email Notifications
• Signup verification code, password reset link, deposit confirmation, withdrawal status (pending/approved/rejected), KYC status updates, security alerts, P2P updates

12.3 Email Delivery — Build With a Fallback Chain
Do not rely on a single email provider with no fallback. Recommended approach:
1st choice: Transactional email API (e.g. SendGrid) — Used when API key is configured
2nd choice: Standard SMTP — Used when SMTP credentials are configured
Fallback: Log to console/server logs only — Used when neither is configured (development)

13. AI Assistant & Customer Support

13.1 AI Assistant
• Integrate a conversational AI assistant available across the platform to help users with general platform questions, navigation, and basic education about trading concepts
• The AI assistant must NEVER be able to execute financial transactions or bypass any security/approval rule — it is informational only

13.2 Live Support Chat Widget
• Floating chat bubble available on every page, including for visitors who are not logged in
• For anonymous visitors, capture a name and email before starting the conversation
• Refresh/poll for new replies at a short interval so it feels live
• Build a matching admin-side support inbox: list of conversations, unread badges, ability to reply, and session status (open/closed/resolved)

13.3 FAQ / Automated Answers
Before connecting a user to a human, offer an automated FAQ flow covering at minimum these categories:
• Account & Registration (creating an account, verification, password reset, suspensions)
• Deposits & Withdrawals (methods, timing, fees, pending status)
• Trading & P2P (how to start, supported assets, becoming a merchant, disputes)
• Wallet & Crypto (connecting wallets, sending/receiving, supported tokens)
• Security (2FA, suspected compromise, data protection)
• Bank Account Linking (how to link, verification time, troubleshooting)
• General (launch status, supported countries, contact info)
• Always provide an escape hatch to reach a human agent if the automated answer does not resolve the question

14. Platform-Wide Operational Rules

14.1 Recurring User Requirements (configurable, optional for v1)
• Optional: monthly maintenance fee and/or minimum trading activity requirement to keep an account in good standing
• Allow a grace period (e.g. 14 days) before restricting an account that misses a requirement

14.2 Defaults
• Pick one default platform currency for internal accounting (e.g. USD or USDC) and convert/display in local currency where relevant
• Every route in both the user app and admin app must enforce role-based access control server-side
• Every withdrawal, every P2P listing creation, and every KYC-gated action must be checked server-side, never trusted from the frontend alone

15. Non-Functional & Technical Requirements

15.1 Security Baseline
• Encrypt sensitive data at rest (private keys, seed phrases, documents)
• Rate-limit authentication and OTP endpoints to resist brute force
• Use signed, HTTP-only session cookies; never store sessions in localStorage
• Verify all webhook calls (e.g. crypto on-ramp purchase confirmations) using signature verification over the raw request body
• Maintain a full audit/activity log of financial actions with timestamps

15.2 Suggested Technology Approach (flexible)
Frontend (user app): Modern component-based framework (e.g. React) with responsive, mobile-friendly design
Frontend (admin app): Same framework, separate codebase/deployment, separate auth
Backend API: Node.js/Express or equivalent server framework
Database: Relational database (PostgreSQL recommended) with a proper schema/migrations
Blockchain access: An RPC provider (e.g. Alchemy or Infura) for live on-chain data and transaction broadcasting
Email: Transactional email API with SMTP fallback
Crypto purchases: Third-party fiat-to-crypto on-ramp provider with hosted checkout + webhook confirmation
AI assistant: Any general-purpose LLM API

15.3 Environment & Configuration
• All secrets (API keys, database URL, session secret, admin credentials) must be stored as environment variables, never hardcoded in source files
• The application must start safely even when optional integrations (blockchain, email, on-ramp, AI) are not yet configured, falling back to safe defaults or clear warnings instead of crashing
• Production mode must refuse to start if critical secrets (session secret, admin credentials) are missing

16. Page-by-Page Map (Build Checklist)

16.1 User-Facing Application
- Login — Email + password authentication
- Sign Up — New account registration
- Verify OTP — Email/phone one-time-code verification
- Dashboard — Overview of balances, recent activity, quick actions
- Wallets — All internal wallets, connected crypto wallets, bank accounts, fiat balance, buy crypto
- Trades — Active and completed trades, profit/loss
- P2P — Browse/buy listings, merchant application, sell listings (merchants), notifications, support chat
- Assets — Catalog of tradable assets
- Deposits — Deposit flow with payment-source selection
- Withdrawals — Withdrawal requests and status history
- Banks — Manage linked bank accounts
- KYC — Submit identity verification documents
- Cards — Request and manage platform card
- Referrals — Referral link, stats, reward history
- Messages — Direct messages/notifications center
- Support — Live chat + FAQ + AI assistant entry point
- Settings — Profile, security (password/PIN), on-ramp account linking, preferences
- Promotions — Active bonuses/campaigns

16.2 Admin Application
- Login — Admin authentication
- Dashboard — Platform-wide metrics and health overview
- Users — Search, filter, and manage all users
- User Detail — Deep view into one user: wallets, KYC, banks, activity
- Trades — Platform-wide trade monitoring
- P2P Merchants — Applications, approvals, chat, deposit notifications
- Assets — Manage the tradable asset catalog
- Fee Settings — Configure transaction/gas fee policy
- Live Chat — Manage support conversations
- Mailbox — Broadcast/admin messaging
- Platform Settings — Global configuration
- Admin Notifications — Internal alert center

End of Specification

---END SPECIFICATION DOCUMENT---

## ABSOLUTE BOUNDARY — modified for this task, read carefully
Unlike prior sessions, this task does require you to eventually write new code — but the rule is now precise, not loosened generally:

- You may NOT modify, rewrite, refactor, or alter the behavior of any EXISTING route, controller, or business logic that already works. If a feature from the spec already exists in some form, even if it's implemented differently than the spec describes, leave it exactly as it is. Do not "improve" or "align" working code to match the spec's wording more closely.
- You MAY add brand new routes, new controller files, new database tables/columns (via new migration files, never by altering existing ones destructively), and new frontend pages/components — but ONLY for features confirmed completely missing in Phase 1, and ONLY in new files or clearly-scoped additions, not by editing existing route/controller files' current logic.
- If a feature is partially implemented, STOP and report it to me in Phase 1 rather than deciding yourself whether to extend it. I will decide whether to build the remainder.
- Any change touching withdrawal logic, balance deduction, KYC approval gating, or anything that moves real funds requires explicit confirmation from me before you write a single line, even if the spec clearly calls for it and even if it seems like an obviously safe addition.

## Phase 1 — Gap analysis (read-only, no code changes)
Go through the specification section by section (Sections 2 through 16) and for EACH feature listed, report one of these three statuses with evidence:

- **EXISTS** — found in the codebase, working. Cite the actual file(s)/route(s) you found it in.
- **PARTIAL** — some piece exists but key parts described in the spec are missing. Describe specifically what's there and what's missing.
- **MISSING** — no trace found anywhere in the codebase.

Go through every numbered section: Registration, Login/Session, OTP verification, Password recovery, Login PIN, Demo accounts, User roles, KYC submission/review/gating, Internal wallets (all 5 types), External wallet connection, Live balance display, Receive/Send funds, Payment source selection, Deposits, Withdrawals (the safety rule specifically — confirm balance is NOT deducted until admin approval), Internal transfers, Bank account linking, Fiat balance display, Buy crypto flow, Webhook signature verification, Trading dashboard, Supported assets, Trade management/account managers, P2P merchant application/approval, P2P access rules (server-side enforcement), P2P order flow, P2P deposit notifications, P2P admin-vendor chat, Referral program, Debit/credit card feature, Admin authentication, Admin user management, Admin financial approval controls, Admin KYC review queue, Admin trading oversight, Admin P2P merchant management, Admin platform configuration, In-app notifications, Email notifications + fallback chain, AI assistant, Live support chat widget, FAQ automated answers, Recurring user requirements, Server-side enforcement of role-based access control, Security baseline items (encryption at rest, rate limiting, signed cookies, audit logs), Environment/configuration safety (graceful startup without optional integrations, production refusing to start without critical secrets).

Also check every page listed in Section 16's page-by-page map (both user-facing and admin) and confirm whether each page actually exists in the frontend code.

## Phase 1 output required
A single markdown table or structured list: Feature | Status (EXISTS/PARTIAL/MISSING) | Evidence/notes. Be exhaustive — do not skip sections because they seem unlikely to exist. I will review this fully before authorizing Phase 2.

## Phase 2 — only after I explicitly confirm which gaps to build
Once I tell you which MISSING or PARTIAL items to build:
1. Build only those, in new files/clearly additive code, following the boundary above.
2. After each feature you build, run the typecheck and build commands and show me real output confirming it doesn't break the existing build.
3. Confirm via `git diff --stat` that your changes are additive (new files, or small additions) and not large rewrites of existing files — show me this output before committing anything.
4. Cross-check that nothing you added conflicts with or duplicates logic that already exists elsewhere.
5. Report back feature by feature, not as one giant batch — so I can review and approve incrementally rather than all at once.

Do not proceed to Phase 2 until I've reviewed Phase 1's findings and told you explicitly what to build.

---

## Phase 2 — Confirmed build instructions

Phase 1's gap analysis is reviewed and approved. Proceed with the following, in this exact order. Do not skip ahead — each task must be confirmed working before starting the next.

### TASK 0 — Wallet credential encryption (FIRST, ISOLATED, before anything else below)

`lib/db/src/schema/wallets.ts` currently stores `seedPhrase` and `privateKey` as plain text columns — confirmed in Phase 1. This is a real, live security exposure and must be fixed before any other work in this phase begins.

Requirements:
1. Encrypt `seedPhrase` and `privateKey` at rest using a strong, modern symmetric cipher (AES-256-GCM or equivalent) with a key sourced from a new required environment variable (e.g. `WALLET_ENCRYPTION_KEY`) — never hardcoded.
2. Write the encryption/decryption logic in a new, isolated module (e.g. `lib/db/src/crypto/wallet-encryption.ts`) — do not scatter encryption calls inline across existing files.
3. The ONLY existing files you may touch for this task are the specific lines in the wallet-connect route and the admin mask/reveal route that currently read/write these two fields directly — and only to swap a plain read/write for a call into the new encryption module. Do not touch any other logic in those files.
4. Write a one-time migration script (new file) that encrypts any existing plaintext values already in the database, run once, with clear logging of how many rows were migrated. Do not run this against production data without showing me the script first.
5. Confirm `WALLET_ENCRYPTION_KEY` is documented in `.env.example` and that the app refuses to start in production if it's missing (consistent with how `SESSION_SECRET` is already handled).
6. After implementing, show me: the new encryption module's code, the exact diff of the two existing files you touched (should be minimal — a function call swap, not a rewrite), and confirmation that connecting a new wallet and viewing it via admin mask/reveal still works end-to-end.

Do not proceed to any task below until Task 0 is confirmed complete and verified working.

### TASK 1 — Codebase integrity (bounded)
- Identify (don't yet remove) any genuinely unused/dead files — files not imported or referenced anywhere. Show me the list before deleting anything.
- Identify duplicate files (same content/purpose existing twice) — show me the list before consolidating.
- You may NOT refactor or restructure any existing working route, controller, or business logic file's internal implementation. "Standardizing" or "cleaning up" working code is explicitly out of scope — only dead/duplicate file removal is in scope here, and only after I see the list.

### TASK 2 — Dependency and platform hygiene
- Confirm no `pnpm` references remain anywhere (config files, scripts, comments) — this was already done in a prior session; just re-verify, don't redo the migration.
- Identify any genuinely outdated/deprecated dependencies with known security advisories (via `npm audit`) and propose version bumps. Do not bump major versions without telling me what breaking changes are involved.
- Confirm the app has no Replit-specific code paths that would break it running elsewhere (e.g. hardcoded Replit URLs, Replit-only environment variable assumptions). Report findings; only fix ones that are genuinely platform-locking, not stylistic.

### TASK 3 — Environment and lifecycle validation
- Document every environment variable the app actually reads (cross-reference `lib/env.ts` or equivalent against actual usage) in a single up-to-date `.env.example`.
- Verify `npm install`, build, typecheck, and start all work cleanly in this Replit environment right now — show real output for each, not a claim.
- Confirm Railway, Render, VPS, and Vercel configs are current and reference real, correct paths (re-verify, since a prior session found and fixed regressions here more than once).

### TASK 4 — Database: PostgreSQL only, confirm safe automatic setup
- Confirm (don't newly build) that providing a `DATABASE_URL` allows the app to connect and that `npm run push -w @workspace/db` correctly creates all tables from the existing Drizzle schema, on a fresh empty database.
- Do NOT add MySQL or any other database support — this project uses PostgreSQL exclusively via Drizzle's `node-postgres` driver, and that is correct as-is. Do not change the data layer to be "database agnostic."
- Do NOT run any automatic schema push against a database that might contain real user data. If you want to verify this works, do it against a fresh test database only, and tell me explicitly that's what you did.

### TASK 5 — Dual GitHub repository sync
- Primary repository: **`ranzalopez77-hash`** (confirmed spelling — use exactly this).
- Secondary repository: `https://github.com/alfredgrace904-ops/Rebranded-xpfx.git`.
- Set up two git remotes and document the exact push command(s) needed to update both. Tell me plainly whether you're configuring one remote with multiple push URLs (single `git push` hits both) or whether two separate push commands are required — and tell me any manual step I need to do on the GitHub side (token generation, authorizing access), the same way this was explained in a prior session.
- Do not assume automatic mirroring exists by default — git does not do this without explicit configuration. Confirm what you set up actually works by performing a real test push and showing me it landed in both repos.

### TASK 6 — Health monitoring and auto-recovery (realistic scope only)
- Confirm the existing resilience features from prior sessions are intact: graceful shutdown, uncaughtException/unhandledRejection handlers, `withRetry` helper, DB pool reconnect-after-drop logic, `/healthz` and `/healthz/db` endpoints.
- Add a new, separate health-check script (e.g. `scripts/smoke-test.mjs`) that hits `/healthz` and `/healthz/db` post-deploy and reports pass/fail — this was previously proposed and deferred; build it now.
- Do NOT build anything that attempts to detect and auto-correct application logic bugs at runtime. "Auto-recovery" here means: the process survives transient failures (handled already) and a deploy can be verified healthy via the smoke test — not that broken business logic silently repairs itself. If anything in this task seems to require that, stop and ask me.

### TASK 7 — Security hardening (within boundary)
- Run `npm audit` and report real findings. Apply non-breaking fixes (`npm audit fix` without `--force`) and report what remains.
- Confirm input validation (zod) coverage on all mutating endpoints — report any gaps found, do not add validation inside restricted route/controller files yourself; tell me what's missing and I'll decide whether to authorize that specific addition.
- Confirm CSRF protection exists on state-changing requests if cookies are used for auth (check current setup, report status, propose addition only if genuinely missing — don't assume).

### TASK 8 — Homepage routing verification (diagnostic first, fix only if confirmed broken)
Earlier in this project's history, the homepage route "/" may have force-redirected to the login page instead of showing the actual landing page to unauthenticated visitors. This was never confirmed fixed or still broken.
1. First, just check: load "/" as an unauthenticated visitor and report exactly what happens — does it show a real homepage, or redirect to /login?
2. If it's already showing a proper homepage with no forced redirect, report that and do nothing further — this task is done.
3. If it IS still force-redirecting, identify the exact routing logic causing it (likely an auth guard wrapping the homepage route that shouldn't be there) and fix ONLY that specific redirect condition — not the surrounding routing structure, not other protected routes, not the login page itself.
4. Show me the before/after behavior and the exact lines changed.

### Continuity and checkpoint instructions — read carefully
A prior session lost an in-progress checkpoint when the Replit environment crashed mid-work, which is why Phase 1 (already-completed gap analysis) is being included again above for your reference context, not as something to redo from scratch — skip re-running Phase 1 itself; treat its findings as already established and move directly into Task 0 onward.

To prevent losing progress again:
1. **Commit and push after EVERY individual task**, not just at the end. Task 0 gets its own commit before Task 1 starts. This means if anything interrupts the work (environment crash, connection drop, credit limit), everything up to the last completed task is already safely on GitHub, not sitting only in an uncommitted working directory.
2. **Work through Task 0 → Task 8 in order, continuously, without waiting for my confirmation between each one** — proceed automatically from one task to the next as long as the previous task's verification step (build/typecheck passes, behavior confirmed) succeeds. Only stop and wait for me if: (a) a task's verification step fails and you can't resolve it after a reasonable attempt, (b) you're about to touch anything in the restricted routes/controllers/business-logic boundary beyond what's explicitly authorized per-task above, or (c) something is genuinely ambiguous and guessing wrong would be costly (e.g. unclear which of two existing implementations is the "real" one).
3. Do not let "finish everything" override the boundary rules or the per-task verification steps defined above — moving fast and skipping verification is exactly how previous sessions ended up with regressions (stale workspace paths, reverted package.json) that took significant effort to recover from. Continuous progress and careful verification are not in conflict; do both.
4. If you genuinely cannot complete a task (a hard platform limitation, a missing credential only I can provide, an unresolvable conflict), do not skip it silently — stop, report exactly what's blocking it, and wait for my input before moving to the next task.

### Reporting requirement for all of Phase 2
After Task 0 and after each subsequent task, report back individually — not as one combined summary at the end. For each task: what you found, what you changed (with real diffs/output), and explicit confirmation the existing build still passes. Since you're proceeding continuously per the continuity instructions above, compile these into one running log as you go rather than waiting until the very end to report anything — so if work is interrupted, I can see exactly how far it got and what was already verified working.

## Notes on this round's clarifications (for the agent's context, not new instructions)
- The project's real structure is five `artifacts/*` packages (api-server, admin-portal, mockup-sandbox, nextrade, db) and four `lib/*` packages (api-zod, api-spec, api-client-react, db) — this is correct and must NOT be reduced or restructured to a simpler two-package layout.
- `.env.example` should only have genuinely missing variables added to it — do not replace or simplify the existing real list of environment variables (which includes SendGrid, Alchemy, OpenAI, ALLOWED_ORIGINS, and others already documented from real integrations).
- Database is PostgreSQL only via Drizzle — do not add MySQL or generic database-agnostic abstractions.
- GitHub dual-sync target accounts: primary `ranzalopez77-hash`, secondary `alfredgrace904-ops/Rebranded-xpfx`.
