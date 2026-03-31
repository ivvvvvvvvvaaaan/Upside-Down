---
status: pending
priority: p2
issue_id: "038"
tags: [code-review, architecture, react]
dependencies: ["033"]
---

# Provider Architecture Issues — Nesting Order and Dependency Breadth

## Problem Statement

`FileTreeProvider` is nested inside `SmartCollectionsProvider` despite having no dependency on it, implying a false relationship. Additionally, `useWorkspaceState` depends on the entire `fileTree` context object rather than specific values, causing unnecessary effect re-runs.

## Findings

- **Architecture reviewer**: FileTreeProvider is independent — it should be above SmartCollectionsProvider in the tree (layout.tsx:21-31).
- **TypeScript reviewer**: `useWorkspaceState` uses `fileTree` (the entire context) as an effect dependency (useWorkspaceState.ts:153-162). This means the init effect re-runs on any tree mutation.
- **Performance reviewer**: `getDepartmentFiles` closes over `tree`, causing a new function reference on every tree change. Combined with `rawFiles` depending on `[fileTree, departmentId]`, workspace view recomputes on any tree mutation — even to other departments.

## Proposed Solutions

### Option A: Reorder providers and narrow dependencies (Recommended)
- Move FileTreeProvider above SmartCollectionsProvider in layout.tsx.
- Destructure `getDepartmentFiles` from `useFileTree()` in `useWorkspaceState` instead of depending on whole object.
- Fix `rawFiles` useMemo deps to `[getDepartmentFiles, departmentId]`.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/app/nextgen/layout.tsx` lines 21-31
  - `src/hooks/useWorkspaceState.ts` lines 153-162, 196-200
  - `src/hooks/useFileTree.tsx` lines 120-123

## Acceptance Criteria

- [ ] FileTreeProvider is above SmartCollectionsProvider in layout.tsx
- [ ] useWorkspaceState destructures specific functions from useFileTree
- [ ] rawFiles useMemo depends on `[getDepartmentFiles, departmentId]`
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Architecture + TypeScript + Performance reviewers all flagged |

## Resources

- Architecture review: Section 3.1
- Performance review: OPT-1
