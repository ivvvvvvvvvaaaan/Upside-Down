---
status: pending
priority: p2
issue_id: "023"
tags: [code-review, ux, design-system]
dependencies: []
---

# Promoted Assets Are NOT Indistinguishable

## Problem Statement

The plan claims promoted assets appear inline "indistinguishable except for subtle AI badges." In reality: workspace files have no thumbnails (gray placeholders vs rich images), they have AI tags that curated assets lack, and their names/metadata are raw filenames. This is the opposite of blending in.

## Findings

- **UX agent**: WorkspaceFileNode has no thumbnail property. AssetCard falls back to gray bg-surface-2 div. A grid of colorful images with gray blanks interspersed is immediately visible.
- **UX agent**: Different metadata structure — curated assets have scene/take/camera; workspace files have raw filenames like "hero_pose_v3.psd".
- Curated assets: "Eleven – Hero Pose" with full thumbnail. Promoted asset: "hero_pose_v3" with gray placeholder and "AI 92%" tag.

## Proposed Solutions

### Option A: Honest two-tier grouping
- Be honest about two-tier nature. Group promoted assets in a subtle "Workspace Suggestions" subsection below curated assets.
- **Effort**: Small
- **Risk**: Low

### Option B: Invest in thumbnail generation
- Invest in thumbnail generation (file-type icons, auto-generated previews) before claiming visual parity.
- **Effort**: Large
- **Risk**: Low

### Option C: Consistent visual treatment for promoted assets
- Show promoted assets inline but with a consistent visual treatment (subtle border or background tint) that acknowledges their different provenance.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: AssetCard component, WorkspaceFileNode type, asset grid views
- WorkspaceFileNode lacks thumbnail property; AssetCard falls back to gray placeholder
- Metadata mismatch: curated assets have scene/take/camera vs raw filenames for workspace files

## Acceptance Criteria

- [ ] Promoted assets are visually differentiated from curated assets in a deliberate way
- [ ] No misleading claim of visual parity between curated and promoted assets
- [ ] Users can quickly identify the provenance of an asset in grid views
- [ ] Visual treatment works correctly at all grid sizes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | UX agent identified visual parity gap between curated and promoted assets |

## Resources

- UX review: Thumbnail and metadata gap analysis
- Design system: AssetCard fallback behavior
