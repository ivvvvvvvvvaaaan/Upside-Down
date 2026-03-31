---
status: pending
priority: p1
issue_id: "001"
tags: [code-review, feasibility, planning]
dependencies: []
---

# P0 Scope Exceeds 3-Week Capacity

## Problem Statement

29 P0 features totaling ~68 person-days (~13.6 person-weeks) of estimated work. For a 3-week sprint, this requires 4-5 engineers with zero slack. The critical path (Inbox + Department Visibility backend) alone is ~4 weeks minimum.

## Findings

- **Feasibility reviewer**: 29 P0 items at 68 person-days. Even with 3 FE + 2 BE + 1 Algo (6 engineers, 18 person-weeks), barely feasible with zero overhead.
- **Stakeholder reviewer**: ~13.5 engineering-weeks of P0 work across 7 categories.
- **Feasibility reviewer**: Longest dependency chain (Inbox or Dept Visibility) exceeds 3 weeks even under optimistic conditions.
- All P0 items are flat priority -- no sub-tiers to guide trade-off decisions when time runs out.

## Proposed Solutions

### Option A: Sub-tier P0 into P0-must and P0-stretch
- **Pros**: Keeps full ambition visible; gives team clear guidance on what to cut
- **Cons**: Requires difficult prioritization conversations now
- **Effort**: Small
- **Risk**: Low

### Option B: Move 3-4 large P0s (Inbox, Dept Visibility, Smart Collections) to P1
- **Pros**: Reduces P0 to ~45 person-days (~9 person-weeks), achievable by 3 engineers
- **Cons**: Loses key features from V0; may disappoint stakeholders
- **Effort**: Small
- **Risk**: Medium (stakeholder pushback)

### Option C: Add a "V0 Scope Definition" section with explicit cut line
- **Pros**: Makes the trade-off transparent; defines "done" for V0
- **Cons**: Requires alignment with product/stakeholders
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected file**: `/Users/ibutyliuk/Documents/Obsidian Vault/NextGen 3W →.md`
- Feature Breakdown tables across all sections

## Acceptance Criteria

- [ ] P0 scope is sub-tiered or reduced to fit 3-week capacity
- [ ] A "V0 Scope Definition" section exists with explicit cut line
- [ ] Team composition and capacity are stated

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-27 | Created from document review | 5 agents agreed: scope exceeds capacity |

## Resources

- Feasibility review: Finding 1, Finding 7
- Stakeholder review: Finding 3.1
