---
title: "feat: Ontology Visualization for Smart Collections"
type: feat
status: active
date: 2026-04-01
origin: docs/brainstorms/2026-04-01-ontology-visualization-brainstorm.md
---

# Ontology Visualization for Smart Collections

Replace plain text relationship links in the smart collection side panel with rich visual cards and an inline relationship graph.

(See brainstorm: `docs/brainstorms/2026-04-01-ontology-visualization-brainstorm.md`)

## Acceptance Criteria

- [ ] Characters render as circular avatar chips with thumbnail + name
- [ ] Scenes/locations render as mini rectangular cards with 2-3 image previews + name
- [ ] Cards are horizontally scrollable per dimension row
- [ ] Inline SVG graph (~200px) shows selected entity centered, related entities around it
- [ ] Graph nodes are clickable (navigate to that collection)
- [ ] Graph lines connect center to related nodes
- [ ] Works for all three dimensions (character, scene, location child collections)
- [ ] Falls back gracefully when no images are available
- [ ] `npx tsc --noEmit` passes

## Implementation

### 1. Derive images for related SmartCollections

**Problem:** `SmartCollection` has no image fields. `getRelatedCollections` returns SmartCollections. The cards need thumbnails.

**Solution:** At render time in the panel, derive images from matching assets for each related collection. Use the same `pick(IMAGE_POOL, collectionId)` pattern that `data.ts` uses for Collection thumbnails.

```ts
// In smart-collection-side-panel.tsx
import { pick, IMAGE_POOL } from '@/lib/images'

function getCollectionImages(collectionId: string): { mainImage: string; thumbnails: string[] } {
  const mainImage = pick(IMAGE_POOL, collectionId, 1)[0]
  const thumbnails = pick(IMAGE_POOL, collectionId + '-thumb', 2)
  return { mainImage, thumbnails }
}
```

- [ ] Add `getCollectionImages` helper
- [ ] Use for both avatar chips and mini cards

### 2. Character avatar chips component

**File: `src/components/ui/smart-collection-side-panel.tsx`**

Horizontal row of circular thumbnails with names:

