---
status: pending
priority: p2
issue_id: "059"
tags: [code-review, smart-collections, authorization]
dependencies: []
---

# Smart Collection Mutations Lack Ownership Guards

## Problem Statement

`deleteCollection` and `updateCollection` in the SmartCollections provider perform no ownership or permission checks. Any persona can delete or modify any other persona's private smart collection through the exposed context API.

## Findings

- **File:** `src/hooks/useSmartCollections.tsx`, lines 178-189
- `deleteCollection` blindly filters by ID and always returns `true`
- `updateCollection` applies updates without checking `createdBy`
- The view has a partial UI guard (hiding delete for auto-generated children) but no logical guard
- Found by: security-sentinel, kieran-typescript-reviewer, architecture-strategist

## Proposed Solutions

### Option A: Add ownership checks to callbacks (Recommended)
```tsx
const deleteCollection = useCallback((id: string): boolean => {
  const target = collections.find(c => c.id === id)
  if (!target || target.isDefault) return false
  if (target.createdBy && target.createdBy !== activePersona?.email) return false
  setCollections(prev => prev.filter(c => c.id !== id))
  return true
}, [collections, activePersona])
```
- **Pros:** Prevents cross-persona mutation, return value becomes meaningful
- **Cons:** `collections` becomes a dependency (minor)
- **Effort:** Small
- **Risk:** Low

## Technical Details

- **Affected files:** `src/hooks/useSmartCollections.tsx`

## Acceptance Criteria

- [ ] Only the creator (or admin) can delete a user-created smart collection
- [ ] Only the creator (or admin) can update a user-created smart collection
- [ ] System defaults cannot be deleted
- [ ] `deleteCollection` returns `false` when not authorized

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-31 | Created | Found during code review of smart collection ownership feature |
