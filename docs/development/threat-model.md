# Autoserve Initial Production Threat Model

## Status

- Stage: 4.0 Decisions and Governance
- Status: Initial production threat model ratified by established Technical and Security/Privacy ownership on 20 July 2026; refresh required after provider and exact policy decisions
- Method: system-boundary review using STRIDE-style threat categories and misuse journeys
- Review requirement: update after architecture, provider, identity, and infrastructure decisions are Confirmed, and again before production readiness

## 1. Security Objectives

Autoserve must protect:

1. Restaurant isolation: one restaurant must never read or mutate another restaurant's records.
2. Order integrity: a paid order, token, KOT, reward, cancellation, and refund occur exactly as authorized and at most once.
3. Payment integrity: only authenticated provider outcomes affect payment or subscription state.
4. Privilege integrity: Staff, Admin, Support, and Super Admin actions stay within approved role, tenant, purpose, and time boundaries.
5. Customer privacy: contact, order, Support, and payment-reference data is collected and exposed only as approved.
6. Operational availability: restaurant ordering and fulfillment recover safely from cache, queue, realtime, provider, or deployment failures.
7. Audit trust: privileged and financial actions remain attributable, ordered, tamper-evident, and reviewable.

## 2. System and Trust Boundaries

```text
Untrusted browser/device
  │ HTTPS / WSS
  ▼
Public edge and Next.js web
  │ authenticated API requests
  ▼
NestJS API trust boundary
  ├── PostgreSQL: transactional source of truth
  ├── Redis/BullMQ: non-authoritative cache and durable work coordination
  ├── Object storage: media, private licences, generated exports
  ├── Cashfree/payment provider: payment and mandate authority
  ├── Google OAuth: customer identity assertion
  └── Email/SMS provider: outbound delivery

Privileged human boundaries
  Restaurant Staff/Admin · Support · Super Admin · Infrastructure/Finance operators
```

No browser role, submitted restaurant identifier, realtime event, queue payload, or cached record is trusted without server-side validation against authoritative state.

## 3. Assets and Sensitivity

| Asset | Security need | Consequence of compromise |
|---|---|---|
| Credentials, sessions, MFA/recovery factors | Confidentiality and revocability | Account takeover and privileged mutations |
| Restaurant membership and permissions | Integrity | Cross-tenant or unauthorized access |
| Customer contact/profile | Confidentiality and purpose limitation | Privacy harm and fraud |
| Licence/company evidence | Confidentiality, integrity, restricted review | Compliance/privacy breach or false approval |
| Menu, price, availability, table/counter settings | Integrity and availability | Incorrect orders, lost sales, unsafe service |
| Cart and checkout draft | Integrity and tenant binding | Price manipulation or wrong-restaurant order |
| Payments, mandates, refunds, settlement references | Integrity, confidentiality, audit | Financial loss or false entitlement |
| Orders, KOTs, tokens, timelines | Integrity, availability, uniqueness | Paid customer not served or duplicate service |
| Reward attempts/issues | Integrity and uniqueness | Inventory loss or unfair reward |
| Support conversations | Confidentiality and purpose-limited access | Exposure of customer/restaurant issues |
| Audit and webhook events | Integrity, ordering, retention | Inability to investigate or reconcile |
| Backups and exports | Confidentiality, completeness, recoverability | Bulk data exposure or failed recovery |
| Provider/cloud secrets | Confidentiality and rotation | Platform-wide compromise |

## 4. Threat Actors

- Anonymous internet attacker.
- Malicious or compromised Guest/Customer account.
- Staff attempting Admin actions or another restaurant's data.
- Compromised Restaurant Admin.
- Support agent exceeding case purpose.
- Compromised or malicious Super Admin/operator.
- Automated bot targeting authentication, QR, Support, or payment endpoints.
- Forged/replayed provider webhook sender.
- Compromised dependency, CI job, container, or deployment credential.
- Accidental operator or developer error.
- Lost/stolen restaurant tablet or customer device.

## 5. Primary Threat Scenarios and Controls

