# Autoserve Production Development Plan

## 1. Document Status

- Product: Autoserve
- Input baseline: stakeholder-approved browser prototype freeze
- Development status: In progress — Stage 4.0 Decisions and Governance
- Delivery model: TypeScript modular monolith
- Primary stack: Next.js, NestJS, PostgreSQL, Prisma, Redis/BullMQ, Socket.IO, Cashfree, and S3-compatible storage
- Companion documents: `requirement.md`, `technology-recommendation.md`, `subscription-billing.md`, and `worksheet.md`
- Active decision register: `production-decisions.md`

This plan converts the approved prototype into a secure, multi-tenant production application. The prototype remains the interaction and workflow reference, but its Local Storage, simulated authentication, simulated payments, and client-side authorization are not reused as production security or infrastructure.

## 2. Development Objective

Deliver a production-ready Autoserve platform in which:

- Guests and customers can enter a restaurant by store, counter, or table QR; browse a current menu; pay; receive a unique token/KOT; track preparation; and obtain receipts and Support.
- Staff can safely fulfill paid KOTs, manage availability, and perform explicitly delegated protected actions.
- Restaurant Admins can manage their restaurant, Staff, menu, service modes, QR cards, history, reports, data, and subscription.
- Super Admin can approve restaurants, manage platform users and plans, audit platform activity, and control operating access.
- Support can manage requests across permitted tenants without acquiring unrelated platform privileges.
- PostgreSQL is the transactional source of truth, tenant boundaries are enforced, critical mutations are idempotent, and production payments are provider-confirmed.

## 3. Scope Boundary

### Included in the first production release

- Responsive web/PWA experience for all approved roles.
- Server-backed authentication and role/tenant authorization.
- Restaurant onboarding, licence evidence, Super Admin approval, and activation.
- Restaurant settings, table/counter QR generation, branded print assets, menu, combos, availability, and Staff management.
- Guest and customer menu, cart, checkout, food payment, token/KOT, tracking, receipts, history, reorder, and Support.
- Staff KOT fulfillment, delayed-order alerts, availability, delegated cancellation, audit history, and reports.
- Customer waiting games with strictly isolated reward eligibility.
- Super Admin, Support, plan catalog, subscription billing, and UPI AutoPay.
- Notifications required for account, order, Support, and billing workflows.
- Tenant-scoped exports, backups, recovery operations, audit logs, observability, and operational runbooks.

### Deferred unless separately approved

- Native iOS or Android applications.
- Marketplace delivery integrations.
- POS, ERP, accounting, GST filing, or kitchen hardware integrations.
- Multi-region active-active deployment.
- Microservice decomposition.
- Advanced loyalty programs beyond the approved reward flow.
- AI recommendations, dynamic pricing, or demand forecasting.

## 4. Delivery Principles

1. Preserve the approved workflow while replacing simulations with backend-owned behavior.
2. Build tenant isolation and auditability before adding operational mutations.
3. Use database transactions and uniqueness constraints for payment/order/token/KOT consistency.
4. Treat provider callbacks and reconciliation as authoritative for payments and subscriptions.
5. Keep the modular monolith until measured scale or ownership boundaries justify separation.
6. Release behind environment and feature controls; do not mix incomplete billing with production access enforcement.
7. Automate the acceptance journeys from the prototype before pilot onboarding.
8. Record unresolved product, compliance, and operations decisions before implementing dependent features.

## 5. Target Architecture

```text
Browser / PWA
  Customer · Guest · Staff · Admin · Support · Super Admin
                         │
                    Next.js web
                         │ HTTPS / WebSocket
                    NestJS API
       ┌─────────────────┼──────────────────┐
       │                 │                  │
  PostgreSQL        Redis/BullMQ        S3 storage
  source of truth   cache/jobs/events   images/licences/exports
       │                 │                  │
       └──────── Cashfree / Google / notification providers
```

Deployable units:

