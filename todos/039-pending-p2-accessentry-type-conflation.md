---
status: pending
priority: p2
issue_id: "039"
tags: [code-review, architecture, typescript]
dependencies: ["035"]
---

# AccessEntry Type Conflates Access Control, Sharing, and Content

## Problem Statement

The `AccessEntry` type serves three distinct roles: folder ACL, shared collection with embedded file metadata, and shared individual asset. Fields like `children`, `sharedBy`, `sharedAt` are only relevant for certain `kind` values but are not type-narrowed. The `accessList` and `sharedWith` fields are redundant (sharedWith is always accessList minus sharedBy).

## Findings

- **Architecture reviewer**: AccessEntry serves too many roles — no discriminated union, consumers must defensively check optional fields (access.ts:17-28).
- **Architecture reviewer**: `DEFAULT_ACCESS_MAP` is a 280-line God Object mixing folder ACLs, shared collections, and shared assets.
- **Code simplicity reviewer**: `sharedWith` is derived data — it's always `accessList.filter(e => e !== sharedBy)`. The sync logic in updateAccessList (useAccess.tsx:78-79) is a bug vector.
- **Code simplicity reviewer**: `revokeShare` manually reconstructs the object to strip sharing fields (useAccess.tsx:85-99). Could be `const { sharedBy, sharedAt, sharedWith, children, ...cleaned } = entry`.
- **TypeScript reviewer**: `children` inline type should be extracted to a named type.

## Proposed Solutions

### Option A: Introduce discriminated union (Recommended)
```ts
type FolderAccess = { kind: 'folder'; id: string; accessList: string[]; departmentId: DepartmentId; ... }
type CollectionShare = { kind: 'collection'; id: string; accessList: string[]; sharedBy: string; children: ...; ... }
type AssetShare = { kind: 'asset'; id: string; accessList: string[]; sharedBy: string; ... }
type AccessEntry = FolderAccess | CollectionShare | AssetShare
```
- **Effort**: Medium
- **Risk**: Medium — touches all AccessEntry consumers

### Option B: Remove sharedWith + simplify revokeShare (Quick win)
- Derive "received by" from `accessList` + `sharedBy` at query time.
- Use destructuring in revokeShare.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/lib/access.ts` — type definition, DEFAULT_ACCESS_MAP
  - `src/hooks/useAccess.tsx` — updateAccessList, revokeShare
  - All consumers of AccessEntry

## Acceptance Criteria

- [ ] `sharedWith` field eliminated or AccessEntry uses discriminated union
- [ ] `revokeShare` uses destructuring instead of manual reconstruction
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Architecture + Code Simplicity + TypeScript reviewers all flagged |

## Resources

- Architecture review: Section 3.3
- Code simplicity review: Findings 3, 6
