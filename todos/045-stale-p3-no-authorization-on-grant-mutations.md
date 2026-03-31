---
status: pending
priority: p3
issue_id: "045"
tags: [code-review, security, permissions]
dependencies: []
---

# No Authorization on Grant Mutations

## Problem Statement

`createGrant`, `revokeGrant`, `revokeShare`, `updateGrantProfile`, and `createProjectGrant` in useAccess.tsx perform zero authorization checks. Any user can escalate privileges, revoke others' grants, or grant themselves owner access. The schema's Sharing Authority table restricts grant creation to manager/artist roles only.

## Findings

- **Security reviewer**: Complete privilege escalation path identified. A vendor can grant themselves owner. A viewer can escalate to manager. Revoke operations are unscoped — any component can destroy any grant.
- **Security reviewer**: `createGrant` (useAccess.tsx:362-402) creates grants without checking the caller's role against the sharing authority table.
- **Security reviewer**: `revokeGrant` (useAccess.tsx:376-384) and `revokeShare` (useAccess.tsx:330-337) perform no scope checks — any component can revoke any grant.
- **Security reviewer**: `updateGrantProfile` allows changing grant roles without verifying the caller has `edit-acl` permission.

## Proposed Solutions

### Option A: Add role check against sharing authority table before mutations (Recommended)
- Check `share` permission for `createGrant` and `createProjectGrant`.
- Check `edit-acl` permission for `updateGrantProfile` and `revokeGrant`.
- Validate caller's role against the sharing authority table before any mutation.
- **Effort**: Medium
- **Risk**: Low

### Option B: Move mutation authorization into grants.ts as a pure function
- Extract a `canMutateGrant(userId, grant, operation)` pure function into `grants.ts`.
- All mutation callsites in useAccess.tsx delegate to this function before proceeding.
- Easier to unit test independently of React state.
- **Effort**: Medium
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/hooks/useAccess.tsx` lines 362-402 (createGrant, createProjectGrant)
  - `src/hooks/useAccess.tsx` lines 376-384 (revokeGrant)
  - `src/hooks/useAccess.tsx` lines 330-337 (revokeShare)
  - `src/hooks/useAccess.tsx` (updateGrantProfile)
  - `src/lib/grants.ts` (potential location for extracted authorization logic)

## Acceptance Criteria

- [ ] `createGrant` checks caller's role against sharing authority table before creating
- [ ] `revokeGrant` verifies caller has `edit-acl` permission
- [ ] `revokeShare` verifies caller has appropriate permission
- [ ] `updateGrantProfile` checks `edit-acl` before modifying grant roles
- [ ] No privilege escalation path exists (vendor cannot grant themselves owner)
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Security reviewer found complete privilege escalation path |

## Resources

- Security review: Grant mutation authorization findings
- SHARING_SCHEMA.md: Sharing Authority table
