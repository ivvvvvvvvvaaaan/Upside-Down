---
status: pending
priority: p2
issue_id: "061"
tags: [code-review, performance, smart-collections, memoization]
dependencies: []
---

# visibleCollections and createCollection Depend on Full Persona Object

## Problem Statement

The `visibleCollections` memo and `createCollection` callback depend on `activePersona` (the full object) but only read `.email`. If the persona object reference ever changes without the email changing, these memos would unnecessarily recompute, cascading into context value invalidation and consumer re-renders.

## Findings

- **File:** `src/hooks/useSmartCollections.tsx`, lines 122-124 and 160-176
- `visibleCollections` depends on `[collections, activePersona]` but only reads `activePersona?.email`
- `createCollection` depends on `[activePersona]` but only reads `activePersona?.email`
- `createCollection` is in the context value dependency array, so its identity change forces new context value
- Found by: kieran-typescript-reviewer, performance-oracle

## Proposed Solutions

### Option A: Extract email into local variable (Recommended)
```tsx
const personaEmail = activePersona?.email
const visibleCollections = useMemo(() => {
  if (!activePersona) return collections
  return collections.filter(c => c.isDefault || c.createdBy === personaEmail)
}, [collections, personaEmail, activePersona])

const createCollection = useCallback((...) => {
  // ...
  createdBy: personaEmail,
  // ...
}, [personaEmail])
```
- **Pros:** Prevents unnecessary memo invalidation, minimal change
- **Cons:** None
- **Effort:** Small (5 minutes)
- **Risk:** None

## Technical Details

- **Affected files:** `src/hooks/useSmartCollections.tsx`

## Acceptance Criteria

- [ ] `visibleCollections` only recomputes when email or collections change
- [ ] `createCollection` identity is stable across same-email persona changes
- [ ] Context value doesn't invalidate unnecessarily

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-31 | Created | Found during code review of smart collection ownership feature |
