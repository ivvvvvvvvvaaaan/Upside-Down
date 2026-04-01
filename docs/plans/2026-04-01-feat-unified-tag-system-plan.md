---
title: "feat: Unified Tag System"
type: feat
status: active
date: 2026-04-01
origin: docs/brainstorms/2026-04-01-unified-tag-system-brainstorm.md
---

# Unified Tag System

Replace scattered tag-like fields (`typeTag`, `isKeyArt`, `isFinal`, `aiMeta.keywords`) with a single `tags: AssetTag[]` field on Asset. All tags render identically. "Appears in" (ontology graph) stays separate.

(See brainstorm: `docs/brainstorms/2026-04-01-unified-tag-system-brainstorm.md`)

## Acceptance Criteria

- [ ] Asset type has `tags: AssetTag[]` field
- [ ] `AssetTag = { label: string; source: 'ai' | 'system' | 'user' }`
- [ ] `promotedInstanceToAsset` populates tags from existing fields (typeTag → system, keywords → ai, isKeyArt/isFinal → system)
- [ ] Asset card shows max 2 tags: type tag + status (Key Art/Final)
- [ ] Detail panel Tags section renders all tags uniformly from `asset.tags`
- [ ] Detail panel has input to add user tags (type + enter)
- [ ] User tags persist to localStorage (keyed by asset ID)
- [ ] Search matches against tag labels
- [ ] "Appears in" section unchanged
- [ ] `npx tsc --noEmit` passes

## Implementation

### 1. Add `AssetTag` type and `tags` field

**File: `src/lib/data.ts`**

```ts
export type TagSource = 'ai' | 'system' | 'user'

export type AssetTag = {
  label: string
  source: TagSource
}

export type Asset = {
  // ... existing fields
  tags?: AssetTag[]  // unified tag list
}
```

- [ ] Add `TagSource` and `AssetTag` types
- [ ] Add `tags` field to Asset

### 2. Populate tags in `promotedInstanceToAsset`

**File: `src/lib/asset-instances.ts`**

Build tags array from existing fields:

```ts
const tags: AssetTag[] = []

// Type tag (system)
const typeTag = instance.aiTags?.typeTag ?? instance.category
if (typeTag) tags.push({ label: typeTag, source: 'system' })

// Status flags (system)
if (instance.aiTags?.typeTag === 'Key Art' || /* check */) tags.push({ label: 'Key Art', source: 'system' })

// AI keywords (ai)
if (instance.aiTags?.keywords) {
  for (const k of instance.aiTags.keywords) {
    tags.push({ label: k, source: 'ai' })
  }
}

base.tags = tags
```

Keep populating the legacy fields too (backwards compat) until all consumers migrate.

- [ ] Build tags array in promotedInstanceToAsset
- [ ] Keep legacy fields for now

### 3. Update AssetCard to read from tags

**File: `src/components/ui/asset-card.tsx`**

Replace `renderTypeTag()` and the `isKeyArt` check with:

```tsx
const typeTag = asset.tags?.find(t => t.source === 'system' && t.label !== 'Key Art' && t.label !== 'Final')
const statusTag = asset.tags?.find(t => t.label === 'Key Art' || t.label === 'Final')

// In footer:
{typeTag && <Tag>{typeTag.label}</Tag>}
{statusTag && <Tag type={statusTag.label === 'Final' ? 'positive' : 'announcement'}>{statusTag.label}</Tag>}
```

Fall back to legacy `getTypeTag()` if `tags` is empty (backwards compat).

- [ ] Read type tag from `asset.tags`
- [ ] Read status tag from `asset.tags`
- [ ] Max 2 tags on card
- [ ] Fallback to legacy fields

### 4. Update detail panel Tags section

**File: `src/components/ui/asset-detail-panel.tsx`**

Replace the current Tags section with a unified render from `asset.tags`:

```tsx
{asset.tags && asset.tags.length > 0 && (
  <section className="space-y-2">
    <h3 className="text-label-0-bold uppercase text-foreground-dim">Tags</h3>
    <div className="flex flex-wrap gap-1.5">
      {asset.tags.map(tag => (
        <Tag key={tag.label} size="compact" type="neutral" variant="border">{tag.label}</Tag>
      ))}
    </div>
  </section>
)}
```

Status tags (Key Art, Final) can keep their colored variants for visual weight.

- [ ] Render from `asset.tags`
- [ ] Color Key Art (announcement) and Final (positive)
- [ ] All others neutral

### 5. Add user tag input in detail panel

**File: `src/components/ui/asset-detail-panel.tsx`**

Below the tag list, add a text input for adding user tags:

```tsx
<input
  type="text"
  placeholder="Add tag..."
  onKeyDown={e => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      addUserTag(asset.id, e.currentTarget.value.trim())
      e.currentTarget.value = ''
    }
  }}
/>
```

User tags persist to localStorage keyed by asset ID.

- [ ] Text input below tags
- [ ] Enter to add
- [ ] Persist to localStorage (`user-tags` key → `Record<assetId, string[]>`)
- [ ] Load and merge with asset.tags on render

### 6. Update search to match tags

**File: `src/lib/smart-collection-filters.ts`**

In `matchesFilter`, when matching `query`, also check `asset.tags?.some(t => t.label.toLowerCase().includes(q))`.

- [ ] Add tag label matching to search filter

## Sources

- **Brainstorm:** [docs/brainstorms/2026-04-01-unified-tag-system-brainstorm.md](docs/brainstorms/2026-04-01-unified-tag-system-brainstorm.md)
  - Key decisions: source-based tags, card shows type+status only, all tags render identically, Appears in stays separate, department not a tag
- Asset type: `src/lib/data.ts:82`
- Tag component: `src/components/ui/tag.tsx`
- Asset card: `src/components/ui/asset-card.tsx`
- Detail panel: `src/components/ui/asset-detail-panel.tsx`
- Asset builder: `src/lib/asset-instances.ts`
- Search filter: `src/lib/smart-collection-filters.ts`
