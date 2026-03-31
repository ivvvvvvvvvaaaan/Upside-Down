---
status: pending
priority: p2
issue_id: "040"
tags: [code-review, architecture, ux]
dependencies: []
---

# Persistence Inconsistency — File Tree Persisted, Access Map Not

## Problem Statement

File tree mutations (create/rename/delete folders) are persisted to localStorage and survive page reload. Access map mutations (updating access lists, revoking shares) are lost on reload because `AccessProvider` initializes from `structuredClone(DEFAULT_ACCESS_MAP)` every time.

## Findings

- **Architecture reviewer**: `useFileTree` persists via `unified-workspace-files-v5` localStorage key. `useAccess` uses `structuredClone(DEFAULT_ACCESS_MAP)` on mount — no persistence (useAccess.tsx:34-36).
- **Architecture reviewer**: This asymmetry means persona switching preserves file tree changes but resets access changes, confusing prototype testers.

## Proposed Solutions

### Option A: Persist access map to localStorage (Recommended)
- Save access map changes to localStorage like the file tree.
- Load from localStorage on mount with fallback to DEFAULT_ACCESS_MAP.
- **Effort**: Small (~10 lines)
- **Risk**: Low

### Option B: Don't persist file tree either
- Reset file tree to defaults on mount (like access map).
- **Effort**: Small
- **Risk**: Low — but loses a useful prototype feature

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/hooks/useAccess.tsx` lines 34-36

## Acceptance Criteria

- [ ] Access map mutations persist across page reload (or file tree mutations don't — pick one consistent strategy)
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Architecture reviewer identified inconsistency |

## Resources

- Architecture review: Section 4.1
