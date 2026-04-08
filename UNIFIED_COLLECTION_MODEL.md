# Unified Collection Model

## Context

The prototype currently has two separate container concepts — folders (workspace file tree) and collections (curated asset lists) — with different sharing models, navigation, and access patterns. This creates confusion: sharing a folder vs sharing a collection behaves differently, recipients see shared items in different places, and the mental model splits.

**Decision**: Unify around a single concept — **Collection** — as the only shareable container. The workspace file tree remains as private department infrastructure (reflecting mounted drives), but every sharing interaction goes through a collection.

---

## The Model

### Collection — the single shareable unit

Three flavors, one concept:

| Flavor | Contents populated by | Example |
|--------|----------------------|---------|
| **Curated** | Manual asset picks | "EP301 Assembly Selects" |
| **Smart** | Filter/AI metadata | "All assets tagged Final" |
| **Workspace** | Bound to a folder path | "Camera Dailies Day 12" |

All three share the same:
- Permission model (view, comment, download, upload, manage)
- Share modal and options
- Grant/access system
- UI representation in nav and browsing

### Workspace = private filesystem lens

- Workspace tree reflects mounted drives — it's the filesystem
- Department members see their department's tree automatically
- The media library is a lens into the filesystem, not a separate thing
- **Not directly shareable** — sharing always creates/uses a collection

### Three persona patterns

| Persona | Entry point | What they see |
|---------|------------|---------------|
| **Producer** (Maria, Tom, Sarah) | Mounted drive + workspace | Filesystem sync. Accept shares → files appear on their drive at a chosen path. Create collections for curation/sharing. |
| **Reviewer** (David, Alex) | Direct link / notification | Review surface with playback, comments, ontology. No workspace, no inbox filing. |
| **Collaborator** (James/vendor) | Scoped shared space | Bidirectional collection — read brief + upload deliveries. |

---

## Share Flows

### Outgoing (sharing)

1. Select assets/folder → Share → creates a collection (or uses existing one)
2. Choose: **Live** (auto-syncs) or **Snapshot** (frozen at share time)
3. Pick recipients, set permissions

### Incoming (producers)

1. Notification arrives in Inbox
2. Accept → choose where in workspace to mount the reference
3. Files sync to mounted drive at that path (read-only reference, isolated from workspace inheritance)
4. Can add assets from the reference to own collections

### Incoming (reviewers)

1. Notification arrives as a direct link (grant-backed, authenticated, with expiration)
2. Click → opens review surface directly
3. No workspace, no filing, just watch and comment

### Incoming (vendors)

1. Receive scoped collection with brief (snapshot of assets to work on)
2. Collection has **dropbox mode** — vendor can upload deliveries into it
3. One shared space, bidirectional: sharer sees brief + deliveries, vendor sees both too

---

## Snapshot vs Live

| Mode | Behavior | Use case |
|------|----------|----------|
| **Live** | Recipient sees the collection as it evolves | Ongoing collaboration: dailies, editorial reviews |
| **Snapshot** | Frozen at share time, contents don't change | Deliveries, approvals, vendor handoffs |

Snapshot = copy the current `assetIds` into the grant. Recipient resolves against that frozen list. The source collection keeps evolving, but the snapshot is a separate frozen view.

**Security note**: Workspace-bound collections should default to snapshot when shared, not live. Live mode on a folder-bound collection means any file added to that folder auto-reaches recipients — no approval step. Live mode should require explicit opt-in with a warning.

---

## Dropbox Mode (vendor collaboration)

A collection can have **upload enabled** for specific recipients. This creates a bidirectional collaboration surface:

- **Brief side**: assets the sharer selected (immutable to recipient, regardless of permissions)
- **Delivery side**: assets the recipient uploaded (visible to both)

