---
status: pending
priority: p2
issue_id: "024"
tags: [code-review, architecture, simplicity]
dependencies: []
---

# instanceToAsset Side Effects Break Purity

## Problem Statement

The plan turns instanceToAsset from a pure 6-line structural mapper into a 30+ line function with external dependencies (getAITagsForFile lookup, ENTITY_TO_COLLECTION_MAP). This also affects WorkspaceUnifiedTab which already calls instanceToAsset — those workspace file cards would gain AI tags and collection IDs even in the file explorer context.

## Findings

- **Architecture agent**: Currently a simple pure mapping with no external dependencies. After change, depends on getAITagsForFile() and ENTITY_TO_COLLECTION_MAP.
- **Code simplicity agent**: Mixing business logic (collection resolution, AI tag lookup, type-specific metadata) into a structural mapper makes it hard to test.
- **Architecture agent**: WorkspaceUnifiedTab at line 211 also calls instanceToAsset — it would gain unwanted AI enrichment.

## Proposed Solutions

### Option A: Separate enrichment function
- Keep instanceToAsset pure. Create separate enrichInstanceWithAI(instance): EnrichedAsset that merging hooks call explicitly.
- **Effort**: Small
- **Risk**: Low

### Option B: Options parameter for conditional enrichment
- Add an options parameter: instanceToAsset(instance, { enrich: boolean }).
- **Effort**: Small
- **Risk**: Low

### Option C: Inline enrichment in merge utility
- Inline the enrichment in the merge utility function instead of modifying instanceToAsset.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: instanceToAsset function, WorkspaceUnifiedTab component (line 211), merge utility
- instanceToAsset is currently a pure 6-line mapper with no external dependencies
- WorkspaceUnifiedTab already calls instanceToAsset and would inherit unwanted AI enrichment

## Acceptance Criteria

- [ ] instanceToAsset remains a pure structural mapper with no external dependencies
- [ ] AI enrichment logic is separated into its own function or utility
- [ ] WorkspaceUnifiedTab file cards do not display AI tags or collection IDs
- [ ] Enrichment is only applied in contexts where AI metadata is appropriate

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | Architecture and Code simplicity agents confirmed purity violation |

## Resources

- Architecture review: Function dependency analysis
- Code simplicity review: Business logic mixing assessment
