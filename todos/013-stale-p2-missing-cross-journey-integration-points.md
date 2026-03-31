---
status: pending
priority: p2
issue_id: "013"
tags: [code-review, completeness, journeys]
dependencies: []
---

# Missing Cross-Journey Integration Points and Traceability

## Problem Statement

Journeys reference features from other journeys without cross-references. No traceability matrix maps journey steps to feature rows. This makes ticket creation interpretive rather than mechanical.

## Findings

- **Completeness reviewer**: Journey 1 step 6 ("sends collection via Send flow") is Journey 4's domain. No cross-reference.
- **Completeness reviewer**: Journey 2 step 2 ("check Inbox") references a feature defined in the Sharing section (Journey 4 domain).
- **Completeness reviewer**: No journey covers "search results -> add to collection" -- a common workflow spanning Journey 2 + Journey 4.
- **Stakeholder reviewer**: Journey-to-feature mapping is implicit. A developer creating tickets has to manually trace steps to feature rows.
- **Completeness reviewer**: Auto-tagging (Algo) to Manual tag editing (FE) fallback path not connected.

## Proposed Solutions

### Option A: Add cross-references between journey steps
- E.g., "Journey 1, step 6: [See Journey 4 for Send flow details]"
- **Effort**: Small
- **Risk**: Low

### Option B: Add a traceability matrix (journey step -> feature row)
- Simple table mapping each step to feature row(s)
- **Effort**: Medium
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected file**: `/Users/ibutyliuk/Documents/Obsidian Vault/NextGen 3W →.md`
- Journeys 1-5: lines 100-146

## Acceptance Criteria

- [ ] Each journey step that references another journey's feature includes a cross-reference
- [ ] "Search -> add to collection" workflow is captured somewhere
- [ ] Auto-tagging to manual-tagging fallback path is explicitly connected

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-27 | Created from document review | Completeness + Stakeholder agents flagged |

## Resources

- Completeness review: Findings 9.1-9.4
- Stakeholder review: Finding 1.5
