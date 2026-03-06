---
status: pending
priority: p3
issue_id: "031"
tags: [code-review, code-quality, dead-code]
dependencies: []
---

# viewFilter Parameter in useWorkspaceState Is Dead Code

## Problem Statement

useWorkspaceState accepts a `viewFilter: WorkspaceViewFilter` parameter ('files' | 'assets' | 'mixed') but never uses it in the function body. The plan calls useWorkspaceState(departmentId, 'files') with a parameter that does nothing, creating confusion about whether it affects returned data.

## Findings

- **Performance agent**: The parameter is declared in the interface but has zero references inside the function. Passing 'files' has no effect.
- If viewFilter behavior is added later, it could silently change what useUnifiedDepartmentAssets returns.

## Proposed Solutions

### Option A: Remove the unused viewFilter parameter
- Remove the viewFilter parameter from useWorkspaceState. Clean up call sites.
- **Effort**: Small
- **Risk**: Low

### Option B: Implement or document intended behavior
- Implement its intended behavior if needed, or document it as reserved for future use.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: useWorkspaceState hook definition, call sites passing viewFilter
- Parameter declared as `viewFilter: WorkspaceViewFilter` ('files' | 'assets' | 'mixed') but never referenced in function body

## Acceptance Criteria

- [ ] viewFilter parameter is either removed or functionally implemented
- [ ] No unused parameters exist in useWorkspaceState signature
- [ ] Call sites do not pass arguments that have no effect

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | Performance agent confirmed parameter is unused in function body |

## Resources

- Performance review: Dead code analysis
