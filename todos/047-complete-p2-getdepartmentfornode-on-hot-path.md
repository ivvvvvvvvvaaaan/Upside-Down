---
status: pending
priority: p1
issue_id: "047"
tags: [code-review, performance]
dependencies: []
---

# getDepartmentForNode on Hot Path

## Problem Statement

`getDepartmentForNode` in useAccess.tsx iterates all 5 departments and recursively walks each department's entire workspace tree on every `canAccess` call. Called per-item in `filterByAccess`, per-folder in the workspace grid, and per-nav-item in the sidebar. Complexity is O(items * 5 * totalNodes) — quadratic.

## Findings

- **Performance reviewer**: At 100x data (5000 nodes), `filterByAccess` alone would take ~2500ms blocking the UI thread.
- **Pattern reviewer**: This is the dominant bottleneck in the access system.
- **Performance reviewer**: `getDepartmentForNode` (useAccess.tsx:119-126) performs a linear scan of all departments and recursive tree walk on every single invocation.
- **Pattern reviewer**: The function is called in tight loops (filterByAccess iterates all items, each calling canAccess, each calling getDepartmentForNode).

## Proposed Solutions

### Option A: Pre-compute node-to-department map (Recommended)
- Build a `Map<nodeId, DepartmentId>` once in `AccessProvider` via `useMemo`.
- Converts O(5N) lookup per call to O(1) amortized.
- Map is recomputed only when department data changes.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/hooks/useAccess.tsx` lines 119-126 (getDepartmentForNode)
  - `src/hooks/useAccess.tsx` (AccessProvider — location for pre-computed map)

## Acceptance Criteria

- [ ] `getDepartmentForNode` lookups are O(1) via pre-computed map
- [ ] Map is built once in AccessProvider and memoized
- [ ] `filterByAccess` performance scales linearly with item count
- [ ] No regressions in access check correctness
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Performance + Pattern reviewers identified as dominant bottleneck |

## Resources

- Performance review: getDepartmentForNode hot path finding
- Pattern review: Quadratic complexity in access checks
