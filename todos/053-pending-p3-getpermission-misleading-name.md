---
status: pending
priority: p2
issue_id: "053"
tags: [code-review, quality]
dependencies: []
---

# getPermission Has Misleading Name

## Problem Statement

`getPermission` in the `useAccess` context returns an `AccessProfileId` (like `'editor'`, `'viewer'`), not a `Permission` (like `'open'`, `'download'`). Consumers expect granular permissions but get role names instead.

## Findings

- `getPermission` is defined at `useAccess.tsx` line 53 and implemented at lines 341-347.
- The return type is an `AccessProfileId`, not a `Permission`.
- The name suggests it returns a specific permission, but it actually returns a role/profile identifier.
- This creates confusion for consumers of the access context.

## Proposed Solutions

### Option A: Rename to getEffectiveProfile or getAccessProfile (Recommended)
- Rename `getPermission` to `getEffectiveProfile` or `getAccessProfile` throughout the codebase.
- Update all call sites.
- **Effort**: Small (rename + find-and-replace)
- **Risk**: Low — rename only, no logic change

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/hooks/useAccess.tsx` line 53 (type definition), lines 341-347 (implementation)
  - All consumers of the `useAccess` context that call `getPermission`

## Acceptance Criteria

- [ ] `getPermission` is renamed to `getEffectiveProfile` or `getAccessProfile`
- [ ] All call sites are updated
- [ ] No references to the old name remain
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Function name contradicts return type |

## Resources

- `src/hooks/useAccess.tsx` — access context definition and implementation
