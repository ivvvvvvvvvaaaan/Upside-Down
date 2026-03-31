---
status: pending
priority: p2
issue_id: "027"
tags: [code-review, architecture, error-handling]
dependencies: []
---

# No Error Handling in New Hooks

## Problem Statement

The planned hooks fetch from APIs but the plan does not describe error states. If one of 5 department API calls in useAllAssetsWithPromoted fails, the search view would show incomplete data with no indication.

## Findings

- **Performance agent**: Silent data loss if one department fails. Existing DepartmentHomeView has proper try/catch/loadError state, but new hooks omit this.
- The API route returns 500 status on error — client must check response.ok.

## Proposed Solutions

### Option A: Partial results with error metadata
- Return partial results with error metadata: { allAssets, errors: DepartmentId[], isLoading }. Show subtle indicator for failed departments.
- **Effort**: Small
- **Risk**: Low

### Option B: Fail entirely on any department error
- Fail entirely if any department fails — show error state.
- **Effort**: Small
- **Risk**: Medium (fragile)

### Option C: Retry with fallback to partial results
- Retry failed departments once, then show partial results.
- **Effort**: Medium
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: useAllAssetsWithPromoted hook, API route handlers
- Existing DepartmentHomeView has proper try/catch/loadError pattern to follow
- API routes return 500 status on error; client must check response.ok

## Acceptance Criteria

- [ ] All API calls in new hooks have proper error handling (try/catch or response.ok checks)
- [ ] Failed department fetches do not silently produce incomplete data
- [ ] Users receive visual indication when data is incomplete due to errors
- [ ] Error handling pattern is consistent with existing DepartmentHomeView approach

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | Performance agent confirmed silent data loss on partial failures |

## Resources

- Performance review: Error handling gap analysis
- Existing pattern: DepartmentHomeView try/catch/loadError implementation
