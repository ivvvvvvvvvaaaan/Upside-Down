# Unified Tag System

## What We're Building

Replace the scattered tag-like fields on assets (typeTag, isKeyArt, isFinal, department, aiMeta.keywords) with a single unified tag model. Every asset has one flat list of tags. Tags come from three sources but render identically.

## Why This Approach

Currently there are 6+ disconnected tag concepts: `typeTag` (on nested metadata objects), `isKeyArt` (boolean), `isFinal` (boolean), `department` (enum), `aiMeta.keywords[]` (strings), plus characters/scene/location in `aiMeta`. These live in different fields, display differently, and can't be searched or filtered uniformly. A unified model makes tags predictable and extensible.

**What stays separate:** "Appears in" is NOT tags — it's the ontology graph (traversable relationships between creative entities: characters, scenes, locations, collections, folders). That stays as-is. Tags describe the asset. "Appears in" describes the asset's relationships.

## Key Decisions

### 1. Data model: source-based tags

```ts
type TagSource = 'ai' | 'system' | 'user'

type AssetTag = {
  label: string
  source: TagSource
}
```

- `system` — type tag (VFX Plate), status (Key Art, Final), department (Editorial)
- `ai` — keywords from AI analysis (plate, SEQ010, SH020, clean plate)
- `user` — manually added by users

All render identically. Source is metadata, not visual styling.

### 2. Card display: type + status only

Asset cards show max 2 tags: the type tag + Key Art/Final if applicable. No keywords, no department on the card. Clean and scannable.

### 3. Detail panel: flat tag list

All tags in one section, no grouping by source. Status tags (Key Art, Final) can use colored variants. Everything else is neutral.

### 4. "Appears in" stays separate

Characters, scenes, locations remain in the "Appears in" section as navigable collection links. They are ontology relationships, not tags. The tag system doesn't touch this.

### 5. User tags are additive

Users can type to add tags in the detail panel. These are `source: 'user'` and persist alongside AI and system tags. No approval workflow.

## Changes Required

### Data model
- Add `tags: AssetTag[]` field to Asset type
- Populate from existing fields: typeTag → system, isKeyArt → system "Key Art", isFinal → system "Final", department → system, aiMeta.keywords → ai
- Remove the scattered boolean/string fields over time (or derive them from tags)

### Asset card
- Show only `system` source tags with labels that match type or status
- Max 2 tags on the card

### Detail panel Tags section
- Render all tags uniformly from `asset.tags`
- Add input for user tags (type + enter to add)

### Search
- Search across all tag labels regardless of source

## Resolved Questions

1. **Should Appears in merge with tags?** → No. Appears in is ontology (traversable relationships). Tags describe the asset. Different concepts, separate sections.

2. **Visual distinction by source?** → No. All tags render identically. Source is internal metadata.

3. **Card tag limit?** → Type + status (max 2). Keywords only in detail panel.

## Resolved Questions (continued)

4. **Should department be a tag?** → No. Department is structural metadata (like file size), not a descriptive tag. Stays in Details only.
