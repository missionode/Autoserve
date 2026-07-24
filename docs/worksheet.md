# Autocode Prototype Worksheet

## Status Legend

- `[ ]` Not started
- `[-]` In progress
- `[x]` Complete
- `[!]` Blocked

## Overall Status

**Prototype status:** Complete — stakeholder-approved freeze  
**Completed major phases:** 3 of 3  
**Current major phase:** Prototype complete; Phase 4 production development is in progress
**Overall completion rule:** The prototype is complete only when every required phase and acceptance checkpoint in this worksheet is marked `[x]`.

**Production development status:** In progress  
**Active local development stage:** Stage 4.2 — Database, Tenancy, Audit, and Idempotency

**Deferred deployment gate:** Stage 4.1B — Cloud Deployment Foundation

**Development completion rule:** Production development is complete only when Stages 4.0–4.12 and the production launch gate are `[x]`.

---

## Phase 1 — Inspiration Design

**Status:** `[x] Complete`

### Deliverables

- [x] Create the visual inspiration page.
- [x] Establish the Autoserve visual theme.
- [x] Use the Tailwind v4 Play CDN browser package.
- [x] Convert custom colors, typography, and spacing into Tailwind v4 theme tokens.
- [x] Refine hero typography and text width.
- [x] Apply the supplied Autoserve SVG logo to the header and footer.
- [x] Refine footer typography and colors.
- [x] Establish standard primary, secondary, and muted text colors.
- [x] Preserve responsive behavior.

### Completion evidence

- Inspiration file: `design_template/index.html`
- Brand asset: `design_template/Autoserve logo.svg`

### Exit criteria

- [x] Inspiration design provides an approved theme for the application prototype.

---

## Phase 2 — Requirements Definition

**Status:** `[x] Complete`

### Customer requirements

- [x] Define guest and signed-in customer roles.
- [x] Define restaurant and table QR entry.
- [x] Define authentication and session behavior.
- [x] Define menu browsing, search, filters, and sold-out states.
- [x] Define sizes, spice levels, add-ons, and special instructions.
- [x] Define cart, inventory validation, and pricing behavior.
- [x] Define dine-in and takeaway checkout.
- [x] Define simulated UPI payment outcomes.
- [x] Define sequential three-digit tokens beginning at `100`.
- [x] Define customer order tracking.
- [x] Define Tic-Tac-Toe gameplay.
- [x] Define signed-in reward eligibility.
- [x] Define current-order complimentary beverage and fallback side.
- [x] Define profile, history, receipts, reorder, help, and error states.

### Restaurant/storefront requirements

- [x] Define Admin and Staff roles.
- [x] Define restaurant authentication.
- [x] Define the operational dashboard.
- [x] Define the chronological live token queue.
- [x] Define preparation and fulfillment transitions.
- [x] Define Staff cancellation using a daily administrative token.
- [x] Define menu and category management.
- [x] Define inventory control, low-stock alerts, and emergency cutoffs.
- [x] Define inventory and order activity auditing.
- [x] Define Staff account administration.
- [x] Define order history and Admin reports.
- [x] Define restaurant settings and reward configuration.
- [x] Define JSON import/export, backup, restore, purge, and reset.
- [x] Define help, alerts, recovery states, and storefront screens.

### Shared requirements

- [x] Define SPA and technology constraints.
- [x] Define Local Storage persistence and cross-tab synchronization.
- [x] Define accessibility and responsive requirements.
- [x] Define prototype limitations.
- [x] Define complete acceptance journeys and definition of done.

### Completion evidence

- Approved specification: `requirement.md`

### Exit criteria

- [x] Customer, restaurant, shared-system, and acceptance requirements are documented.

---

## Phase 3 — Prototype Design and Implementation

**Status:** `[x] Complete`

Phase 3 is divided into implementation stages. Each stage must be completed in order unless its dependencies permit safe parallel work.

### Stage 3.1 — Application Foundation

**Status:** `[x] Complete — implementation and automated foundation verification complete`

- [x] Create the approved root, `customers/`, `restaurants/`, `super_admin/`, and `support/` structure.
- [x] Create root `index.html`, `login.html`, `signup.html`, and `forgot-password.html` authentication pages.
- [x] Route customer login, registration, and guest entry into `customers/`.
- [x] Route Admin and Staff login into `restaurants/`.
- [x] Establish shared Tailwind theme tokens from the inspiration design.
- [x] Create shared responsive layout, navigation, feedback, and dialog patterns.
- [x] Define route/view switching for the multi-view SPA.
- [x] Define the versioned Local Storage schema.
- [x] Seed restaurant, menu, inventory, Customer, Admin, Staff, Super Admin, Support, history, and Support-request demo data.
- [x] Implement shared state reads, writes, validation, migrations, and storage events.
- [x] Implement role-aware route protection.
- [x] Add common empty, loading, unauthorized, and error states.

#### Exit criteria

- [x] Both customer and restaurant shells load with seeded persistent state.
- [x] Shared design and state foundations are reusable by later stages.

### Stage 3.2 — Shared Authentication

**Status:** `[x] Complete — implementation and automated authentication verification complete`

- [x] Implement customer sign-up.
- [x] Implement customer sign-in.
- [x] Implement guest continuation.
- [x] Use the root authentication pages for every role entry flow.
- [x] Load the seeded prototype accounts defined in `authentication.md`.
- [x] Preserve a guest cart after customer sign-in.
- [x] Implement Admin and Staff sign-in.
- [x] Implement role resolution and protected navigation.
- [x] Implement account sign-out and session restoration.
- [x] Prevent deactivated Staff accounts from signing in.
- [x] Display prototype-security limitations.
- [x] Restrict simulated Google authentication to Customer accounts.
- [x] Route Super Admin and Support accounts to their protected workspaces.
- [x] Require matching confirmation for password and owner-PIN creation while providing visibility and password-strength controls.

#### Exit criteria

- [x] Guest, Customer, Admin, Staff, Super Admin, and Support entry paths behave according to `requirement.md`.
- [x] Inactive-account, restaurant-approval, role-protection, session restore, sign-out, and guest-cart-transfer guards have automated regression coverage.

### Stage 3.3 — Customer Menu and Cart

**Status:** `[x] Complete — implementation, cart-integrity fixes, and automated verification complete`

