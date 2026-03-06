---
status: pending
priority: p1
issue_id: "014"
tags: [code-review, architecture, data-integrity]
dependencies: []
---

# Deduplication by ID Is a No-Op

## Problem Statement

The plan proposes merging API assets with workspace-promoted assets and "deduplicating by ID." But API assets use IDs like `art-1` while workspace assets use `inst-ws-art-concept-1`. These namespaces never collide, so dedup does nothing. Users will see the same logical asset twice if it exists in both the API and workspace.

## Findings

- **Architecture agent**: `instanceToAsset()` generates IDs with prefix `inst-` (e.g., `inst-ws-art-concept-1`), while curated assets have server IDs. These are disjoint — dedup by ID will never actually remove duplicates.
- **Performance agent**: Confirmed — merge is effectively a plain concatenation with unnecessary Map overhead.
- No mechanism to detect semantic duplication (same file appears as both curated and promoted).

## Proposed Solutions

### Option A: Deduplicate by `sourceFileId`
- Add `sourceFileId` to promoted assets, match against curated assets. When match found, prefer curated version but merge AI fields.
- **Effort**: Medium
- **Risk**: Low

### Option B: Acknowledge disjoint sources — don't deduplicate
- Clearly differentiate curated vs promoted visually. Simple concatenation.
- **Effort**: Small
- **Risk**: Low (but users may see duplicates)

### Option C: Use a name-based fuzzy match
- Correlate by file name similarity.
- **Effort**: Large
- **Risk**: Medium (false positives)

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: `instanceToAsset()` in asset-instances module, merge logic in department hooks
- ID generation uses `inst-` prefix for workspace assets; server assets use unprefixed IDs like `art-1`

## Acceptance Criteria

- [ ] Deduplication strategy correctly identifies the same logical asset across API and workspace sources
- [ ] No duplicate assets appear in department views when the same file exists in both sources
- [ ] Merge strategy is documented and tested

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | Architecture and Performance agents confirmed dedup is ineffective |

## Resources

- Architecture review: ID namespace analysis
- Performance review: Merge operation analysis
