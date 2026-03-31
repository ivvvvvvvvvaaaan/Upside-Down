---
status: pending
priority: p2
issue_id: "049"
tags: [code-review, quality]
dependencies: []
---

# Duplicate Constants Across Files

## Problem Statement

Multiple constants are duplicated across the codebase: `TEMPLATE_RANK` in `grants.ts` and `useAccess.tsx`. `PERM_TAG_TYPE`/`PERM_SHORT`/`PERM_LABELS` in `access-panel.tsx`, `shared-side-panel.tsx`, and `settings-modal.tsx` (3 copies). `getMorePermissiveTemplate` reimplements `mostPermissiveTemplate`. `userHasAccess` duplicates `resolveAccess`.

## Findings

- `TEMPLATE_RANK` is defined independently in both `grants.ts` and `useAccess.tsx`.
- `PERM_TAG_TYPE`, `PERM_SHORT`, and `PERM_LABELS` are copy-pasted across three UI components.
- `getMorePermissiveTemplate` in one location reimplements `mostPermissiveTemplate` from another.
- `userHasAccess` duplicates the logic of `resolveAccess`.

## Proposed Solutions

### Option A: Export once from grants.ts, import everywhere (Recommended)
- Consolidate `TEMPLATE_RANK`, `PERM_TAG_TYPE`, `PERM_SHORT`, `PERM_LABELS` into `grants.ts` as named exports.
- Remove `getMorePermissiveTemplate` and `userHasAccess` duplicates, replacing with imports.
- ~60 LOC removed.
- **Effort**: Small
- **Risk**: Low — pure constant/function deduplication

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/lib/grants.ts`
  - `src/hooks/useAccess.tsx`
  - `src/components/ui/access-panel.tsx`
  - `src/components/ui/shared-side-panel.tsx`
  - `src/components/ui/settings-modal.tsx`

## Acceptance Criteria

- [ ] `TEMPLATE_RANK` is defined in one place and imported elsewhere
- [ ] `PERM_TAG_TYPE`, `PERM_SHORT`, `PERM_LABELS` are defined in one place and imported elsewhere
- [ ] `getMorePermissiveTemplate` and `userHasAccess` duplicates are removed
- [ ] ~60 LOC removed
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Constants duplicated across 5 files |

## Resources

- `src/lib/grants.ts` — canonical location for permission constants
