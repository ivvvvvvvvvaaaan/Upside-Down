---
status: pending
priority: p1
issue_id: "002"
tags: [code-review, design, planning]
dependencies: []
---

# P0 Features Have No UX Design

## Problem Statement

At least 5 P0 features have "UX TBD -- needs design" with no designer assigned, no deadline, and no dependency link to the engineering work they unblock. In a 3-week sprint, design must be ready before Day 1.

## Findings

- **Inbox (XL)**: No UX design. "UX design needed: Inbox item design" row exists but no owner/date.
- **Send flow (L)**: "UX design needed: Send flow wireframe" -- branching logic, field layout, watermark toggle all undefined.
- **Shared (left nav) (M)**: "UX TBD -- needs design" -- no definition of what this page shows.
- **Bulk edit metadata (L)**: "UX TBD -- needs design" -- no corresponding "UX design needed" row (inconsistent with Sharing section).
- **File browser panel (L)**: No UX design callout at all despite being a complex Finder-style UI.
- **Collection creation flow**: No UX design callout for how users create collections.
- **Search results page**: No UX design callout for result display, ranking, empty states.

## Proposed Solutions

### Option A: Pre-sprint design sprint (2-3 days)
- **Pros**: All designs ready before engineering starts; no mid-sprint blocking
- **Cons**: Delays sprint start; requires designer availability
- **Effort**: Medium
- **Risk**: Low

### Option B: Add design owners and deadlines inline in the plan
- **Pros**: Makes the dependency explicit; enables parallel design+dev
- **Cons**: Risk of design arriving late and causing rework
- **Effort**: Small
- **Risk**: Medium

### Option C: Developer-led design for simpler items (Shared, Collection creation)
- **Pros**: Unblocks immediately; reduces design bottleneck
- **Cons**: UX quality may suffer
- **Effort**: Small
- **Risk**: Medium

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected file**: `/Users/ibutyliuk/Documents/Obsidian Vault/NextGen 3W →.md`
- Sharing table: lines 205-209
- Selection table: line 189
- Storage table: line 241
- Collections table: lines 178-179

## Acceptance Criteria

- [ ] Every P0 feature with "UX TBD" has a designer assigned and delivery date
- [ ] Missing "UX design needed" rows added for: file browser, collection creation, search results, bulk edit
- [ ] All P0 UX designs delivered before sprint Day 1

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-27 | Created from document review | Consistency + Completeness + Stakeholder agents all flagged this |

## Resources

- Consistency review: Findings 3, 7, 8
- Completeness review: Findings 5.1-5.4
- Stakeholder review: Findings 1.2, 5.1
