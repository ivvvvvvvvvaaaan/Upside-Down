---
status: pending
priority: p3
issue_id: "044"
tags: [code-review, typescript]
dependencies: []
---

# Unsafe Type Assertions in FileTree

## Problem Statement

`getDepartmentFiles` casts `UnifiedFileNode[]` to `WorkspaceFileNode[]` without validation. This cast is repeated in multiple consumers. If these types diverge, the cast silently lies to the type system.

## Findings

- **TypeScript reviewer**: `useFileTree.tsx:122` casts `(findSubtree(tree, folderId) ?? []) as WorkspaceFileNode[]`. Same cast in `nav-sidebar.tsx` (lines 386, 515) and `workspace-view.tsx` (lines 178, 235).
- **TypeScript reviewer**: If `UnifiedFileNode` and `WorkspaceFileNode` are structurally identical, one should be an alias of the other. If they differ, a proper mapping function is needed.

## Proposed Solutions

### Option A: Make WorkspaceFileNode an alias of UnifiedFileNode (Recommended)
- If structurally identical, `type WorkspaceFileNode = UnifiedFileNode`.
- Remove all `as WorkspaceFileNode[]` casts.
- **Effort**: Small
- **Risk**: Low

### Option B: Add a type guard / mapping function
- Create `toWorkspaceFileNode(node: UnifiedFileNode): WorkspaceFileNode` with proper validation.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/hooks/useFileTree.tsx` line 122
  - `src/components/ui/nav-sidebar.tsx` lines 386, 515
  - `src/app/nextgen/workspace/workspace-view.tsx` lines 178, 235
  - `src/lib/workspace-data.ts` — type definitions

## Acceptance Criteria

- [ ] No `as WorkspaceFileNode[]` casts in the codebase
- [ ] Types are either unified or properly mapped
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | TypeScript reviewer identified repeated unsafe casts |

## Resources

- TypeScript review: Finding 3
