# Stage 3.11 Virtual Acceptance Record

Audit date: 20 July 2026  
Scope: Autoserve browser prototype  
Method: executable integration tests, versioned-state inspection, route and role-guard inspection, mutation-path walkthrough, recovery-path walkthrough, and documentation reconciliation.

## Acceptance Boundary

This is a virtual engineering acceptance run requested for the prototype. It verifies that the required screens, guards, state transitions, safety checks, and recovery paths are connected in source and covered by automated assertions. It is not evidence of testing on physical phones, tablets, cameras, printers, assistive technologies, or real payment infrastructure. Those remain final visual/user review activities or documented production integrations.

## Journey Results

| Journey | Virtual path exercised | Result | Evidence |
|---|---|---|---|
| Guest customer | QR/guest entry → restaurant menu → Quick add/customize → table or takeaway checkout → simulated payment → KOT/token → waiting game → ready tracking | Pass | Guest session and restaurant context, checkout invariants, KOT generation, timer, and service-aware ready messaging assertions |
| Signed-in customer and reward | Sign in → persistent cart/profile → paid order → one eligible Tic-Tac-Toe attempt → inventory-safe reward → receipt/history/reorder | Pass | Customer account, immutable paid snapshot, one-attempt reward, reward fallback, history, and reorder assertions |
| Staff fulfillment | Staff sign in → chronological paid queue → accept → prepare → ready → verify service → delivered → history | Pass | Role guards, transition map, stale-write conflict checks, KOT status, timeline, and current-session history assertions |
| Staff cancellation | Open active order → reason → current daily administrative token → restoration decision → cancellation/refund → retired token | Pass | Token expiry/reload, restaurant-scoped Admin authorizer, rate limiting, concurrency recheck, idempotent restoration, refund, and cancellation audit assertions |
| Admin management | Dashboard → menu/availability/inventory → Staff/settings/rewards/combos → reports/history → QR → subscription simulation → data tools | Pass | Admin-only route and mutation guards, tenant scoping, conflict validation, immutable reporting, QR branding, and simulated billing assertions |
| Data recovery | Export → non-mutating validation → integrity summary → pre-import backup → confirmed replacement/restore → rollback/purge/reset | Pass | Functional second-tenant isolation test plus schema, digest, confirmation, rollback, scoped purge, credential, and seeded-reset assertions |
| Restaurant approval and activation | Company application → Pending → denied sign-in → Super Admin licence review/approval → Admin sign-in → closed safe defaults → settings/availability/QR activation | Pass with documented manual sequence | Onboarding, approval guards and audit, closed status, unavailable cloned items, Admin configuration routes, and QR assertions |
| Guest Support continuity | Guest Help submission → stable reference → centralized queue → Support response → recent requests for same guest identity | Pass within prototype boundary | Requester identity/reference storage, Support queue and reply assertions; continuity is intentionally limited to the same local guest identity |
| Responsive and keyboard structure | Desktop navigation, mobile icon drawer, mobile action distribution, fixed order CTA, dialogs, labels, focus and Escape/outside-click behavior | Pass for virtual structure | Shared responsive CSS/HTML and interaction assertions; physical viewport and assistive-technology review remains final acceptance |

## Safety and Quality Results

- Duplicate-sensitive payment, token, KOT, inventory, reward, cancellation, restoration, and subscription mutations contain explicit guards.
- Local and cross-tab writes notify subscribed views; invalid cross-tab state produces a recoverable state rather than being applied.
- Staff cannot see or invoke Admin-only routes and controllers.
- Restaurant data export, import, backup, restore, purge, and reset preserve other restaurants and platform state.
- Import validation requires current Support, authorization, and subscription collections and rejects foreign-restaurant records.
- Paid order and subscription history use immutable price/feature snapshots.
- Pending and failed simulated payments do not silently create paid orders or paid subscription periods.
- Source-level review found no unresolved critical or high-severity prototype defect.

## Deferred Production Decisions

The following do not block prototype freeze and must be decided during production development:

- Subscription grace period, read-only/access enforcement, and plan-entitlement mapping.
- Upgrade, downgrade, proration, credit, retry, cancellation, and removed-plan policy.
- Real UPI/UPI AutoPay provider onboarding, backend callbacks, reconciliation, settlement, and dispute handling.
- Production guest Support recovery across devices or after local identity loss.
- Server-backed multi-user sessions, durable realtime delivery, notification providers, retention, and recovery objectives.

These questions are tracked in `../subscription-billing.md` and `../technology-recommendation.md`.

## Automated Evidence

```text
node --test tests/*.test.js
48 tests passed, 0 failed
```

Every JavaScript file under `assets/js/` also passes `node --check`, and `git diff --check` reports no whitespace errors.

## Conclusion

Stage 3.11 passes virtual prototype acceptance. Physical-device presentation, real camera/print behavior, and final stakeholder approval remain in Stage 3.12; production integrations remain explicitly deferred until after prototype freeze.

