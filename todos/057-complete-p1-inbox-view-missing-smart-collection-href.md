---
status: pending
priority: p1
issue_id: "057"
tags: [code-review, bug, smart-collections, inbox]
dependencies: []
---

# Inbox View Missing smart-collection Href

## Problem Statement

When a user receives a shared smart collection (e.g., Maria Santos receives "Finals" from Sarah Chen), clicking "Open" in the inbox view does nothing. The `selectedEntryHref` computation in `inbox-view.tsx` has no branch for `'smart-collection'`, so it returns `undefined`.

## Findings

- **File:** `src/app/nextgen/inbox/inbox-view.tsx`, lines 60-66
- The `selectedEntryHref` memo handles `'collection'` and `'folder'` but falls through to `undefined` for `'smart-collection'`
- The nav sidebar's `SharedCollectionNavItems` correctly routes smart collections to `/nextgen/smart-collections/${id}`, but the inbox does not
- Found by: pattern-recognition-specialist, architecture-strategist

## Proposed Solutions

### Option A: Add smart-collection case (Recommended)
Add a single line to the href computation:
```tsx
if (kind === 'smart-collection') return `/nextgen/smart-collections/${selectedEntry.resourceId}`
```
- **Pros:** Minimal change, consistent with nav-sidebar routing
- **Cons:** None
- **Effort:** Small (1 line)
- **Risk:** None

## Technical Details

- **Affected files:** `src/app/nextgen/inbox/inbox-view.tsx`
- **Components:** `InboxView`

## Acceptance Criteria

- [ ] Clicking "Open" on a shared smart collection in the inbox navigates to `/nextgen/smart-collections/{id}`
- [ ] Regular collection and folder links still work as before

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-31 | Created | Found during code review of smart collection ownership feature |
