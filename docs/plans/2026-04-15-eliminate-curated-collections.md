# Eliminate Curated Collections: Folders are the Sharing Container

*April 15, 2026. Plan for removing curated collections from the user-facing model.*

## The change

Collections split into two:
- **Smart collections** (Character, Scene, Location, Finals): system-generated discovery views. Stay.
- **Curated collections** (user-created, manual): eliminated. Folders replace them for sharing.

Users share folders. Recipients see folders. No concept transformation.

## What stays

- Smart collections and all ontology browsing
- Workspace folder tree
- Permission levels (Viewer/Editor/Manager + modifiers)
- Access model (additive, explainable, revocable)
- Share dialog, share notes, synced/frozen
- Drag and drop
- Vendor upload flow (into shared folders)

## What changes

### Sharing flow
- **Before**: share a folder -> system creates a collection -> grant on collection
- **After**: share a folder -> grant on folder directly

### User vocabulary
- **Before**: folders + collections (two container concepts)
- **After**: folders + smart collections (one container you manage, one the system manages)

### "Add to Collection" becomes "Add to Folder"
- Drag assets to a folder in the nav sidebar (already works)
- The contextual action bar button changes label

### Nav sidebar
- "New Collection" button removed
- Curated collections in the nav replaced by shared folders
- Smart collections section stays

## Files to remove

| File | Reason |
|------|--------|
| `src/components/ui/collection-membership-modal.tsx` | Adding assets to curated collections |
| `src/app/nextgen/collections/[id]/view.tsx` | UserCollectionDetailView (curated collection detail) |
| `src/hooks/useShareAsCollection.ts` | Folder-to-collection conversion |
| `src/lib/smart-collection-share-utils.ts` | Smart-to-curated snapshot creation |

## Files to refactor

| File | Change |
|------|--------|
| `src/hooks/useUserCollections.tsx` | Remove curated collection CRUD. Keep if any smart collection storage needs it, otherwise remove entirely. |
| `src/hooks/useAccess.tsx` | `collectionAssetAccessById` becomes folder-based. Grants on folders cascade to contents. Remove collection ripple, replace with folder inheritance. `canUploadToCollection` becomes `canUploadToFolder`. |
| `src/hooks/useCollections.ts` | Simplify to only return smart collections. |
| `src/components/ui/access-panel.tsx` | Remove smart-to-curated snapshot creation (lines 707-718). "Shared Via Collections" becomes "Shared Via Folders". |
| `src/components/ui/collection-side-panel.tsx` | Remove curated-specific UI (asset count, edit modal, add assets). Keep for smart collection display. |
| `src/components/ui/new-collection-modal.tsx` | Remove "Manual collection" option. Keep smart collection creation only. |
| `src/components/ui/contextual-action-bar.tsx` | "Add to Collection" -> "Add to Folder" or remove. |
| `src/components/ui/nav-sidebar.tsx` | Remove "New Collection" button. Remove curated collections from nav. Keep smart collections. Shared folders appear under "Shared with me". |
| `src/lib/grants.ts` | Keep `'collection'` in ResourceType for smart collection grants. Sharing now creates grants on `'folder'` type. |
| `src/lib/scenario.ts` | Convert curated collection grants to folder grants. Remove curated collection definitions. |
| `src/lib/collection-types.ts` | Remove `canShare`, `showAccessTab` from curated capabilities. Simplify. |
| `src/app/nextgen/collections/[id]/page.tsx` | Always route to SmartCollectionDetailView. Remove branching. |
| `src/app/nextgen/collections/page.tsx` | Show only smart collections. |
| `src/app/nextgen/_components/collection-browser-view.tsx` | Simplify for smart collections only. |

## Seed data migration

Current curated collections in scenario.ts become folders:

| Current (collection) | Becomes (folder) |
|------|--------|
| `ws-vfx-coll-for-editorial` "EP301 VFX Pulls" | Folder in VFX workspace, shared with editorial |
| `coll-smart-finals-shared` "Finals (shared)" | Smart collection snapshot stays as grant with snapshotAssetIds |
| `ws-edit-coll-dailies` "Dailies Review Cuts" | Folder in editorial workspace, shared with reviewers |
| `coll-vfx-vendor-drop` "Framestore" | Already folder-bound, just remove collection wrapper |
| `ws-cam-coll-broll` "B-Roll Highlights" | Folder in camera workspace, shared with art + editorial |
| `ws-audio-coll-for-editorial` "Temp Sound Kit" | Folder in audio workspace, shared with editorial |

## Access model changes

### Before (collection ripple)
```
Grant on collection -> resolve collection asset IDs -> each asset gets rippled permissions
```

### After (folder inheritance)
```
Grant on folder -> folder contents inherit permissions -> subfolders inherit too
```

This is simpler. Folder inheritance already exists in the codebase (`nodeToParent` chain in `getEffectivePermissionSet`). The collection ripple (`collectionAssetAccessById`) can be removed once all grants point to folders.

## Snapshot shares

Smart collection shares that need freezing: the grant stores `snapshotAssetIds` directly. No intermediate curated collection needed. The smart collection stays dynamic for browsing; the grant's frozen asset list is what the recipient sees.

## Risk

The biggest risk is breaking the demo scenarios. Each scenario must be walked through with folder-based sharing before the migration starts. The VFX turnover, editorial cut progression, and vendor handoff flows must work with folders.

## Execution order

1. Walk through all demo scenarios with folder-based sharing on paper
2. Update seed data: convert curated collections to folders with grants
3. Update `useAccess.tsx`: folder-based ripple replaces collection ripple
4. Remove `useShareAsCollection.ts`: share folders directly
5. Update access panel: remove smart-to-curated conversion
6. Update nav sidebar: remove curated collections, show shared folders
7. Remove `collection-membership-modal.tsx` and `UserCollectionDetailView`
8. Update contextual action bar: "Add to Folder"
9. Clean up remaining references
10. Bump seed version, test all scenarios
