---
status: pending
priority: p1
issue_id: "046"
tags: [code-review, security, permissions, architecture]
dependencies: []
---

# Collection Ripple Escalates Beyond Schema

## Problem Statement

Collection ownership grants owner-level permissions on all assets in the collection via `collectionAssetAccessById`. A user who was shared a collection as `viewer` could create their own collection referencing the same asset IDs and gain `owner` access. The schema says collection ripple should default to `read-only` and never grant destructive actions.

## Findings

- **Security reviewer**: `collectionAccessById` (useAccess.tsx:170-212) uses `collection.createdBy` for ownership, then propagates owner-level access to every asset in the collection.
- **Architecture reviewer**: This violates the SHARING_SCHEMA.md inheritance vs ripple principle — ripple should cap at the grant level of the collection share, not the creator's ownership level.
- **Security reviewer**: A user shared a collection as `viewer` can create their own collection with the same asset IDs, becoming the `createdBy` owner and gaining full owner access to those assets.
- **Architecture reviewer**: The collection-to-asset access propagation (useAccess.tsx:170-236) has no ceiling mechanism to enforce the schema's ripple policy.

## Proposed Solutions

### Option A: Cap collection-asset ripple at grant level (Recommended)
- When computing asset access via collection membership, cap the propagated permission at the grant level of the collection share (not the creator's ownership level).
- Add a ripple policy ceiling per the schema definition.
- Ensure creating a new collection referencing existing assets does not escalate access beyond what the user already has on those assets.
- **Effort**: Medium
- **Risk**: Low — tightens permissions, does not break existing legitimate access

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/hooks/useAccess.tsx` lines 170-236 (collectionAccessById, collectionAssetAccessById)
  - `SHARING_SCHEMA.md` (defines ripple policy that is currently violated)

## Acceptance Criteria

- [ ] Collection-asset ripple never exceeds the grant level of the collection share
- [ ] Creating a new collection with existing asset IDs does not escalate access
- [ ] Viewer-level collection shares propagate read-only access to contained assets
- [ ] Owner-level collection access still works correctly for legitimate owners
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Security + Architecture reviewers both flagged inheritance vs ripple violation |

## Resources

- Security review: Collection access escalation finding
- Architecture review: Inheritance vs ripple principle violation
- SHARING_SCHEMA.md: Ripple policy definition
