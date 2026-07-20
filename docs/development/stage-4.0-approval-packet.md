# Autoserve Stage 4.0 Approval Packet

## Purpose

This packet consolidates the production decisions that require stakeholder action. It does not replace specialist legal, finance, security, or provider review. It provides recommended defaults so decisions can be accepted, amended, or rejected explicitly.

## How to Approve

For each batch, respond with one of:

- `Approve Batch A as recommended.`
- `Approve Batch A except: ...`
- `Do not approve Batch A; revise: ...`

Approvals will be recorded with date and approver role in `../production-decisions.md`. Proposed technical and policy records become Confirmed/Accepted only after their required approvers are named.

## Batch A — Ownership, Scope, and Architecture

**Product approval recorded:** 20 July 2026. The current stakeholder is recorded as Product Owner and final product stakeholder approver. Specialist owners remain TBD, so technical and infrastructure ADR acceptance is still pending.

### A1. Stakeholder authority

Recommended decision:

- The current stakeholder acts as Product Owner and final product acceptance authority.
- Technical, Security/Privacy, Finance/Billing, Operations, Support, Infrastructure, QA, and Design owners remain `TBD` until named.
- A `TBD` owner prevents completion of controls requiring that specialist's approval; it does not allow the Product Owner to silently approve technical/security/legal claims on their behalf.

### A2. First-release scope

Recommended decision: approve the Included/Deferred boundary in `../development-plan.md`, including responsive web/PWA, all six roles, QR/table/counter ordering, real food payment/KOT, fulfillment, Support, Super Admin, real restaurant subscription billing, games/rewards, reports, notifications, and tenant data operations.

Key consequence: real subscription billing adds significant provider, finance, entitlement, Support, and launch-test scope. If launch speed becomes the priority, it should be explicitly moved to a later production release rather than partially implemented.

### A3. Architecture

Recommended decisions:

- TypeScript modular monolith.
- Next.js/React web, NestJS API, BullMQ worker.
- PostgreSQL/Prisma source of truth with restaurant ID and RLS.
- Redis/BullMQ for cache/jobs; Socket.IO for realtime acceleration with API resync.
- One protected monorepo and shared contracts.
- No microservices or native apps in the first release.

### A4. Cloud baseline

Recommended decision: AWS Mumbai primary region with isolated development, staging, and production environments; managed PostgreSQL, Redis, S3, CDN/TLS, secrets, and container compute. Exact service products and topology remain a Technical/Infrastructure ADR.

### Batch A approval statement

```text
I am the Product Owner and final product stakeholder approver; specialist owners are TBD until named. I approve Batch A as recommended: the first-release scope, TypeScript modular-monolith architecture, monorepo, Next.js/NestJS/PostgreSQL/Prisma/Redis/BullMQ/Socket.IO stack, responsive web/PWA-first delivery, and AWS Mumbai baseline.
```

## Batch B — Reliability, Identity, Privilege, and Data

**Product approval recorded:** 20 July 2026. Reliability targets and the identity/authorization/data-handling direction are approved as the production baseline. Exact session, retention, legal, compliance, and specialist acceptance gates remain open.

### B1. Proposed service and recovery objectives

Recommended starting targets for pilot review, not contractual SLA:

- Monthly application availability target: 99.9% excluding approved maintenance.
- Critical ordering API p95 target: 500 ms under agreed normal load, excluding external provider interaction.
- Public menu p75 Largest Contentful Paint target: 2.5 seconds on the agreed mobile test profile.
- RPO: 15 minutes for PostgreSQL business data.
- RTO: 4 hours for severe regional/service recovery during initial pilot.
- Automated database backup plus point-in-time recovery where supported; quarterly restore drill before launch, increasing with risk/scale.
- Export artifacts expire automatically within a short approved window; suggested maximum 24 hours.

These values require Technical/Infrastructure/Product approval and cost validation.

### B2. Identity and sessions

Recommended policy:

- Secure server sessions in HTTP-only cookies; no browser-readable production auth token.
- Customer email/mobile account plus customer-only Google OAuth.
- MFA required for Restaurant Admin, Support, and Super Admin.
- Staff uses verified account credentials; step-up action-bound delegation for cancellation and any elevated action. Decide whether Staff MFA is required during pilot based on device model and risk review.
- Recent reauthentication for Staff management, PIN/security change, exports, restore/reset/deletion, restaurant suspension, plan/rate publication, subscription cancellation/manual reconciliation, and licence decisions.
- Immediate session revocation after deactivation, password/recovery compromise, or privilege removal.

Open values: exact factor types, idle/absolute durations, concurrent-device policy, and recovery channels.

### B3. Authorization boundaries

Recommended decision: approve `authorization-matrix.md` as the policy baseline—deny by default, tenant/membership/capability checks, Support purpose limitation, Super Admin exceptional tenant access only, RLS as second boundary, and action-bound Staff delegation instead of a shared daily production token.

