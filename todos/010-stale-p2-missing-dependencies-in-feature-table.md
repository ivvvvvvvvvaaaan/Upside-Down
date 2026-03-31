---
status: pending
priority: p2
issue_id: "010"
tags: [code-review, dependencies, completeness]
dependencies: []
---

# Several Features Missing Backend Dependencies

## Problem Statement

Multiple P0 features list no dependencies but clearly require backend APIs or processing pipelines that either don't exist or haven't been confirmed.

## Findings

- **Bulk edit metadata (P0, L)**: Scoped FE-only, but batch updating N assets requires a backend batch-update endpoint. Without it, N sequential API calls will be unacceptably slow.
- **Manual ingest (P0, M)**: Notes say "generates thumbnail" but thumbnail generation for video is a backend/processing concern. No dependency listed for the thumbnail pipeline.
- **Semantic search (P0, XL)**: Depends on Algo team for embeddings, but also depends on ingest pipeline populating the search index. V0 search only works for manually ingested assets unless auto-ingest (P1) ships.
- **Collection detail view (P0, M)**: Scoped FE-only but must read from the collections API being built by the backend team.
- **Dependency map consolidates** "User-created collections" and "Smart collections" into one entry ("Collections persistence"), potentially underestimating backend work (two separate L-effort features).

## Proposed Solutions

### Option A: Add missing dependencies to feature table rows
- **Effort**: Small (doc edit)
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected file**: `/Users/ibutyliuk/Documents/Obsidian Vault/NextGen 3W →.md`
- Selection table: line 189
- Storage table: line 242
- Search table: line 159
- Collections table: line 180
- Dependency Map: line 282

## Acceptance Criteria

- [ ] Bulk edit metadata lists backend batch-update API as dependency
- [ ] Manual ingest notes clarify thumbnail pipeline dependency
- [ ] Semantic search notes document: "V0 covers manually ingested assets only"
- [ ] Collection detail view notes reference dependency on collections API
- [ ] Dependency map splits "Collections persistence" into two entries or notes combined scope

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-27 | Created from document review | Completeness reviewer found 4 missing deps |

## Resources

- Completeness review: Findings 3.1-3.4
- Consistency review: Finding 9
