---
status: pending
priority: p3
issue_id: "056"
tags: [code-review, schema-conformance]
dependencies: []
---

# Scenario Seed Data Has Creative User as Share Grantor

## Problem Statement

The scenario seed data lists `creative-david` (role: creative) as the grantor of a share. According to the schema's Sharing Authority table, creative users do not have permission to create grants. This makes the prototype data inconsistent with the access model it is supposed to demonstrate.

## Findings

- At line ~155 of `src/lib/scenario.ts`, a grant entry uses `by: 'creative-david'`.
- `creative-david` has the `creative` role, which lacks sharing authority per the schema definition.
- Users with sharing authority include department-level roles like `editorial-artist` or `editorial-coordinator`.

## Proposed Solutions

### Option A: Change grantor to an authorized role (Recommended)
- Replace `by: 'creative-david'` with a user who has an appropriate role, such as `editorial-artist` or `editorial-coordinator`.
- **Effort**: Trivial (single line change)
- **Risk**: Low — seed data only, no runtime logic affected

### Option B: Grant creative role sharing authority
- Update the schema's Sharing Authority table to allow creatives to share.
- **Effort**: Small but has design implications
- **Risk**: Medium — changes the access model semantics

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/lib/scenario.ts` line ~155 — `by: 'creative-david'` grant entry

## Acceptance Criteria

- [ ] No grants in scenario seed data are attributed to users whose roles lack sharing authority
- [ ] Seed data is consistent with the Sharing Authority table in the schema
- [ ] Application still renders correctly with updated seed data

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | Seed data should conform to the access rules it demonstrates |

## Resources

- Sharing Authority table in schema documentation
- `src/lib/scenario.ts` for seed data definitions
