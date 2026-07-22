# Autoserve Development Handoff

This is the canonical live resume snapshot. Update it through `stage-resume-protocol.md` after every meaningful checkpoint or stage transition.

## Active Stage Snapshot

- Updated: 21 July 2026
- Active stage: Stage 4.2 — Database, Tenancy, Audit, and Idempotency
- Status: Ready to start locally
- First unchecked item: Implement the approved PostgreSQL/Prisma identity, restaurant, membership, licence, table, and counter schema
- Last completed checkpoint: Stage 4.1A local Docker foundation and recovery verification
- Next safe action: Design and implement the first Stage 4.2 Prisma schema/migration slice for identity and restaurant tenancy, then test it in the local PostgreSQL container
- Blockers: None for local Stage 4.2 work
- Safe parallel work: None authorized; follow the worksheet sequentially

## Stage Ledger

| Stage | State | Evidence or resume note |
|---|---|---|
| 4.0 Decisions and Governance | Complete | `../production-decisions.md`, `stage-4.0-policy-resolution.md` |
| 4.1A Local Docker Foundation | Complete | `stage-4.1-verification.md` |
| 4.1B Cloud Deployment Foundation | Deferred mandatory gate | GitHub/AWS development and staging evidence required before pilot |
| 4.2 Database, Tenancy, Audit, and Idempotency | Ready | Active stage; no implementation item complete |
| 4.3–4.5 | Not started | Must follow Stage 4.2 exit criteria |
| 4.6 Payments | Not started; externally gated | Provider onboarding/behavior and legal/tax gates remain |
| 4.7–4.8 | Not started | Follow worksheet sequence |
| 4.9 Subscriptions | Not started; externally gated | Provider onboarding/behavior and legal/tax gates remain |
| 4.10–4.12 and Launch Gate | Not started | Stage and launch evidence required |

## Last Verified State

- Verification date: 21 July 2026
- `npm run verify`: passed
- `npm run test:failure-gates`: passed; failing test, type error, secret, and invalid migration were rejected
- `npm run local:smoke`: passed for web, API, worker, provider stub, and object storage
- Prisma migration and deterministic `stage-4.1` seed: passed
- PostgreSQL persistence after restart: passed
- SQL backup and disposable restore verification: passed
- Dependency gate: no high or critical findings; two moderate and one low transitive advisory recorded
- Detailed evidence: `stage-4.1-verification.md`

## Cold-Start Actions

1. Read `stage-resume-protocol.md`, this snapshot, the active section of `../worksheet.md`, `../development-plan.md`, and the evidence linked above.
2. Inspect `git status`; preserve unrelated/user-owned changes and the frozen prototype.
3. Run `docker compose ps -a`; if necessary, run `npm run local:up`.
4. Run `npm run local:smoke` and `npm run verify`.
5. If those checks match the recorded state, perform the Next safe action above and update this file before ending the session.

## Runtime and Boundaries

| Service | Address |
|---|---|
| Web | `http://localhost:3000` |
| API health | `http://localhost:3001/api/v1/health` |
| Worker health | `http://localhost:3002/health` |
| Provider stub | `http://localhost:8089/health` |
| MinIO API/console | `http://localhost:9000` / `http://localhost:9001` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

- The stakeholder-approved prototype is frozen; production work is additive.
- Do not start Stage 4.3 before Stage 4.2 exit criteria pass.
- Do not mark overall Stage 4.1 complete while Stage 4.1B is deferred.
- External provider onboarding, provider behavior, legal/tax conclusions, and vendor contracts remain gated.
- The workspace contains uncommitted user and production-foundation changes; never reset or discard them.
- The filesystem and repository documentation are authoritative, not prior conversation memory.

## Partial Work and Cleanup

- No known partial Stage 4.2 implementation exists.
- Local Docker containers may already be running; stopping them with `npm run local:down` preserves volumes.
- The local backup used for verification is in `/tmp` and is not production evidence.
