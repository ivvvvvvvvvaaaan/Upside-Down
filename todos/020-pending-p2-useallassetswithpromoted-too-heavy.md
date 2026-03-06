---
status: pending
priority: p2
issue_id: "020"
tags: [code-review, performance, architecture]
dependencies: []
---

# useAllAssetsWithPromoted Too Heavy for Search Page

## Problem Statement

The hook fetches from all 5 department APIs + computes promoted assets for all 5 departments on every search page mount, before the user types anything. Replaces a server-side data pattern (recentAssets passed as prop) with 5 client-side API calls + 5 tree walks + 5 merge/dedup passes.

## Findings

- **Performance agent**: 5 parallel fetch() calls, each triggering getAssets() which fetches the FULL dataset from Supabase then filters. The full dataset is fetched 5 times.
- **Performance agent**: All computation happens before user types a query. Eagerly loading everything for a page that may never be searched is wasteful.
- **Architecture agent**: Changes the search page from server-driven (recentAssets prop) to client-driven with no loading state handling.

## Proposed Solutions

### Option A: Defer full asset load until search query
- Defer full asset load until user types a search query (debounced). Keep server-side recentAssets for initial view.
- **Effort**: Small
- **Risk**: Low

### Option B: Single unified API endpoint
- Create a single /api/assets/all endpoint. One fetch instead of 5.
- **Effort**: Small
- **Risk**: Low

### Option C: Hybrid server/client pattern
- Keep existing server component pattern for curated assets, only add promoted assets client-side.
- **Effort**: Medium
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: useAllAssetsWithPromoted hook, search page component
- 5 department API calls on mount, each fetching full Supabase dataset before filtering

## Acceptance Criteria

- [ ] Search page does not trigger 5 API calls on initial mount
- [ ] Initial view uses server-side data for curated/recent assets
- [ ] Full asset loading is deferred until user initiates a search
- [ ] Loading states are properly handled during data fetching

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | Performance and Architecture agents confirmed excessive eager loading |

## Resources

- Performance review: API call and computation analysis
- Architecture review: Server-to-client migration analysis
