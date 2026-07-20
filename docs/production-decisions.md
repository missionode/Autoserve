# Autoserve Production Decision and Governance Register

## 1. Purpose

This register is the approval source for Stage 4.0 of the production worksheet. It prevents implementation from silently converting recommendations or prototype simulations into production policy.

The stakeholder-approved prototype remains frozen. A production decision may reuse its workflow, but must still address security, tenancy, provider, finance, privacy, operations, and recovery implications.

## 2. Status Definitions

| Status | Meaning |
|---|---|
| Confirmed | Explicitly approved, dated, owned, and ready to govern implementation |
| Proposed | Recommended baseline awaiting the named approval |
| Open | Decision options or required facts are incomplete |
| Blocked | An external prerequisite prevents a safe decision |
| Deferred | Intentionally excluded from the first production release |
| Superseded | Replaced by a later decision with a linked record |

Only `Confirmed` decisions satisfy worksheet approval items. A decision record must identify its approver and approval date before its status changes to Confirmed.

APPR-006 confirms every provider-neutral internal decision in this register on 20 July 2026. PAY-001 and SUB-001 remain due-diligence directions rather than provider selections; provider onboarding, provider-specific behavior, legal/tax conclusions, and vendor contracts remain explicit external gates and are not made `Confirmed` by APPR-006.

## 3. Governance Roles

One person may hold multiple roles in a small team, but accountability must be explicit.

| Governance role | Accountable for | Assigned owner | Status |
|---|---|---|---|
| Product Owner | Release scope, workflows, acceptance, pilot cohort, change control | Current stakeholder (name not supplied) | Confirmed 20 July 2026 |
| Technical Lead | Architecture, module boundaries, engineering quality, release design | Established externally; identity not supplied to repository | Confirmed 20 July 2026 |
| Security and Privacy Owner | Threat model, identity controls, data policy, security acceptance | Established externally; identity not supplied to repository | Confirmed 20 July 2026 |
| Finance and Billing Owner | Payments, settlements, refunds, subscriptions, reconciliation, tax/receipt policy | Established externally; identity not supplied to repository | Confirmed 20 July 2026 |
| Restaurant Operations Owner | KOT, Staff delegation, service, cancellation, pilot operations | Established externally; identity not supplied to repository | Confirmed 20 July 2026 |
| Support Owner | Request handling, access boundary, SLA, escalation, knowledge base | Established externally; identity not supplied to repository | Confirmed 20 July 2026 |
| Infrastructure/SRE Owner | Cloud, environments, availability, backup, recovery, monitoring, incidents | Established externally; identity not supplied to repository | Confirmed 20 July 2026 |
| QA/Acceptance Owner | Test strategy, traceability, browser/device/accessibility and release evidence | Established externally; identity not supplied to repository | Confirmed 20 July 2026 |
| Design/Accessibility Owner | Prototype fidelity, content, interaction, accessibility approval | Established externally; identity not supplied to repository | Confirmed 20 July 2026 |

## 4. Decision Register

### Product and delivery

| ID | Decision | Proposed baseline | Required approver | Status | Blocks |
|---|---|---|---|---|---|
| PROD-001 | First production release scope | Use the Included/Deferred boundary in `development-plan.md` | Product Owner | Confirmed 20 July 2026 | All delivery stages |
| PROD-002 | Pilot model | Controlled 1–3 restaurant cohort for at least 14 operating days, with daily reconciliation, no-go thresholds, and rollback criteria | Product + Operations | Confirmed 20 July 2026 | Stage 4.12 |
| PROD-003 | Change control | Prototype remains frozen; production scope changes require impact, owner, acceptance, and approval record | Product + Technical Lead | Confirmed 20 July 2026 | Stage planning |
| PROD-004 | Native apps | Defer native apps; deliver responsive web/PWA first | Product Owner | Confirmed 20 July 2026 | Mobile delivery scope |

### Architecture and engineering

