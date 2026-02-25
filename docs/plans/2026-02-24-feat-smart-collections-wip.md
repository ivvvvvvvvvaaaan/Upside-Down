# Smart Collections Implementation

**Status:** In Progress
**Started:** 2026-02-24
**Last Updated:** 2026-02-24

## Overview

Rework smart collections from hardcoded static groups to dynamic filter-based collections that users can create, edit, and delete. Default collections serve as suggestions.

## Architecture

### Types (in `src/lib/data.ts`)

```typescript
type SmartCollectionIcon = 'character' | 'location' | 'scene' | 'palette' | 'filter' | 'tag'

type AssetFilter = {
  query?: string              // Free text search (name, tags)
  types?: AssetType[]         // ['image', 'video', 'shot', 'text', 'audio']
  department?: DepartmentId   // 'art-design', 'vfx', 'camera', etc.
  typeTags?: string[]         // ['Concept Art', 'Storyboards', 'Final']
  isKeyArt?: boolean          // Key art filter
}

type SmartCollection = {
  id: string
  name: string
  icon: SmartCollectionIcon
  filter: AssetFilter
  isDefault?: boolean         // Cannot be deleted, only edited
  createdAt: Date
}
```

### Filter Logic
- All filter rules are combined with AND logic
- Empty/undefined rules are ignored (pass-through)
- Example: `types: ['image'], query: 'yellow'` = images containing "yellow"

## Implementation Status

### Completed

| Step | File | Status |
|------|------|--------|
| 1. Add types to data.ts | `src/lib/data.ts` | Done |
| 2. Create useSmartCollections hook | `src/hooks/useSmartCollections.tsx` | Done |
| 3. Create filter builder component | `src/components/ui/smart-collection-filter-builder.tsx` | Done |
| 4. Create smart collection side panel | `src/components/ui/smart-collection-side-panel.tsx` | Done |
| 5. Create smart collection detail pages | `src/app/nextgen/smart-collections/[id]/` | Done |
| 6. Update layout with provider | `src/app/nextgen/layout.tsx` | Done |
| 7. Update nav sidebar | `src/components/ui/nav-sidebar.tsx` | Done |
| 8. Export from hooks index | `src/hooks/index.ts` | Done |
| 9. Export from components index | `src/components/ui/index.ts` | Done |

### Default Collections

| Name | Icon | Filter |
|------|------|--------|
| Characters | character (User) | `{ typeTags: ['Character'] }` |
| Locations | location (MapPin) | `{ typeTags: ['Location', 'Environment'] }` |
| Scenes | scene (Film) | `{ typeTags: ['Scene'] }` |
| Color Palettes | palette (Palette) | `{ typeTags: ['Color Palette', 'Palette'] }` |

## Files Changed

### Created
- `src/hooks/useSmartCollections.tsx` - Context, Provider, CRUD, filter matching
- `src/components/ui/smart-collection-filter-builder.tsx` - Filter UI builder
- `src/components/ui/smart-collection-side-panel.tsx` - Edit panel
- `src/app/nextgen/smart-collections/[id]/page.tsx` - Server page
- `src/app/nextgen/smart-collections/[id]/view.tsx` - Client view

### Modified
- `src/lib/data.ts` - Added SmartCollection, AssetFilter, SmartCollectionIcon types
- `src/hooks/index.ts` - Added exports
- `src/app/nextgen/layout.tsx` - Added SmartCollectionsProvider
- `src/components/ui/nav-sidebar.tsx` - Dynamic smart collections with icons
- `src/components/ui/index.ts` - Added component exports

## Recent Changes

### 2026-02-24: Unified Collections & Progressive Disclosure

**Sidebar: Unified "Collections" section**
- Merged "Smart Collections" + "My Collections" into single "Collections" section
- Smart collections: show semantic icons (User, MapPin, Film, Palette, Filter, Tag)
- User collections: show Folder icon + asset count badge
- "New Collection" button at bottom
- Conceptual model: all are "my collections", differentiated by smart/manual and shared/private

**New Collection Modal: Unified creation flow**
- Type choice step when no assets selected: "Manual" or "Smart" cards
- If assets selected (from selection bar): goes straight to manual form
- Smart collection form: name + icon selector, filter rules added after creation
- Manual collection form: name + asset preview thumbnails
- After creation: navigates to the new collection page

**Filter Builder: Progressive disclosure**
Redesigned `smart-collection-filter-builder.tsx` for better UX:

**Before:** All filter options shown at once (overwhelming)

**After:** Progressive disclosure pattern
- **Name & Icon** - Always visible at top (no section header)
- **Filter Rules section** - Active filters shown as removable rows
- **"Add filter" button** - Opens popover to add new filter types
- Each filter type can only be added once
- Inline editing within filter rows
- Remove button appears on hover

**Filter Types:**
| Type | UI |
|------|-----|
| Name contains | Text input |
| Asset type | Toggle chips (Image, Video, Shot, Text, Audio) |
| Department | Dropdown select |
| Type tag | Chips + "Add" popover for presets |
| Key art only | Toggle switch |

## TODO / Future Iterations

### High Priority
- [x] ~~Add "New Smart Collection" button to nav sidebar~~ (unified "New Collection" button)
- [x] ~~Create modal for creating new smart collections~~ (unified modal with type choice)
- [ ] Test filtering with real asset data
- [ ] Verify type tags match actual asset metadata

### Medium Priority
- [ ] Add search within smart collection view
- [ ] Add sort options to smart collection view
- [ ] Persist smart collections to localStorage
- [ ] Add collection reordering in sidebar

### Low Priority
- [ ] Add collection duplication
- [ ] Add collection sharing
- [ ] Add bulk operations on filtered assets
- [ ] Add filter presets/templates

## Design System Consistency

**Heights:**
- Top-level form fields: standard h-10 (40px) - Input, FormSelect
- Inline/row editors: compact h-8 (32px) - FormSelect compact, inline inputs

**Components used:**
- Input component for text fields
- FormSelect for dropdowns
- Custom toggle switch (styled to match design system)
- Button with variants (primary, secondary, tertiary, icon)
- Popover for add-filter dropdown

## Known Issues

1. **Type tags may not match** - The filter uses typeTags like 'Character', 'Location', etc. but these need to match exactly with asset metadata typeTag fields. Current mock data may not have these tags.

2. **No persistence** - Smart collections are stored in React state only. Page refresh resets to defaults.

3. **No "New Smart Collection" UI** - Users can only use default collections currently. Need to add creation flow.

## Testing Notes

- Navigate to `/nextgen` to see smart collections in sidebar
- Click any smart collection to view filtered assets
- Use side panel to edit filter rules
- Default collections cannot be deleted (delete button hidden)

## API Endpoints Used

- `GET /api/assets` - Fetch all assets for client-side filtering

## Design Decisions

1. **Client-side filtering** - Chosen for prototype simplicity. All assets fetched, then filtered in browser.

2. **AND logic for filters** - All rules must match. Simpler mental model than complex boolean expressions.

3. **Default collections are deletable** - Defaults are just starting suggestions. Users can delete any collection. If needed, they can recreate.

4. **Icons from Lucide** - Using existing icon library for consistency: User, MapPin, Film, Palette, Filter, Tag.

5. **Matching count in panel header** - Shows asset count prominently at top, not buried in form.