- [x] Implement restaurant and table entry context.
- [x] Implement responsive dynamic menu grid.
- [x] Implement category filters and text search.
- [x] Implement dietary and availability indicators.
- [x] Implement item detail and customization view.
- [x] Implement sizes, spice levels, add-ons, quantities, and instructions.
- [x] Implement sold-out disabling.
- [x] Implement responsive slide-out cart.
- [x] Implement quantity changes, removal, and totals.
- [x] Persist the cart and enforce one-restaurant cart scope.
- [x] Revalidate inventory and changed menu data.
- [x] Require confirmation before clearing an order during QR restaurant switching.
- [x] Keep featured-combo lines atomic and prevent item-level quantity changes from invalidating a combo.

#### Exit criteria

- [x] A Guest or signed-in Customer can build and retain a valid customized cart.
- [x] Add, quantity-change, restaurant-switch, option-change, and checkout revalidation paths have automated regression coverage.

### Stage 3.4 — Customer Checkout, Payment, and Token

**Status:** `[x] Complete — payment state-machine fixes and automated invariant verification complete`

- [x] Implement dine-in and takeaway selection.
- [x] Implement table identification and checkout fields.
- [x] Implement final inventory validation.
- [x] Implement order summary, tax, and terms acceptance.
- [x] Implement mock UPI application and UPI ID flows.
- [x] Implement Processing, Success, Failure, Cancellation, and Pending outcomes.
- [x] Prevent duplicate payment submission.
- [x] Generate one order after successful payment.
- [x] Deduct inventory exactly once.
- [x] Generate sequential restaurant tokens beginning at `100`.
- [x] Preserve the cart after failed or cancelled payment.
- [x] Implement order confirmation.
- [x] Model a cancellable Processing state before the simulated provider callback.
- [x] Reset the payment action safely after cancellation so the Customer can retry.
- [x] Display restaurant, order reference, fulfillment status, service mode, and customization details in confirmation.

#### Exit criteria

- [x] Successful payment creates exactly one paid order, inventory deduction, KOT, and token.
- [x] Processing, Pending, Failed, and Cancelled payments do not create an order or deduct inventory.
- [x] Duplicate submission, callback cancellation, retry, success idempotency, cart preservation, and confirmation details have automated regression coverage.

### Stage 3.5 — Restaurant Live Operations

**Status:** `[x] Complete — live-transition integrity fixes and automated workflow verification complete`

- [x] Implement Admin and Staff operational dashboards.
- [x] Implement metrics and operational alerts.
- [x] Implement chronological live token queue.
- [x] Implement order detail and activity timeline.
- [x] Implement Accept Order.
- [x] Implement Start Preparing.
- [x] Implement operational issue flags.
- [x] Implement Mark Ready.
- [x] Implement Mark Delivered.
- [x] Enforce valid status transitions.
- [x] Implement elapsed, preparation, and ready-waiting timers.
- [x] Synchronize changes with customer tracking and other tabs.
- [x] Bind fulfillment actions to their rendered status so stale-tab actions cannot skip a step.
- [x] Require active operational issues to be resolved before Ready.
- [x] Require token or table verification plus confirmation before Delivered.
- [x] Apply configured warning and delayed thresholds and surface unusually long Pending payments.

#### Exit criteria

- [x] Staff can fulfill a paid order through the complete approved sequence.
- [x] Customer and restaurant views remain consistent through local and cross-tab updates.
- [x] Chronology, transitions, concurrency guards, timers, alerts, handoff verification, timelines, and customer notifications have automated regression coverage.

### Stage 3.6 — Customer Tracking, Game, and Reward

**Status:** `[x] Complete — reward-integrity fixes and automated tracking/game verification complete`

- [x] Implement active-order tracking.
- [x] Display token, timing, payment, order, and status information.
- [x] Implement Ready and Delivered notifications.
- [x] Implement responsive Tic-Tac-Toe against a beatable computer.
- [x] Implement compact responsive game selection.
- [x] Implement practice-only Memory Match.
- [x] Implement practice-only Tap Rush.
- [x] Implement practice-only Ludo Race.
- [x] Implement guest and practice-only game states.
- [x] Implement one reward-eligible attempt per paid order.
- [x] Persist win, loss, draw, and consumed-attempt states.
- [x] Implement complimentary beverage reward.
- [x] Implement complimentary side fallback.
- [x] Prevent reward duplication.
- [x] Deduct reward inventory exactly once.
- [x] Add the reward to customer and restaurant order views.
- [x] Interrupt or pause gameplay when the order becomes Ready.
- [x] Atomically claim one reward-eligible attempt across concurrent tabs.
- [x] Persist an interrupted attempt and its board when the order becomes Ready.
- [x] Deduct current reward availability and mark exhausted rewards Sold Out.
- [x] Display explicit turn state, current-order customizations, payment reference, and service instructions.

#### Exit criteria

- [x] Eligible wins issue at most one available current-order reward.
- [x] Guests can play but cannot receive an offer.
- [x] Primary/fallback selection, unavailable alternatives, zero-price labeling, inventory deduction, Ready cutoff, attempt concurrency, and practice-game isolation have automated regression coverage.

### Stage 3.7 — Menu and Inventory Administration

**Status:** `[x] Complete`

- [x] Implement Admin menu list, search, and filters.
- [x] Implement menu creation, editing, duplication, preview, and publishing.
- [x] Implement item states: Draft, Published, Hidden, Sold Out, and Archived.
- [x] Implement category creation, ordering, assignment, and archiving.
- [x] Implement customization and price validation.
- [x] Implement Admin and Staff inventory views.
- [x] Implement replenishment, correction, and exact stock updates.
- [x] Implement low-stock thresholds and alerts.
- [x] Implement emergency cutoffs.
- [x] Implement reward inventory indicators.
- [x] Implement concurrent-change detection.
- [x] Implement inventory activity auditing.

Verification notes:

- Permanent publishing states are separated from temporary availability states; legacy Sold Out records migrate to Published + Sold Out availability.
- Physical stock and sellable quantity remain synchronized for stock adjustments, paid orders, and complimentary rewards, with an audit record for every deduction.
- The unified Admin/Staff inventory list exposes availability, replenishment/correction, low-stock, reward, and emergency-cutoff controls without competing renderers.
- Inventory and cutoff updates reject stale cross-tab changes, while customer ordering continues to revalidate current sellable quantity before payment.
- Published menu items require an active category and food image; unavailable and sold-out states require an operational reason.
- Automated verification: `node --test tests/*.test.js` — 45 passed, 0 failed.

#### Exit criteria

- [x] Approved menu changes and inventory changes update customer availability safely.

### Stage 3.8 — Cancellation, History, and Reports

**Status:** `[x] Complete`

