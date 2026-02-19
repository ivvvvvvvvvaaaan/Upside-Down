# Collection Creation Prototype

## Overview

Enable users to create collections from selected assets and see them appear in the NavSidebar's "My Collections" section. This is a prototype implementation without backend persistence - collections will exist only in client-side React state.

## Current State

- **SelectionBar** (`src/components/ui/selection-bar.tsx`): Has "Add to Collection" button that triggers `NewCollectionModal`, receives `selectedAssets` array, but `onCreateCollection` callback only logs to console
- **NavSidebar** (`src/components/ui/nav-sidebar.tsx`): Has "My Collections" section showing "No collections yet" empty state and "New Collection" button with `onNewCollection` callback prop
- **NewCollectionModal** (`src/components/ui/new-collection-modal.tsx`): Modal with name input, invokes `onCreate(name)` callback
- **No shared state**: Collections exist nowhere - no context, no store, no persistence
- **No nextgen layout**: Only root `src/app/layout.tsx` exists - need to create `src/app/nextgen/layout.tsx`

## Implementation Plan

### 1. Create Collections Context ✅

**File**: `src/hooks/useUserCollections.tsx`

Create a React Context + hook to manage collection state across the app:

```typescript
type Collection = {
  id: string
  name: string
  assetIds: string[]
  createdAt: Date
}

type CollectionsContextValue = {
  collections: Collection[]
  createCollection: (name: string, assetIds: string[]) => Collection
  deleteCollection: (id: string) => void
  getCollection: (id: string) => Collection | undefined
}
```

- Generate unique IDs with `crypto.randomUUID()` or timestamp-based
- Store collections in state array
- Wrap app in provider at layout level

### 2. Wire Views to Context ✅

**Files**: `src/app/nextgen/search-view.tsx`, `src/app/nextgen/assets/view.tsx`, `src/app/nextgen/collections/view.tsx`

- Import and use `useCollections` hook
- Replace console.log with actual `createCollection` call
- After creation: clear selection, optionally show success toast

**Changes needed**:
- Add `useCollections` import
- In `onCreateCollection` handler: call `createCollection(name, selectedAssets.map(a => a.id))`
- Clear selection after successful creation

### 3. Update NavSidebar to Show Dynamic Collections ✅

**File**: `src/components/ui/nav-sidebar.tsx`

- Import and use `useCollections` hook
- Replace hardcoded "My Collections" items with dynamic list from context
- Keep existing static items as defaults OR remove them entirely
- Each collection links to `/nextgen/collections/[id]`

**Changes needed**:
- Convert to client component (add `'use client'`)
- Map over `collections` array to render nav items
- Use collection name and generated href

### 4. Create Collection Detail Route ✅

**File**: `src/app/nextgen/collections/[id]/page.tsx`

Create dynamic route for viewing individual collections:

- Server component wrapper
- Passes collection ID to client view

**File**: `src/app/nextgen/collections/[id]/view.tsx`

Client component that:
- Uses `useCollections` to get collection by ID
- Uses collection's `assetIds` to filter/fetch assets
- Renders collection name as header
- Displays assets in CardGrid with same pattern as other views
- Shows empty state if collection not found

### 5. Create Nextgen Layout with Provider ✅

**File**: `src/app/nextgen/layout.tsx`

Create a new layout file for the nextgen section and wrap with `CollectionsProvider`:

```tsx
import { CollectionsProvider } from '@/contexts/collections-context'

export default function NextGenLayout({ children }) {
  return (
    <CollectionsProvider>
      {/* existing layout */}
    </CollectionsProvider>
  )
}
```

## File Changes Summary

| File | Action | Description | Status |
|------|--------|-------------|--------|
| `src/hooks/useUserCollections.tsx` | Create | Context + hook for user collection state | ✅ |
| `src/hooks/index.ts` | Modify | Export new hook | ✅ |
| `src/app/nextgen/search-view.tsx` | Modify | Wire to context, call createCollection | ✅ |
| `src/app/nextgen/assets/view.tsx` | Modify | Wire to context, call createCollection | ✅ |
| `src/app/nextgen/collections/view.tsx` | Modify | Wire to context, call createCollection | ✅ |
| `src/components/ui/nav-sidebar.tsx` | Modify | Render dynamic collections from context | ✅ |
| `src/app/nextgen/layout.tsx` | Create | New layout with UserCollectionsProvider | ✅ |
| `src/app/nextgen/collections/[id]/page.tsx` | Create | Dynamic route for collection detail | ✅ |
| `src/app/nextgen/collections/[id]/view.tsx` | Create | Collection detail view component | ✅ |
| `src/lib/data.ts` | Modify | Add getAssetsByIds helper | ✅ |

## User Flow

1. User selects assets in any view (search, all assets, etc.)
2. SelectionBar appears with "Create Collection" button
3. User clicks button, NewCollectionModal opens
4. User enters collection name, clicks Create
5. Collection is created in context with selected asset IDs
6. Selection is cleared, modal closes
7. New collection immediately appears in NavSidebar under "My Collections"
8. User can click collection in nav to view its contents

## Edge Cases

- **Empty name**: Modal should validate non-empty name (already has validation)
- **No assets selected**: Button should be disabled (already handled by SelectionBar visibility)
- **Collection not found**: Show "Collection not found" message in detail view
- **Page refresh**: Collections are lost (expected - prototype behavior)

## Not In Scope

- Backend persistence
- Collection editing/renaming
- Removing assets from collections
- Sharing collections
- Collection thumbnails
