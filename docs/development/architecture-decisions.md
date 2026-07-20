# Autoserve Proposed Architecture Decisions

## Status

The established accountable owners ratified the Stage 4.0 internal policy baseline on 20 July 2026. ADR-001–ADR-012 are Accepted for their provider-neutral internal decisions. Provider onboarding, provider-specific behavior, legal/tax conclusions, and vendor contracts require later addenda and remain gated by Section 9 of `stage-4.0-policy-resolution.md`.

## ADR-001 — TypeScript Modular Monolith

- Status: Accepted 20 July 2026
- Decision: Build one domain-modular NestJS application with separately deployable Next.js web and BullMQ worker, sharing TypeScript contracts and one PostgreSQL source of truth.
- Why: Autoserve needs strong cross-domain transactions, a small initial operational footprint, and coherent tenant/security rules more than independent service scaling.
- Consequences: Enforce module boundaries in code; scale deployables independently; consider service extraction only through a later ADR supported by measured need.
- Alternatives: Microservices rejected for initial delivery; serverless-only rejected for transactional/realtime/worker complexity; frontend/backend mixed without domain boundary rejected.
- Approvers: Technical Lead; Product informed.

## ADR-002 — Monorepo and Shared Contracts

- Status: Accepted 20 July 2026
- Decision: Use one protected monorepo containing `apps/web`, `apps/api`, `apps/worker`, and shared database/contracts/UI/configuration/observability/testing packages.
- Why: Atomic contract changes and shared quality tooling reduce drift across one product and team.
- Consequences: CI uses affected-project optimization only after full required gates exist; packages have explicit dependency direction; deployable artifacts remain independent.
- Alternatives: Separate repositories may be reconsidered when independent teams and release cycles exist.
- Approvers: Technical Lead; Infrastructure Owner.

## ADR-003 — PostgreSQL, Prisma, and Tenant Isolation

- Status: Accepted 20 July 2026
- Decision: PostgreSQL is authoritative; Prisma handles application migrations/access; every tenant record has `restaurant_id`; API policy plus PostgreSQL RLS enforce isolation.
- Why: Orders, payments, KOTs, refunds, rewards, subscriptions, and audits require relational constraints and transactions.
- Consequences: Runtime DB user does not own tables or bypass RLS; raw SQL/migrations receive security review; database-policy tests are mandatory; money uses precise numeric/minor-unit conventions.
- Alternatives: Document databases rejected as primary; database-per-tenant deferred until scale/regulatory need.
- Approvers: Technical Lead; Security Owner; Data/Infrastructure Owner.

## ADR-004 — Server Sessions and Role/Capability Authorization

- Status: Accepted 20 July 2026
- Decision: Use server-side sessions referenced by Secure HTTP-only cookies. Authorization derives role, membership, capability, tenant, purpose, assurance, and record state on the server.
- Why: Browser-stored bearer authorization and prototype global session state are unsuitable for production.
- Consequences: Session store/revocation, CSRF, rotation, MFA/reauth, account recovery, and authorization matrix become platform foundations.
- External/later detail: Implementation library and provider configuration must conform to the ratified session, MFA, recovery, delegation, and elevation values.
- Approvers: Security Owner; Technical Lead; Product/Operations for user policy.

## ADR-005 — Transactional Outbox, BullMQ, and Realtime Resync

- Status: Accepted 20 July 2026
- Decision: Critical state changes commit with an outbox/event record; worker jobs are idempotent; Redis/BullMQ handles durable processing; Socket.IO accelerates updates; clients resync from API.
- Why: Redis Pub/Sub/WebSocket messages can be missed and must not be authoritative.
- Consequences: Event IDs/versions, dispatcher, retries, dead-letter handling, monitoring, and replay tools are required.
- Alternatives: Direct fire-and-forget notifications rejected; Kafka deferred until measured event scale/retention requires it.
- Approvers: Technical Lead; Infrastructure Owner.

## ADR-006 — AWS Mumbai Production Baseline

- Status: Accepted 20 July 2026
- Decision: Use isolated AWS environments with Mumbai as primary region, managed PostgreSQL, managed Redis, S3, CDN/TLS, secret management, and container compute for API/worker.
- Why: Recommended proximity to primary Indian users and mature managed services.
- Consequences: Exact account topology, compute product, RTO/RPO, availability target, retention, cost, and disaster-recovery design remain decisions.
- Alternatives: Other Indian-region providers remain valid if evaluated against security, managed-service, cost, support, and portability requirements.
- Approvers: Infrastructure Owner; Technical Lead; Security Owner; Product for cost/recovery target.