- `web`: Next.js frontend and server-rendered public/menu entry.
- `api`: NestJS REST API, authentication, authorization, business transactions, WebSocket gateway, and provider callback endpoints.
- `worker`: BullMQ processors for notifications, reconciliation, delayed-order evaluation, exports, and scheduled maintenance.
- `database`: PostgreSQL schema and migrations.
- `redis`: queues, rate limits, short-lived cache, and realtime fanout.
- `object-storage`: restaurant/media/licence files and generated export artifacts.

## 6. Repository and Engineering Structure

```text
apps/
  web/
  api/
  worker/
packages/
  database/
  contracts/
  ui/
  authentication/
  authorization/
  configuration/
  observability/
  testing/
docs/
infrastructure/
```

Repository requirements:

- TypeScript strict mode and shared lint/format rules.
- Lockfile committed; dependency updates automated and reviewed.
- Environment variables validated at startup.
- API request/response contracts generated or shared from one schema source.
- Database migrations reviewed and tested forward and backward where rollback is supported.
- Protected main branch with required tests, review, and security checks.
- Conventional release tags and an auditable deployment history.

## 7. Domain Modules

The NestJS application should use modules with explicit ownership:

| Module | Responsibilities |
|---|---|
| Identity | Accounts, credentials, Google OAuth, sessions, verification, recovery, MFA policy |
| Authorization | Roles, restaurant membership, permissions, Staff delegation, platform access |
| Restaurants | Company profile, licences, approval, operating status, service modes, tables, counters, branding |
| Catalog | Categories, menu items, options, add-ons, combos, publishing, availability |
| Customer | Customer profile, restaurant-scoped preferences, history, consent |
| Cart | Server cart, guest continuity, price preview, availability checks, expiration |
| Checkout | Draft validation, totals, tax snapshots, payment-session creation |
| Payments | Food payment attempts, provider callbacks, reconciliation, refunds |
| Orders and KOT | Paid-order transaction, token/KOT allocation, immutable snapshots, lifecycle |
| Fulfillment | Queue, transitions, preparation, Ready/Delivered verification, delays |
| Cancellation | Authorization, reason, stock policy, refund, retired token, audit |
| Rewards and Games | Eligible attempts, board state, reward issuance, practice isolation |
| Notifications | Customer, Staff, Support, and billing message jobs and delivery history |
| Reporting | Operational aggregates, immutable financial inputs, exports |
| Support | Requests, assignment, replies, status, SLA fields, requester continuity |
| Subscriptions | Plans, mandates, recurring payments, entitlement state, reconciliation |
| Data Management | Tenant export, restore policy, retention, deletion, backup administration |
| Audit | Privileged actions, security events, provider events, correlation identifiers |
| Platform | Super Admin restaurant/user control, configuration, activity, feature controls |

Modules may call one another through application services and domain events, but must not bypass another module's invariants by writing its tables directly.

## 8. Core Data Model

All durable records use UUID/ULID-style identifiers, UTC timestamps, and explicit created/updated metadata. Restaurant-owned records include `restaurant_id` and suitable indexes.

### Identity and tenancy

- `users`
- `auth_identities`
- `sessions`
- `restaurants`
- `restaurant_memberships`
- `roles` and `permissions` or a versioned permission policy
- `restaurant_licences`
- `restaurant_tables`
- `pickup_counters`
- `approval_decisions`

### Catalog and ordering

- `categories`
- `menu_items`
- `menu_item_sizes`
- `menu_item_add_ons`
- `menu_item_availability`
- `combos` and `combo_items`
- `carts` and `cart_lines`
- `checkout_attempts`
- `payment_attempts`
- `orders` and `order_lines`
- `kots`
- `order_status_events`
- `cancellations` and `refunds`
- `availability_audits`

### Engagement, platform, and operations

- `game_attempts` and `reward_issues`
- `support_tickets`, `support_messages`, and `support_events`
- `subscription_plans`
- `restaurant_subscriptions`
- `payment_mandates`
- `subscription_payments`
- `notification_jobs` and `notification_deliveries`
- `audit_events`
- `idempotency_keys`
- `webhook_events`
- `export_jobs` and `restore_events`

### Required database safeguards

