# Autocode Prototype Worksheet

## Status Legend

- `[ ]` Not started
- `[-]` In progress
- `[x]` Complete
- `[!]` Blocked

## Overall Status

**Prototype status:** In progress  
**Completed major phases:** 2 of 3  
**Current major phase:** Phase 3 — Prototype Design and Implementation  
**Overall completion rule:** The prototype is complete only when every required phase and acceptance checkpoint in this worksheet is marked `[x]`.

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

**Status:** `[-] In progress`

Phase 3 is divided into implementation stages. Each stage must be completed in order unless its dependencies permit safe parallel work.

### Stage 3.1 — Application Foundation

**Status:** `[-] In progress — implementation complete, user verification pending`

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

- [ ] Both customer and restaurant shells load with seeded persistent state.
- [ ] Shared design and state foundations are reusable by later stages.

### Stage 3.2 — Shared Authentication

**Status:** `[-] In progress — implementation complete, user verification pending`

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

#### Exit criteria

- [ ] Guest, customer, Admin, and Staff entry paths behave according to `requirement.md`.

### Stage 3.3 — Customer Menu and Cart

**Status:** `[-] In progress — implementation complete, user verification pending`

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

#### Exit criteria

- [ ] A guest or signed-in customer can build and retain a valid customized cart.

### Stage 3.4 — Customer Checkout, Payment, and Token

**Status:** `[-] In progress — implementation complete, user verification pending`

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

#### Exit criteria

- [ ] Successful payment creates exactly one paid order, inventory deduction, and token.
- [ ] Non-successful payment does not create or deduct an order.

### Stage 3.5 — Restaurant Live Operations

**Status:** `[-] In progress — implementation complete, user verification pending`

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

#### Exit criteria

- [ ] Staff can fulfill a paid order through the complete approved sequence.
- [ ] Customer and restaurant views remain consistent.

### Stage 3.6 — Customer Tracking, Game, and Reward

**Status:** `[-] In progress — implementation complete, user verification pending`

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

#### Exit criteria

- [ ] Eligible wins issue at most one available current-order reward.
- [ ] Guests can play but cannot receive an offer.

### Stage 3.7 — Menu and Inventory Administration

**Status:** `[-] In progress — implementation complete, user verification pending`

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

#### Exit criteria

- [ ] Approved menu changes and inventory changes update customer availability safely.

### Stage 3.8 — Cancellation, History, and Reports

**Status:** `[-] In progress — implementation complete, user verification pending`

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

#### Exit criteria

- [ ] Cancellation and reopening follow permissions and audit rules.
- [ ] History and reports reconcile with stored order data.

### Stage 3.9 — Profiles, Staff, Settings, and Help

**Status:** `[-] In progress — implementation complete, user verification pending`

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
- [x] Implement role-aware customer and restaurant Help/FAQ views.
- [x] Implement shared Support forms for Guest, Customer, Admin, Staff, and Super Admin.
- [x] Implement requester-visible recent Support requests and replies.
- [x] Implement required empty and recovery states.

#### Exit criteria

- [ ] Profile, account, configuration, reorder, and help workflows match approved permissions.

### Stage 3.10 — Data Management

**Status:** `[-] In progress — implementation complete, user verification pending`

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

- [ ] Export, import, backup, restore, purge, and reset preserve data safety requirements.

### Stage 3.11 — Integration and Quality Verification

**Status:** `[-] In progress — automated verification complete, browser/user acceptance pending`

- [ ] Verify the complete guest customer journey.
- [ ] Verify the complete signed-in and rewarded customer journey.
- [ ] Verify the complete Staff fulfillment journey.
- [ ] Verify Staff cancellation with the current daily administrative token.
- [ ] Verify the Admin management journey.
- [ ] Verify data backup and recovery journey.
- [x] Verify duplicate-action protection for payment, token, stock, reward, and cancellation.
- [x] Verify cross-tab state synchronization.
- [x] Verify responsive mobile, tablet, and desktop layout structure; browser visual acceptance pending.
- [x] Verify keyboard navigation, focus behavior, labels, and contrast structure; browser interaction acceptance pending.
- [x] Verify loading, empty, failure, conflict, and recovery states.
- [x] Verify no inaccessible Admin actions are exposed to Staff.
- [x] Verify Super Admin and Support route protection and seeded prototype credentials.
- [x] Verify Support submissions connect every Help workspace to the centralized request queue.
- [x] Verify compact mobile game navigation and practice-game reward isolation.
- [x] Resolve critical and high-severity defects found by automated and source-level verification.

#### Automated verification evidence

- `node --test tests/prototype-integration.test.js`
- Repository-wide `node --check` for every file in `assets/js/`
- Resolved stale local customer cart/checkout rendering after reorder and other same-tab state changes.

#### Exit criteria

- [ ] Every acceptance journey in `requirement.md` passes.
- [ ] No unresolved critical or high-severity defects remain.

### Stage 3.12 — Final Prototype Review

**Status:** `[ ] Not started`

- [ ] Compare all screens against the approved inspiration theme.
- [ ] Review the implementation against `requirement.md`.
- [ ] Confirm all worksheet items are complete or explicitly removed through an approved requirement change.
- [ ] Confirm seeded data demonstrates every major workflow.
- [ ] Confirm prototype limitations are visible where relevant.
- [ ] Complete final user review.

#### Exit criteria

- [ ] Phase 3 is approved.
- [ ] Overall prototype status is changed to Complete.

---

## Completion Summary

| Major phase | Status | Evidence |
|---|---|---|
| Phase 1 — Inspiration Design | Complete | `design_template/index.html` |
| Phase 2 — Requirements Definition | Complete | `requirement.md` |
| Phase 3 — Prototype Design and Implementation | In progress | Stage 3.1 awaiting user verification |

**Prototype completion:** Not complete — Phase 3 remains.

## Status Update Procedure

When work progresses:

1. Change the active item from `[ ]` to `[-]`.
2. Mark an item `[x]` only after implementation and appropriate verification.
3. Mark the stage Complete only when every required item and exit criterion in that stage is `[x]`.
4. Update the Overall Status and Completion Summary after each completed stage.
5. Mark the prototype Complete only after all three major phases and the final prototype review are `[x]`.
