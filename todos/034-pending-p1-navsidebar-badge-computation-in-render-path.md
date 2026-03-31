---
status: pending
priority: p1
issue_id: "034"
tags: [code-review, performance, react]
dependencies: ["033"]
---

# NavSidebar Badge Computation in Render Path

## Problem Statement

Smart collection badge counts are computed inline during the render phase of `HardcodedNavigation` — running `matchesFilter` against every scoped asset for every collection on every render. Combined with unmemoized context values (033), this O(collections * assets) computation runs far more often than necessary.

## Findings

- **Performance reviewer**: `nav-sidebar.tsx` lines 542-543 run `scopedAssets.filter(a => matchesFilter(a, collection.filter)).length` for each of 5 parent collections during render. With N assets, that's 5N filter+string operations per render.
- **Performance reviewer**: At 1000 assets, estimated 5000 filter calls per sidebar render. At 10,000 assets, this would cause visible UI jank.
- **Performance reviewer**: `FolderNavTree` also calls `useAccess()` and `usePersona()` per recursive render (lines 334-337), creating redundant context subscriptions.

## Proposed Solutions

### Option A: Memoize badge counts in HardcodedNavigation (Recommended)
- Wrap badge computation in `useMemo` depending on `[collections, scopedAssets]`.
- **Effort**: Small (~10 lines)
- **Risk**: Low

### Option B: Pre-compute in SmartCollectionsProvider
- Add a `collectionCounts: Record<string, number>` to the context value.
- **Effort**: Medium
- **Risk**: Low — moves computation to a single location

### Option C: Hoist context hooks out of recursive FolderNavTree
- Pass `canAccess` and `activePersona` as props instead of calling hooks per tree level.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/components/ui/nav-sidebar.tsx` lines 334-337, 542-543
  - `src/hooks/useSmartCollections.tsx` (if Option B)
- `matchesFilter` does string operations (`.toLowerCase()`, `.includes()`) per call

## Acceptance Criteria

- [ ] Badge counts are memoized and only recompute when collections or assets change
- [ ] FolderNavTree does not create redundant context subscriptions per tree level
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Performance reviewer identified O(n*m) in render path |

## Resources

- Performance review analysis of re-render cascade
