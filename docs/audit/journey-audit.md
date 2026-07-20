# Autoserve Virtual User-Journey Audit

Audit date: 20 July 2026  
Scope: Current prototype behavior only; this audit does not propose new product scope.  
Method: Source-level walkthrough of seeded state, routes, role guards, mutations, recovery paths, documentation, and automated integration assertions.

## Outcome

The primary prototype journeys are connected and demonstrable. No source-level blocker was found for the intended local demo. The remaining gaps are either production boundaries already excluded from the browser prototype or continuity/decision gaps that should be resolved before the corresponding journey is considered production-ready.

## Journey Map

| Journey | Result | Main handoff or bottleneck |
|---|---|---|
| Guest QR → menu → order → payment → game → ready | Connected | Guest identity and history remain browser/session-specific by design. |
| Customer sign-in/sign-up → saved ordering and rewards | Connected | Google is a shared simulated customer, not real OAuth identity. |
| Customer payment Pending → resolution | Connected | Resolution is local simulation rather than provider reconciliation. |
| Restaurant company onboarding → Super Admin approval | Virtually accepted | After approval, the restaurant remains safely closed with cloned items unavailable; the existing Admin settings, availability, subscription, and QR routes form the documented manual activation sequence. |
| Staff KOT fulfillment and delegated cancellation | Connected | Depends on receiving the current daily administrative token out of band from an Admin. |
| Admin settings → table/counter QR → customer table prefill | Connected | Camera and printable QR behavior still require browser/device acceptance testing. |
| Admin subscription selection → monthly billing | Demonstrable simulation | Real UPI AutoPay mandate setup, callbacks, automatic collection, cancellation, and reconciliation are not implemented. |
| Super Admin plan-rate edit → Restaurant plan display | Connected | Entitlements and Staff limits shown in plan features are descriptive, not enforced. |
| User Help form → Support reply → resolution | Virtually accepted | Guest Support is explicitly same-local-identity assistance in the prototype; cross-device recovery is deferred to production identity design. |
| Support queue → assignment → response → close/reopen | Connected | Single local queue has no production concurrency, SLA, or notification delivery. |
| Multi-tab customer/restaurant synchronization | Connected for state updates | All tabs share one `activeSession`; signing into another role in the same browser can replace the session context globally. |
| Export/import/reset recovery | Virtually accepted | Validation covers current Support, authorization, and subscription collections; Restaurant Admin replacement and reset preserve platform and other-tenant state. |

## Confirmed Strengths

- Role destinations and route guards exist for Customer, Guest, Admin, Staff, Super Admin, and Support.
- Restaurant approval is checked both during sign-in and Restaurant workspace initialization.
- Customer order creation remains dependent on successful payment and guards duplicate submission.
- KOT/token, availability, cancellation, reward, and history changes use stable stored records.
- Daily Staff authorization tokens expire and protected attempts are audited.
- Support requests retain references, roles, restaurant context, messages, priority, and status.
- Subscription payments retain plan price-and-feature snapshots when rates later change.
- Password creation/replacement uses confirmation; password-like inputs have visibility controls.
- Responsive route menus, mobile drawers, compact game selection, and outside-click dropdown dismissal are represented in shared behavior.

## Gaps and Decisions

### G1 — UPI AutoPay is not a real mandate lifecycle

Priority: Production blocker; acceptable prototype limitation.

The Restaurant billing dialog records simulated Success, Pending, or Failure and sets `autoRenew`, but it does not create or verify a provider mandate. No real recurring debit occurs.

Required decision: Select a payment provider and backend design before billing can move beyond prototype status. Follow `../subscription-billing.md`; do not treat `autoRenew: true` as evidence of an active UPI AutoPay mandate.

### G2 — Subscription status does not enforce Restaurant access or plan entitlements

Priority: High before paid production use.

An inactive or expired subscription is displayed, but Restaurant operations remain available. Plan feature text and `staffLimit` values do not gate routes or account creation.

Required decision: Define grace period, read-only behavior, operational exceptions, and entitlement mapping before enforcement. Avoid adding ad hoc route checks until those rules are approved.

### G3 — Subscription Pending has no resolution or reconciliation path

Priority: High for billing integrity.

A simulated Pending subscription attempt remains in history and never resolves. Customer order payments already have a local resolution control, but subscription billing does not.

Required decision: In production, provider callbacks must be the source of truth. For later prototype acceptance, decide whether Pending should remain a terminal demonstration state or receive an explicit simulator resolution.

