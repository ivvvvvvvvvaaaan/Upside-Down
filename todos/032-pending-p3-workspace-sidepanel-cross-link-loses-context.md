---
status: pending
priority: p3
issue_id: "032"
tags: [code-review, ux, navigation]
dependencies: []
---

# WorkspaceSidePanel Cross-Link Loses Context

## Problem Statement

The proposed "View as asset in Art & Design" link navigates from /nextgen/workspace to /nextgen/departments/art-design. This loses workspace context (selectedNode is in-memory useState, not persisted). The user arrives at the department page with no indication of which specific asset to look at. No easy way back.

## Findings

- **UX agent**: selectedNode state is not persisted in localStorage. Navigating away and back resets it.
- **UX agent**: Department view has its own state (search query, sort, selected collection). User arrives with no context.
- The navigation sidebar doesn't highlight workspace when on a department page, losing spatial orientation.

## Proposed Solutions

### Option A: Use modal overlay for asset detail
- Use modal overlay (existing Modal component available) to show asset detail while keeping workspace context intact.
- **Effort**: Medium
- **Risk**: Low

### Option B: Deep-link to specific asset
- Deep-link to specific asset: /nextgen/departments/art-design?asset=ws-art-concept-1 with pre-selection.
- **Effort**: Medium
- **Risk**: Low

### Option C: Add "Back to Workspace" breadcrumb
- Add "Back to Workspace" breadcrumb on the department page when navigated from workspace.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: WorkspaceSidePanel component, department page navigation, selectedNode state management
- selectedNode is in-memory useState, not persisted across navigation
- Department view has independent state (search query, sort, selected collection)

## Acceptance Criteria

- [ ] Navigating from workspace to department view preserves context about which asset to view
- [ ] User has a clear path back to workspace with their previous state intact
- [ ] Navigation sidebar correctly indicates spatial context when cross-linking between views

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | UX agent identified context loss during cross-view navigation |

## Resources

- UX review: Navigation context and state persistence analysis
