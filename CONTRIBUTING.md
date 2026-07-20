# Contributing to Autoserve

Production work follows Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`) and pull-request review. `main` is protected in the repository host: require the `quality`, `security`, `migration`, and `build` checks, one accountable review, resolved conversations, and no force pushes.

Run `npm run verify` before review. Database migrations are forward-only in production, must include a compatibility note and migration test, and use a new corrective migration instead of rewriting applied history. Features with incomplete policy/provider dependencies ship disabled through typed server-owned flags. Releases use immutable `vMAJOR.MINOR.PATCH` tags, staging evidence, an approver, smoke checks, and a recorded rollback artifact.

Never commit credentials. Copy `.env.example` to `.env.local` for local development; deployed secrets come from the environment's managed secret store. See `docs/development/engineering-standards.md` and `docs/development/incident-development.md`.
