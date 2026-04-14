# Assets-First Model

*April 13, 2026. Architectural plan for decoupling assets from workspace folders.*

## Problem

When a vendor uploads to a shared collection, the files have nowhere to go unless the collection is folder-bound to a workspace directory. This forces every shared collection to have a workspace folder, which is artificial. The current model treats workspace files as the source of truth for assets. No file = no asset.

This creates three problems:
1. Vendor uploads to non-folder-bound collections don't persist
2. Every shared collection needs a folder, even when a folder doesn't make sense
3. The "where do the bytes go?" question has no clean answer

## Principle

Assets are first-class entities that exist independently of folders. A folder is optional organization, not a requirement for existence. A collection is a group of asset references. An asset can exist in zero folders, one folder, or many collections.

## Current architecture

```
Workspace files (source of truth)
  └── generateAssetInstances() → Asset objects (computed on every load)
        └── Collections reference asset IDs
              └── getAssetsByIds() looks up computed assets
```

Assets are ephemeral. They're recomputed from workspace files on every page load. Upload to a collection creates a temporary in-memory asset that vanishes on reload.

## Target architecture

```
Asset Store (persistent, localStorage)     Workspace files (optional organization)
  └── Stored assets (uploads, vendor         └── generateAssetInstances() → promoted assets
      deliveries, any user-created)
        \                                      /
         └── getAllAssets() merges both sources ─┘
               └── Collections reference asset IDs
                     └── getAssetsByIds() finds assets from either source
```

Two sources, one merged view. Workspace-promoted assets and stored assets coexist. Collections don't care which source an asset came from.

## Implementation

### 1. Asset Store (`src/hooks/useAssetStore.tsx`)

New React context + localStorage persistence. Same pattern as `useUserCollections`:

```typescript
type StoredAsset = {
  id: string
  name: string
  type: AssetType
  extension?: string
  thumbnail?: string
  department?: DomainId
  uploadedAt: string
  uploadedBy?: string
  size?: number
}
```

- `addAsset(asset)` -- persist a new asset to localStorage
- `getAsset(id)` -- look up by ID
- `allAssets` -- all stored assets
- `getStoredAssets()` -- static function (no hook) for use in `getAllAssets()`

Respects `SEED_VERSION` for cache invalidation, same as collections.

### 2. Merge stored assets into `getAllAssets()` (`src/lib/data.ts`)

```typescript
function getAllAssets(): Asset[] {
  const workspace = mergePrototypeAssets(getAssets())
  const cuts = buildCuts().map(seedCutToAsset)
  const stored = getStoredAssets()  // reads localStorage directly
  return [...workspace, ...cuts, ...stored]
}
```

`getAssetsByIds()` automatically finds stored assets because it calls `getAllAssets()`.

### 3. Upload creates stored assets (`src/app/nextgen/collections/[id]/view.tsx`)

Current upload flow creates temporary in-memory assets. Change to:
1. Create a `StoredAsset` with a persistent ID
2. Add the ID to the collection's `assetIds` via `addAssetsToCollection()`
3. Asset persists across page reloads

### 4. Collection resolution unchanged

`resolveCollectionAssets()` has two paths:
- Folder-bound: resolves from folder contents (unchanged)
- Curated: returns `assetIds` (unchanged)

Both call `getAssetsByIds()` which now finds stored assets. No changes needed.

## What this enables

### Demo Scene 5 (vendor upload)
1. Sarah creates "Framestore Deliveries" as a manual collection (no folder)
2. Shares with Framestore team + upload enabled + note
3. James uploads a comp
4. Comp persists as a stored asset
5. Sarah sees it in the collection immediately
6. She can drag it to her workspace folder later if she wants

### Independent asset lifecycle
- Assets created by upload exist without workspace files
- Deleting a workspace file doesn't delete the asset (it was never tied to one)
- Same asset can appear in multiple collections via `assetIds` references
- No folder binding required for any collection

## What stays the same

- Workspace file tree and folder navigation
- Smart collections and filter-based resolution
- Sharing, permissions, grants
- Drag and drop
- Collection management (create, rename, delete)
- Access control and permission cascading

## Files changed

| File | Change |
|------|--------|
| `src/hooks/useAssetStore.tsx` | **New** -- localStorage-backed asset store |
| `src/lib/data.ts` | `getAllAssets()` merges stored assets |
| `src/app/nextgen/collections/[id]/view.tsx` | Upload creates stored assets instead of temp state |
| `src/hooks/index.ts` | Export new hook |

## Risks and open questions

1. **Deduplication**: If a user uploads a file that already exists as a workspace asset, do we detect and merge? For the prototype, no. Two separate assets with the same name is fine.

2. **Storage limits**: localStorage has a ~5MB limit. Stored assets don't include the actual bytes (thumbnails are URLs, not blobs), so this is metadata only. Thousands of assets fit comfortably.

3. **Workspace sync**: If a stored asset gets dragged into a workspace folder, should the stored asset be removed and replaced by the workspace-promoted version? For the prototype, both coexist. The workspace version wins in resolution scoring (it has `workspacePath`).

4. **Smart collection visibility**: Stored assets need department and type metadata to be filterable by smart collections. The upload flow should capture these.
