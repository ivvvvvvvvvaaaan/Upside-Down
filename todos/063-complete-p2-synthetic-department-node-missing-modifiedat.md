---
status: complete
priority: p2
issue_id: "063"
tags: [code-review, workspace, side-panel]
dependencies: []
---

# Synthetic Department Node Missing modifiedAt

## Problem Statement

The `effectiveNode` fallback in `workspace-view.tsx` synthesizes a `WorkspaceFileNode` for the department root, but omits `modifiedAt`. The `WorkspaceSidePanel` unconditionally renders a "Modified" row via `formatDate(node.modifiedAt)`, which will display a dash or "Invalid Date" for the synthetic node.

## Findings

- **File:** `src/app/nextgen/workspace/workspace-view.tsx`, lines 399-411
- **File:** `src/components/department/WorkspaceSidePanel.tsx`, lines 126-129
- The synthetic node has `{ id, name, type, children }` but no `modifiedAt`
- `formatDate(undefined)` produces a fallback string that may not be the intended display
- The same pattern exists in `departmentNodes` (line 216) which also omits `modifiedAt`
- Found by: architecture-strategist, kieran-typescript-reviewer

## Proposed Solutions

### Option A: Derive modifiedAt from most recent child
```tsx
modifiedAt: processedFiles.reduce((latest, f) =>
  f.modifiedAt && (!latest || f.modifiedAt > latest) ? f.modifiedAt : latest,
  undefined as string | undefined,
),
```
- **Pros:** Semantically meaningful, shows when department was last updated
- **Cons:** Slight computation cost (iterates children)
- **Effort:** Small
- **Risk:** Low

### Option B: Hide "Modified" row when modifiedAt is undefined
In `WorkspaceSidePanel`, conditionally render the Modified row:
```tsx
{node.modifiedAt && (
  <div className="flex justify-between text-label-1-regular">
    <span className="text-foreground-dim">Modified</span>
    <span className="text-foreground">{formatDate(node.modifiedAt)}</span>
  </div>
)}
```
- **Pros:** Clean display, no fake data
- **Cons:** Inconsistent layout between real and synthetic nodes
- **Effort:** Small
- **Risk:** Low

## Recommended Action

Option B is simpler and more robust — avoids computing derived dates and handles any node that lacks `modifiedAt`.

## Technical Details

- **Affected files:** `workspace-view.tsx`, `WorkspaceSidePanel.tsx`
- **Components:** WorkspaceView, WorkspaceSidePanel

## Acceptance Criteria

- [ ] Department root panel does not show "Invalid Date" or misleading modified date
- [ ] Real file/folder nodes still show their modified date correctly

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-31 | Created from code review | Synthetic nodes missing optional fields cause display artifacts |
