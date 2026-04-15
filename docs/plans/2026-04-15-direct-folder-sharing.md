# Direct Folder Sharing

*April 15, 2026.*

## The change

Sharing a folder creates a grant on the folder. No intermediate collection.

**Folder**: share a workspace location. Vendor deliveries, dailies, department handoffs. New files land in it automatically.

**Collection**: curate a package from multiple locations. Review packages, cross-folder selections, personal groupings.

**Smart collection**: system-generated discovery. Characters, scenes, locations.

## Sharing flow

Before: share folder -> create collection -> grant on collection.
After: share folder -> grant on folder.

## Remove

- `src/hooks/useShareAsCollection.ts`
- `src/lib/smart-collection-share-utils.ts`

## Refactor

- `src/hooks/useAccess.tsx` -- folder grants cascade to contents via `nodeToParent`
- `src/components/ui/access-panel.tsx` -- folder shares create grants directly
- `src/components/ui/nav-sidebar.tsx` -- shared folders under Workspaces
- `src/lib/scenario.ts` -- folder-bound collection grants become folder grants

## Seed data

Folder-bound collections become folder grants:
- "Framestore" -> grant on `ws-vfx-vendor-framestore`
- "Camera Selects" -> grant on `ws-cam-selects`
- "Lens Data" -> grant on folder

Curated collections stay: "EP301 VFX Pulls", "Dailies Review Cuts", "Hero Shots".

## Access model

Two paths:
1. Folder: grant on folder -> contents inherit via parent chain
2. Collection: grant on collection -> assets resolved by membership

## Steps

1. Direct folder sharing
2. Access panel handles folder shares
3. Seed data migration
4. Remove `useShareAsCollection.ts`
5. Shared folders in nav sidebar
6. Bump seed version, test
