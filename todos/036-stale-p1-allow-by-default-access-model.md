---
status: pending
priority: p1
issue_id: "036"
tags: [code-review, security, architecture]
dependencies: []
---

# Allow-by-Default Access Model

## Problem Statement

The access system defaults to granting full, unrestricted access in multiple places: null persona = admin mode, unknown resource IDs = unrestricted, assets without sourceFolderIds pass through. While intentional for the prototype's "Admin (All Access)" mode, these patterns are dangerous if carried forward.

## Findings

- **Security reviewer**: Null persona grants universal access — clearing `localStorage` or setting an unknown persona ID gives admin privileges (useAccess.tsx:57-58, 67-68; useDepartmentAccess.ts:24-26).
- **Security reviewer**: `hasAccess()` returns `true` for unknown IDs (access.ts:319: "No access entry = unrestricted").
- **Security reviewer**: `filterByAccess` passes through assets without `sourceFolderIds` (useAccess.tsx:61).
- **TypeScript reviewer**: The inverted security default should be documented prominently.
- **Security reviewer**: Persona lookup falling back to `null` (admin) when stored ID is invalid is particularly dangerous.
- **Architecture reviewer**: Conflates "no user logged in" with "superadmin."

## Proposed Solutions

### Option A: Add prominent documentation (Recommended for prototype)
- Add `// PROTOTYPE: In production, default must be deny-all` comments at each fallback point.
- Add a banner in README or SHARING_SCHEMA.md about the allow-by-default design choice.
- **Effort**: Small
- **Risk**: Low

### Option B: Flip to deny-by-default
- Null persona = no access (show login prompt instead of admin mode).
- Unknown IDs = restricted.
- Unknown persona IDs in localStorage = logged out, not admin.
- **Effort**: Medium — changes behavior across the app
- **Risk**: Medium — breaks current admin/debug workflow

### Option C: Separate admin toggle from persona state
- Add an explicit `isAdmin` flag instead of using `null` persona as admin.
- Unknown persona IDs fall back to a default restricted persona, not null/admin.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/hooks/useAccess.tsx` lines 57-58, 67-68
  - `src/hooks/useDepartmentAccess.ts` lines 24-26
  - `src/lib/access.ts` lines 317-321
  - `src/hooks/usePersona.tsx` line 28 (fallback to null)

## Acceptance Criteria

- [ ] Each allow-by-default fallback is either documented or changed to deny-by-default
- [ ] Unknown persona IDs in localStorage do not grant admin access
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Security + TypeScript + Architecture reviewers all flagged independently |

## Resources

- Security review: Findings 1, 2, 8
- OWASP: Secure by Default principle