| ID | Decision | Proposed baseline | Required approver | Status | Blocks |
|---|---|---|---|---|---|
| ARC-001 | Architecture style | TypeScript modular monolith with separately deployable web, API, and worker | Technical Lead | Confirmed 20 July 2026 | Stage 4.1 |
| ARC-002 | Web/API stack | Next.js + React + TypeScript; NestJS API; shared contracts | Technical Lead | Confirmed 20 July 2026 | Stage 4.1 |
| ARC-003 | Data/cache stack | PostgreSQL/Prisma as source of truth; Redis/BullMQ for cache/jobs/realtime fanout | Technical Lead | Confirmed 20 July 2026 | Stages 4.1–4.2 |
| ARC-004 | Realtime model | Socket.IO/WebSocket acceleration with authoritative API resync on reconnect | Technical Lead | Confirmed 20 July 2026 | Stage 4.7 |
| ARC-005 | Repository | One protected monorepo using the structure in `development-plan.md` | Technical Lead | Confirmed 20 July 2026 | Stage 4.1 |
| ARC-006 | Service decomposition | No microservices until measured scale or ownership evidence justifies an ADR | Technical Lead | Confirmed 20 July 2026 | Architecture governance |

### Infrastructure and reliability

| ID | Decision | Proposed baseline | Required approver | Status | Blocks |
|---|---|---|---|---|---|
| INF-001 | Cloud and primary region | AWS with Mumbai as the primary region | Technical + Infrastructure Owner | Confirmed 20 July 2026 | Stage 4.1 provisioning |
| INF-002 | Account/environment model | Isolated development, staging, and production accounts/projects, secrets, databases, and provider credentials | Infrastructure + Security | Confirmed 20 July 2026 | Stage 4.1 |
| INF-003 | Availability target | Pilot baseline: 99.9% monthly application availability excluding approved maintenance; validate cost/topology | Product + Infrastructure | Confirmed 20 July 2026 | Production topology |
| INF-004 | Recovery objectives | 15-minute RPO; 4-hour RTO; 35-day PITR/daily retention; 12-month monthly snapshot subject to legal/privacy validation; quarterly restore drill owned by Infrastructure/SRE and witnessed by QA | Product + Infrastructure + Security | Confirmed internal baseline 20 July 2026; legal/privacy validation gated | Backup architecture and launch |
| INF-005 | Deployment model | Managed PostgreSQL, managed Redis, S3-compatible storage, containerized API/worker, CDN/TLS | Technical + Infrastructure | Confirmed 20 July 2026 | Stage 4.1 |
| INF-006 | Observability | OpenTelemetry-compatible traces/metrics/logs plus Sentry-style frontend monitoring | Technical + Infrastructure | Confirmed 20 July 2026 | Stage 4.1 |

### Identity and authorization

| ID | Decision | Proposed baseline | Required approver | Status | Blocks |
|---|---|---|---|---|---|
| IAM-001 | Customer identity | Email/mobile account plus customer-only Google OAuth; server sessions in secure cookies | Product + Security | Confirmed baseline 20 July 2026; exact session/recovery values remain IAM-003/IAM-004 | Stage 4.3 |
| IAM-002 | Workforce authentication | Mandatory MFA for Admin, Support, and Super Admin; Staff verified credentials with elevated-action delegation | Security + Operations | Confirmed 20 July 2026 | Stage 4.3 |
| IAM-003 | Session policy | Role-specific idle/absolute duration, revocation, rotation, and suspicious-session handling per ratified exact policy | Security + Product | Confirmed 20 July 2026 | Stage 4.3 |
| IAM-004 | Recovery policy | Verified recovery, lockout, and incident escalation per ratified exact policy | Security + Support | Confirmed 20 July 2026 | Stage 4.3 |
| IAM-005 | Staff delegation | Scoped, expiring, revocable, single-use/action-bound authorization; maximum 10 minutes | Security + Operations | Confirmed 20 July 2026 | Protected actions |
| IAM-006 | Support boundary | Purpose-limited Support access with case reference, audit, masking, and 15-minute elevation for sensitive data | Security + Support | Confirmed 20 July 2026 | Stage 4.8 |
| IAM-007 | Super Admin elevation | Strong authentication, five-minute critical-action reauthentication, least privilege, immutable audit, and 15-minute elevation | Security + Technical Lead | Confirmed 20 July 2026 | Stages 4.3/4.8 |