### G4 — Subscription privacy and masking — Resolved for prototype

Priority: Production privacy requirement; prototype hardening complete.

The prototype now stores only a masked payer display value and simulated provider mandate reference in subscription and payment records. Raw submitted UPI IDs are not retained after the local simulation.

Remaining production rule: never use real payer data in the prototype, and let the approved provider own sensitive payment instruments in production.

### G5 — Removed active-plan label — Resolved for prototype

Priority: Resolved display behavior; production catalog policy remains open.

Restaurant Settings falls back to the subscription's stored `planName`, and payment history uses immutable price-and-feature snapshots when a catalog plan is later removed.

Remaining production decision: prefer retiring referenced plans and define how existing subscribers are migrated.

### G6 — Plan-change timing is underspecified

Priority: Medium.

The prototype extends any successful payment from the existing paid-through date, including a switch to another plan. It does not define immediate upgrades, scheduled downgrades, credits, or proration.

Required decision: Confirm that all plan changes take effect next period, or document approved upgrade/downgrade rules before production billing.

### G7 — New Restaurant handoff after approval is safe but fragmented

Priority: Medium usability bottleneck.

Onboarding creates a closed restaurant with cloned menu items unavailable. Approval allows sign-in, after which the Admin must configure availability, profile/service preferences, subscription, and QR entry across separate settings.

Required decision: Keep the safe defaults. During browser acceptance, verify that the existing dashboard/settings cues are sufficient; document the manual activation sequence if no guided flow is desired.

### G8 — Guest Support continuity is fragile

Priority: Medium.

Guest tickets are attached to a generated guest ID. Signing out, starting another guest session, resetting state, or switching devices prevents the Guest from seeing the earlier request even if a contact value was supplied.

Required decision: Treat Guest Support as same-session assistance in the prototype. Production recovery needs authenticated identity or reference-plus-contact verification.

### G9 — One Local Storage session is shared across tabs

Priority: Medium prototype constraint; high if mistaken for multi-user behavior.

The complete prototype state contains one `activeSession`. Signing in as a different role in another tab changes that shared state, which can make simultaneous role demonstrations confusing.

Required decision: Use separate browser profiles/incognito contexts for parallel role acceptance. Production sessions must be server-backed and isolated per authenticated client.

### G10 — Import validation for recent collections — Resolved

Priority: Resolved in Stage 3.10.

Restaurant exports and imports require current Support, authorization, and subscription collections. Platform settings are deliberately excluded from Restaurant Admin replacement scope, while other restaurants and platform state are preserved.

Verification: the functional tenant-isolation test imports a selected-restaurant snapshot while preserving a second restaurant, its backups, and platform settings.

### G11 — Practice games reset on refresh

Priority: Low; acceptable current behavior.

Reward-eligible Tic-Tac-Toe persists its attempt and board. Memory Match, Tap Rush, and Ludo Race are practice-only and reset on refresh or navigation.

Decision recorded: This is consistent with their unlimited, non-reward role unless browser acceptance identifies user confusion.

### G12 — Dynamic enhancement dependency

Priority: Low for the JavaScript-required SPA.

Password confirmations, strong-password controls, Ludo, subscription sections, and Super Admin subscription Settings are inserted by JavaScript. If script loading fails, these enhancements are unavailable rather than progressively rendered.

Decision recorded: JavaScript is a core technical requirement. Error-state/browser testing should still verify that failures do not submit unsafe partial forms.

## Acceptance Order

To minimize rework, perform remaining manual acceptance in this order:

1. Use separate browser profiles for each role.
2. Complete restaurant onboarding and Super Admin approval.
3. Complete Admin setup: availability, service/table settings, subscription simulation, and QR generation.
4. Run Guest and Customer ordering journeys, including failed and Pending order payment.
5. Run Staff fulfillment and daily-token cancellation.
6. Verify Support request/reply continuity for signed-in and Guest users.
7. Exercise Super Admin rate changes and confirm historical payment snapshots remain unchanged.
8. Recheck export/import/reset with Support and subscription data during final user review; virtual tenant-isolation acceptance is complete.
9. Complete mobile/tablet/desktop visual and keyboard checks.

## Documentation Rule

Items marked as production blockers must remain described as limitations until their underlying provider/backend behavior exists. Documentation must not present simulated Google, UPI, UPI AutoPay, refunds, notifications, or Local Storage authorization as production integrations.
