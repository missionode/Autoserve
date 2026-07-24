# Stage 4.2 Verification Record

## Checkpoint 1 — Identity and Restaurant Tenancy

- Date: 24 July 2026
- Status: Complete for the first Stage 4.2 worksheet item
- Scope: users, authentication identities, restaurants, memberships, licences, tables, pickup counters, and approval decisions

### Implemented controls

- UUID primary keys, UTC timestamp columns, optimistic version fields, foreign keys, restricted tenant-parent deletion, and restaurant-scoped uniqueness.
- Database checks for normalized email/handles, nonblank identifiers, positive versions/capacity, valid licence dates, currency format, and restaurant slug format.
- Deterministic Demo Kitchen tenant, Admin membership, licence, table, counter, approval actor, and approval-decision seed records.
- Prisma schema and forward migration `202607240001_identity_restaurant_tenancy`.

### Verification

| Evidence | Result |
|---|---|
| Prisma schema validation | Pass |
| Two migrations applied; migration status current | Pass |
| Prisma schema-to-database diff | No difference detected |
| Deterministic seed | Pass |
| Coherent restaurant aggregate integration test | Pass |
| Invalid table capacity rejected | Pass |
| Duplicate restaurant table code rejected | Pass |
| Unknown restaurant foreign key rejected | Pass |
| Local health smoke | Pass |
| SQL backup and disposable restore | Pass |

### Open dependency advisory

On 24 July 2026, `npm audit --audit-level=high` reports high transitive PostCSS and Sharp advisories inside Next.js 15.5.21. Next.js 15.5.21 fixes the direct framework advisories published for earlier versions, but its package still pins PostCSS 8.4.31 and permits Sharp below 0.35.0. npm overrides do not replace those nested packaged versions. This is recorded as a Security/Stage 4.11 and deployment gate; it does not alter the verified PostgreSQL checkpoint. Do not claim a clean high-severity dependency gate until an upstream-compatible patched tree is installed and retested.

## Checkpoint 2 — Catalog and Cart Foundation

- Date: 24 July 2026
- Status: Complete sub-slice; overall Stage 4.2 remains in progress
- Designed: restaurant categories, menu items, item availability, carts, cart lines, minor-unit price snapshots, optimistic versions, lifecycle statuses, and composite restaurant relations preventing cross-tenant references
- Migration: `202607240002_catalog_cart_foundation`; applied successfully
- Evidence: deterministic category/menu/availability/cart seed; four database tests passed; no Prisma drift; full repository verification, SQL backup/disposable restore, and local health smoke passed
- Enforced invariants: composite restaurant foreign keys, nonnegative minor-unit prices, exact line totals, positive quantities/versions, normalized slugs/currency, owned carts, valid JSON configuration snapshots, and LIMITED availability count requirement
- Next sub-slice: checkout, payment, order, immutable order line, KOT/token, and status-event foundations
