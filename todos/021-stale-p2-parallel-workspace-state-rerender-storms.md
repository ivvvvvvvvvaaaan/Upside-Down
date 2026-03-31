---
status: pending
priority: p2
issue_id: "021"
tags: [code-review, performance, architecture]
dependencies: []
---

# Parallel Workspace State Creates Re-render Storms

## Problem Statement

useUnifiedDepartmentAssets and WorkspaceUnifiedTab both call useWorkspaceState independently — creating two separate state instances for the same department. Toggling a managed zone in workspace tab won't propagate to the department view until remount. Each state change in useWorkspaceState triggers cascading re-renders through the nested hook chain.

## Findings

- **Performance agent**: Two independent localStorage readers for the same department. Each maintains its own useState for managedFolderIds. Mutations in one don't trigger re-renders in the other.
- **Architecture agent**: Double computation — two separate markManagedZones + generateAssetInstances chains for the same department.
- **Performance agent**: Without proper useMemo, every render creates new Asset objects via instanceToAsset, invalidating all downstream consumers.

## Proposed Solutions

### Option A: React context for shared workspace state
- Lift workspace state to a React context (WorkspaceStateProvider per department). Both consumers share same state instance.
- **Effort**: Medium
- **Risk**: Low

### Option B: Accept assetInstances as parameter
- Have useUnifiedDepartmentAssets accept assetInstances as a parameter instead of calling useWorkspaceState internally. Parent component orchestrates both.
- **Effort**: Small
- **Risk**: Low

### Option C: Utility function instead of hook
- Use mergeWorkspaceAssets utility function (not hook) — avoids the nested hook problem entirely.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: useUnifiedDepartmentAssets hook, WorkspaceUnifiedTab component, useWorkspaceState hook
- Two independent localStorage readers for the same department data
- Cascading re-renders through nested hook chain on every state change

## Acceptance Criteria

- [ ] Only one instance of workspace state exists per department at any time
- [ ] Toggling a managed zone propagates to all consumers without remount
- [ ] No duplicate markManagedZones + generateAssetInstances computation chains
- [ ] Asset objects are properly memoized to prevent unnecessary downstream re-renders

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | Performance and Architecture agents confirmed duplicate state and computation |

## Resources

- Performance review: Re-render chain analysis
- Architecture review: Duplicate hook instantiation analysis