### Privacy, compliance, and data

| ID | Decision | Proposed baseline | Required approver | Status | Blocks |
|---|---|---|---|---|---|
| DATA-001 | Data classification | Classify identity, contact, licence, payment reference, order, Support, audit, and telemetry data | Security/Privacy Owner | Open | Schema, logging, access |
| DATA-002 | Retention | Set retention/deletion rules per data class and legal/business need | Privacy + Finance + Support | Open | Data lifecycle and launch |
| DATA-003 | Customer rights | Define consent, access/export, correction, deletion, account closure, and exception handling | Privacy + Product | Open | Account/data features |
| DATA-004 | Licence evidence | Private object storage, restricted reviewers, expiry notices, retention, and deletion policy | Privacy + Platform Operations | Product handling baseline approved; Privacy/Operations acceptance pending | Stage 4.4 |
| DATA-005 | Audit retention | Define immutable audit scope, access, retention, export, and incident preservation | Security + Finance + Operations | Open | Audit implementation |
| DATA-006 | Analytics | First-party minimum analytics with consent and prohibited sensitive fields; vendor choice pending | Product + Privacy | Open | Analytics instrumentation |
| DATA-007 | Production import | Canonical versioned import only; never import prototype credentials, sessions, PINs, or simulated payment identifiers | Security + Technical Lead | Confirmed 20 July 2026 | Stage 4.10 |

### Customer payments

| ID | Decision | Proposed baseline | Required approver | Status | Blocks |
|---|---|---|---|---|---|
| PAY-001 | Provider | Evaluate Cashfree first; merchant eligibility, pricing, settlement, sandbox, support, data terms, and fallback must be verified before selection | Finance + Technical Lead | Product direction approved; due diligence and specialist selection pending | Stage 4.6 |
| PAY-002 | Capture model | Backend-created payment session; authenticated provider result creates order transaction exactly once | Finance + Technical Lead | Product approved; Finance/Technical acceptance pending | Stage 4.6 |
| PAY-003 | Pending/reconciliation | No token/KOT until confirmed success; paid-without-order enters reconciliation and alerts | Finance + Operations | Product approved; Finance/Operations acceptance pending | Stage 4.6 |
| PAY-004 | Cancellation/refund | Define who may cancel, cutoff/status rules, refund amount/timing, failures, customer notice, and escalation | Finance + Operations + Product | Open | Stage 4.6 |
| PAY-005 | Settlement and disputes | Define daily reconciliation, settlement ownership, mismatch workflow, evidence, chargeback/dispute process | Finance Owner | Open | Stage 4.6 and launch |
| PAY-006 | Receipts and tax | Define legal invoice/receipt content, GST/tax calculation ownership, numbering, correction, retention | Finance + Compliance | Open | Checkout, receipts, reports |
| PAY-007 | Webhook policy | Pin version after provider selection; raw-body signature, event idempotency, replay/out-of-order behavior, retention | Technical + Security | Blocked by PAY-001 | Stage 4.6 |

### Restaurant subscriptions