- [x] Implement Staff cancellation request and required reason.
- [x] Implement protected daily administrative-token authorization for Staff.
- [x] Implement failed-PIN logging and rate limiting.
- [x] Implement simulated refund state.
- [x] Implement conditional inventory restoration.
- [x] Prevent duplicate cancellation, refund, or restoration.
- [x] Implement Admin reopening of mistakenly delivered orders.
- [x] Implement current-session history for Staff.
- [x] Implement complete Admin order history and filters.
- [x] Implement receipts and immutable paid-order snapshots.
- [x] Implement Admin operational reports.

Verification notes:

- New paid orders use the quantity-inventory model; active legacy paid orders migrate safely without making completed legacy orders restorable.
- Cancellation requires a reason and confirmation, revalidates the daily administrative token inside the final Staff mutation, rate-limits and audits failures, and prevents repeated cancellation, refund, or restoration.
- Pre-preparation cancellations restore every purchased and complimentary line automatically; later cancellations restore only selected safe items, updating both physical and sellable quantities with an inventory audit record.
- Refund amounts, receipts, sales totals, average order values, and top-selling items reconcile against immutable paid snapshots; cancelled orders do not count as realized sales or sold items.
- Admin reopening is limited to current-session deliveries, requires a reason and confirmation, detects stale records, restores Ready/KOT state, and records both timeline and authorization audit events.
- Staff history is constrained to the current signed-in session, while Admin retains complete search, date, status, type, payment, reward, customer, and actor filters.
- Automated verification: `node --test tests/*.test.js` — 46 passed, 0 failed.

#### Exit criteria

- [x] Cancellation and reopening follow permissions and audit rules.
- [x] History and reports reconcile with stored order data.

### Stage 3.9 — Profiles, Staff, Settings, and Help

**Status:** `[x] Complete for prototype freeze`

- [x] Implement customer profile and order history.
- [x] Implement customer receipt and reorder.
- [x] Implement Admin Staff-account management.
- [x] Implement Staff activation and deactivation.
- [x] Implement restaurant profile and operating status.
- [x] Implement tax, timing, token, reward, and PIN settings.
- [x] Replace delegated Admin PIN operations with a reloadable daily administrative token.
- [x] Implement configurable dine-in service modes, table numbers, and QR-derived table prefill.
- [x] Implement branded printable restaurant, pickup-counter, and multi-table QR cards.
- [x] Implement featured multi-combo configuration and customer slideshow.
- [x] Implement Super Admin authentication, responsive workspace, restaurant directory, users, and platform activity.
- [x] Implement restaurant company/licence onboarding and Super Admin approval or rejection.
- [x] Implement Support authentication, responsive dashboard, request queue, replies, resolution, reopening, and activity.
- [x] Implement Super Admin monthly subscription plan and rate management.
- [x] Publish active plan rates into Restaurant Admin Settings.
- [x] Implement simulated UPI subscription success, pending, and failure outcomes.
- [x] Implement monthly activation/renewal periods and immutable payment price snapshots.
- [x] Implement restaurant and platform subscription payment history.
- [x] Document UPI AutoPay as the required production recurring-billing method.
- **Deferred after prototype freeze:** Replace the local simulation with a provider-backed UPI AutoPay mandate lifecycle.
- **Deferred after prototype freeze:** Process authenticated, idempotent mandate and recurring-payment callbacks on a production backend.
- **Deferred after prototype freeze:** Connect Restaurant Admin mandate status and cancellation controls to the selected real provider.
- [x] Implement role-aware customer and restaurant Help/FAQ views.
- [x] Implement shared Support forms for Guest, Customer, Admin, Staff, and Super Admin.
- [x] Implement requester-visible recent Support requests and replies.
- [x] Implement required empty and recovery states.

Verification notes:

- Signed-in customers can update a uniquely validated profile; Google-managed email remains provider-controlled, and the active session name updates with the profile.
- Customer history and receipts use immutable paid snapshots. Reorder uses snapshot lines, current prices/options, and the remaining sellable quantity after accounting for the existing cart.
- Every Staff edit, reset, activation, and deactivation lookup is scoped to both the current restaurant and Staff role, preventing crafted cross-restaurant account mutations.
- Restaurant settings validate operating modes, contact email, timing order, token non-reuse, table-service tables, active reward choices, printable QR details, and stale cross-tab versions before saving.
- Admin PIN replacement is confirmation-protected, scoped, concurrency-checked, and audited; the daily delegated token remains independently reloadable and expires at local midnight.
- The prototype now represents AutoPay honestly with simulated mandate status, masked payer references, mandate references, next-debit visibility, immutable rate/feature snapshots, idempotency guards, and simulated future-renewal cancellation.
- Real mandate creation, authenticated callbacks, recurring debits, and provider cancellation are explicitly outside the prototype freeze. Provider, backend, security, data, policy, and operations questions are recorded in `docs/subscription-billing.md` for the development handoff.
- Automated verification: `node --test tests/*.test.js` — 47 passed, 0 failed.

#### Exit criteria

- [x] Profile, account, configuration, reorder, and help workflows match approved permissions.

### Stage 3.10 — Data Management

**Status:** `[x] Complete for prototype freeze`

- [x] Implement schema-versioned auto-save.
- [x] Implement complete JSON export.
- [x] Implement non-mutating import validation and summary.
- [x] Implement pre-import backup.
- [x] Implement confirmed full-replacement import.
- [x] Implement rollback after import failure.
- [x] Implement named manual backups.
- [x] Implement backup download and restore.
- [x] Implement confirmed backup purge.
- [x] Implement protected prototype reset with backup offer.
- [x] Handle unavailable, full, and corrupted Local Storage.

#### Exit criteria

- [x] Export, import, backup, restore, purge, and reset preserve data safety requirements.

#### Verification notes

- Restaurant Admin exports, imports, backups, restores, downloads, purges, and seeded resets are scoped to the signed-in restaurant. Platform settings and other restaurants remain unchanged.
- Imports are parsed and integrity-checked before mutation, use an explicit confirmation, retain a pre-import backup, and roll back on failed writes or post-import validation.
- Prototype reset requires the current restaurant Admin password or authorization PIN, typed `RESET`, final confirmation, and offers a downloadable pre-reset export.
- Unavailable, corrupted, and full Local Storage states produce recoverable errors without silently replacing active state.
- Automated verification: `node --test tests/*.test.js` — 48 passed, 0 failed.

### Stage 3.11 — Integration and Quality Verification

