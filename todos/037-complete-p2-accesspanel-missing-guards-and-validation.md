---
status: pending
priority: p2
issue_id: "037"
tags: [code-review, security, ux]
dependencies: []
---

# AccessPanel Missing Guards and Validation

## Problem Statement

The `AccessPanel` component allows removing all users from an access list (including the share creator/owner) and accepts any string as an "email" without validation. The `updateAccessList` and `revokeShare` functions have no authorization checks — they are UI-gated only.

## Findings

- **TypeScript reviewer**: No guard prevents removing the last email or the share creator (access-panel.tsx:29-31).
- **Security reviewer**: No email format validation — `type="email"` on the input only validates on form submission, not on Enter keypress or button click (access-panel.tsx:21-27).
- **Security reviewer**: `updateAccessList` and `revokeShare` perform no authorization checks (useAccess.tsx:72-83, 85-99). UI `readOnly` prop is the only gating.
- **TypeScript reviewer**: Owner should be shown as non-removable in the UI.

## Proposed Solutions

### Option A: Add guards at component and data layer (Recommended)
- Prevent removing `entry.sharedBy` email (owner).
- Prevent empty access lists.
- Add email regex validation: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- Add persona check in `updateAccessList`/`revokeShare`.
- **Effort**: Small (~15 lines across 2 files)
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/components/ui/access-panel.tsx` lines 21-31, 46-69
  - `src/hooks/useAccess.tsx` lines 72-99

## Acceptance Criteria

- [ ] Cannot remove the share creator from the access list
- [ ] Cannot create an empty access list
- [ ] Email input validates format before accepting
- [ ] Owner row shows "Owner" badge and no remove button
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | TypeScript + Security reviewers both flagged |

## Resources

- TypeScript review: Finding 4
- Security review: Findings 4, 5
