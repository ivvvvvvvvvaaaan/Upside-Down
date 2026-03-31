---
status: pending
priority: p1
issue_id: "004"
tags: [code-review, consistency, access-control]
dependencies: []
---

# Restricted Visibility (Layer 2) Missing From Feature Table

## Problem Statement

Journey 5 defines three access control layers. Layer 1 (Department visibility) and Layer 3 (Per-asset permissions) each have feature table rows. Layer 2 ("Restricted visibility -- project-level setting") has NO feature table entry. The dependency map references "Restricted visibility" as a backend P0 blocker, but there's no matching feature row to implement.

## Findings

- **Consistency reviewer**: Journey 5 layer 2 (line 143) describes restricted visibility as a distinct concept from sensitive content restriction. But the Access Control feature table only has "Sensitive content restriction" (existing, M effort) which covers lock icons + capability gates -- not the broader project-level setting.
- **Consistency reviewer**: The dependency map row for "Backend team (Netflix backend)" lists "Restricted visibility" under "Blocks (P0)" but this doesn't match any feature row.
- Either the dependency map is wrong (referring to the existing sensitive content feature), or there's a missing feature.

## Proposed Solutions

### Option A: Add a feature table row for "Restricted visibility (project-level setting)"
- **Pros**: Completes the three-layer model; makes scope explicit
- **Cons**: May add another net-new dependency if this doesn't exist
- **Effort**: Small (doc edit)
- **Risk**: Low

### Option B: Clarify that "Sensitive content restriction" IS the restricted visibility layer
- **Pros**: No new feature needed; existing code covers it
- **Cons**: May lose nuance between the two concepts
- **Effort**: Small (doc edit)
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected file**: `/Users/ibutyliuk/Documents/Obsidian Vault/NextGen 3W →.md`
- Journey 5: line 143
- Access Control feature table: lines 226-236
- Dependency Map: line 282

## Acceptance Criteria

- [ ] Layer 2 (Restricted visibility) either has its own feature row OR is explicitly mapped to an existing row
- [ ] Dependency map entry matches the feature table

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-27 | Created from document review | Consistency reviewer found the gap |

## Resources

- Consistency review: Findings 1, 4