**Status:** `[x] Complete for virtual prototype acceptance`

- [x] Verify the complete guest customer journey.
- [x] Verify the complete signed-in and rewarded customer journey.
- [x] Verify the complete Staff fulfillment journey.
- [x] Verify Staff cancellation with the current daily administrative token.
- [x] Verify the Admin management journey.
- [x] Verify data backup and recovery journey.
- [x] Verify duplicate-action protection for payment, token, stock, reward, and cancellation.
- [x] Verify cross-tab state synchronization.
- [x] Verify responsive mobile, tablet, and desktop layout structure for virtual acceptance; physical-device review remains in Stage 3.12.
- [x] Verify keyboard navigation, focus behavior, labels, and contrast structure for virtual acceptance; final user review remains in Stage 3.12.
- [x] Verify loading, empty, failure, conflict, and recovery states.
- [x] Verify no inaccessible Admin actions are exposed to Staff.
- [x] Verify Super Admin and Support route protection and seeded prototype credentials.
- [x] Verify Support submissions connect every Help workspace to the centralized request queue.
- [x] Verify compact mobile game navigation and practice-game reward isolation.
- [x] Resolve critical and high-severity defects found by automated and source-level verification.
- [x] Complete a source-level virtual journey audit across every role and record findings in `audit/journey-audit.md`.
- **Deferred after prototype freeze:** decide subscription grace-period, access-enforcement, and plan-entitlement rules during production development; questions are recorded in `subscription-billing.md` and `technology-recommendation.md`.
- **Deferred after prototype freeze:** decide plan upgrade, downgrade, proration, retry, credit, and removed-plan behavior during production development.
- [x] Align import validation with Support, authorization, and subscription collections while preserving platform settings outside Restaurant Admin import scope.
- [x] Verify the post-approval Restaurant activation sequence virtually, including safe closed/unavailable defaults and the manual Admin activation path.
- [x] Verify Guest Support continuity as same-local-identity assistance and record cross-device recovery as a production requirement.

#### Automated verification evidence

- `node --test tests/prototype-integration.test.js`
- Repository-wide `node --check` for every file in `assets/js/`
- Resolved stale local customer cart/checkout rendering after reorder and other same-tab state changes.
- Virtual acceptance matrix and evidence: `audit/stage-3.11-virtual-acceptance.md`.
- Physical-device, camera, print, and final stakeholder review remain Stage 3.12 activities.

#### Exit criteria

- [x] Every acceptance journey in `requirement.md` passes virtual prototype verification.
- [x] No unresolved critical or high-severity prototype defects remain.

### Stage 3.12 — Final Prototype Review

**Status:** `[x] Complete — stakeholder approved prototype freeze`

- [x] Compare all screens against the approved inspiration theme through shared theme and source-level review.
- [x] Review the implementation against `requirement.md`.
- [x] Confirm all prior worksheet items are complete or explicitly deferred after prototype freeze.
- [x] Confirm seeded data demonstrates every major workflow.
- [x] Confirm prototype limitations are visible where relevant.
- [x] Complete final user review — stakeholder approval received.

#### Review evidence

- Final virtual review: `audit/final-prototype-review.md`.
- Cross-role acceptance evidence: `audit/stage-3.11-virtual-acceptance.md`.
- Automated verification: `node --test tests/*.test.js` — 48 passed, 0 failed.
- Repository-wide JavaScript syntax and whitespace checks pass.
- Final stakeholder approval was received and recorded.

#### Exit criteria

- [x] Phase 3 is approved.
- [x] Overall prototype status is changed to Complete.

---

## Completion Summary

| Major phase | Status | Evidence |
|---|---|---|
| Phase 1 — Inspiration Design | Complete | `design_template/index.html` |
| Phase 2 — Requirements Definition | Complete | `requirement.md` |
| Phase 3 — Prototype Design and Implementation | Complete | Stage 3.12 stakeholder-approved prototype freeze |

**Prototype completion:** Complete — all three phases and final prototype review are approved.

---

## Phase 4 — Production Development

**Status:** `[-] In progress — Stage 4.0 and Stage 4.1A complete; Stage 4.2 local development is active; Stage 4.1B cloud deployment is deferred`

**Planning source:** `development-plan.md`  
**Architecture source:** `technology-recommendation.md`  
**Billing decision source:** `subscription-billing.md`

Phase 4 is a separate post-freeze program. Starting it does not alter the approved prototype baseline. Every stage requires an assigned owner, acceptance evidence, and completed exit criteria before it is marked Complete.

### Stage 4.0 — Decisions and Governance

**Status:** `[x] Complete — internal baseline ratified 20 July 2026; external gates explicitly deferred to their dependent stages`

- [x] Assign Product, Technical, Security/Privacy, Finance/Operations, Support, QA, Design, and Infrastructure owners — all roles established; identities not supplied to repository.
- [x] Confirm the first-production-release scope and explicitly record exclusions — Product Owner approved Batch A on 20 July 2026.
- [x] Approve the TypeScript modular-monolith architecture and monorepo ownership model — Product and Technical ratification recorded 20 July 2026.
- [x] Approve AWS account structure, Mumbai deployment region, environment isolation, and domain ownership — Product, Technical, Security, and Infrastructure ratification recorded 20 July 2026.
- [x] Set availability target, recovery time objective, recovery point objective, backup retention, and restore ownership.
- [x] Approve customer, Staff, Admin, Support, and Super Admin identity, session, MFA, recovery, and reauthentication policy.
- [x] Approve the role/permission matrix, Staff delegation model, Support access boundary, and Super Admin elevation policy.
- [x] Approve the internal privacy, consent, data classification, retention, deletion, export, licence-document, and audit-retention baseline; external legal validation remains gated.
- [x] Approve the channel map and provider-selection gate; email/SMS contracts and registration remain gated, and WhatsApp is deferred.
- [x] Approve Cashfree-first due diligence without selecting a provider; merchant/KYC/sandbox onboarding remains a Stage 4.6/4.9 gate.
- [x] Approve provider-neutral food-payment capture, pending, reconciliation, cancellation, refund, settlement, dispute, and receipt policies; provider behavior and tax conclusions remain gated.
- [x] Approve subscription grace, entitlement, retry, upgrade, downgrade, proration, cancellation, and removed-plan rules; provider behavior and tax conclusions remain gated.
- [x] Approve provider-neutral webhook signature, idempotency, retention, and reconciliation rules; pinning the exact API/webhook version remains gated by provider selection.
- [x] Create the initial threat model, privacy/data-flow inventory, compliance checklist, and production risk register with owners.
- [x] Approve the release strategy, pilot cohort, rollback authority, incident severity model, and change-control process.
- [x] Convert approved internal decisions into architecture decision records and update dependent documentation.

