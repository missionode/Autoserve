# Autoserve Stage Resume Protocol

## Purpose

This protocol makes Phase 4 resumable from any stage without relying on conversation history. It applies to Stages 4.0–4.12, split stages such as 4.1A/4.1B, provider gates, launch gates, and temporarily blocked work.

The canonical live state is `current-handoff.md`. The detailed checklist and completion authority remain in `../worksheet.md`; the handoff summarizes them but never overrides them.

## Required Handoff Fields

Every handoff update must record:

1. update date and active stage/substage;
2. stage status: `Ready`, `In progress`, `Blocked`, `Deferred gate`, or `Complete`;
3. completed stages and independently deferred gates;
4. first unchecked worksheet item;
5. last completed implementation checkpoint;
6. verification commands run and their exact pass/fail outcome;
7. evidence document/file links;
8. current blockers, required owner/input, and safe work that can continue;
9. next safe action, expressed as one concrete task;
10. boundaries: frozen prototype, unrelated worktree changes, external gates, and actions that are not authorized;
11. runtime state where relevant: services, ports, migrations, seed version, feature flags, and provider stubs;
12. known failures, partial changes, generated artifacts, and cleanup still required.

Never mark a stage Complete merely because its code exists. Its worksheet exit criteria and required evidence must pass.

## Cold-Start Procedure for Any New Session

1. Read `current-handoff.md` and the active stage section in `../worksheet.md`.
2. Read the evidence and decision files linked by the handoff; do not load unrelated stage documents unless needed.
3. Inspect `git status` and preserve all unrelated or user-owned changes.
4. Verify that the worksheet, Phase 4 Completion Summary, development-plan status, and handoff agree.
5. Reproduce the handoff's minimum health/quality command before editing. If it fails, diagnose the drift and update the handoff rather than assuming the prior state still holds.
6. Resume at the recorded first unchecked item and next safe action.
7. Do not cross into a later stage unless the worksheet exit criteria pass or an explicitly recorded Product Owner exception defines a safe split/deferred gate.

## End-of-Session Procedure

1. Stop at a coherent checkpoint; do not claim partially executed work as complete.
2. Update checklist items and exit criteria using `[ ]`, `[-]`, and `[x]` accurately.
3. Update the Phase 4 Completion Summary and overall/active-stage text.
4. Update `current-handoff.md` using every required field above.
5. Link or create a stage verification record containing commands, results, limitations, and dates.
6. Run:

   ```sh
   git diff --check
   npm run docs:handoff:check
   rg -n "Active local development stage|Deferred deployment gate|Production development completion" docs/worksheet.md
   rg -n "Active stage|First unchecked item|Next safe action|Last verified" docs/development/current-handoff.md
   ```

7. Run the stage-appropriate quality/health tests. Record failures rather than hiding them.
8. Search for stale status statements in `docs/README.md`, `docs/development-plan.md`, `docs/worksheet.md`, and the handoff.

## Stage Transition Rule

When a stage completes, replace—not append to—the active-stage snapshot in `current-handoff.md`. Move durable evidence to a stage-specific verification file, update the stage ledger, then set the new stage's first unchecked item and next safe action. This keeps the handoff short while preserving history in evidence records and version control.

If work becomes blocked, keep the active stage, record the precise blocker and accountable owner, and list any safe in-stage work that remains. If the Product Owner authorizes a split such as local-first/cloud-later, record the completed substage and deferred gate separately in both the worksheet and handoff.
