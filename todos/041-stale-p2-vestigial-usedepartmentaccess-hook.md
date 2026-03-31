---
status: pending
priority: p2
issue_id: "041"
tags: [code-review, simplification]
dependencies: []
---

# Vestigial useDepartmentAccess Hook

## Problem Statement

After the refactor, `useDepartmentAccess` is a 37-line hook that wraps a 2-line operation: read `activePersona.departmentAccess[id]` with a fallback to `'full'`. It has only one remaining consumer (`DepartmentHomeView.tsx`). The hook, its barrel export, and its type export add navigational overhead without providing meaningful abstraction.

## Findings

- **Code simplicity reviewer**: The hook could be replaced at the call site with 2 lines: `const { activePersona } = usePersona(); const accessLevel = activePersona?.departmentAccess[config.id] ?? 'full'`.
- **Architecture reviewer**: The hook exists historically. Now it is a direct passthrough with no genuine responsibility.
- **Code simplicity reviewer**: Removing it saves 37 LOC, one module, one barrel export, and eliminates an abstraction layer.

## Proposed Solutions

### Option A: Inline at call site (Recommended)
- Replace usage in `DepartmentHomeView.tsx` with direct `usePersona()` call.
- Delete `useDepartmentAccess.ts`.
- Remove from `hooks/index.ts`.
- **Effort**: Small
- **Risk**: Low

### Option B: Keep but document intent
- Add comment explaining why the hook exists (future: will compute access from multiple sources).
- **Effort**: Trivial
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/hooks/useDepartmentAccess.ts` — delete
  - `src/hooks/index.ts` — remove export
  - `src/components/department/DepartmentHomeView.tsx` — inline logic

## Acceptance Criteria

- [ ] `useDepartmentAccess` either removed or has a documented purpose
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Code simplicity + Architecture reviewers both flagged |

## Resources

- Code simplicity review: Finding 4
- Architecture review: Section 3.4
