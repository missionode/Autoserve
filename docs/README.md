# Autoserve Prototype

Autoserve is a browser-based restaurant ordering, KOT, fulfillment, administration, and customer waiting-game prototype. It uses HTML, vanilla JavaScript, Tailwind’s browser package, and versioned Local Storage; no backend or production payment provider is required.

## Workspaces

- `customers/` — guest and signed-in ordering, QR entry, digital menu, checkout, tracking, receipts, Help, and games.
- `restaurants/` — Admin and Staff operations, KOT queue, availability, menu management, reports, settings, branded QR cards, and data tools.
- `super_admin/` — platform dashboard, restaurant approval, restaurant directory, user management, activity, and Help.
- `support/` — centralized support metrics, searchable request queue, threaded replies, resolution, and activity.
- Root pages — shared login, customer registration, restaurant company onboarding, recovery, and role routing.

## Current Prototype Highlights

- Table and pickup-counter QR entry with printable restaurant branding, logo, complaint contact, and Autoserve identity.
- Restaurant-configurable dine-in modes, table numbers, service preference, digital-menu combos, rewards, and daily administrative token.
- Realistic item availability states: Available, Limited, Temporarily unavailable, and Sold out for today.
- Fast ordering through Quick add defaults, customization, persistent order review, simulated UPI payment, KOT creation, token tracking, and meal-ready timer.
- Waiting Game corner with reward-eligible Tic-Tac-Toe plus practice-only Memory Match, Tap Rush, and Ludo Race.
- Support forms in Customer, Guest, Admin, Staff, and Super Admin Help views, connected to the Support workspace.
- Super Admin-managed monthly restaurant plans, Restaurant Admin billing, renewal status, and immutable price-snapshot history. The local prototype simulates payment; production recurring billing must use a provider-backed UPI AutoPay mandate.
- Customer-only simulated Google sign-in/sign-up, plus shared password visibility, confirmation, strength feedback, and strong-password generation controls.
- Responsive desktop, tablet, and mobile navigation with compact icon CTAs and aligned mobile header actions.
- Seeded operational history, support conversations, restaurant data, users, orders, payments, cancellations, and rewards.

## Run Locally

Serve the repository root on port 8000, then open:

```text
http://localhost:8000/login.html
```

Prototype credentials and routing are documented in `authentication.md`.

Subscription ownership, UPI AutoPay requirements, records, and prototype limitations are documented in `subscription-billing.md`.

The recommended post-prototype production architecture, stack, design rules, deployment progression, and remaining development decisions are documented in `technology-recommendation.md`.

The complete production delivery roadmap—including architecture, domains, data model, API conventions, security, payments, testing, infrastructure, migration, risks, launch gates, and ownership—is documented in `development-plan.md`.

Cross-role journey coverage, current bottlenecks, and the recommended acceptance order are documented in `audit/journey-audit.md`.

The completed Stage 3.11 virtual engineering run and its journey-by-journey evidence are documented in `audit/stage-3.11-virtual-acceptance.md`.

The final theme, requirements, seed-data, limitation, and freeze-readiness review is documented in `audit/final-prototype-review.md`. The prototype freeze is stakeholder-approved and Complete.

Production execution is tracked separately in Phase 4 of `worksheet.md`. Stage 4.0 is complete, and Stage 4.1 Engineering and Environment Foundation is in progress.

Stage 4.0 owners, proposed baselines, open decisions, provider/policy gates, risks, ADR queue, and approval records are maintained in `production-decisions.md`.

Initial Stage 4.0 review artifacts are maintained under `development/`: the production threat model, authorization matrix, data-governance proposal, and proposed architecture decisions.

Stakeholder decisions are grouped into reviewable scope/architecture, identity/data, and provider/operations batches in `development/stage-4.0-approval-packet.md`.

Cashfree-first payment and UPI AutoPay evaluation requirements, evidence, scorecard, sandbox scenarios, and selection gate are documented in `development/provider-due-diligence.md`; no provider is selected yet.

The ratified exact Stage 4.0 internal policies and their provider/legal exceptions are recorded in `development/stage-4.0-policy-resolution.md`.

Stage 4.1 local verification, remaining cloud evidence, engineering rules, and incident-development rules are recorded in `development/stage-4.1-verification.md`, `development/engineering-standards.md`, and `development/incident-development.md`.

## Verification

```sh
node --test tests/*.test.js
npm run verify
npm run test:failure-gates
```

The prototype is intentionally client-side. Authentication, authorization secrets, payments, refunds, notifications, camera scanning, and persistence are simulations and must not be treated as production security or infrastructure. Restaurant subscription billing does not create a real UPI mandate; production must integrate UPI AutoPay through an approved payment provider and process mandate/payment callbacks server-side.
