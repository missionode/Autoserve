# Autoserve Engineering Standards

## Status

- Stage: 4.1 Engineering and Environment Foundation
- Effective: 20 July 2026
- Scope: production monorepo only; the frozen browser prototype remains unchanged

## Coding and Review

- Strict TypeScript and runtime validation are required at trust boundaries.
- Domain modules own their invariants and storage writes; cross-module changes use application services or events.
- Pull requests use Conventional Commits, link acceptance criteria, include tests, and require an accountable reviewer.
- `main` requires CI quality, security, migration, and build checks; force pushes and direct unreviewed changes are prohibited.
- Secrets, personal data, payment payloads, cookies, authorization values, and tokens must not enter source, logs, traces, or frontend bundles.

## Database Migrations

- Applied migration history is immutable. Production fixes use a new forward migration.
- Every migration is reviewed for locking, compatibility, tenant policy, data backfill, rollback/forward-fix, and observability.
- Destructive changes require an expand/migrate/contract sequence and separately recorded approval.
- CI validates naming and rejects destructive SQL in the ordinary path before applying migrations to a clean PostgreSQL service.

## Feature Flags

- Flags are typed, server-owned, environment-scoped, auditable, and default off for incomplete or provider-gated behavior.
- Authorization, payment confirmation, and tenant isolation cannot be bypassed with a flag.
- Every flag has an owner, expiry/removal condition, and tested behavior for both states.

## Releases and Incidents

- Releases promote one immutable image digest through development, staging, and production.
- Staging health and smoke evidence, migration evidence, approver identity, rollback target, and release notes are recorded before production.
- Rollback never rewrites an applied database migration; incompatible schema changes use a corrective forward path.
- Incident changes use the same audit trail, receive expedited peer review where possible, and require a follow-up review and permanent test.

## Local Commands

- `npm run verify`: formatting, linting, type checking, unit tests, secret scan, migration validation, and production build.
- `npm run test:failure-gates`: proves the failure controls reject deliberately bad fixtures.
- `npm audit --audit-level=high`: blocks high and critical dependency findings.
- `docker compose up -d`: PostgreSQL, Redis, MinIO, and provider stub when Docker is available.
- `npm run local:up`: build and start the complete web/API/worker/local-infrastructure stack and wait for health.
- `npm run local:smoke`: verify all local application and provider health endpoints.
- `sh scripts/local-backup.sh <path>` and `sh scripts/local-restore-verify.sh <path>`: verify database recovery without replacing the development database.
- `npm run seed`: deterministic foundation seed after PostgreSQL and the migration are available.
