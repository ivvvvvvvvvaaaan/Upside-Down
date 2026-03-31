---
status: complete
priority: p3
issue_id: "064"
tags: [code-review, workspace, simplification]
dependencies: []
---

# Simplify effectiveNode — Remove useMemo

## Problem Statement

The `effectiveNode` derivation uses `useMemo` with 5 dependencies, but the computation is trivial (three `if` checks and one object literal). The consumer `WorkspaceSidePanel` is not wrapped in `React.memo`, so reference stability provides no re-render prevention benefit.

## Findings

- **File:** `src/app/nextgen/workspace/workspace-view.tsx`, lines 398-411
- `useMemo` adds cognitive overhead (5-item dependency array to maintain) for zero measurable benefit
- `WorkspaceSidePanel` at `src/components/department/WorkspaceSidePanel.tsx` is a plain component — re-renders whenever parent re-renders regardless of prop reference equality
- The only branch creating a new object is the `departmentId` fallback; the other two return existing references
- Found by: code-simplicity-reviewer

## Proposed Solutions

### Option A: Replace with plain variable using nullish coalescing
```tsx
const effectiveNode: WorkspaceFileNode | null =
  selectedNode ?? currentFolder ?? (departmentId
    ? { id: departmentId, name: departmentName, type: 'folder' as const, children: processedFiles }
    : null)
```
- **Pros:** Simpler, fewer lines, no dependency array to maintain
- **Cons:** Creates new object reference each render for department fallback (harmless without React.memo)
- **Effort:** Small
- **Risk:** Low

### Option B: Keep useMemo, add React.memo to WorkspaceSidePanel
- **Pros:** Prevents unnecessary side panel re-renders from parent state changes
- **Cons:** More code, requires stabilizing `onClose`/`onToggleManagedZone` callbacks with useCallback
- **Effort:** Medium
- **Risk:** Low

## Recommended Action

Option A — simplify. If performance profiling later shows the side panel as a bottleneck, Option B can be applied then.

## Technical Details

- **Affected files:** `workspace-view.tsx`

## Acceptance Criteria

- [ ] `effectiveNode` is a plain derived variable (no useMemo)
- [ ] Same fallback behavior: selectedNode → currentFolder → department → null
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-31 | Created from code review | useMemo without React.memo consumer provides no benefit |
