---
status: pending
priority: p2
issue_id: "025"
tags: [code-review, ux, design-system]
dependencies: []
---

# Asset Detail Panel Information Density

## Problem Statement

The AssetDetailPanel is a fixed 360px panel with 4 existing sections (Details, Tags, Collections, Workspace). Adding "AI Analysis" and "Appears In" brings it to 6 sections, requiring substantial scrolling. For non-promoted assets, AI sections would be empty noise.

## Findings

- **UX agent**: 6 sections in 360px panel. Empty "AI Analysis" and "Appears In" sections for the majority of assets (curated, non-AI) add visual noise.
- **UX agent**: Could use tabs (existing Tabs component available) to separate "Info" from "AI Analysis".

## Proposed Solutions

### Option A: Conditional rendering based on AI metadata
- Conditionally render AI sections only when asset has AI metadata (asset.isAutoPromoted). No empty sections.
- **Effort**: Small
- **Risk**: Low

### Option B: Tabbed panel layout
- Use tabs within the panel — "Info" tab (existing sections) and "AI" tab (new sections).
- **Effort**: Medium
- **Risk**: Low

### Option C: Inline AI data into existing sections
- Add inline to existing sections rather than new sections — e.g., AI characters as tags in the Tags section, workspace path already has a section.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: AssetDetailPanel component, Tabs component
- Panel is fixed at 360px width with 4 existing sections
- Existing Tabs component is available for tabbed layout approach

## Acceptance Criteria

- [ ] Non-promoted assets do not display empty AI sections
- [ ] Panel remains usable without excessive scrolling for common asset types
- [ ] AI metadata is accessible for promoted assets without cluttering the default view
- [ ] Panel layout works correctly at the fixed 360px width

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | UX agent identified information density and empty section concerns |

## Resources

- UX review: Panel section density analysis
- Existing Tabs component for potential tabbed layout
