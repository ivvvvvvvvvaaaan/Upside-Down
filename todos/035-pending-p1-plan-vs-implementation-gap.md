---
status: pending
priority: p1
issue_id: "035"
tags: [code-review, architecture, sharing]
dependencies: []
---

# Plan vs Implementation Gap — Missing Permission Model

## Problem Statement

`SHARING_SCHEMA.md` describes a three-layer Google Docs-style permission system (Identity → Permissions → Collections) with `PermissionEntry`, `ShareTarget`, `Permission` types, teams, and role-based defaults. The actual implementation retains the old flat `AccessEntry` model with binary access (in list or not) and no permission differentiation (owner/editor/viewer).

## Findings

- **Architecture reviewer**: None of the planned types exist: `PermissionEntry`, `ShareTarget`, `Permission`, `UserRole` (enum), `Team`.
- **Architecture reviewer**: Planned files `src/lib/teams.ts` and `src/lib/permissions.ts` were never created.
- **Architecture reviewer**: `Persona.role` is a freeform `string` instead of the planned `UserRole` enum.
- **Architecture reviewer**: `AccessEntry` conflates access control, sharing metadata, and content (children) in one type.
- **Architecture reviewer**: `SHARING_SCHEMA.md` will mislead developers who expect these types to exist.

## Proposed Solutions

### Option A: Implement the planned schema
- Create `teams.ts`, `permissions.ts` with the types from `SHARING_SCHEMA.md`.
- Replace `AccessEntry.accessList` with `PermissionEntry[]`.
- Add Owner/Editor/Viewer permission levels.
- **Effort**: Large (multi-file refactor)
- **Risk**: Medium — touches all consumers of access data

### Option B: Mark SHARING_SCHEMA.md as future-state design
- Add a status banner: "Design document — not yet implemented"
- Document which parts are implemented vs planned.
- **Effort**: Small
- **Risk**: Low

### Option C: Implement incrementally
- Start with `Permission` type (owner/editor/viewer) on `AccessEntry`.
- Add permission level dropdown to AccessPanel UI.
- Defer teams and role defaults to a follow-up.
- **Effort**: Medium
- **Risk**: Low — additive changes

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `SHARING_SCHEMA.md` — documentation
  - `src/lib/access.ts` — AccessEntry type
  - `src/lib/personas.ts` — Persona type (role is string, not UserRole)
  - `src/components/ui/access-panel.tsx` — no permission dropdown
  - `src/components/ui/shared-side-panel.tsx` — no permission levels shown

## Acceptance Criteria

- [ ] SHARING_SCHEMA.md accurately reflects the current state (or is marked as future-state)
- [ ] If implementing: PermissionEntry type exists with owner/editor/viewer levels
- [ ] If implementing: AccessPanel shows permission level dropdown per user

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Architecture reviewer identified significant gap between documented plan and implementation |

## Resources

- `SHARING_SCHEMA.md` — planned architecture
- `src/lib/access.ts` — current implementation
