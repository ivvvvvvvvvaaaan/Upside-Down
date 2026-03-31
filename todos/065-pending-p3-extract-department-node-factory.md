---
status: pending
priority: p3
issue_id: "065"
tags: [code-review, workspace, architecture]
dependencies: []
---

# Extract Shared Factory for Synthetic Department Nodes

## Problem Statement

The same `WorkspaceFileNode` shape for departments is constructed inline in two separate places in `workspace-view.tsx`: the `departmentNodes` memo (line 216) and the new `effectiveNode` fallback (line 402). This duplication means changes to the department node shape must be coordinated in two locations.

## Findings

- **File:** `src/app/nextgen/workspace/workspace-view.tsx`, lines 216-226 (`departmentNodes`)
- **File:** `src/app/nextgen/workspace/workspace-view.tsx`, lines 402-408 (`effectiveNode` fallback)
- Both create `{ id, name, type: 'folder', children }` with no `modifiedAt`, `zone`, or `managedZone`
- If the interface evolves to require new fields, both sites must be updated independently
- Found by: architecture-strategist, kieran-typescript-reviewer

## Proposed Solutions

### Option A: Extract a `createDepartmentNode` helper
```tsx
function createDepartmentNode(
  deptId: DepartmentId,
  children: WorkspaceFileNode[],
): WorkspaceFileNode {
  return {
    id: deptId,
    name: departmentConfigs[deptId].name,
    type: 'folder',
    children,
  }
}
```
Use in both `departmentNodes` and `effectiveNode`.
- **Pros:** Single source of truth, named intent, testable
- **Cons:** Adds a function for a 5-line object literal
- **Effort:** Small
- **Risk:** Low

### Option B: Leave as-is
- **Pros:** No additional abstraction
- **Cons:** Two inline constructions to maintain
- **Effort:** None
- **Risk:** Low (duplication is minor)

## Recommended Action

Option A if todo 063 (modifiedAt) is also addressed — combining both concerns in one factory makes the cleanup worthwhile. Otherwise Option B is fine.

## Technical Details

- **Affected files:** `workspace-view.tsx`

## Acceptance Criteria

- [ ] Single factory produces department folder nodes
- [ ] Both `departmentNodes` and `effectiveNode` use the factory
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-31 | Created from code review | Synthetic node shapes duplicated across useMemo calls |