#### Completed governance evidence

- Decision and owner register: `production-decisions.md`.
- Initial production threat model: `development/threat-model.md`.
- Initial production data-flow and external-vendor boundary inventory: `development/data-flow-inventory.md`.
- Ratified authorization and privileged-action matrix: `development/authorization-matrix.md`.
- Ratified internal data classification, retention, customer-rights, and compliance controls: `development/data-governance.md`; external legal validation remains gated.
- Accepted internal/provider-neutral ADR-001–ADR-012: `development/architecture-decisions.md`.
- Consolidated stakeholder decision review: `development/stage-4.0-approval-packet.md`.
- Payment and UPI AutoPay provider evaluation gate: `development/provider-due-diligence.md`.
- Ratified exact internal reliability, identity, retention, payment, subscription, communications, Support, and pilot policies: `development/stage-4.0-policy-resolution.md`.
- Recorded Product Owner approval: `production-decisions.md` → APPR-001.
- Recorded Product Owner reliability, identity, authorization, and data baseline: `production-decisions.md` → APPR-002.
- Recorded Product Owner provider, billing, communications, Support, and pilot direction: `production-decisions.md` → APPR-003.
- Recorded Technical, Security/Privacy, and Infrastructure ownership/ratification: `production-decisions.md` → APPR-004.
- Recorded remaining governance ownership confirmation: `production-decisions.md` → APPR-005.
- Recorded exact internal-policy ratification and preserved external gates: `production-decisions.md` → APPR-006.

#### Exit criteria

- [x] No unresolved internal decision blocks Stage 4.1–4.3 implementation.
- [x] Payment and subscription internal decisions are approved; provider onboarding, provider-specific behavior, legal/tax conclusions, and contracts remain explicit Stage 4.6/4.9/4.11 gates.
- [x] Owners, decision records, risk register, first-release scope, and acceptance authority are recorded.

### Stage 4.1 — Engineering and Environment Foundation

**Status:** `[-] In progress — Stage 4.1A local Docker foundation complete; Stage 4.1B cloud deployment deferred as a mandatory pre-pilot gate`

#### Stage 4.1A — Local Docker foundation

- [x] Build web, API, worker, migration, and seed application containers from the pinned monorepo lockfile.
- [x] Run PostgreSQL, Redis, MinIO object storage, and the payment-provider stub through Docker Compose.
- [x] Apply the Prisma migration and deterministic seed before application startup.
- [x] Verify web, API, worker, object-storage, and provider-stub health endpoints.
- [x] Verify PostgreSQL data persists across a container restart.
- [x] Create a local SQL backup and restore it into an isolated disposable verification database.
- [x] Add the same Compose build, smoke, backup, and restore flow to CI.

The Product Owner's local-first plan permits Stage 4.2 local development after Stage 4.1A. Stage 4.1B cloud deployment remains required before pilot deployment and does not become implicitly approved or complete.

#### Shared engineering controls and Stage 4.1B cloud deployment foundation

- [x] Create the monorepo with `web`, `api`, `worker`, database, contracts, UI, configuration, observability, and testing packages.
- [x] Configure strict TypeScript, linting, formatting, dependency policy, and commit/release conventions; repository-host protected-branch activation remains environment-owned evidence.
- [x] Create validated environment configuration with no secrets committed or exposed to the browser.
- [x] Provide and runtime-validate containerized local PostgreSQL, Redis, object-storage/provider stubs, and deterministic seed commands.
- [ ] Provision isolated CI, development, staging, and production foundations through infrastructure as code.
- [ ] Configure managed secrets, service identities, private database/cache networking, TLS, DNS, CDN, and storage access.
- [x] Create CI checks for formatting, linting, compilation, unit tests, dependency/secret/static scans, production build, and migration validation.
- [ ] Create deployment pipelines with immutable artifacts, approvals, health checks, smoke tests, and rollback records.
- [ ] Establish structured logging, correlation IDs, metrics, traces, frontend error reporting, and environment dashboards.
- [x] Publish coding, review, database migration, feature-flag, release, and incident-development standards.

#### In-progress engineering evidence

- Verification record and remaining environment evidence: `development/stage-4.1-verification.md`.
- Engineering and incident standards: `development/engineering-standards.md` and `development/incident-development.md`.
- Local `npm run verify`: passed 20 July 2026.
- CI failure-gate proof: deliberately failing test, secret, type error, and invalid migration were all rejected.
- Dependency gate: no high or critical findings; two moderate and one low transitive advisory remain recorded.
- Docker Compose runtime, persistence, backup, and restore evidence passed 21 July 2026. Terraform/cloud deployment evidence remains outstanding.

#### Exit criteria

- [ ] A minimal web/API/worker vertical slice deploys through CI to development and staging.
- [ ] Secrets, environment isolation, observability, health checks, and rollback path are verified.
- [x] CI blocks a deliberately failing test, secret, type error, and invalid migration.

### Stage 4.2 — Database, Tenancy, Audit, and Idempotency

**Status:** `[-] In progress — identity and restaurant-tenancy foundation verified`

- [x] Implement the approved PostgreSQL/Prisma identity, restaurant, membership, licence, table, and counter schema — migration, deterministic seed, zero-drift check, and four database integration tests passed 24 July 2026.
- [-] Implement catalog, cart, checkout, payment, order, KOT, event, cancellation, refund, reward, Support, subscription, notification, audit, webhook, and export foundations — catalog, availability, cart, and immutable price-snapshot sub-slice fully verified; checkout/payment/order/KOT is next.
- [ ] Add UUID/ULID identifiers, UTC timestamps, foreign keys, checks, indexes, optimistic versions, and money/status constraints.
- [ ] Add restaurant identifiers to every tenant-owned record and document the tenant-policy map.
- [ ] Implement PostgreSQL Row-Level Security with default-deny behavior and explicit platform/Support policies.
- [ ] Implement audit event, idempotency key, webhook event, and immutable snapshot foundations.
- [ ] Implement transaction helpers, outbox/post-commit event pattern, and safe concurrency conventions.
- [ ] Add forward migration, seed, reset-for-development, backup, restore, and migration-test tooling.
- [ ] Create a database data dictionary and critical entity/sequence diagrams.
- [ ] Add automated cross-tenant, uniqueness, locking, rollback, and migration tests.