- Unique token/KOT allocation within the defined restaurant operating period.
- Unique provider transaction, webhook event, mandate, refund, and idempotency identifiers.
- Foreign keys for every domain relationship.
- Check constraints for money, quantities, statuses, and valid time ranges.
- Optimistic version columns on conflict-sensitive operational records.
- PostgreSQL Row-Level Security for tenant-owned tables, with tests proving default denial.
- Append-only or mutation-restricted history for paid snapshots, payment events, and audits.

## 9. API and Realtime Contract

### API conventions

- Versioned `/api/v1` routes.
- JSON request/response schemas with runtime validation.
- Consistent problem details containing safe message, error code, correlation ID, and field errors.
- Cursor pagination for large restaurant, order, payment, user, support, and audit lists.
- Idempotency header required for payment, order, cancellation, refund, reward, mandate, and other duplicate-sensitive requests.
- ETag/version or explicit record version required for conflict-sensitive updates.
- No role or `restaurant_id` is trusted merely because the browser submitted it.

### Initial API groups

- `/auth`, `/sessions`, `/account`
- `/restaurants`, `/restaurants/:id/approval`, `/restaurants/:id/settings`
- `/restaurants/:id/tables`, `/restaurants/:id/counters`, `/restaurants/:id/qr`
- `/restaurants/:id/menu`, `/restaurants/:id/categories`, `/restaurants/:id/availability`
- `/carts`, `/checkout`, `/payments`, `/payment-webhooks`
- `/orders`, `/kots`, `/orders/:id/transitions`, `/orders/:id/cancellation`
- `/games`, `/rewards`
- `/support`, `/support/:id/messages`
- `/plans`, `/subscriptions`, `/subscription-webhooks`
- `/reports`, `/exports`, `/audit-events`

### Realtime channels

- Restaurant KOT queue updates.
- Customer order-status updates.
- Availability and restaurant operating-state updates.
- Restaurant alerts and delayed-order updates.
- Support conversation updates where authorized.

Every event contains a stable event ID, aggregate ID, restaurant ID where applicable, type, version, and timestamp. Clients reconnect by fetching authoritative API state; WebSocket delivery is an acceleration, not the source of truth.

## 10. Identity, Authorization, and Security

### Identity

- Passwords hashed with an approved adaptive password hash.
- Sessions stored server-side and referenced by Secure, HTTP-only, SameSite cookies.
- Session rotation after sign-in, privilege change, password reset, and MFA completion.
- Customer-only Google OAuth with verified callback and account-linking rules.
- Email/mobile verification and recovery rules decided before launch.
- Staff/Admin MFA and sensitive-action reauthentication policy recorded during Stage 4.0.

### Authorization

- Deny by default.
- Role plus restaurant membership checked in the API for every protected request.
- Staff permissions use explicit capabilities; Admin delegation is scoped, expiring, revocable, and audited.
- Support access is case- and purpose-limited where practical.
- Super Admin actions require elevated policy, stronger authentication, and audit records.
- Database RLS complements API authorization and is never the only control.

### Application security

- CSRF protection for cookie-authenticated mutations.
- Strict CORS, security headers, content security policy, and upload validation.
- Rate limits on authentication, QR entry, Support, payments, callbacks, and protected actions.
- Secrets stored in a managed secret service and never exposed to clients or logs.
- Provider webhook signature validation uses the raw request body and pinned API version.
- Malware/type/size checks and private object storage for uploaded licence evidence.
- Dependency, secret, static-analysis, and container scans in CI.
- Security logging avoids passwords, complete payer instruments, tokens, and unnecessary personal data.

## 11. Payments, Orders, and KOT Transaction

### Customer payment flow

```text
Validate cart and restaurant availability
→ create checkout attempt and provider payment session
→ customer completes provider flow
→ backend receives/polls authenticated payment result
→ idempotent database transaction creates successful payment, order, lines, KOT, token, and events
→ commit once
→ publish post-commit realtime and notification events
```

Rules:

- The frontend never creates a paid order by declaring success.
- Pending and failed attempts do not allocate token/KOT or reduce orderable availability.
- Duplicate and out-of-order callbacks return a safe acknowledgement without repeating effects.
- A successful provider payment that cannot create an order enters reconciliation and alerts operations.
- Paid totals and item configuration are immutable snapshots.
- Refund and cancellation state is driven by recorded provider and business events.

