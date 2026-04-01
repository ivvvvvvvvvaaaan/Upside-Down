# Ontology Visualization for Smart Collections

## What We're Building

Replace the plain text relationship links in the smart collection side panel with two visual treatments:

1. **Rich relationship cards** — styled differently per entity type:
   - Characters → circular avatar chip (collection's mainImage) + name
   - Scenes → mini rectangular card with 2-3 image previews + name
   - Locations → same rectangular treatment as scenes

2. **Inline relationship graph** — a small (~200px tall) node diagram showing the selected entity in the center connected to related entities. Nodes are clickable for navigation.

Both render in the smart collection side panel when viewing a child collection (e.g., Demogorgon under Character).

## Why This Approach

The current plain text links lose the visual richness of the ontology. Characters are people — they should look like people (avatars). Scenes and locations are places — they should show imagery. The graph adds a spatial understanding of how entities connect that a flat list can't communicate.

The side panel at 360px is tight but can fit both: cards as a horizontal scrollable strip per dimension, graph as a compact fixed-height diagram below.

## Key Decisions

### 1. Character avatars use collection mainImage
The smart collection child already has a `mainImage` computed from its matching assets (via `imagesFromFileIds`). Reuse that — no new data needed.

### 2. Scene/location cards show 2-3 preview images
A strip of tiny thumbnails inside each mini card gives a sense of the content. Derived from the collection's existing `thumbnailImages` array.

### 3. Graph is small and inline (~200px)
Fits within the panel without overwhelming the cards. Selected entity centered, related entities positioned around it. Compact enough for 360px width.

### 4. Graph nodes are clickable
Each node navigates to that collection's page. The graph is both visualization and navigation.

### 5. Cards laid out horizontally per dimension
Characters as a horizontal row of avatar chips. Scenes as a horizontal scrollable row of mini cards. Keeps vertical space manageable in the panel.

## Layout Sketch

```
┌─────────────────────────────────┐
│ [LayoutGrid] Demogorgon         │
│ Smart Collection            [X] │
├─────────────────────────────────┤
│ Assets  12     Created  Jan 15  │
│                                 │
│ ┌─ Graph ─────────────────────┐ │
│ │        [Scene A]            │ │
│ │           │                 │ │
│ │  [Loc] ─ ● ─ [Scene B]     │ │
│ │           │                 │ │
│ │        [Loc B]              │ │
│ └─────────────────────────────┘ │
│                                 │
│ Scenes                          │
│ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │▪▪▪   │ │▪▪▪   │ │▪▪▪   │ →   │
│ │Lab   │ │Court │ │Park  │     │
│ └──────┘ └──────┘ └──────┘     │
│                                 │
│ Locations                       │
│ ┌──────┐ ┌──────┐              │
│ │▪▪▪   │ │▪▪▪   │              │
│ │Upside│ │Lab   │              │
│ └──────┘ └──────┘              │
│                                 │
│ Filter rules...                 │
│ Access...                       │
└─────────────────────────────────┘
```

## Resolved Questions

1. **Graph size?** → Small inline, ~200px tall, within the panel.
2. **Avatar source?** → Collection's mainImage (already computed).
3. **Preview images per card?** → 2-3 small thumbnails.
4. **Graph interactivity?** → Clickable nodes for navigation.

## Resolved Questions (continued)

5. **Graph library?** → Pure SVG with CSS. Radial layout, hand-positioned. No dependencies. Hawkins tokens for styling.
