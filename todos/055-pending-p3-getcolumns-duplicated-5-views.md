---
status: pending
priority: p3
issue_id: "055"
tags: [code-review, quality]
dependencies: []
---

# getColumns() Duplicated Across 5+ Views

## Problem Statement

An identical `getColumns()` function that maps `cardSize` to a column count is copy-pasted verbatim in at least five view files. Any change to the grid breakpoints or size-to-column mapping must be replicated in every location, creating a maintenance burden and divergence risk.

## Findings

- The same logic appears in all major grid-based views.
- Each copy is functionally identical — mapping card size strings to numeric column counts.
- No shared utility exists for this mapping despite it being a core layout concern.

## Proposed Solutions

### Option A: Extract to shared utility (Recommended)
- Create a `getGridColumns(cardSize)` function in `src/hooks/useViewPreferences.ts` or `src/lib/utils.ts`.
- Replace all inline copies with imports of the shared function.
- **Effort**: Small (extract + find-replace)
- **Risk**: Low — pure function with no side effects

### Option B: Move into useViewPreferences hook return value
- Have the `useViewPreferences` hook compute and return `columns` directly alongside `cardSize`.
- Consumers would destructure `columns` instead of calling a separate function.
- **Effort**: Small-Medium (hook change + update all consumers)
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/app/nextgen/workspace/workspace-view.tsx`
  - `src/app/nextgen/collections/[id]/view.tsx`
  - `src/app/nextgen/smart-collections/[id]/view.tsx`
  - `src/app/nextgen/search-view.tsx`
  - `src/app/nextgen/media-library/view.tsx`

## Acceptance Criteria

- [ ] A single shared `getGridColumns(cardSize)` function exists
- [ ] All five (or more) view files import and use the shared function
- [ ] No duplicate `getColumns` definitions remain
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Classic DRY violation across view layer |

## Resources

- Existing view files for current implementation reference
