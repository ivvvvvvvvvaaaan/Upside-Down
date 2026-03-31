---
status: pending
priority: p2
issue_id: "051"
tags: [code-review, architecture, ux]
dependencies: []
---

# WorkspaceSidePanel Shows Misleading Permissions

## Problem Statement

`WorkspaceSidePanel` shows static project-level team roles as "Inherited from [dept] workspace" but no actual inheritance resolution happens. The same teams/roles display regardless of folder depth. There is no check for broken inheritance (`no-inherit`). No direct grants are shown for the selected resource.

## Findings

- `WorkspaceSidePanel.tsx` lines 137-158 display team roles with "Inherited from [dept] workspace" labels.
- The displayed teams/roles are static and do not change based on the selected folder or asset.
- No logic checks for `no-inherit` flags that would break the inheritance chain.
- Direct grants on the selected resource are not shown.

## Proposed Solutions

### Option A: Show actual resource grants via AccessPanel (Recommended)
- Use `AccessPanel` to display actual grants for the selected node.
- Show inheritance context separately with clear labeling that it is project-level, not folder-level.
- Check for `no-inherit` flags and display accordingly.
- **Effort**: Medium
- **Risk**: Low — improves accuracy of displayed information

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/components/department/WorkspaceSidePanel.tsx` lines 137-158

## Acceptance Criteria

- [ ] Selected resource's direct grants are displayed
- [ ] Inheritance context is shown with accurate labeling
- [ ] `no-inherit` flags are checked and reflected in the UI
- [ ] Display changes when navigating to different folder depths
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Static team roles shown regardless of folder depth |

## Resources

- `src/components/department/WorkspaceSidePanel.tsx` — current implementation
- `src/components/ui/access-panel.tsx` — reusable access display component