| ID | Scenario | Category | Required preventive controls | Required detection/recovery |
|---|---|---|---|---|
| T-001 | Change `restaurant_id` to access another tenant | Elevation/information disclosure | Server-derived tenant context, membership checks, RLS default deny, opaque IDs | Cross-tenant denial metrics, security audit, adversarial tests |
| T-002 | Staff calls hidden Admin API directly | Elevation | Capability guard on every controller/service, reauth for sensitive actions | Denied-action audit and rate alert |
| T-003 | Support searches unrelated sensitive records | Information disclosure | Purpose/case-scoped access, masking, elevation, least privilege | Query/access audit and periodic review |
| T-004 | Stolen Super Admin session changes access or plans | Elevation/tampering | MFA, short privileged session, reauthentication, device/session revocation | High-risk action alert, immutable audit, emergency revoke |
| T-005 | Browser declares payment success | Tampering | Backend-created session; provider callback/poll verification; no client success authority | Payment/order reconciliation |
| T-006 | Duplicate or replayed webhook creates duplicate order/refund/renewal | Replay/tampering | Signature/time validation, unique provider event and transaction keys, idempotent transaction | Duplicate-event metrics and retained callback evidence |
| T-007 | Valid payment succeeds but order transaction fails | Availability/integrity | Atomic local transaction after verified success; durable reconciliation record | Critical alert, retry/manual recovery runbook |
| T-008 | Concurrent checkout allocates duplicate token/KOT | Tampering/concurrency | Database uniqueness, scoped counter lock/transaction, retry | Constraint alert and concurrency tests |
| T-009 | Stale Staff tab overwrites newer KOT status | Tampering | Allowed transition state machine and optimistic version check | Conflict response and authoritative reload |
| T-010 | Reward endpoint called repeatedly | Tampering | Unique eligible attempt/order constraint and transactional issue | Duplicate-denial metric and audit |
| T-011 | Cancellation authorization is replayed or shared broadly | Elevation/replay | Action-bound, expiring, revocable delegation; one-time nonce; recheck actor/order | Failed/replayed attempt audit and lockout/escalation |
| T-012 | Malicious QR sends customer to another origin/restaurant/table | Spoofing | Signed/validated deep-link fields, approved origin, restaurant/table existence, visible confirmation | Invalid QR telemetry and safe fallback |
| T-013 | Menu price or tax is modified in browser | Tampering | Server calculations from current catalog/settings; immutable paid snapshot | Mismatch response and checkout refresh |
| T-014 | Licence upload contains malware or is publicly enumerable | Information disclosure/execution | Private bucket, signed upload, allowlist/type/size scan, random key, no execution | Malware quarantine and access logs |
| T-015 | Export link exposes bulk tenant data | Information disclosure | Admin reauth, tenant scope, async job, encrypted private object, short signed URL | Download audit, revoke/delete, incident response |
| T-016 | Logs contain password, cookie, UPI ID, webhook secret, or licence | Information disclosure | Structured allowlist logging and redaction tests | Log scanning and deletion/rotation response |
| T-017 | CSRF triggers settings/cancellation while user is signed in | Spoofing/tampering | SameSite cookies, CSRF token/origin verification, reauth for critical actions | Rejected-origin telemetry |
| T-018 | XSS steals session or performs privileged actions | Spoofing/elevation | Output encoding, CSP, safe UI primitives, no unsafe HTML, Secure HTTP-only cookie | CSP reports, frontend/error monitoring, session revoke |
| T-019 | Auth/Support/payment endpoints are abused by bots | Denial/abuse | Layered rate limits, challenge/escalation, request size limits, queue bounds | Abuse metrics, temporary blocks, provider escalation |
| T-020 | Redis/cache loss causes incorrect authoritative state | Integrity/availability | PostgreSQL source of truth, cache-aside invalidation, API resync, idempotent jobs | Cache-loss drill and degradation dashboard |
| T-021 | Queue job executes twice or out of order | Tampering | Job idempotency, aggregate version/precondition, durable state check | Retry/dead-letter metrics and replay tools |
| T-022 | WebSocket subscriber joins another restaurant/order | Information disclosure | Authenticated handshake, membership/order authorization, room names server-derived | Subscription denial audit and reconnect tests |
| T-023 | Backup is incomplete because tenant policy filters it | Availability/integrity | Privileged backup role/process, completeness checks, encrypted backup, restore drill | Backup verification and failed-restore alert |
| T-024 | Dependency or CI secret compromise ships malicious artifact | Supply chain | Lockfile, review, scans, least-privilege CI, signed/immutable artifacts, protected branch | Artifact provenance and credential rotation runbook |
| T-025 | Deleted/retired plan rewrites or obscures billing history | Repudiation/integrity | Immutable plan snapshot, retirement rather than destructive deletion | Billing reconciliation and audit |
| T-026 | Notification leaks order/support details to wrong contact | Information disclosure | Verified destination, minimal content, template review, tenant/user binding | Delivery audit and privacy incident flow |
| T-027 | Account enumeration through sign-in/recovery errors | Information disclosure | Uniform responses and timing, rate limit | Enumeration alert and abuse review |
| T-028 | Database owner bypasses RLS accidentally in API | Elevation | Runtime DB role without owner/BYPASSRLS, FORCE RLS where appropriate, policy tests | Startup/config check and tenant canary tests |