| ID | Decision | Proposed baseline | Required approver | Status | Blocks |
|---|---|---|---|---|---|
| SUB-001 | UPI AutoPay provider | Evaluate Cashfree first and prefer the food-payment provider only if capability, commercial, data, Support, and exit requirements fit | Finance + Technical Lead | Product direction approved; due diligence and specialist selection pending | Stage 4.9 |
| SUB-002 | Entitlement source | Confirmed paid-through date derived only from authenticated, idempotent payment events | Product + Finance + Technical | Product approved; Finance/Technical acceptance pending | Stage 4.9 |
| SUB-003 | Grace/access behavior | Define grace duration, warnings, read-only behavior, active-order exception, recovery after payment | Product + Finance + Operations | Open | Stage 4.9 |
| SUB-004 | Plan change | Define immediate/scheduled upgrade, downgrade, proration, credit, mandate update/replacement | Product + Finance | Open | Stage 4.9 |
| SUB-005 | Retry/failure | Define provider retry ownership, Autoserve reconciliation, notices, Support actions, and terminal outcome | Finance + Support + Operations | Open | Stage 4.9 |
| SUB-006 | Cancellation | Future renewal cancellation with paid access through period end; confirm mandate/provider behavior | Product + Finance | Product approved; Finance/provider acceptance pending | Stage 4.9 |
| SUB-007 | Removed plans | Retire rather than delete referenced plans; define migration and notice rules | Product + Finance | Product approved; Finance migration policy pending | Plan management |
| SUB-008 | Billing documents | Define invoices/receipts, tax, credits/refunds, retention, and finance exports | Finance + Compliance | Open | Stage 4.9 |

### Notifications and Support

| ID | Decision | Proposed baseline | Required approver | Status | Blocks |
|---|---|---|---|---|---|
| COM-001 | Email provider | Use email for account, approval, billing, Support, and approved durable receipts; evaluate SES/Postmark | Technical + Support/Operations | Product channel direction approved; provider/specialist selection pending | Notification delivery |
| COM-002 | SMS provider | Use SMS for verified recovery/time-sensitive notices where consent/template rules allow; select approved Indian provider | Operations + Compliance | Product channel direction approved; provider/compliance selection pending | Mobile notices and recovery |
| COM-003 | WhatsApp | Defer from first release unless separately approved through change control | Product + Operations | Product approved; Operations acknowledgement pending | Optional channel |
| COM-004 | Channel map | In-app realtime primary for live order state; define mandatory/optional email/SMS, retry, opt-out, and failure behavior | Product + Support + Privacy | Product direction approved; Support/Privacy details pending | Stage 4.7 |
| SUP-001 | Guest continuity | Production recovery through verified reference-plus-contact or authenticated identity; reference alone is insufficient | Product + Security + Support | Product approved; Security/Support verification policy pending | Stage 4.8 |
| SUP-002 | SLA/escalation | Define priorities, targets, assignment, escalation, sensitive cases, and operating hours | Support + Operations | Open | Stage 4.8/launch |

## 5. First-Release Scope Ratification

The proposed first release is the `Included in the first production release` section of `development-plan.md`. Approval must explicitly confirm whether each of these remains included:

- Guest and signed-in customer ordering.
- Store, counter, and table QR entry.
- Food payment, KOT/token, tracking, receipt, cancellation/refund, and reconciliation.
- Staff and Restaurant Admin operations.
- Super Admin restaurant approval and platform controls.
- Support workflows for every role.
- Restaurant UPI AutoPay subscription billing and entitlement enforcement.
- Waiting games and the approved reward mechanism.
- Tenant exports, recovery operations, audit, notifications, reporting, and production observability.

Any removal must identify its dependent UI/API/data/test changes. Any addition requires impact assessment and explicit change approval.

## 6. Stage 4.0 Approval Checklist

