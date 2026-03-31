---
status: pending
priority: p1
issue_id: "019"
tags: [code-review, planning, deliverability]
dependencies: []
---

# 12 Files Modified Is Too Much for One Deliverable

## Problem Statement

The plan touches 3 new files and 9 existing files spanning data layer, hook layer, UI components, and collection views. Too large to review, test, or debug as a unit. A bug in any layer blocks the whole feature.

## Findings

- **Code simplicity agent**: The core feature can be delivered with 4-5 files instead of 12, creating 0 new hooks instead of 2, and 0 new modules instead of 1.
- **Suggested phasing**: Phase 1 (3-4 files): enrich `instanceToAsset` + `mergeWorkspaceAssets` utility + DepartmentHomeView integration. Phase 2 (2-3 files): AI tags data + wire into `instanceToAsset`. Phase 3 (2-3 files): search + banner.

## Proposed Solutions

### Option A: Three phases, ship independently
- Phase 1 (3-4 files): enrich `instanceToAsset` + `mergeWorkspaceAssets` utility + DepartmentHomeView integration.
- Phase 2 (2-3 files): AI tags data + wire into `instanceToAsset`.
- Phase 3 (2-3 files): search + banner.
- **Effort**: Same total, lower risk per phase
- **Risk**: Low

### Option B: Two phases
- Phase 1: data layer + department view.
- Phase 2: search + collections + detail panels.
- **Effort**: Same total
- **Risk**: Low

### Option C: Ship as one (plan as-is)
- **Effort**: Same total
- **Risk**: High (large blast radius)

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: 3 new files + 9 existing files across data layer, hook layer, UI components, and collection views
- Core feature achievable with 4-5 files, 0 new hooks, 0 new modules

## Acceptance Criteria

- [ ] Deliverable is broken into phases of no more than 5 files each
- [ ] Each phase is independently shippable and testable
- [ ] Phase boundaries align with architectural layers (data, hooks, UI)
- [ ] No single PR spans more than one architectural layer without justification

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | Code simplicity agent identified 60% file reduction opportunity |

## Resources

- Code simplicity review: File count and phasing analysis