```tsx
function CharacterChips({ items }: { items: SmartCollection[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {items.map(item => {
        const { mainImage } = getCollectionImages(item.id)
        return (
          <Link key={item.id} href={`/nextgen/smart-collections/${item.id}`}
            className="flex flex-col items-center gap-1 shrink-0 group">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <Image src={mainImage} alt={item.name} fill className="object-cover" />
            </div>
            <span className="text-body-0-regular text-foreground-dim group-hover:text-foreground truncate max-w-[60px]">
              {item.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] Create `CharacterChips` component
- [ ] Circular 48px thumbnails from collection mainImage
- [ ] Name below, truncated
- [ ] Horizontal scroll, shrink-0

### 3. Scene/location mini cards component

```tsx
function EntityCards({ items, kind }: { items: SmartCollection[]; kind: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map(item => {
        const { mainImage, thumbnails } = getCollectionImages(item.id)
        return (
          <Link key={item.id} href={`/nextgen/smart-collections/${item.id}`}
            className="shrink-0 w-[140px] rounded overflow-hidden border border-border-dim group">
            <div className="flex h-16 gap-px">
              <div className="flex-[2] relative">
                <Image src={mainImage} alt={item.name} fill className="object-cover" />
              </div>
              {thumbnails.map((t, i) => (
                <div key={i} className="flex-1 relative">
                  <Image src={t} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
            <div className="px-2 py-1">
              <p className="text-body-0-regular text-foreground truncate group-hover:text-foreground-system-link">
                {item.name}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] Create `EntityCards` component
- [ ] 140px wide, 1 main + 2 small images in a strip
- [ ] Name below the image strip
- [ ] Horizontal scroll

### 4. Inline relationship graph (SVG)

**~200px tall, radial layout.** Center node = selected entity. Related entities positioned around it in a circle. Lines from center to each related node.

```tsx
function RelationshipGraph({
  center,
  related,
}: {
  center: { name: string; id: string }
  related: { name: string; id: string; dimension: string }[]
}) {
  const cx = 160, cy = 100, r = 75
  const nodes = related.map((item, i) => {
    const angle = (2 * Math.PI * i) / related.length - Math.PI / 2
    return { ...item, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })

  return (
    <svg viewBox="0 0 320 200" className="w-full h-[200px]">
      {/* Lines */}
      {nodes.map(n => (
        <line key={n.id} x1={cx} y1={cy} x2={n.x} y2={n.y}
          stroke="var(--border-dim)" strokeWidth={1} />
      ))}
      {/* Center node */}
      <circle cx={cx} cy={cy} r={20} className="fill-surface-3 stroke-border" />
      <text x={cx} y={cy + 4} textAnchor="middle"
        className="fill-foreground text-[10px] font-bold">{center.name.slice(0, 8)}</text>
      {/* Related nodes */}
      {nodes.map(n => (
        <Link key={n.id} href={`/nextgen/smart-collections/${n.id}`}>
          <circle cx={n.x} cy={n.y} r={16}
            className="fill-surface-2 stroke-border-dim hover:fill-surface-3 cursor-pointer transition-colors" />
          <text x={n.x} y={n.y + 3} textAnchor="middle"
            className="fill-foreground-dim text-[8px] pointer-events-none">{n.name.slice(0, 10)}</text>
        </Link>
      ))}
    </svg>
  )
}
```

- [ ] Create `RelationshipGraph` component
- [ ] SVG viewBox 320x200
- [ ] Center node with entity name
- [ ] Related nodes positioned radially
- [ ] Lines from center to each node
- [ ] Clickable nodes navigate to collection
- [ ] Use CSS variables for Hawkins colors

### 5. Wire into SmartCollectionSidePanel

Replace the current plain link list with the new components:

```tsx
// Replace isRelationshipMode section:
{isRelationshipMode && (
  <div className="space-y-4">
    <RelationshipGraph
      center={{ name: collection.name, id: collection.id }}
      related={allRelated}
    />
    {relationships.characters.length > 0 && (
      <section className="space-y-2">
        <h3 className="text-body-0-bold text-foreground-dim">Characters</h3>
        <CharacterChips items={relationships.characters} />
      </section>
    )}
    {relationships.scenes.length > 0 && (
      <section className="space-y-2">
        <h3 className="text-body-0-bold text-foreground-dim">Scenes</h3>
        <EntityCards items={relationships.scenes} kind="Scene" />
      </section>
    )}
    {relationships.locations.length > 0 && (
      <section className="space-y-2">
        <h3 className="text-body-0-bold text-foreground-dim">Locations</h3>
        <EntityCards items={relationships.locations} kind="Location" />
      </section>
    )}
  </div>
)}
```

- [ ] Replace plain link rendering with new components
- [ ] Build `allRelated` array for graph from all three dimensions
- [ ] Keep filter summary and edit button for non-relationship mode

## Technical Notes

- **No new dependencies.** SVG is hand-drawn, images use existing `pick(IMAGE_POOL)`.
- **SmartCollection has no image fields.** Images derived at render time via deterministic hash — same asset always gets same thumbnail regardless of where it's shown.
- **Horizontal scroll** uses `overflow-x-auto` — native browser scrolling, no custom scroll library.
- **SVG graph** uses `viewBox` for responsive scaling. CSS variables for colors keep it theme-aware.

## Sources

- **Brainstorm:** [docs/brainstorms/2026-04-01-ontology-visualization-brainstorm.md](docs/brainstorms/2026-04-01-ontology-visualization-brainstorm.md)
  - Key decisions: circular avatars for characters, mini cards for scenes/locations, pure SVG graph, clickable nodes, collection mainImage as avatar source
- Smart collection panel: `src/components/ui/smart-collection-side-panel.tsx`
- Relationship data: `src/hooks/useSmartCollections.tsx:205` (`getRelatedCollections`)
- Image derivation: `src/lib/images.ts` (`pick`, `IMAGE_POOL`)
- Avatar component: `src/components/ui/avatar.tsx`