| Gate | Required evidence | Current state |
|---|---|---|
| Named accountable owners | Completed Governance Roles table | All governance roles established; personal identities not supplied to repository |
| Release scope | PROD-001 Confirmed | Confirmed 20 July 2026 |
| Architecture | ARC-001–ARC-006 Confirmed and ADRs created | Confirmed 20 July 2026; ADR-001–ADR-012 accepted for internal/provider-neutral decisions |
| Infrastructure/recovery | INF-001–INF-006 Confirmed | Confirmed internal baseline 20 July 2026; external legal/privacy retention validation gated |
| Identity/authorization | IAM-001–IAM-007 Confirmed | Exact internal policy confirmed 20 July 2026 through APPR-006 |
| Privacy/data | DATA-001–DATA-007 Confirmed | Internal handling/lifecycle baseline confirmed 20 July 2026; legal conclusions remain gated |
| Food payments | PAY-001–PAY-007 resolved or explicitly gated | Provider-neutral policy confirmed; selection, onboarding, provider behavior, and tax/legal conclusions gated |
| Subscriptions | SUB-001–SUB-008 resolved or explicitly gated | Internal entitlement/lifecycle policy confirmed; selection, onboarding, provider behavior, and tax/legal conclusions gated |
| Communications/Support | COM-001–COM-004 and SUP-001–SUP-002 resolved or explicitly gated | Internal channel, recovery, and response policy confirmed; vendor contracts/registration gated |
| Threat/data-flow review | Initial diagrams and accountable-owner review | Ratified with the internal baseline through APPR-006 |
| Risk governance | Owners, probability, impact, mitigation, target and acceptance fields completed | Accountable roles and stage controls ratified; operational evidence continues in dependent stages |
| Pilot and launch authority | PROD-002 plus rollout/rollback/incident approvers | Controlled pilot policy confirmed; launch evidence remains Stage 4.12 work |

### Recorded approvals

#### APPR-001 — Batch A product approval

- Approval date: 20 July 2026
- Approver: Current stakeholder acting as Product Owner and final product stakeholder approver; personal name not supplied
- Approved: First-release Included/Deferred scope; responsive web/PWA-first delivery; TypeScript modular-monolith direction; monorepo; Next.js, NestJS, PostgreSQL, Prisma, Redis/BullMQ, and Socket.IO stack direction; AWS Mumbai baseline
- Specialist ownership: Technical, Security/Privacy, Finance/Billing, Operations, Support, Infrastructure/SRE, QA, and Design owners remain TBD
- Constraint: Product approval confirms product direction but does not impersonate required Technical, Security, Finance, Infrastructure, legal, or provider acceptance
- Source: Stakeholder approval message in the Phase 4 thread
- Related: PROD-001, PROD-003, PROD-004, ARC-001–ARC-006, INF-001, ADR-001–ADR-006

#### APPR-002 — Batch B product approval

- Approval date: 20 July 2026
- Approver: Current stakeholder acting as Product Owner and final product stakeholder approver; personal name not supplied
- Approved baseline: 99.9% pilot availability target; 15-minute RPO and 4-hour RTO starting targets; secure server sessions; customer-only Google OAuth; mandatory MFA for Admin, Support, and Super Admin; action-bound Staff delegation; deny-by-default authorization; PostgreSQL RLS tenant boundary; proposed data classification and handling rules
- Explicitly open: exact session factors/durations, Staff MFA decision, concurrent-device/recovery policy, backup retention, personal-data retention, legal bases, customer-rights timing, compliance interpretation, vendor terms, and named specialist owners
- Constraint: Technical, Security/Privacy, Infrastructure, Operations, Support, Finance/Compliance, and legal acceptance remain required where identified
- Source: Stakeholder Batch B approval message in the Phase 4 thread
- Related: INF-003, INF-004, IAM-001–IAM-007, DATA-001–DATA-007, ADR-003, ADR-004, ADR-006, ADR-009, ADR-011, `development/authorization-matrix.md`, and `development/data-governance.md`

#### APPR-003 — Batch C product approval

- Approval date: 20 July 2026
- Approver: Current stakeholder acting as Product Owner and final product stakeholder approver; personal name not supplied
- Approved direction: evaluate Cashfree first without premature selection; provider-verified transactional food payments; paid-through subscription entitlement; future-renewal cancellation with paid access through period end; retirement rather than deletion of referenced plans; in-app/email/SMS channel direction with WhatsApp deferred; verified Guest Support recovery; controlled pilot with reconciliation and rollback criteria
- Explicitly open: merchant/KYC/sandbox/provider due diligence, provider contract/version, food-payment capture/refund/settlement/dispute/tax policy, subscription grace/restriction/retry/proration/credit/tax policy, notification providers/templates/consent, Support SLA/verification details, pilot no-go metrics, and named specialist owners
- Constraint: No real provider is selected and no financial or entitlement implementation gate is cleared by this product-direction approval alone
- Source: Stakeholder Batch C approval message in the Phase 4 thread
- Related: PROD-002, PAY-001–PAY-007, SUB-001–SUB-008, COM-001–COM-004, SUP-001–SUP-002, ADR-007, ADR-008, ADR-010

