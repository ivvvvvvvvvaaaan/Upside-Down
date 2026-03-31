---
status: pending
priority: p2
issue_id: "048"
tags: [code-review, architecture, permissions]
dependencies: []
---

# Access Resolution Split Across Layers

## Problem Statement

Grant resolution is split between `grants.ts` (direct/department access) and `useAccess.tsx` React context (collection-derived access). This means `grants.ts` cannot fully answer "does user X have access to asset Y?" — the React runtime is required. Collection ripple logic is untestable in isolation and has no test coverage.

## Findings

- `resolveAccess` in `grants.ts` handles direct and department-level grants but does not account for collection-derived access.
- `useAccess.tsx` lines 170-236 reimplement collection-ripple resolution inside a React context provider, making it impossible to unit test without rendering components.
- No test coverage exists for the collection ripple logic path.

## Proposed Solutions

### Option A: Move collection-ripple resolution into grants.ts (Recommended)
- Extract collection-ripple resolution from `useAccess.tsx` into a pure function in `grants.ts`.
- `useAccess.tsx` calls the pure function instead of reimplementing the logic.
- This enables unit testing without React rendering.
- **Effort**: Medium (~50 lines moved, interface changes)
- **Risk**: Low — logic is unchanged, just relocated

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/lib/grants.ts` (`resolveAccess`)
  - `src/hooks/useAccess.tsx` lines 170-236

## Acceptance Criteria

- [ ] Collection-ripple resolution is a pure function exported from `grants.ts`
- [ ] `useAccess.tsx` calls the pure function instead of inline logic
- [ ] Unit tests cover collection-ripple resolution without React rendering
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | grants.ts and useAccess.tsx split resolution responsibility |

## Resources

- `src/lib/grants.ts` — direct/department grant resolution
- `src/hooks/useAccess.tsx` — collection-derived access resolution