## 6. Critical Misuse Journeys

The automated security suite must include:

1. Customer A requests Customer B's receipt/order by identifier.
2. Restaurant A Admin requests Restaurant B menu, Staff, export, report, and subscription.
3. Staff calls every Admin-only endpoint with valid Staff session.
4. Support queries a ticket without purpose/assignment and attempts mutation outside Support scope.
5. Super Admin performs critical action without current elevated authentication.
6. Forged, expired, duplicate, delayed, and out-of-order payment/subscription webhooks.
7. Concurrent verified payment callbacks for one attempt.
8. Concurrent token/KOT allocation across multiple workers.
9. Replayed cancellation delegation and reward issue.
10. Export/restore crafted with foreign restaurant records.
11. WebSocket room/order identifier manipulation.
12. Licence upload with incorrect MIME, oversized content, executable payload, and path tricks.

## 7. Data Flows Requiring Detailed Diagrams

- Sign-in, session rotation, MFA, recovery, and revocation.
- Restaurant onboarding, licence upload, review, approval, and activation.
- QR entry through guest/customer context binding.
- Cart/checkout through provider payment and atomic order/KOT creation.
- Staff fulfillment and customer realtime resynchronization.
- Delegated cancellation through refund and reconciliation.
- Reward attempt through exactly-once issue.
- Support submission, assignment, access, response, and requester recovery.
- UPI AutoPay mandate through renewal, entitlement, cancellation, and reconciliation.
- Tenant export, signed download, restore, purge, and deletion.

## 8. Security Verification Gates

- Stage 4.1: secret handling, CI supply-chain, environment isolation, TLS, headers, logging baseline.
- Stage 4.2: RLS/default denial, database roles, constraints, idempotency, immutable audit.
- Stage 4.3: identity/session/MFA/recovery/CSRF/rate-limit/authorization matrix.
- Stages 4.4–4.9: domain-specific misuse and provider-contract tests.
- Stage 4.10: full cross-role/cross-tenant browser/API security regression.
- Stage 4.11: updated threat model, independent penetration test, recovery and incident exercises.

## 9. Open Decisions

This threat model cannot be approved until the following are Confirmed in `../production-decisions.md`:

- Identity factors, session duration, recovery, reauthentication, and Staff delegation.
- Cloud topology, availability target, RTO/RPO, backup and retention.
- Payment/subscription provider and webhook specification.
- Data classification, retention, customer rights, licence and audit policy.
- Support purpose limitation and Super Admin elevation.
- Notification providers and message content policy.

## 10. Approval

Security/Privacy Owner: Established externally; identity not supplied to repository  
Technical Lead: Established externally; identity not supplied to repository  
Review status: Initial Stage 4.0 model approved; provider/policy refresh required  
Approval date: 20 July 2026