#### APPR-004 — Technical, Security/Privacy, and Infrastructure ratification

- Approval date: 20 July 2026
- Approvers: Technical Lead, Security/Privacy Owner, and Infrastructure/SRE Owner are established externally; personal identities were not supplied for repository recording
- Ratified: ARC-001–ARC-006; AWS Mumbai; isolated environments; managed PostgreSQL/Redis/S3/container/CDN/TLS baseline; 99.9% pilot availability target; OpenTelemetry-compatible observability; PostgreSQL/RLS tenant-security direction; secure server-session and customer-only Google OAuth baseline; Super Admin elevation baseline; canonical safe production import; initial threat/data-flow direction
- Superseded by APPR-006: Internal INF-004, IAM-002–IAM-006, and DATA policy details are ratified. External legal/tax, provider, and vendor gates remain open; individual identities remain outside the repository.
- Source: Stakeholder statement that Technical, Security, and Infrastructure ownership and ratification are established
- Related ADRs: ADR-001–ADR-012 are accepted for their internal/provider-neutral decisions through APPR-006; external addenda remain required where stated.

#### APPR-005 — Remaining governance ownership confirmation

- Confirmation date: 20 July 2026
- Confirmed roles: Finance/Billing Owner, Restaurant Operations Owner, Support Owner, QA/Acceptance Owner, and Design/Accessibility Owner
- Identity handling: Roles are established externally; personal identities were not supplied to the repository
- Scope: Ownership confirmation only; it does not imply approval of open policies, provider selection, legal conclusions, acceptance evidence, or production readiness
- Source: Stakeholder confirmation in the Phase 4 thread

Stage 4.1 may begin only when architecture, repository, environment, and security-foundation decisions are Confirmed and no Stage 4.1 exit criterion is blocked. Payment and subscription implementation remains independently gated even if foundation work begins.

#### APPR-006 — Exact Stage 4.0 internal-policy ratification

- Approval date: 20 July 2026
- Approvers: Established Product, Technical, Security/Privacy, Infrastructure/SRE, Finance/Billing, Restaurant Operations, Support, QA/Acceptance, and Design/Accessibility owners; personal identities not supplied to the repository
- Ratified: The exact internal policy baseline in `development/stage-4.0-policy-resolution.md`, including reliability/recovery, identity and privileged access, data handling, provider-neutral food-payment and subscription behavior, communications/Support policy, and controlled pilot policy
- Explicitly gated: External provider onboarding, legal/tax conclusions, provider-specific behavior, and vendor contracts exactly as listed in Section 9 of the ratified policy
- Effect: Stage 4.0 internal governance is complete and Stage 4.1 may begin; this approval does not select Cashfree or clear the later Stage 4.6, 4.9, or 4.11 external gates
- Source: Accountable-owner ratification statement in the Phase 4 thread

## 7. Initial Production Risk Register

