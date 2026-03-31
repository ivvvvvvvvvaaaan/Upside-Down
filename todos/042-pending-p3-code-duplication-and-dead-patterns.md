---
status: pending
priority: p3
issue_id: "042"
tags: [code-review, quality, simplification]
dependencies: []
---

# Code Duplication and Dead Patterns

## Problem Statement

Several small code quality issues: duplicated utility functions, default parameters that are never used, and static data threaded through context unnecessarily.

## Findings

- **TypeScript reviewer + Code simplicity reviewer**: `initials()` is duplicated in `persona-picker.tsx` (local) and `personas.ts` (exported). The picker should import from `personas.ts`.
- **Code simplicity reviewer**: `kindIcon()` is duplicated in `shared-side-panel.tsx` and `shared-view.tsx` with only icon size differing.
- **Code simplicity reviewer**: `allPersonas` on PersonaContext is a static constant (`PERSONAS` array) — could be imported directly where needed instead of threaded through context.
- **Code simplicity reviewer**: Default parameter values on `access.ts` utility functions (`hasAccess`, `getAccessibleFolderIds`, etc.) with `= DEFAULT_ACCESS_MAP` are never used — all callers pass the map explicitly. Defaults mask compile-time errors.
- **Code simplicity reviewer**: `emailsToFacepileUsers` in shared-view.tsx is used once and could be inlined.

## Proposed Solutions

### Option A: Fix all (Recommended)
- Import `initials` from `@/lib/personas` in persona-picker.tsx.
- Extract `kindIcon` to `@/lib/access.ts` with size parameter, or inline at each call site.
- Remove `allPersonas` from context; import `PERSONAS` directly.
- Remove default parameter values from `access.ts` utility functions.
- Inline `emailsToFacepileUsers`.
- **Effort**: Small (~30 min)
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/components/ui/persona-picker.tsx` — remove local initials, import from personas
  - `src/components/ui/shared-side-panel.tsx` + `src/app/nextgen/shared/shared-view.tsx` — deduplicate kindIcon
  - `src/hooks/usePersona.tsx` — remove allPersonas from context
  - `src/lib/access.ts` — remove default params from utility functions

## Acceptance Criteria

- [ ] No duplicated `initials` function
- [ ] `kindIcon` exists in one place (or inlined)
- [ ] `allPersonas` removed from context interface
- [ ] `access.ts` utility functions require explicit `accessMap` parameter
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Multiple reviewers flagged small duplication issues |

## Resources

- TypeScript review: Finding 6
- Code simplicity review: Findings 1, 2, 5, 8
