---
status: pending
priority: p2
issue_id: "050"
tags: [code-review, schema-conformance]
dependencies: []
---

# Discover Permission Dead Code

## Problem Statement

`discover` permission exists in the `Permission` type and all UI mapping tables, but the schema explicitly says it was merged into `open`. No role group assigns it. This is dead code that contradicts the schema.

## Findings

- `discover` is included in the `Permission` type union at `grants.ts` line 35.
- All three UI mapping tables (`access-panel.tsx`, `shared-side-panel.tsx`, `settings-modal.tsx`) include `discover` entries.
- The sharing schema explicitly states `discover` was merged into `open`.
- No role group in the codebase assigns the `discover` permission.

## Proposed Solutions

### Option A: Remove discover from Permission type and all UI maps (Recommended)
- Remove `discover` from the `Permission` type in `grants.ts`.
- Remove `discover` entries from all UI mapping tables.
- **Effort**: Small (~10 lines removed)
- **Risk**: Low — dead code removal, no runtime behavior change

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/lib/grants.ts` line 35
  - `src/components/ui/access-panel.tsx`
  - `src/components/ui/shared-side-panel.tsx`
  - `src/components/ui/settings-modal.tsx`

## Acceptance Criteria

- [ ] `discover` is removed from the `Permission` type
- [ ] `discover` is removed from all UI permission mapping tables
- [ ] No references to `discover` remain in the codebase
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Schema says discover merged into open, but code still references it |

## Resources

- Sharing schema documentation on permission merging
- `src/lib/grants.ts` — Permission type definition
