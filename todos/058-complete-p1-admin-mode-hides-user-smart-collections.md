---
status: pending
priority: p1
issue_id: "058"
tags: [code-review, smart-collections, admin, visibility]
dependencies: []
---

# Admin Mode Hides User-Created Smart Collections

## Problem Statement

When no persona is active (admin mode), the `visibleCollections` filter evaluates `c.createdBy === undefined`, which never matches user-created collections. Admin mode can only see the 5 system defaults, not any user-created smart collections (Finals, Key Art, Needs AI Review). This is inconsistent with every other resource type where admin sees everything.

Additionally, collections created while in admin mode get `createdBy: undefined`, making them invisible to all personas (not `isDefault`, no email match).

## Findings

- **File:** `src/hooks/useSmartCollections.tsx`, lines 122-124
- `visibleCollections` filter: `c.isDefault || c.createdBy === activePersona?.email` -- when `activePersona` is null, `null?.email` is `undefined`
- `createCollection` (line 171): sets `createdBy: activePersona?.email` which is `undefined` in admin mode, creating orphaned collections
- Found by: security-sentinel, kieran-typescript-reviewer

## Proposed Solutions

### Option A: Admin bypass in visibility filter (Recommended)
```tsx
const visibleCollections = useMemo(() => {
  if (!activePersona) return collections // Admin sees everything
  return collections.filter(c => c.isDefault || c.createdBy === activePersona.email)
}, [collections, activePersona])
```
- **Pros:** One-line fix, consistent with admin behavior elsewhere
- **Cons:** None
- **Effort:** Small
- **Risk:** None

## Technical Details

- **Affected files:** `src/hooks/useSmartCollections.tsx`

## Acceptance Criteria

- [ ] Admin mode (no persona) sees all smart collections in the nav
- [ ] Switching to a persona correctly filters to defaults + own creations
- [ ] Collections created in admin mode are visible to admin

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-31 | Created | Found during code review of smart collection ownership feature |
