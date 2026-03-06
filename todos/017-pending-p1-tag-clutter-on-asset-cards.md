---
status: pending
priority: p1
issue_id: "017"
tags: [code-review, ux, design-system]
dependencies: []
---

# Tag Clutter on AssetCards Undermines UX

## Problem Statement

Current cards can show up to 4 tags. Adding "AI 92%" (`type="informative"` = solid blue fill) and character name (`type="announcement"` = solid purple fill) creates up to 6 tags per card. At small grid sizes (~160px wide), this overflows. The confidence percentage undermines user trust ("Why only 72%?"). The tags are visually loud, not "subtle" as claimed.

## Findings

- **UX agent**: `type="informative"` renders as `bg-blue-400 !text-white` — a saturated blue pill. `type="announcement"` is solid purple. Two additional colored pills make promoted cards louder than curated ones.
- 6 tags at 10px font with padding ≈ 280-320px total, overflowing cards in 6-column grid.
- Confidence scores raise doubt rather than building trust in a production studio context.

## Proposed Solutions

### Option A: Single neutral tag with detail in panel
- Single neutral "AI" border tag (`type="neutral" variant="border"`) or a Sparkles icon. Move character names and confidence to AssetDetailPanel only.
- **Effort**: Small
- **Risk**: Low

### Option B: Character name tag only with icon
- Replace confidence with character name tag only, prefixed with Sparkles icon. Keeps tag count at current levels.
- **Effort**: Small
- **Risk**: Low

### Option C: Keep both AI tags but reduce visual weight
- Use `variant="border"` and `type="neutral"` for visual quietness.
- **Effort**: Small
- **Risk**: Medium (still adds 2 tags)

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: AssetCard component, tag rendering logic
- Card width in 6-column grid is ~160px; 6 tags at 10px font with padding totals 280-320px

## Acceptance Criteria

- [ ] AssetCard tag count does not exceed current maximum (4 tags)
- [ ] AI indicator uses a visually quiet treatment (neutral/border variant or icon)
- [ ] Confidence scores are not shown on card thumbnails
- [ ] Cards render correctly at all grid sizes without tag overflow

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | UX agent identified visual overflow and trust concerns |

## Resources

- UX review: Tag overflow and visual weight analysis
- Design system: Hawkins tag variant reference