### B4. Data governance

Recommended decision: approve the classification and handling baseline in `data-governance.md`, including:

- No storage of complete payer instruments.
- Secrets only in managed secret storage.
- Private licence/export storage.
- No sensitive payloads in logs/analytics.
- Canonical allowlisted imports; no prototype credentials or sessions.
- Tenant export separated from infrastructure backup.

Retention periods, legal bases, customer rights response times, audit duration, and vendor terms remain open for qualified owner/legal review.

### Batch B approval statement

```text
Approve Batch B as the proposed production baseline, including the pilot reliability targets, secure server sessions, Customer-only Google OAuth, mandatory MFA for Admin/Support/Super Admin, action-bound Staff delegation, deny-by-default authorization matrix, RLS tenant boundary, and data-classification/handling rules. Exact session factors/durations, retention periods, and legal requirements remain gated for specialist approval.
```

## Batch C — Payments, Subscription, Notifications, Support, and Pilot

**Product approval recorded:** 20 July 2026. Provider evaluation, financial architecture, paid-through entitlement, communications, verified Guest Support, and controlled-pilot direction are approved. Provider selection and the listed finance, tax, grace, proration, SLA, consent, and specialist gates remain open.

### C1. Payment provider evaluation

Recommended decision:

- Evaluate Cashfree first for both customer payments and UPI AutoPay to reduce provider/reconciliation complexity.
- Do not mark provider selection Confirmed until merchant/KYC eligibility, sandbox access, API/webhook version, fees, settlement, refunds, UPI AutoPay capability, data terms, support, and exit/export are verified.
- Maintain a documented fallback evaluation if Cashfree cannot meet required terms.

### C2. Food-payment baseline

Recommended policy:

- Backend creates payment session.
- Only signed/authenticated provider success creates an order.
- Payment/order/KOT/token/outbox commit once in one database transaction.
- Pending/failure/cancel does not allocate token/KOT.
- Verified payment without order enters immediate reconciliation and critical alert.
- Refund is not marked successful before provider confirmation.

Open: capture timing, pending timeout, refund eligibility/cutoff, settlement ownership, disputes, GST/tax, invoice numbering, and retention.

### C3. Subscription baseline

Recommended policy:

- Entitlement comes from confirmed paid-through period, not mandate status alone.
- Successful initial/renewal payment stores immutable plan/rate/feature snapshot.
- Cancellation stops future renewal while paid access remains through period end.
- Referenced plans are retired, not destructively deleted.
- Proposed seven-day payment-failure grace period: full operational access for existing restaurant service with warnings, then approved read-only/restricted behavior; active paid customer orders must remain fulfillable.
- Upgrades take effect immediately only if an approved provider/payment/proration transaction succeeds; downgrades take effect next period by default.

The grace duration, restriction behavior, proration/credit, retries, tax/invoice, and manual reconciliation require Product/Finance/Operations approval.

### C4. Communications and Support

Recommended policy:

- In-app realtime is primary for live order state.
- Email for account, approval, billing, Support, and durable receipts where approved.
- SMS for verified mobile/recovery and high-value time-sensitive notices where consent/template rules permit.
- WhatsApp deferred from first release unless explicitly approved.
- Guest Support recovery uses reference plus verified contact; reference alone is insufficient.
- Support is purpose-limited and cannot directly perform restaurant/financial/platform mutations.

Provider choices and SLA targets remain open.

### C5. Pilot and release control

Recommended policy:

- Small controlled pilot cohort.
- Feature flags for provider and entitlement rollout.
- Daily payment/order/refund/subscription reconciliation during pilot.
- Defined rollback authority and no-go thresholds before onboarding.
- No broad launch until tenant, payment, restore, security, accessibility, performance, and incident gates pass.

### Batch C approval statement

```text
Approve Batch C as the policy direction: evaluate Cashfree first without declaring selection until due diligence passes; use provider-verified transactional food payments; use paid-through subscription entitlement, period-end cancellation and plan retirement; use in-app/email/SMS with WhatsApp deferred; require verified Guest Support recovery; and launch through a controlled reconciled pilot. Open finance, tax, retention, provider, grace, proration, SLA and Support details remain gated for their accountable owners.
```

## What Approval Does and Does Not Do

Approval of a batch:

- Confirms the stated baseline and allows dependent design/implementation planning.
- Does not complete provider onboarding, legal review, threat-model approval, penetration testing, or production readiness.
- Does not let a `TBD` specialist owner be treated as having signed off.
- Does not mark Stage 4.0 complete while its worksheet exit criteria remain open.

## Recommended Approval Order

1. Batch A now, because it unblocks repository/environment design.
2. Batch B after reviewing reliability cost and identity operational fit.
3. Batch C after Finance/Operations and provider due diligence begins.
