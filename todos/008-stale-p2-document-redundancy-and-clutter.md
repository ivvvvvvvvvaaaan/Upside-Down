---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, simplicity, documentation]
dependencies: []
---

# Document Has Significant Redundancy and Clutter

## Problem Statement

Key decisions are repeated 3x, "Done" items waste visual space, User Stories overlap with Journeys, out-of-scope items are inline, Notes columns are too verbose, and open design questions are scattered across two locations.

## Findings

- **Simplicity reviewer**: Share/Release/Collections resolved decision appears in Journey 4, Sharing blockquote, AND Open Design Questions table.
- **Simplicity reviewer**: Access control three-layer model described in Journey 5, Access Control blockquote, AND Current State block.
- **Simplicity reviewer**: 8 "Done" rows in Navigation + Virtual Desktop tables carry zero actionable info.
- **Simplicity reviewer**: User Stories section is redundant with Journeys. Out-of-scope stories mixed with in-scope.
- **Simplicity reviewer**: Notes column has 40+ word cells with implementation detail.
- **Simplicity reviewer**: Open questions split between dedicated table and inline "Open design question" rows in feature tables.
- **Simplicity reviewer**: 4 non-blocking dependency map rows (Available items) add no value.
- **Simplicity reviewer**: User Persona section is underdeveloped and orphaned.

## Proposed Solutions

### Option A: Full cleanup pass
- State each resolved decision once in its canonical location
- Remove all "Done" rows; add brief "Completed" bullet list at bottom
- Collapse User Stories into 5-7 bullet "Scope Summary" or remove entirely
- Move out-of-scope items to "Future Scope" section at end
- Trim Notes to 5-15 words; move detail to tickets
- Consolidate all questions into one Open Questions table
- Remove non-blocking dependency map rows; add "Available Integrations" bullet list
- **Effort**: Medium
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected file**: `/Users/ibutyliuk/Documents/Obsidian Vault/NextGen 3W →.md`
- Throughout the entire document

## Acceptance Criteria

- [ ] No resolved decision is stated more than once
- [ ] No "Done" rows in feature tables
- [ ] Open questions consolidated into one table
- [ ] Notes cells are under 20 words each
- [ ] Non-blocking items removed from dependency map

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-27 | Created from document review | Simplicity reviewer found 11 issues |

## Resources

- Simplicity review: Findings 1-9