## ADR-007 — Provider-Verified Food Payment and Atomic Order Creation

- Status: Accepted 20 July 2026 — provider-neutral decision; provider addendum required
- Decision: Backend creates payment sessions. An authenticated, idempotent provider outcome triggers one database transaction that records success and creates immutable order, KOT, token, timeline, and outbox events.
- Why: Prevent false client success, duplicate fulfillment, paid-without-order loss, and mutable historical totals.
- Consequences: Unique provider/idempotency keys, callback inbox, reconciliation, refund flow, finance monitoring, and failure runbooks are required.
- Open detail: Cashfree/provider contract, capture model, pending timeout, refund/settlement/tax/dispute policies.
- Approvers: Finance Owner; Technical Lead; Security Owner; Operations.

## ADR-008 — Provider-Verified UPI AutoPay and Paid-Through Entitlement

- Status: Accepted 20 July 2026 — provider-neutral decision; provider and Finance addendum required
- Decision: Provider mandate/payment events are verified and idempotent; successful payment creates immutable plan snapshot and paid-through period; entitlement follows approved paid-through/grace policy rather than browser mandate state.
- Why: A mandate alone is not proof of a paid billing period.
- Consequences: State mapping, renewal/retry/reconciliation, cancellation, plan-change, finance/Support tooling, and access exceptions must be approved.
- Approvers: Product Owner; Finance Owner; Technical Lead; Operations/Support.

## ADR-009 — Object Storage and Upload Security

- Status: Accepted 20 July 2026 — internal storage/upload baseline; vendor and legal details gated
- Decision: Public menu/brand derivatives and private licence/export objects use separate access policies. Uploads use short signed operations, random keys, allowlisted types/sizes, verification/scanning, and metadata records.
- Why: Local paths and unrestricted public uploads cannot protect licences or scale media delivery.
- Consequences: Asset lifecycle, image processing, malware quarantine, private signed downloads, CDN, retention, and deletion jobs are required.
- Approvers: Technical Lead; Security/Privacy Owner; Infrastructure Owner.

## ADR-010 — Notification Abstraction and Delivery Evidence

- Status: Accepted 20 July 2026 — channel abstraction; provider addendum required
- Decision: Domain modules enqueue provider-neutral notification intents. Workers select approved email/SMS/in-app channels, render versioned templates, retry safely, and record delivery outcome.
- Why: Business transactions must not depend synchronously on third-party messaging and channel policy may change.
- Consequences: Consent/opt-out, required-service notices, destination verification, template approval, idempotency, privacy, fallback, and provider monitoring are required.
- Approvers: Product Owner; Support/Operations; Privacy Owner; Technical Lead.

## ADR-011 — Data Export, Backup, Restore, Retention, and Deletion

- Status: Accepted 20 July 2026 — internal lifecycle/recovery baseline; legal retention validation gated
- Decision: Tenant export is an authorized asynchronous product workflow; infrastructure backup is a separate encrypted recovery system; restore is controlled and audited; retention/deletion follows approved data-class rules.
- Why: Treating browser import/export as production recovery risks tenant leaks, incomplete backups, and corrupted authoritative state.
- Consequences: Canonical export schema, private expiring artifacts, reauth, completeness checks, RTO/RPO drills, deletion lifecycle, and backup residual policy are required.
- Approvers: Privacy/Security Owner; Infrastructure Owner; Product; Finance where records apply.

## ADR-012 — Observability and Immutable Audit Separation

- Status: Accepted 20 July 2026
- Decision: Operational telemetry uses structured logs, metrics, traces, and frontend monitoring; business/security audit events are separate governed records with stronger integrity and access controls.
- Why: Logs are not a reliable or privacy-appropriate substitute for financial/privileged audit history.
- Consequences: Correlation IDs connect telemetry to audit without copying sensitive payloads; alert ownership, retention, redaction, audit export, and incident preservation are required.
- Approvers: Technical Lead; Infrastructure Owner; Security Owner; Finance/Operations.

## Approval Process

For each ADR:

1. Assign an owner.
2. Confirm dependencies in `../production-decisions.md`.
3. Add alternatives and cost/security/operations implications specific to selected vendors.
4. Record approval names and date.
5. Change status to Accepted only after approval.
6. Link the ADR from the relevant worksheet item and implementation pull request.
7. Use a new ADR to supersede an accepted decision; do not silently rewrite its history.