Requires a distinct `upload` permission (append-only, can't modify/delete existing assets) — separate from `write`. Brief assets are never modifiable by recipients.

The collection becomes a scoped workspace for a specific collaboration. Both sides contribute to the same container. The vendor can only see/upload to this collection, not the broader workspace.

---

## Persona Scenarios

### Tom (DIT) → Lisa (Coordinator) → Maria (Editor)

Tom dumps dailies to `/Camera/Dailies/Day_12/` via mounted drive. He never opens the media library. Lisa shares the dailies with editorial — this creates a collection from that folder's contents (snapshot by default, or live with explicit opt-in). Maria accepts → files appear at a path on her mounted drive (isolated reference, doesn't inherit department permissions). She pulls shots into Avid directly from her filesystem. In the media library, she creates "EP301 Assembly Selects" (curated collection) by dragging the shots she chose.

### Maria (Editor) → David (Director)

Maria shares "EP301 Assembly Selects" with David. David is a reviewer — he gets an authenticated direct link with expiration, opens the review surface, watches the cut, leaves timestamped comments, browses alternate takes via the ontology. He never touches a workspace or files anything.

### Sarah (VFX Coordinator) → James (Framestore vendor)

Sarah creates "Framestore Week 12 Delivery" (curated collection with 8 approved shots). Shares as **snapshot** with upload enabled. James receives a scoped collection: the 8 shots as his brief (read-only), plus an upload zone for his rendered frames. Sarah sees both the brief and James's deliveries in the same collection. Next week, Sarah creates a new snapshot — "Framestore Week 13 Delivery" — cleanly separated.

---

## Navigation Structure

```
Workspace (private dept browsing)
├── VFX/
├── Editorial/
├── Camera/
└── Audio/

Collections (all shareable containers)
├── Smart collections (system)
│   ├── Characters
│   ├── Scenes
│   └── Locations
├── My collections (curated + workspace-bound)
│   ├── EP301 Assembly Selects (curated)
│   ├── Camera Dailies Day 12 (workspace-bound)
│   └── Framestore Week 12 (curated, dropbox enabled)
├── Received (accepted shares from others)
└── + New Collection
```

---

## Review Findings & Amended Approach

### Key tension: Full type unification vs. presentation-layer unification

The code review surfaced a strong counterargument: the UX goal (one mental model for sharing) **does not require merging the data types**. The current `UserCollection` (5 fields) and `SmartCollection` (10 fields) are each clean and purpose-built. Merging them creates a god-type with 7+ optional conditional fields.

### Recommended approach: Unify the UX, not the types

**MVP to validate the concept (~50-80 lines of changes):**

1. **Unified share modal** — one share UI that works for folders, user collections, and smart collections. Same modal, same options, regardless of source. Already mostly exists.

2. **Unified nav section** — show all shareable containers (user collections, smart collections, workspace-bound collections) under one "Collections" section. Presentation-layer change in `nav-sidebar.tsx`.

3. **"Share folder" creates a UserCollection** — when you share a folder, auto-create a `UserCollection` seeded with that folder's asset IDs. No `boundFolderId` sync machinery needed. Uses existing `createCollection` from `useUserCollections`.

**What this validates**: Do users feel like sharing is one experience? Does the unified nav reduce confusion? If yes → proceed with deeper model changes. If not → iterate on the UX without having invested in a data model rewrite.

### If the MVP validates → incremental type migration

Use a **facade hook** (`useCollections`) that wraps both existing providers and presents a unified API. Migrate consumers incrementally. If types are eventually merged, use a **TypeScript discriminated union** (not flat optional fields):

```ts
type Collection =
  | { flavor: 'curated'; id: string; name: string; assetIds: string[]; createdBy?: string; createdAt: Date }
  | { flavor: 'smart'; id: string; name: string; filter: AssetFilter; groupBy?: SmartCollectionGroupBy; icon: SmartCollectionIcon; parentId?: string; visibleToAll?: boolean; createdAt: Date }
  | { flavor: 'workspace'; id: string; name: string; boundFolderId: string; boundDepartmentId: DepartmentId; createdBy?: string; createdAt: Date }
```

### Grant extensions (deferred until validated)

```ts
Grant = {
  ...existing fields
  shareMode?: 'live' | 'snapshot'
  snapshotAssetIds?: string[]    // frozen contents for snapshot mode
  allowUpload?: boolean          // dropbox mode for vendor collaboration
}
```

