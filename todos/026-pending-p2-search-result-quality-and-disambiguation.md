---
status: pending
priority: p2
issue_id: "026"
tags: [code-review, ux, search]
dependencies: []
---

# Search Result Quality and Disambiguation

## Problem Statement

Search returns both curated department assets and workspace files with no source disambiguation, no relevance ranking, and potential duplicates. A search for "Eleven" could return a curated "Eleven - Hero Pose" alongside raw workspace files "protagonist_turnaround.png" with no indication of which is the authoritative asset.

## Findings

- **UX agent**: No combined "source" indicator. AssetCard can show department tag OR workspace tag but not a clear provenance story.
- **UX agent**: With 5 departments x ~10-20 workspace files each, search results could include 50+ raw files burying curated assets.
- **Performance agent**: No deduplication between curated and promoted versions of same logical asset.

## Proposed Solutions

### Option A: Group results by source
- Group search results by source: "Department Assets" section above "Workspace Files (AI-matched)" section. Prioritize curated.
- **Effort**: Small
- **Risk**: Low

### Option B: Relevance scoring
- Add relevance scoring — curated assets rank higher than AI-inferred. Show score-ordered single list.
- **Effort**: Medium
- **Risk**: Low

### Option C: Default to curated with toggle
- Show only curated assets by default. Add a "Include workspace files" toggle.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: Search view component, AssetCard component, search result rendering logic
- 5 departments x ~10-20 workspace files = potentially 50+ raw files in results
- No deduplication between curated and promoted versions of same logical asset

## Acceptance Criteria

- [ ] Users can distinguish curated assets from workspace files in search results
- [ ] Curated assets are prioritized over raw workspace files
- [ ] Search results do not show duplicate representations of the same logical asset
- [ ] Result set remains manageable and navigable at scale

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | UX and Performance agents identified disambiguation and ranking gaps |

## Resources

- UX review: Source disambiguation analysis
- Performance review: Deduplication gap analysis