### Fulfillment flow

Only allowed transitions are accepted. Each transition checks the current version/status, actor permission, restaurant scope, and prerequisites, then appends an event in the same transaction. Ready and Delivered behavior remains service-aware for table delivery and counter pickup.

## 12. Subscription and UPI AutoPay Delivery

Subscription development cannot begin beyond provider-neutral interfaces until the Stage 4.0 billing decisions are approved.

Required implementation:

- Provider adapter and sandbox configuration.
- Mandate creation and authorization handoff.
- Signed, idempotent mandate/payment/refund callback processing.
- Immutable plan/rate/feature snapshots.
- Paid-through calculation and approved entitlement policy.
- Pending, active, on-hold, paused, customer-cancelled, expired, failed, and cancelled states.
- Renewal notices, failed-payment handling, retry/reconciliation, cancellation, and Support tools.
- Restaurant and Super Admin histories without exposing sensitive payer data.
- Finance reconciliation report and operational alerts.

The final provider-specific state map and policies must be appended to `subscription-billing.md` before this stage moves to implementation.

## 13. Data Migration and Prototype Mapping

The prototype seed is demonstration data, not a production database export.

Migration approach:

1. Define a versioned canonical import schema independent of Local Storage shape.
2. Map prototype concepts to production entities and record any discarded fields.
3. Import only approved fictional demo content into development/staging.
4. Never import prototype passwords, PIN hashes, active sessions, raw payment values, or simulated provider references into production.
5. Upload menu images and branding into object storage and replace local paths with managed asset records.
6. Generate fresh production restaurant, user, table, menu, and plan identifiers.
7. Recreate production accounts through secure invitations or verified onboarding.
8. Validate counts, references, tenant scope, and immutable snapshots in a dry run.
9. Produce a signed migration report and retain rollback instructions.

If real pilot restaurant data is collected, it must use the approved import schema, consent/retention rules, and a tenant-specific validation report.

## 14. Environments and Infrastructure

### Environments

- Local development: containerized dependencies and provider stubs.
- CI: isolated ephemeral database/Redis and deterministic tests.
- Development: shared integration environment with fictional data.
- Staging: production-like infrastructure and provider sandbox.
- Production: isolated accounts/secrets/data, approved domains, monitoring, backups, and restricted access.

### Infrastructure requirements

- Infrastructure as code for networking, compute, PostgreSQL, Redis, storage, CDN, DNS, certificates, secrets, and alarms.
- Private database/cache networking; only required public web/API entry points exposed.
- Automated encrypted backups and point-in-time recovery where supported.
- Object versioning/lifecycle policy for required files.
- Separate service identities with least-privilege permissions.
- Health, readiness, and worker-liveness checks.
- Zero- or controlled-downtime migration and rollback procedure.
- Cost budgets and alerts by environment.

Recovery point objective, recovery time objective, retention, region, and backup ownership are Stage 4.0 decisions.

## 15. CI/CD and Release Controls

Every pull request must run:

- Formatting, linting, TypeScript compilation, and unit tests.
- Contract, database, and tenant-policy tests.
- Integration tests with PostgreSQL and Redis.
- Dependency, secret, and static security scans.
- Production build and migration validation.
- Relevant Playwright journeys for affected domains.

Every release must:

- Be traceable to an immutable commit and artifact.
- Apply approved migrations through the deployment pipeline.
- Run smoke tests and health checks.
- Support application rollback; database rollback/forward-fix path must be stated.
- Record deployer, version, environment, migration, time, and outcome.
- Keep provider callbacks compatible during rolling deployments.

## 16. Testing Strategy

### Test layers

- Unit: calculations, policies, transitions, masking, entitlement, and validation.
- Database: constraints, transactions, RLS, locking, token/KOT allocation, and migrations.
- Integration: API modules, Redis jobs, object storage, email/SMS adapters, and provider sandbox/stubs.
- Contract: browser/API, worker events, Cashfree callbacks, Google OAuth, and notification provider payloads.
- Browser: all prototype acceptance journeys in Chromium, Firefox, and WebKit-supported Playwright targets.
- Accessibility: automated checks plus manual keyboard and screen-reader review of critical flows.
- Performance: QR/menu load, checkout, queue refresh, WebSocket reconnect, reports, and peak restaurant load.
- Resilience: duplicate/out-of-order webhooks, worker retry, database failover, cache loss, slow provider, and partial notification failure.
- Security: authorization matrix, tenant escape attempts, OWASP-focused review, upload testing, and penetration testing before launch.