#### In-progress Stage 4.2 evidence

- Identity and restaurant-tenancy verification: `development/stage-4.2-verification.md`.
- Applied migration: `packages/database/prisma/migrations/202607240001_identity_restaurant_tenancy/migration.sql`.
- Deterministic seed: `packages/database/src/seed.ts`.
- Database integration coverage: `tests/database-foundation.test.ts` — four tests passed 24 July 2026.
- Prisma schema-to-database comparison: no difference detected.
- SQL backup and disposable restore verification: passed 24 July 2026.
- Next unchecked item: tenant-owned catalog, ordering, payment, fulfillment, Support, subscription, notification, audit, webhook, and export foundations.
- Completed sub-slice: catalog/category/menu availability and cart migration, deterministic seed, composite tenant relations, four constraint tests, zero drift, backup, restore, full build, and local smoke passed 24 July 2026.
- Next sub-slice: checkout attempts, payment attempts, orders, immutable order lines, KOT/token allocation, and order status events.
- Open deployment/Security gate: high transitive PostCSS and Sharp advisories remain inside the current Next.js package tree; direct framework advisories are patched at Next.js 15.5.21. This does not satisfy the Stage 4.11 dependency gate.

#### Exit criteria

- [ ] Tenant escape attempts fail at API/service and database-policy levels.
- [ ] Duplicate keys and invalid state cannot violate payment, token, KOT, reward, refund, or webhook invariants.
- [ ] Clean install, migration, backup, restore, and rollback/forward-fix drills pass in staging.

### Stage 4.3 — Identity and Authorization

**Status:** `[ ] Not started`

- [ ] Implement secure password hashing, server-side sessions, Secure/HTTP-only/SameSite cookies, rotation, revocation, and sign-out.
- [ ] Implement Customer registration, sign-in, verification, recovery, profile, and approved consent capture.
- [ ] Implement customer-only Google OAuth, callback validation, account linking, and conflict handling.
- [ ] Implement Admin, Staff, Support, and Super Admin authentication with approved MFA/reauthentication controls.
- [ ] Implement restaurant memberships, role/capability policies, disabled-account behavior, and approval-aware access.
- [ ] Implement scoped, expiring, revocable, non-reusable Staff delegation for protected actions.
- [ ] Implement CSRF protection, CORS, security headers, rate limits, authentication audit, and safe error messages.
- [ ] Implement account/session/device visibility and privileged credential-rotation workflows required by policy.
- [ ] Create the authorization matrix and automated allow/deny coverage for every role and tenant combination.
- [ ] Verify session isolation across browsers/tabs and prevent prototype-style global session replacement.

#### Exit criteria

- [ ] Authentication, recovery, OAuth, MFA/reauthentication, session, and revocation journeys pass.
- [ ] No role can view or invoke an unapproved route, API, tenant record, or protected mutation.
- [ ] Security and tenant authorization tests have no unresolved critical/high finding.

### Stage 4.4 — Restaurant Onboarding, Configuration, Catalog, and QR

**Status:** `[ ] Not started`

- [ ] Implement restaurant company onboarding, private licence uploads, validation, consent, and Pending status.
- [ ] Implement Super Admin search, review, approval, rejection, operating access, and audited decisions.
- [ ] Preserve safe post-approval defaults and implement/document the Admin activation sequence.
- [ ] Implement restaurant profile, contacts, complaint details, hours, service modes, tables, counters, tax, preparation thresholds, and closure behavior.
- [ ] Implement Staff account administration within approved plan/policy limits.
- [ ] Implement categories, menu items, images, sizes, spice levels, add-ons, defaults, combos, publishing states, and previews.
- [ ] Implement Available, Limited, Temporarily unavailable, and Sold out states with their required details and audit history.
- [ ] Store menu and branding assets privately/publicly as appropriate through signed upload and managed delivery.
- [ ] Implement store, counter, and table QR generation, branded printable cards, bulk table printing, and validated deep links.
- [ ] Implement optimistic conflicts, audit events, empty/loading/failure states, and accessible responsive administration.

#### Exit criteria

- [ ] A new restaurant can move from application through approval to safe manual activation without platform intervention gaps.
- [ ] A second restaurant cannot view or mutate the first restaurant's settings, Staff, assets, menu, availability, or QR records.
- [ ] Catalog and QR journeys pass responsive, accessibility, upload-security, and print acceptance.

### Stage 4.5 — Customer Entry, Menu, Cart, and Checkout Draft

**Status:** `[ ] Not started`

- [ ] Implement store/counter/table QR deep-link validation and safe restaurant/table context retention through authentication.
- [ ] Implement Guest identity/session continuity and approved signed-in Customer continuity.
- [ ] Implement responsive digital menu, professional media, search, filters, availability, multiple combo carousel, defaults, Quick add, and customization.
- [ ] Implement server-backed cart with guest-to-customer transfer, stable line identity, quantity limits, availability checks, and expiry policy.
- [ ] Implement floating Review order behavior, checkout hiding, and obstruction-free mobile positioning.
- [ ] Implement restaurant-configured dine-in/takeaway/service preferences, prefilled valid table, and counter pickup behavior.
- [ ] Implement checkout customer details, instructions, order notes, tax/total preview, terms, and final availability/price revalidation.
- [ ] Implement accessible loading, empty, closed restaurant, invalid QR, stale menu, conflict, and recovery states.
- [ ] Add analytics events approved by privacy policy without leaking sensitive cart/customer data.
- [ ] Automate Guest and signed-in Customer journeys through the pre-payment checkout boundary.

#### Exit criteria

- [ ] Guest and Customer carts remain tenant-correct, server-authoritative, recoverable, and price/availability safe.
- [ ] Every approved service configuration produces the correct checkout requirements and QR-prefilled context.
- [ ] Mobile, tablet, desktop, keyboard, screen-reader, and supported-browser acceptance passes.

### Stage 4.6 — Customer Payments, Orders, KOT, Cancellation, and Refunds

**Status:** `[ ] Not started — provider and policy gate applies`

