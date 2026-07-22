# Stage 4.1 Verification Record

## Current Result

- Date: 21 July 2026
- Status: Stage 4.1A local Docker foundation complete; Stage 4.1B cloud deployment deferred
- Prototype boundary: preserved; production code is additive under `apps/`, `packages/`, `infrastructure/`, `.github/`, and root engineering configuration

## Verified Locally

| Control | Evidence | Result |
|---|---|---|
| Pinned workspace install | `package-lock.json` | Pass |
| Formatting, lint, strict type checks | `npm run verify` | Pass |
| Unit contract test | `tests/foundation.test.ts` | Pass |
| API, web, worker production builds | workspace build scripts | Pass |
| Repository secret scan | `scripts/scan-secrets.mjs` | Pass |
| Migration structural validation | `scripts/validate-migrations.mjs` | Pass |
| Deliberate failure controls | failing test, type error, secret, and invalid migration fixtures | All four blocked |
| Dependency severity gate | `npm audit --audit-level=high` | Pass; two moderate and one low transitive finding remain recorded |

## Local Docker Verification

| Control | Evidence | Result |
|---|---|---|
| Compose model | `docker compose config --quiet` | Pass |
| Pinned application images | `Dockerfile.local` for web/API/worker/migration/seed | Built |
| PostgreSQL and migration | PostgreSQL 17 health plus Prisma deploy | Pass |
| Deterministic seed | `foundation_probes.name = stage-4.1` | Pass |
| Redis, MinIO, provider stub | Compose health checks | Pass |
| Web/API/worker | `/health`, `/api/v1/health`, and worker `/health` | Pass |
| Persistent database volume | Seed remained after PostgreSQL container restart | Pass |
| Backup | `/tmp/autoserve-stage-4.1.sql` generated and non-empty | Pass |
| Restore | Restored into disposable `autoserve_restore_check`; expected row count verified | Pass |
| CI parity | `local-containers` job uses the same Compose build, smoke, backup, and restore flow | Configured |

The local stack remains available on ports 3000, 3001, 3002, 5432, 6379, 8089, 9000, and 9001. Local credentials are development-only defaults and must never be promoted to a deployed environment.

## Evidence Still Required

- Configure repository-host branch protection and environment approvals.
- Connect GitHub OIDC to distinct least-privilege AWS roles for development, staging, and production.
- Complete and apply reviewed environment IaC for VPC/private subnets, managed PostgreSQL/Redis, compute, service identities, TLS, DNS, CDN, storage policies, alarms, and dashboards.
- Replace the deployment/smoke adapters with the selected compute topology commands and environment URLs.
- Promote one immutable web/API/worker artifact to development and staging; capture health, smoke, observability, approval, and rollback evidence.
- Run migration apply and deterministic seed against an isolated PostgreSQL instance.
- Run Terraform validation and cloud apply from the approved deployment tooling when Stage 4.1B begins.

Stage 4.1A is sufficient to begin local Stage 4.2 development under the approved local-first plan. Overall Stage 4.1 remains In progress until Stage 4.1B supplies the original development/staging deployment evidence, and Stage 4.1B remains a mandatory pre-pilot gate.
