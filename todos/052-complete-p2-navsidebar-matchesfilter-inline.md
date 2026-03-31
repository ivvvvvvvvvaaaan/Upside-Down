---
status: pending
priority: p2
issue_id: "052"
tags: [code-review, performance]
dependencies: ["033"]
---

# NavSidebar matchesFilter Inline Computation

## Problem Statement

`NavSidebar` computes smart collection badge counts by filtering the entire `scopedAssets` array per collection during render. This is O(collections * assets) on every render of a persistent layout component.

## Findings

- `nav-sidebar.tsx` line 574 runs `matchesFilter` across `scopedAssets` for each smart collection during render.
- This computation runs on every render, not just when data changes.
- As a persistent layout component, `NavSidebar` renders frequently.
- Depends on issue 033 (unmemoized context values cause unnecessary re-renders).

## Proposed Solutions

### Option A: Memoize badge counts with useMemo (Recommended)
- Wrap badge count computation in `useMemo` with `[smartCollections, scopedAssets]` as dependencies.
- **Effort**: Small (~5 lines)
- **Risk**: Low — standard React memoization pattern

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/components/ui/nav-sidebar.tsx` line 574

## Acceptance Criteria

- [ ] Badge count computation is wrapped in `useMemo`
- [ ] Dependency array includes `smartCollections` and `scopedAssets`
- [ ] No unnecessary recomputation on unrelated renders
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | O(collections * assets) on every render |

## Resources

- `src/components/ui/nav-sidebar.tsx` — badge count computation
- Issue 033 — prerequisite fix for context re-renders
