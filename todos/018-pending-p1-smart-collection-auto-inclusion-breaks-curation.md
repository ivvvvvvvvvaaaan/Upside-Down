---
status: pending
priority: p1
issue_id: "018"
tags: [code-review, ux, architecture, collections]
dependencies: []
---

# Smart Collection Auto-Inclusion Breaks Curated Expectations

## Problem Statement

Auto-adding AI-promoted files to character/location smart collections changes counts unpredictably (user didn't add these), pollutes thumbnail grids (workspace files have no thumbnails, producing gray placeholders), and provides no undo mechanism. Also, the typeTags filter path doesn't bridge to AI fields — promoted assets won't match `typeTags: ['Character']` because `getAssetTypeTag()` reads from metadata objects that promoted assets lack.

## Findings

- **UX agent**: CollectionCard prominently displays assetCount. Toggling a managed zone could jump "Eleven" collection from 8 to 23 assets. User didn't curate these.
- **Architecture agent**: `matchesFilter` typeTags check uses `getAssetTypeTag()` which reads `imageMeta.typeTag`, `videoMeta.typeTag` etc. Promoted assets from `instanceToAsset()` produce assets with no metadata objects. Smart collections will silently EXCLUDE all AI-promoted assets even when AI tags match.
- **UX agent**: No mechanism to reject wrong AI classifications from a smart collection.

## Proposed Solutions

### Option A: Require explicit user approval
- Do NOT auto-include. Show "Suggested additions" section in smart collection detail view requiring explicit user approval.
- **Effort**: Medium
- **Risk**: Low

### Option B: Set metadata in `instanceToAsset()` and add visual indicator
- Set appropriate `imageMeta.typeTag` in `instanceToAsset()` so existing typeTags filtering works. Add visual indicator for AI-suggested assets within collections.
- **Effort**: Medium
- **Risk**: Medium

### Option C: Separate AI collection
- Only auto-include in a new "AI Discoveries" smart collection (separate from curated ones).
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: Smart collection filtering logic, `matchesFilter()`, `getAssetTypeTag()`, `instanceToAsset()`, CollectionCard component
- `getAssetTypeTag()` reads `imageMeta.typeTag`, `videoMeta.typeTag` — fields not populated by `instanceToAsset()`

## Acceptance Criteria

- [ ] AI-promoted assets do not silently change curated collection counts
- [ ] Smart collection typeTags filtering correctly handles promoted assets (either includes or explicitly excludes)
- [ ] Users have a mechanism to accept/reject AI-suggested assets in collections
- [ ] Workspace files without thumbnails do not produce gray placeholders in collection grids

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | UX and Architecture agents identified silent exclusion and curation expectation violations |

## Resources

- UX review: Collection count and thumbnail analysis
- Architecture review: typeTags filter path analysis