**Prerequisite**: Refactor `collectionAssetAccessById` in `useAccess.tsx` to be grant-driven (outer loop over grants, not collections) before implementing snapshot mode. Different recipients of the same collection may see different asset sets.

---

## Implementation Phases (Amended)

### Phase 0: MVP — Presentation-layer unification

- Unified share modal for all resource types (folder, collection, smart collection)
- Unified "Collections" nav section (all flavors in one list)
- "Share folder" action auto-creates a UserCollection from folder contents
- **No type changes, no grant extensions, no new infrastructure**
- Validate: does the UX feel unified?

### Phase A: Facade hook + route unification (if MVP validates)

- Create `useCollections()` facade wrapping both existing providers
- Unify `/nextgen/collections/[id]` and `/nextgen/smart-collections/[id]` into one route
- Migrate consumers incrementally

### Phase B: Share-creates-collection + live/snapshot

- Add `shareMode` and `snapshotAssetIds` to Grant type
- Refactor `collectionAssetAccessById` to be grant-driven (prerequisite)
- Workspace-bound shares default to snapshot (explicit opt-in for live with warning)
- Smart collection shares: intersect filter results with recipient's access permissions

### Phase C: Inbox accept → workspace mount

- Accept flow places isolated reference in recipient's workspace
- **Isolated from workspace inheritance** — carries its own grant permissions, doesn't cascade
- Audit logging for mount operations

### Phase D: Vendor collaboration (dropbox mode)

- Introduce `upload` permission (append-only, distinct from `write`)
- Brief assets immutable to recipients
- Upload zone in collection UI for permitted recipients

### Phase E: Reviewer direct link

- Grant-backed, authenticated links with mandatory expiration
- Focused review surface (playback, comments, ontology)
- Forwarding a link doesn't grant access — requires authentication

<<<<<<< HEAD
### Phase F: Live workspace sync

- When a "live" collection is "added to workspace", the reference folder auto-syncs with the collection's current contents
- New assets added to the source collection appear in the recipient's workspace without manual action
- Workspace view resolves reference folder contents from the live collection at render time, not from the static file tree
- Enables Nick's workflow: VFX coord adds shot to "VFX-to-Editorial" → Maria's workspace auto-updates
- Snapshot collections remain frozen — only live shares auto-sync

=======
>>>>>>> origin/main
---

## Security Constraints

| Concern | Rule |
|---------|------|
| Workspace-bound live shares | Default to snapshot. Live requires explicit opt-in. New files in folder don't auto-reach recipients without approval. |
| Snapshot integrity | Production: server-authoritative. Prototype: document as client-trusted. Validate sharer had access at snapshot time. |
| Dropbox uploads | `upload` ≠ `write`. Brief assets immutable. File type validation + size limits in production. |
| Mounted references | Isolated from folder inheritance. Don't inherit department-level permissions. |
| Smart collection shares | Always intersect filter results with recipient's access permissions. Never expose metadata for inaccessible assets. |
| Reviewer links | Grant-backed with auth + expiration. Not bearer-token. Forwarding doesn't grant access. |
| Share rate limiting | Production: rate limits on grant/link creation. Admin notifications for high-volume sharing. |

---

## Key Files

| File | Change |
|------|--------|
| `src/components/ui/nav-sidebar.tsx` | Unified collections section (Phase 0) |
| `src/components/ui/access-panel.tsx` | Unified share modal for all types (Phase 0) |
| `src/hooks/useUserCollections.tsx` | "Share folder" creates collection (Phase 0) |
| `src/hooks/useAccess.tsx` | Grant-driven refactoring (Phase B), mount isolation (Phase C) |
| `src/lib/grants.ts` | shareMode, snapshotAssetIds, allowUpload, upload permission (Phases B-D) |
| `src/lib/scenario.ts` | Updated seed data |
| `src/app/nextgen/collections/[id]/view.tsx` | Unified collection route (Phase A) |
| `src/app/nextgen/inbox/inbox-view.tsx` | Accept flow with workspace placement (Phase C) |
