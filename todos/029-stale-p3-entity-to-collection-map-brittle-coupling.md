---
status: pending
priority: p3
issue_id: "029"
tags: [code-review, architecture, data-integrity]
dependencies: []
---

# ENTITY_TO_COLLECTION_MAP Creates Brittle Cross-System Coupling

## Problem Statement

The plan creates a static map from entity names ("Eleven") to collection IDs ("char-2"). This duplicates knowledge already present in MOCK_COLLECTIONS (which has `id: 'char-1', name: 'Billy Hargrove'`). Every time a collection is added or renamed, both data structures need updating — a sync bug waiting to happen.

## Findings

- **Architecture agent**: Collection IDs like `char-2` come from MOCK_COLLECTIONS. If anyone re-IDs or renames a collection, the AI tag mapping silently breaks.
- **Code simplicity agent**: The map is a hand-maintained join table over mock data. Can be derived dynamically from MOCK_COLLECTIONS in ~5 lines.

## Proposed Solutions

### Option A: Derive mapping at module init from MOCK_COLLECTIONS
- `const collectionsByName = new Map(MOCK_COLLECTIONS.map(c => [c.name.toLowerCase(), c.id]))`. Zero maintenance.
- **Effort**: Small
- **Risk**: Low

### Option B: Colocate the mapping with collection definitions
- Colocate the mapping with collection definitions so changes are visible together.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: ENTITY_TO_COLLECTION_MAP definition, MOCK_COLLECTIONS data source
- Static map duplicates collection name-to-ID relationships already present in MOCK_COLLECTIONS

## Acceptance Criteria

- [ ] No static entity-to-collection mapping exists separate from MOCK_COLLECTIONS
- [ ] Adding or renaming a collection does not require updating a second data structure
- [ ] AI tag-to-collection resolution uses a single source of truth

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | Architecture and Code simplicity agents confirmed brittle duplication |

## Resources

- Architecture review: Cross-system coupling analysis
- Code simplicity review: Derived mapping recommendation
