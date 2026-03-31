---
status: pending
priority: p1
issue_id: "015"
tags: [code-review, architecture, data-consistency, maintainability]
dependencies: []
---

# Two Hooks With Divergent Data Sources Create Inconsistency

## Problem Statement

`useUnifiedDepartmentAssets` reads managed zones from localStorage (user-customized) while `useAllAssetsWithPromoted` uses "default managed IDs from static data." A file the user explicitly un-managed would still appear in search/collections. These two hooks also do the same merge logic with only a scope difference (one dept vs all depts), creating maintenance duplication.

## Findings

- **Architecture agent**: Data consistency violation — user toggles managed zone OFF, but file still shows in search.
- **Code simplicity agent**: Both hooks walk workspace files, generate AssetInstance objects, call `instanceToAsset`, and merge-deduplicate. The only difference is scope. Two parallel implementations will diverge.
- **Suggested alternative**: A single `mergeWorkspaceAssets(apiAssets, instances)` utility function (~10 lines) that both call sites invoke with the data they already have. Zero new hooks needed.

## Proposed Solutions

### Option A: Single utility function `mergeWorkspaceAssets()` in `asset-instances.ts`
- Not a hook. Call sites pass their own data.
- **Effort**: Small
- **Risk**: Low

### Option B: Single hook with `departmentId?: DepartmentId` parameter
- `undefined` means all departments. Both data sources use localStorage.
- **Effort**: Medium
- **Risk**: Low

### Option C: Keep two hooks but share a centralized "effective managed instances" function
- Always reads localStorage to ensure consistency.
- **Effort**: Medium
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: `useUnifiedDepartmentAssets` hook, `useAllAssetsWithPromoted` hook, asset-instances module
- localStorage stores user-customized managed zone state; static data provides default managed IDs

## Acceptance Criteria

- [ ] A single source of truth for managed zone state (localStorage) is used by all consumers
- [ ] Merge logic exists in exactly one location (utility function or single hook)
- [ ] Toggling a managed zone OFF removes its files from both department views and search/collections

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | Architecture and Code simplicity agents identified divergent data sources and duplication |

## Resources

- Architecture review: Data consistency analysis
- Code simplicity review: Hook duplication analysis
