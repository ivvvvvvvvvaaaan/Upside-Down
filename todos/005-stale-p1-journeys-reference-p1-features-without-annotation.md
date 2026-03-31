---
status: pending
priority: p1
issue_id: "005"
tags: [code-review, consistency, journeys]
dependencies: []
---

# Journey Steps Reference P1 Features Without Annotation

## Problem Statement

Journey narratives read as if every step is P0, but several steps depend on P1 features. This creates false expectations about what V0 will deliver. Additionally, some P0 features have no journey step at all.

## Findings

- **Journey 1, step 3**: "On ingest, auto-tagging runs (Algo team)" -- but auto-tagging is P1/XL. No indication this step is optional.
- **Journey 1, step 2 Path A**: Auto-ingest is P1/XL. Path B (manual) is the P0 baseline, but the journey presents Path A first as "ideal."
- **Journey 2, step 5**: "adjust... visible metadata" -- but customizable metadata display is P1/M.
- **Manual tag editing (P0)**: Has no journey step. Journey 1 step 4 says "tweaks" auto-tags but doesn't cover manual tagging from scratch.
- **Sensitive content restriction (P0, Existing)**: No journey step describes encountering a restricted asset.
- **Per-asset action permissions (P0, Existing)**: No journey step describes lacking a capability.

## Proposed Solutions

### Option A: Annotate journey steps with priority tiers
- **Pros**: Reader instantly knows which steps are P0 baseline vs P1 stretch
- **Cons**: Makes journeys slightly less readable
- **Effort**: Small
- **Risk**: Low

### Option B: Add missing P0 feature steps to journeys
- **Pros**: Every P0 feature has a journey home; completeness improves
- **Cons**: Journeys get longer
- **Effort**: Small
- **Risk**: Low

## Recommended Action

Do both: annotate P1 steps AND add missing P0 steps.

## Technical Details

- **Affected file**: `/Users/ibutyliuk/Documents/Obsidian Vault/NextGen 3W →.md`
- Journeys 1-5: lines 100-146

## Acceptance Criteria

- [ ] Every journey step that depends on a P1 feature is annotated "(P1)"
- [ ] Manual tag editing has a journey step (Journey 1)
- [ ] Sensitive content restriction has a journey step (Journey 2 or 3)
- [ ] Per-asset permissions has a journey step (Journey 3 or 4)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-27 | Created from document review | Consistency + Completeness agents found complementary gaps |

## Resources

- Consistency review: Findings 6, 10
- Completeness review: Findings 2.1, 2.3, 2.4
