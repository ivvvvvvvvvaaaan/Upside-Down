---
status: pending
priority: p3
issue_id: "043"
tags: [code-review, quality, ux]
dependencies: []
---

# InboxView Hydration Gap and Minor Inconsistencies

## Problem Statement

`InboxView` does not check the `hydrated` flag from `usePersona()`, causing a flash of incorrect data on first render (admin view → persona view). Additionally, there are minor inconsistencies in null handling and unused destructures.

## Findings

- **TypeScript reviewer**: `SharedView` checks `!hydrated` and renders empty div while waiting. `InboxView` does not — it will flash with wrong data before localStorage hydration completes (inbox-view.tsx).
- **TypeScript reviewer**: `InboxView` destructures `activePersona` from `usePersona()` but never uses it (inbox-view.tsx:15). This creates an unnecessary context subscription.
- **TypeScript reviewer**: Inconsistent `sharedAt` null handling — `inbox-view.tsx:98` uses `entry.sharedAt ?? ''` while `shared-view.tsx:94` passes `entry.sharedAt` directly to `formatDate`. Both work, but pick one pattern.
- **Code simplicity reviewer**: `allProjectShares` is computed on every accessMap change even when no admin persona is active (useAccess.tsx:53-55). Could be made conditional.

## Proposed Solutions

### Option A: Fix all (Recommended)
- Add `hydrated` check to InboxView.
- Remove unused `activePersona` destructure.
- Standardize `sharedAt` handling.
- Make `allProjectShares` computation conditional on admin persona.
- **Effort**: Small (~10 lines)
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/app/nextgen/inbox/inbox-view.tsx` — add hydration check, remove unused destructure
  - `src/hooks/useAccess.tsx` — conditional allProjectShares

## Acceptance Criteria

- [ ] InboxView shows empty state during hydration (matches SharedView behavior)
- [ ] No unused destructures
- [ ] Consistent null handling pattern for optional date fields
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | TypeScript reviewer identified multiple minor issues |

## Resources

- TypeScript review: Findings 10, 11, 12
- Code simplicity review: Finding 9
