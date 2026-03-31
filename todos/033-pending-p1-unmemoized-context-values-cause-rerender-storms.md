---
status: pending
priority: p1
issue_id: "033"
tags: [code-review, performance, react]
dependencies: []
---

# Unmemoized Context Values Cause Re-render Storms

## Problem Statement

Three React context providers pass inline object literals as their `value` prop, creating a new reference on every render. This forces every consumer to re-render regardless of whether actual data changed. Since `PersonaProvider` is at the top of the provider tree, any re-render cascades through `AccessProvider`, `SmartCollectionsProvider`, and all consumers — affecting the entire app.

## Findings

- **TypeScript reviewer**: PersonaProvider (usePersona.tsx:47) and SmartCollectionsProvider (useSmartCollections.tsx:236-255) create new objects every render.
- **Performance reviewer**: Confirmed all three providers — PersonaProvider, SmartCollectionsProvider, UserCollectionsProvider — have this issue. AccessProvider and FileTreeProvider correctly use `useMemo`.
- **Performance reviewer**: A persona switch cascades through the entire component tree due to referential inequality of context values.

## Proposed Solutions

### Option A: Wrap context values in useMemo (Recommended)
- Add `useMemo` with correct dependency arrays to PersonaProvider, SmartCollectionsProvider, and UserCollectionsProvider.
- **Effort**: Small (3 changes, ~5 lines each)
- **Risk**: Low — standard React pattern already used by AccessProvider and FileTreeProvider

### Option B: Split contexts into separate value/dispatch contexts
- Separate read-only state from dispatch functions to minimize re-render scope.
- **Effort**: Large
- **Risk**: Medium — significant refactor

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/hooks/usePersona.tsx` line 47
  - `src/hooks/useSmartCollections.tsx` lines 236-255
  - `src/hooks/useUserCollections.tsx` lines 51-54
- Both `AccessProvider` (useAccess.tsx:101) and `FileTreeProvider` (useFileTree.tsx:146) already do this correctly — follow their pattern.

## Acceptance Criteria

- [ ] All five context providers wrap their value prop in `useMemo`
- [ ] React DevTools Profiler shows no unnecessary re-renders on persona switch
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review of Sharing & Permissions Schema Redesign | TypeScript + Performance reviewers both flagged independently |

## Resources

- React docs: useMemo for context values
- Existing pattern: `src/hooks/useAccess.tsx` lines 101-111
