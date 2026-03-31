---
status: pending
priority: p2
issue_id: "060"
tags: [code-review, performance, smart-collections]
dependencies: []
---

# childCollections Computed for Hidden Parent Collections

## Problem Statement

The `childCollections` memo in `SmartCollectionsProvider` iterates over all `collections` (including ones the current persona cannot see) to generate child collections. This wastes computation: children are generated for hidden parents and then never displayed.

## Findings

- **File:** `src/hooks/useSmartCollections.tsx`, lines 150-153
- `collections.flatMap(parent => generateChildCollections(parent, scopedAssets))` runs for ALL parent collections
- `generateChildCollections` internally calls `assets.filter(a => matchesFilter(a, parent.filter))` — O(parents * assets)
- At current scale (~8 collections, ~200 assets) this is negligible, but scales poorly
- Found by: performance-oracle

## Proposed Solutions

### Option A: Filter to visible parents before generating children (Recommended)
```tsx
const childCollections = useMemo(() => {
  if (scopedAssets.length === 0) return []
  return visibleCollections
    .filter(c => c.groupBy)
    .flatMap(parent => generateChildCollections(parent, scopedAssets))
}, [visibleCollections, scopedAssets])
```
- **Pros:** Eliminates wasted computation, simple change
- **Cons:** Children of hidden collections won't exist in `allCollections` (acceptable since they're never rendered)
- **Effort:** Small
- **Risk:** Low — verify `getRelatedCollections` still works (it uses `allCollections`)

## Technical Details

- **Affected files:** `src/hooks/useSmartCollections.tsx`

## Acceptance Criteria

- [ ] Child collections are only generated for visible parent collections
- [ ] Navigation to child collections still works for visible parents
- [ ] `getRelatedCollections` returns correct cross-dimensional links

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-31 | Created | Found during code review of smart collection ownership feature |