### Required automated journeys

- Guest QR to paid order, KOT, ready, and collection/table delivery.
- Customer sign-in/cart continuity, payment, reward, receipt, history, and reorder.
- Staff chronological fulfillment and conflict handling.
- Staff cancellation with valid, expired, rotated, and replayed delegation.
- Admin menu, availability, Staff, settings, QR, report, and data workflows.
- Restaurant onboarding, Super Admin approval/rejection, and safe activation.
- Support submission, assignment, reply, resolve, reopen, and requester continuity.
- Subscription authorization, success, pending, failure, renewal, cancellation, replay, and reconciliation.
- Tenant-isolation tests across every restaurant-owned endpoint and export.

## 17. Observability and Operations

### Telemetry

- Structured application logs with correlation, request, user, restaurant, order, and provider-event identifiers where safe.
- Metrics for request latency/errors, payment conversion, callback lag/failure, KOT age, queue depth, job retries, WebSocket connections, notification failure, and subscription state.
- Distributed traces across web/API, database, jobs, and provider adapters.
- Frontend error and performance monitoring with source maps protected appropriately.

### Alerts and runbooks

Runbooks are required for:

- Payment succeeded but order missing.
- Callback verification failure or backlog.
- Token/KOT allocation conflict.
- Restaurant queue or notification delay.
- Subscription renewal/reconciliation failure.
- Database, Redis, storage, or worker degradation.
- Cross-tenant access alert.
- Backup/restore failure.
- Credential compromise and provider-key rotation.

Alerts must identify an owner, severity, acknowledgement target, and escalation route.

## 18. Delivery Stages and Dependencies

| Stage | Outcome | Depends on |
|---|---|---|
| 4.0 Decisions and governance | Approved product, security, billing, data, and operations policies | Prototype freeze |
| 4.1 Engineering foundation | Monorepo, environments, CI/CD, observability baseline | 4.0 architecture decisions |
| 4.2 Data and tenancy | PostgreSQL schema, migrations, RLS, audit and idempotency foundation | 4.1 |
| 4.3 Identity and access | Secure sessions, Google customer OAuth, roles, memberships, delegation | 4.2 |
| 4.4 Restaurant and catalog | Onboarding, approval, settings, assets, tables/counters, menu and availability | 4.3 |
| 4.5 Customer ordering | QR entry, menu, cart, checkout draft and totals | 4.4 |
| 4.6 Payments, order and KOT | Provider payment, transactional order creation, token/KOT, cancellation/refund | 4.5 |
| 4.7 Realtime fulfillment and engagement | Staff queue, tracking, notifications, games and rewards | 4.6 |
| 4.8 Back office and platform | Reports, history, Support, Super Admin and data operations | 4.7; parts may begin after 4.4 |
| 4.9 Subscription billing | UPI AutoPay, entitlements, histories and reconciliation | 4.0 billing decisions, 4.3, 4.8 plan management |
| 4.10 Migration and acceptance | Approved demo/pilot data, full browser journeys, accessibility and performance | 4.1–4.9 |
| 4.11 Security and operational readiness | Pen test, recovery drill, runbooks, monitoring, compliance and launch gate | 4.10 |
| 4.12 Pilot and production launch | Controlled restaurant pilot, stabilization, go-live and handover | 4.11 |

No calendar commitment should be made until Stage 4.0 resolves scope, team capacity, provider onboarding, and compliance dependencies. Planning should use small vertical slices that end in demonstrable acceptance journeys rather than frontend/backend handoff batches.

## 19. Team Responsibilities

Minimum ownership areas, which may be combined in a small team:

- Product owner: scope, acceptance, policy decisions, pilot restaurants.
- Technical lead: architecture, module boundaries, security and release quality.
- Web engineers: Next.js workspaces, accessibility, responsive behavior, browser tests.
- Backend engineers: NestJS domains, transactions, integrations, workers, realtime.
- Data/infra engineer: PostgreSQL, RLS, migrations, infrastructure, backups, observability.
- QA engineer: test strategy, journey automation, exploratory/device testing, release evidence.
- Security/privacy owner: threat model, controls, retention, incident and vendor review.
- Finance/operations owner: payment/subscription policy, reconciliation, refunds, support runbooks.
- Design owner: prototype fidelity, states, accessibility, final production content.

Every worksheet stage must name a directly responsible owner before work starts.

## 20. Risk Register

| Risk | Early control |
|---|---|
| Cross-restaurant data exposure | Tenant ID everywhere, RLS default deny, authorization matrix and adversarial tests |
| Paid customer without order | Provider idempotency, transactional order creation, reconciliation queue and alert |
| Duplicate token/KOT/reward/refund | Database uniqueness, locks, idempotency records, replay tests |
| Lost realtime event | API reload on reconnect, durable source of truth, queued critical work |
| Subscription state incorrectly grants access | Approved entitlement policy, callback verification, paid-through transaction and reconciliation |
| Provider onboarding delays | Complete Stage 4.0 merchant/sandbox gate before committing billing milestone |
| Staff/Admin credential misuse | MFA/reauth policy, scoped delegation, expiry, rotation, rate limit and audit |
| Licence or personal-data leakage | Private storage, purpose-limited access, retention and export controls |
| Report/accounting mismatch | Immutable snapshots, documented accounting boundary, reconciliation and finance review |
| Prototype assumptions copied into production | Requirement trace, production ADRs, threat model and explicit simulation replacement checklist |
| Scope growth delays launch | Frozen release boundary and change-control process |

The risk register should gain owner, probability, impact, mitigation due date, and current status during Stage 4.0.

## 21. Definition of Ready

A development stage may start only when:

- Product behavior and out-of-scope boundary are written.
- Dependent decisions and previous exit criteria are complete.
- API/data implications and threat scenarios are reviewed.
- Acceptance tests and required observability are identified.
- Provider credentials or stubs, designs, content, and test data are available.
- Owner, reviewer, environment, and rollout method are assigned.

## 22. Definition of Done

A production feature is done only when:

- Approved requirements and error/recovery states are implemented.
- Tenant, role, privacy, audit, idempotency, and concurrency controls are enforced.
- Unit, integration, contract, and relevant browser tests pass.
- Accessibility and responsive behavior are reviewed.
- Metrics, logs, alerts, and Support/operations behavior exist.
- Data migrations, rollback/forward-fix, and documentation are complete.
- No unresolved critical/high defect or unaccepted security finding remains.
- Product and technical owners approve the acceptance evidence.
- The feature is deployed safely to its intended environment and smoke-tested.

## 23. Production Launch Gate

Production launch requires all of the following:

- Stage 4 worksheet exit criteria complete.
- Provider production accounts, callbacks, domains, and secrets approved.
- Privacy, terms, consent, retention, refund, cancellation, and Support policies published.
- Threat model and penetration test findings resolved or formally accepted.
- Tenant-isolation, payment/reconciliation, backup/restore, and incident drills pass.
- Accessibility, responsive-device, browser, load, and failure testing pass.
- Monitoring, on-call ownership, runbooks, status communication, and rollback are ready.
- Pilot restaurant sign-off and production change approval are recorded.

## 24. Documentation Deliverables

Development must keep these artifacts current:

- Architecture decision records.
- C4/context, container, and critical sequence diagrams.
- Database schema and data dictionary.
- API/OpenAPI and event-contract documentation.
- Authorization matrix and RLS policy map.
- Threat model and privacy/data-flow inventory.
- Provider integration and webhook runbooks.
- Test plan, traceability matrix, and release evidence.
- Deployment, migration, rollback, backup/restore, and incident runbooks.
- Support knowledge base and restaurant onboarding/activation guide.
- Change log and known limitations.

The production worksheet in `worksheet.md` is the execution source of truth; this document explains its architecture, sequencing, and quality gates.