- [ ] Implement backend-created food payment sessions using the approved provider sandbox.
- [ ] Implement raw-body signature verification, pinned webhook version, idempotent callback inbox, and safe acknowledgements.
- [ ] Implement payment Success, Pending, Failure, Cancelled, timeout, duplicate, delayed, and out-of-order behavior.
- [ ] Implement the atomic successful-payment transaction creating payment, immutable order snapshot, KOT, token, status events, and outbox events exactly once.
- [ ] Implement restaurant operating-period token/KOT uniqueness and concurrency tests.
- [ ] Implement paid-without-order reconciliation, alert, recovery, and Support visibility.
- [ ] Implement cancellation authorization, approved restoration policy, provider refund, retired token, and immutable audit history.
- [ ] Implement receipt data, customer payment/order status, and finance/operations reconciliation views.
- [ ] Implement provider sandbox contract tests, replay tests, failure injection, and transaction rollback tests.
- [ ] Document payment, refund, reconciliation, settlement, and incident runbooks.

#### Exit criteria

- [ ] No client-declared or unverified payment can create an order.
- [ ] A provider success creates exactly one payment, order, KOT, token allocation, and immutable snapshot under concurrency and replay.
- [ ] Cancellation/refund/reconciliation journeys pass and no unresolved critical/high payment defect remains.

### Stage 4.7 — Realtime Fulfillment, Notifications, Games, and Rewards

**Status:** `[ ] Not started`

- [ ] Implement restaurant WebSocket rooms, authenticated subscriptions, reconnect, resync, and authorization.
- [ ] Implement chronological paid KOT queue, details, customization/reward display, and permitted transition state machine.
- [ ] Implement conflict-safe Accept, Preparing, Ready, Delivered, reopen, issue, and resolution actions.
- [ ] Implement delayed-order timers and alerts through durable scheduled/background work.
- [ ] Implement service-aware counter collection and table-service Ready/Delivered messages.
- [ ] Implement durable notification jobs, provider adapters, retries, delivery history, opt-out/consent, and failure visibility.
- [ ] Implement Customer tracking from authoritative API state with realtime acceleration and reconnect recovery.
- [ ] Implement waiting timer/game navigation and practice-only Memory Match, Tap Rush, and Ludo.
- [ ] Implement one persisted reward-eligible Tic-Tac-Toe attempt, inventory-safe reward/fallback, and exactly-once issuance.
- [ ] Add load, reconnect, lost-message, duplicate-event, worker-retry, and reward-concurrency tests.

#### Exit criteria

- [ ] Staff and Customer state converges after disconnect, reconnect, cache loss, or missed realtime events.
- [ ] Every KOT transition and reward issuance is permissioned, auditable, conflict-safe, and idempotent.
- [ ] Fulfillment, notification, game, and reward acceptance journeys pass under expected peak load.

### Stage 4.8 — History, Reports, Support, Platform, and Data Operations

**Status:** `[ ] Not started`

- [ ] Implement Customer profile, receipts, history, instructions, immutable totals, and current-catalog reorder behavior.
- [ ] Implement Staff current-session history and Admin retained history, filters, receipts, activity, and approved reopen behavior.
- [ ] Implement operational reports from immutable paid/refunded records with documented accounting limits.
- [ ] Implement centralized Support submission, requester continuity, search, assignment, reply, resolve, reopen, SLA fields, notifications, and access auditing.
- [ ] Implement Super Admin restaurant directory, users, operating access, plan catalog, activity, Help, and privileged-action safeguards.
- [ ] Implement tenant-scoped export jobs, signed/expiring downloads, validation, restore policy, purge, and approved reset/deletion controls.
- [ ] Implement platform backup administration, point-in-time recovery procedures, retention, legal hold where required, and restore audit.
- [ ] Implement cursor pagination, large-data performance, empty/failure states, and accessible responsive tables/cards.
- [ ] Add authorization, tenant isolation, immutable reporting, Support privacy, export, restore, and recovery tests.
- [ ] Publish Admin, Staff, Support, Super Admin, finance, and data-recovery operating guides.

#### Exit criteria

- [ ] History and reports reconcile with payments, refunds, orders, rewards, and cancellations.
- [ ] Support and Super Admin access is purpose-limited, elevated where required, and fully audited.
- [ ] Export, backup, restore, purge, deletion/reset, and recovery drills meet approved data and recovery policies.

### Stage 4.9 — Restaurant Subscriptions and UPI AutoPay

**Status:** `[ ] Not started — provider and entitlement policy gate applies`

- [ ] Append the approved provider state map, API/webhook version, entitlement, retry, cancellation, and plan-change policies to `subscription-billing.md`.
- [ ] Implement Super Admin plan catalog, versioning, availability/retirement, rates, features, and Staff/feature entitlement mapping.
- [ ] Implement provider-neutral mandate adapter and approved Cashfree/provider sandbox integration.
- [ ] Implement mandate authorization, callback verification, idempotency, state transitions, cancellation, and reconciliation.
- [ ] Implement recurring payment attempts, immutable price/feature snapshots, paid-through periods, retries, failures, refunds, and finance records.
- [ ] Implement approved grace/read-only/access enforcement without interrupting active paid restaurant operations incorrectly.
- [ ] Implement immediate/scheduled upgrade and downgrade behavior, proration/credit rules, and removed-plan migration policy.
- [ ] Implement Restaurant billing status, next debit, history, notices, cancellation, and Support recovery tools.
- [ ] Implement Super Admin billing oversight, reconciliation report, alerts, and audited manual operations.
- [ ] Add signed webhook contract, replay, out-of-order, delayed, missing-callback, reconciliation, and entitlement tests.

#### Exit criteria

- [ ] Only authenticated, idempotently processed provider outcomes change mandate, paid-through, or entitlement state.
- [ ] Every approved subscription state and plan-change policy has automated and sandbox acceptance evidence.
- [ ] Finance reconciliation, cancellation, privacy, Support, monitoring, and incident runbooks are approved.

### Stage 4.10 — Migration and Full Acceptance

**Status:** `[ ] Not started`

- [ ] Define and version the canonical production import format and prototype-to-production mapping.
- [ ] Exclude prototype passwords, PIN hashes, sessions, simulated provider identifiers, and unsafe Local Storage values.
- [ ] Move approved images/branding to managed storage and recreate secure users through invitation/onboarding.
- [ ] Execute development and staging dry runs with counts, references, tenant validation, audit report, and rollback.
- [ ] Automate every Guest, Customer, Staff, Admin, Super Admin, Support, payment, subscription, and data-recovery journey.
- [ ] Run supported Chromium, Firefox, and WebKit browser suites at mobile, tablet, and desktop viewports.
- [ ] Complete keyboard, screen-reader, contrast, zoom, focus, reduced-motion, and error-announcement review.
- [ ] Complete API, database, WebSocket, queue, report, export, and peak restaurant performance tests.
- [ ] Complete provider sandbox end-to-end and failure/reconciliation tests.
- [ ] Produce the requirements traceability matrix, migration report, acceptance report, and known-limitations register.