| ID | Risk | Likelihood | Impact | Proposed mitigation | Accountable role | Target stage | Status |
|---|---|---|---|---|---|---|---|
| R-001 | Cross-restaurant data exposure | Medium | Critical | Tenant ID, API authorization, RLS default deny, adversarial tests | Security Owner | 4.2–4.3 | Open |
| R-002 | Provider payment succeeds without order | Medium | Critical | Transactional creation, idempotency, reconciliation and alert | Technical + Finance Owners | 4.6 | Open |
| R-003 | Duplicate token/KOT/refund/reward | Medium | High | Unique constraints, locking, idempotency and replay tests | Technical Lead | 4.2/4.6/4.7 | Open |
| R-004 | Incorrect subscription access | Medium | High | Approved entitlement state machine and reconciliation | Product + Finance Owners | 4.9 | Open |
| R-005 | Provider onboarding delays | High | High | Complete merchant/sandbox evaluation and fallback decision in Stage 4.0 | Finance Owner | 4.0 | Open |
| R-006 | Privileged account compromise | Medium | Critical | MFA/reauth, least privilege, rotation, audit and response | Security Owner | 4.3 | Open |
| R-007 | Licence/personal-data leakage | Medium | High | Classification, private storage, limited access and retention | Privacy Owner | 4.0/4.4 | Open |
| R-008 | Lost realtime update causes stale operation | Medium | High | Authoritative API resync, versions and conflict checks | Technical Lead | 4.7 | Open |
| R-009 | Restore cannot meet business need | Medium | High | Approved RPO/RTO, automated backups and restore drills | Infrastructure Owner | 4.1/4.11 | Open |
| R-010 | Scope growth prevents pilot | High | High | Confirmed release boundary and change control | Product Owner | 4.0–4.12 | Open |
| R-011 | Webhook forgery/replay changes financial state | Medium | Critical | Raw-body signature, timestamp/version validation, event uniqueness and alerting | Security + Technical Owners | 4.6/4.9 | Open |
| R-012 | Support exceeds case purpose | Medium | High | Purpose-limited access, masking, elevation, audit and review | Support + Privacy Owners | 4.8 | Open |
| R-013 | Notification sent to wrong destination | Medium | High | Verified destination, minimal templates, tenant binding, delivery audit | Support/Operations Owner | 4.7 | Open |
| R-014 | Production secret enters client/log/source | Medium | Critical | Secret manager, CI scanning, redaction tests, least privilege and rotation drill | Security + Infrastructure Owners | 4.1/4.11 | Open |
| R-015 | Migration imports unsafe prototype credentials/data | Low | Critical | Canonical allowlisted schema, fresh invitations, dry-run report and security review | Technical + Security Owners | 4.10 | Open |

Accountable roles and Stage 4.0 acceptance authority are established through APPR-006. Named operator assignment, mitigation dates, measurable residual-risk targets, and implementation evidence remain required before the applicable implementation or launch gate. Likelihood and impact remain initial estimates for stage-level validation.

## 8. Architecture Decision Record Queue

The following ADRs should be created after decisions are approved:

Initial proposed ADR content is prepared in `development/architecture-decisions.md`; it remains non-binding until the required decisions and approvers are recorded.

- ADR-001 Modular monolith and module boundaries.
- ADR-002 Next.js/NestJS monorepo and shared contracts.
- ADR-003 PostgreSQL tenancy and Row-Level Security.
- ADR-004 Session, identity, Google OAuth, and workforce MFA.
- ADR-005 Redis/BullMQ, outbox, and realtime delivery model.
- ADR-006 AWS environment and deployment topology.
- ADR-007 Food payment provider and atomic order creation.
- ADR-008 UPI AutoPay mandate, entitlement, and reconciliation model.
- ADR-009 Object storage, uploads, licence evidence, and media delivery.
- ADR-010 Notification providers and channel policy.
- ADR-011 Export, retention, backup, restore, and deletion model.
- ADR-012 Observability, audit, and security-event handling.

## 9. Approval Record Template

Use this format when a decision is approved:

```text
Decision ID:
Final decision:
Alternatives considered:
Reason:
Consequences and tradeoffs:
Implementation constraints:
Required tests/monitoring/runbooks:
Approver name/role:
Approval date:
Supersedes:
Related ADR/worksheet items:
```

## 10. Immediate Next Action

Assign the governance roles, then review the register in dependency order:

1. PROD-001–PROD-004 release boundary.
2. ARC-001–ARC-006 architecture.
3. INF-001–INF-006 infrastructure and recovery.
4. IAM-001–IAM-007 identity and privilege.
5. DATA-001–DATA-007 privacy/data.
6. PAY, SUB, COM, and SUP provider/policy decisions.

Implementation must not begin by treating a `Proposed` entry as `Confirmed`.
