---
status: pending
priority: p3
issue_id: "062"
tags: [code-review, smart-collections, ui]
dependencies: []
---

# kindIcon Functions Missing smart-collection Branch

## Problem Statement

The `kindIcon` helper functions in `shared-view.tsx` and `shared-side-panel.tsx` have no explicit branch for `'smart-collection'`. Shared smart collections fall through to the generic `FileText` icon instead of getting the `LayoutGrid` icon used for regular collections.

## Findings

- **File:** `src/app/nextgen/shared/shared-view.tsx`, lines 19-23
- **File:** `src/components/ui/shared-side-panel.tsx`, lines 28-33
- Both functions check `'folder'` and `'collection'` explicitly but let `'smart-collection'` fall through to `FileText`
- Found by: pattern-recognition-specialist

## Proposed Solutions

### Option A: Expand collection branch to include smart-collection
```tsx
if (kind === 'collection' || kind === 'smart-collection') return <LayoutGrid ... />
```
- **Pros:** Consistent icon treatment, minimal change
- **Cons:** None
- **Effort:** Small (2 lines across 2 files)
- **Risk:** None

## Technical Details

- **Affected files:** `src/app/nextgen/shared/shared-view.tsx`, `src/components/ui/shared-side-panel.tsx`

## Acceptance Criteria

- [ ] Shared smart collections show `LayoutGrid` icon in shared view and side panel
- [ ] Regular collections still show `LayoutGrid` icon

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-31 | Created | Found during code review of smart collection ownership feature |