#### Exit criteria

- [ ] Migration dry run is repeatable, tenant-safe, reconciled, and rollback-tested.
- [ ] Every production acceptance journey passes in staging with no unresolved critical/high defect.
- [ ] Accessibility, responsive, browser, performance, and provider sandbox acceptance is approved.

### Stage 4.11 — Security, Compliance, and Operational Readiness

**Status:** `[ ] Not started`

- [ ] Complete threat-model review against implemented data flows and provider integrations.
- [ ] Complete dependency, secret, static, dynamic, container, infrastructure, upload, and tenant-isolation security testing.
- [ ] Complete independent penetration testing and resolve or formally accept findings.
- [ ] Review privacy notices, consent, terms, refunds, cancellation, retention, deletion, exports, cookies, and vendor agreements.
- [ ] Verify least privilege, MFA/reauthentication, secret rotation, audit access, log redaction, and production support access.
- [ ] Verify monitoring dashboards and alerts for availability, latency, errors, payments, callbacks, KOT delays, workers, notifications, subscriptions, and tenant security.
- [ ] Complete backup restore, point-in-time recovery, provider outage, queue backlog, cache loss, database failure, and rollback drills.
- [ ] Complete payment-without-order, webhook attack/replay, cross-tenant incident, credential compromise, and notification outage exercises.
- [ ] Approve on-call ownership, incident severity/communication, escalation, vendor contacts, status communication, and post-incident process.
- [ ] Complete production readiness review with Product, Engineering, Security, Finance/Operations, Support, and QA sign-off.

#### Exit criteria

- [ ] No unresolved critical/high security, privacy, compliance, payment, or operational-readiness finding remains.
- [ ] Recovery objectives are demonstrated and all launch-critical runbooks have named trained owners.
- [ ] Production readiness approval is recorded.

### Stage 4.12 — Pilot, Launch, and Handover

**Status:** `[ ] Not started`

- [ ] Select and contract the controlled pilot cohort and define measurable success/rollback criteria.
- [ ] Prepare production domains, provider credentials/callbacks, secrets, plans, Support channels, monitoring, and on-call rota.
- [ ] Onboard pilot restaurants through the real approval, configuration, subscription, QR, Staff, and menu process.
- [ ] Execute production smoke tests without unsafe test transactions or customer data.
- [ ] Run the pilot with daily payment/order/KOT/subscription reconciliation and defect triage.
- [ ] Measure QR/menu performance, payment conversion, paid-without-order count, KOT delays, notification delivery, Support volume, and error rates.
- [ ] Resolve pilot launch blockers and obtain pilot restaurant, Product, Engineering, Operations, Security, Support, and Finance approval.
- [ ] Execute the approved production rollout and communication plan.
- [ ] Verify post-launch dashboards, alerts, backups, reconciliation, Support routing, and rollback window.
- [ ] Transfer architecture, code, infrastructure, provider, data, security, Support, finance, release, and incident documentation to operational owners.
- [ ] Schedule the first post-launch review and record deferred improvements without changing launch evidence.

#### Exit criteria

- [ ] Pilot success criteria pass and rollback is not required or is completed safely.
- [ ] Production launch is approved, completed, monitored, reconciled, and handed over.
- [ ] Phase 4 status is changed to Complete with release evidence and known limitations.

### Production Launch Gate

- [ ] All Stage 4.0–4.12 exit criteria are complete.
- [ ] Provider production onboarding, signed callbacks, domains, secrets, reconciliation, and finance ownership are verified.
- [ ] Tenant isolation, authorization, payment/order atomicity, idempotency, backup/restore, and incident drills pass.
- [ ] Privacy, security, accessibility, performance, browser/device, Support, and operational approvals are recorded.
- [ ] No unresolved critical/high defect or unaccepted launch risk remains.
- [ ] Final production change approval is recorded.

### Phase 4 Completion Summary

| Development stage | Status | Evidence |
|---|---|---|
| 4.0 Decisions and Governance | Complete | `production-decisions.md`, `development/stage-4.0-policy-resolution.md` |
| 4.1 Engineering and Environment Foundation | In progress | Stage 4.1A complete: `development/stage-4.1-verification.md`; Stage 4.1B deferred |
| 4.2 Database, Tenancy, Audit, and Idempotency | In progress | First schema slice verified: `development/stage-4.2-verification.md` |
| 4.3 Identity and Authorization | Not started | Pending |
| 4.4 Restaurant Onboarding, Configuration, Catalog, and QR | Not started | Pending |
| 4.5 Customer Entry, Menu, Cart, and Checkout Draft | Not started | Pending |
| 4.6 Customer Payments, Orders, KOT, Cancellation, and Refunds | Not started | Provider/policy gated |
| 4.7 Realtime Fulfillment, Notifications, Games, and Rewards | Not started | Pending |
| 4.8 History, Reports, Support, Platform, and Data Operations | Not started | Pending |
| 4.9 Restaurant Subscriptions and UPI AutoPay | Not started | Provider/policy gated |
| 4.10 Migration and Full Acceptance | Not started | Pending |
| 4.11 Security, Compliance, and Operational Readiness | Not started | Pending |
| 4.12 Pilot, Launch, and Handover | Not started | Pending |

**Production development completion:** In progress — Stage 4.0 and local Stage 4.1A are complete; Stage 4.2 is the active local implementation stage; Stage 4.1B cloud deployment remains a mandatory pre-pilot gate.

## Status Update Procedure

When work progresses:

1. Change the active item from `[ ]` to `[-]`.
2. Mark an item `[x]` only after implementation and appropriate verification.
3. Mark the stage Complete only when every required item and exit criterion in that stage is `[x]`.
4. Update the Overall Status and Completion Summary after each completed stage.
5. Preserve the stakeholder-approved prototype status while production development progresses.
6. Mark Phase 4 Complete only after every Stage 4.0–4.12 exit criterion and the Production Launch Gate are `[x]`.
7. Add direct evidence links, test results, owner, decision references, and release identifiers whenever a production item is completed.
8. Update `development/current-handoff.md` after every meaningful checkpoint, blocker, stage transition, or deferred-gate change by following `development/stage-resume-protocol.md`.
9. Ensure the handoff names the first unchecked worksheet item, the last verified command/result, the next safe action, and anything that must not be inferred as complete.
10. Before ending a work session, run the resume-integrity checks defined in the stage-resume protocol and remove stale stage language from the documentation.
