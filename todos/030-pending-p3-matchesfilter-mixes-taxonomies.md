---
status: pending
priority: p3
issue_id: "030"
tags: [code-review, architecture, search]
dependencies: []
---

# matchesFilter Extension Mixes Structural and Content Taxonomies

## Problem Statement

Smart collections filter by typeTags (structural categories like "Concept Art", "Storyboards"). The plan extends matchesFilter to also search aiCharacters/aiKeywords/aiLocation (content entities like "Eleven", "Hawkins Lab"). These are different taxonomies. AI field matching belongs in the search bar (free-text), not in matchesFilter (structured filter matching).

## Findings

- **Code simplicity agent**: The smart collection "Characters" filters on `typeTags: ['Character']` — meaning assets whose typeTag is literally "Character", not assets that depict a specific character. Conflating these muddies semantics.
- **Code simplicity agent**: Search filtering should reuse matchesFilter with `{ query }` rather than implementing its own filter logic. The plan duplicates filter logic in search-view.tsx.

## Proposed Solutions

### Option A: Keep matchesFilter for smart collections only
- Keep matchesFilter as-is for smart collections. Add AI field matching only to the search implementation (construct AssetFilter with query, call matchesFilter).
- **Effort**: Small
- **Risk**: Low

### Option B: Separate matchesSearch function
- Add a separate `matchesSearch()` function that extends matchesFilter with AI field matching, used only by search.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: matchesFilter function, search-view.tsx, smart collection filter definitions
- typeTags are structural categories; aiCharacters/aiKeywords/aiLocation are content entities — different taxonomies

## Acceptance Criteria

- [ ] matchesFilter remains focused on structural taxonomy filtering (typeTags)
- [ ] AI field matching (aiCharacters, aiKeywords, aiLocation) is handled separately from smart collection filtering
- [ ] Search does not duplicate filter logic already present in matchesFilter
- [ ] Smart collection semantics are not muddied by content-level entity matching

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | Code simplicity agent identified taxonomy conflation and duplicated filter logic |

## Resources

- Code simplicity review: Taxonomy and filter logic analysis
