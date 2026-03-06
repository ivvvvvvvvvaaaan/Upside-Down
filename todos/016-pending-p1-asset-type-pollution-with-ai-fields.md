---
status: pending
priority: p1
issue_id: "016"
tags: [code-review, architecture, type-safety, maintainability]
dependencies: []
---

# Core Asset Type Pollution With 7 AI Fields

## Problem Statement

Adding `isAutoPromoted`, `aiCharacters`, `aiScene`, `aiLocation`, `aiConfidence`, `aiKeywords`, `workspacePath` directly to the `Asset` type creates a ~20-field "god object." Server-fetched assets never have these fields. No compile-time safety for which fields exist in which context. Every consumer carries dead weight.

## Findings

- **Architecture agent**: Couples core domain model to a feature-specific concern. Server-fetched assets will never populate these fields, creating implicit subtyping.
- **Performance agent**: No discriminator field means consumers must null-check everywhere. `matchesFilter` would call `aiCharacters.join(' ')` on `undefined`.
- **Code simplicity agent**: `instanceToAsset` only populates 5 of ~20 fields — workspace assets are mostly undefined.

## Proposed Solutions

### Option A: Extension type with optional metadata
- `type EnrichedAsset = Asset & { promotedMeta?: PromotedAssetMeta }`. Only merging hooks return `EnrichedAsset[]`. Core Asset stays clean.
- **Effort**: Small
- **Risk**: Low

### Option B: Discriminated union with source field
- Add `source?: 'api' | 'workspace'` field for type narrowing.
- **Effort**: Medium
- **Risk**: Low

### Option C: Keep flat Asset with all optional fields (plan as-is)
- **Effort**: Small
- **Risk**: Medium (type safety debt)

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: `Asset` type definition, `instanceToAsset()`, `matchesFilter()`, all Asset consumers
- 7 new optional fields on a type consumed by every view in the application

## Acceptance Criteria

- [ ] Core `Asset` type does not contain AI-specific or workspace-specific fields
- [ ] AI/workspace metadata is accessible through a well-typed extension mechanism
- [ ] Compile-time safety prevents accessing AI fields on server-fetched assets without a guard
- [ ] `matchesFilter` handles both asset types without runtime errors

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | Architecture, Performance, and Code simplicity agents all flagged type pollution |

## Resources

- Architecture review: Domain model coupling analysis
- Performance review: Null-check overhead analysis
- Code simplicity review: Field population analysis
