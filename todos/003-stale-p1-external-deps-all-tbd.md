---
status: pending
priority: p1
issue_id: "003"
tags: [code-review, dependencies, planning]
dependencies: []
---

# External Dependencies Are All TBD -- No Contacts, No Commitments

## Problem Statement

10 of 29 P0 features depend on external teams (Backend, Algo, LucidLink) whose commitment, capacity, and timeline are all "TBD." The dependency map has "TBD" in both Contact/Owner and Status columns for most entries. No fallback plans exist.

## Findings

- **Algo team**: TBD contact. Blocks semantic search (P0 XL).
- **LucidLink**: TBD status. Blocks file browser (P0 L) + manual ingest (P0 M).
- **Backend team (Netflix backend)**: TBD status. Blocks 5 P0s: API layer, performance, manual ingest, collections persistence x2.
- **Backend team (new access control)**: Blocks department visibility (P0 XL). Status: "Net-new."
- **Backend team (notification feed)**: Blocks Inbox (P0 XL). Status: "Net-new."
- No contingency/fallback plans documented for any dependency.
- No decision dates defined for confirming dependency status.

## Proposed Solutions

### Option A: Get written commitments before sprint starts
- **Pros**: Eliminates the largest risk in the plan
- **Cons**: May reveal that some teams can't commit, forcing scope changes
- **Effort**: Medium (coordination work)
- **Risk**: Low

### Option B: Add fallback/mock strategy for each TBD dependency
- **Pros**: FE work proceeds regardless; risk is managed
- **Cons**: Mocked features may need significant rework later
- **Effort**: Medium
- **Risk**: Medium

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected file**: `/Users/ibutyliuk/Documents/Obsidian Vault/NextGen 3W →.md`
- Dependency Map: lines 278-289

## Acceptance Criteria

- [ ] Every dependency row has a named contact person
- [ ] Every dependency has a confirmed status (committed / tentative / not started)
- [ ] Every dependency has an estimated delivery date
- [ ] Every TBD dependency has a documented fallback plan

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-27 | Created from document review | Feasibility + Stakeholder agents both flagged as highest risk |

## Resources

- Feasibility review: Finding 2
- Stakeholder review: Findings 3.4, 4.2
