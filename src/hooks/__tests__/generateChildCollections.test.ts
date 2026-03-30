import { describe, it, expect } from 'vitest'
import { generateChildCollections, slugify } from '@/lib/smart-collection-filters'
import type { Asset, SmartCollection } from '@/lib/data'

function makeParent(overrides: Partial<SmartCollection> = {}): SmartCollection {
  return {
    id: 'parent-1',
    name: 'Parent',
    icon: 'character',
    filter: {},
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'a1',
    name: 'Test Asset',
    type: 'image',
    ...overrides,
  }
}

describe('slugify', () => {
  it('lowercases and replaces non-alphanumeric with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips leading/trailing hyphens', () => {
    expect(slugify('--Hello--')).toBe('hello')
  })

  it('collapses multiple separators', () => {
    expect(slugify('Foo   Bar & Baz')).toBe('foo-bar-baz')
  })

  it('handles already-clean input', () => {
    expect(slugify('eleven')).toBe('eleven')
  })
})

describe('generateChildCollections', () => {
  it('returns empty array when no groupBy', () => {
    const parent = makeParent({ groupBy: undefined })
    expect(generateChildCollections(parent, [makeAsset()])).toEqual([])
  })

  it('groups by characters — sorted, correct IDs', () => {
    const parent = makeParent({
      id: 'sc-char',
      filter: { aiHasCharacters: true },
      groupBy: 'characters',
    })

    const assets: Asset[] = [
      makeAsset({ id: 'a1', aiMeta: { characters: ['Mike Wheeler', 'Eleven'] } }),
      makeAsset({ id: 'a2', aiMeta: { characters: ['Eleven', 'Dustin Henderson'] } }),
    ]

    const children = generateChildCollections(parent, assets)

    expect(children).toHaveLength(3)
    expect(children.map(c => c.name)).toEqual(['Dustin Henderson', 'Eleven', 'Mike Wheeler'])
    expect(children[0].id).toBe('sc-char--dustin-henderson')
    expect(children[1].id).toBe('sc-char--eleven')
    expect(children[2].id).toBe('sc-char--mike-wheeler')

    // Each child has correct filter
    expect(children[1].filter).toEqual({ aiCharacters: ['Eleven'] })
    // Each child references parent
    expect(children[0].parentId).toBe('sc-char')
  })

  it('groups by locations', () => {
    const parent = makeParent({
      id: 'sc-loc',
      filter: { aiHasLocation: true },
      groupBy: 'locations',
    })

    const assets: Asset[] = [
      makeAsset({ id: 'a1', aiMeta: { location: 'Hawkins Lab' } }),
      makeAsset({ id: 'a2', aiMeta: { location: 'Byers House' } }),
      makeAsset({ id: 'a3', aiMeta: { location: 'Hawkins Lab' } }),
    ]

    const children = generateChildCollections(parent, assets)

    expect(children).toHaveLength(2)
    expect(children.map(c => c.name)).toEqual(['Byers House', 'Hawkins Lab'])
    expect(children[0].id).toBe('sc-loc--byers-house')
    expect(children[0].filter).toEqual({ aiLocation: 'Byers House' })
  })

  it('groups by scenes', () => {
    const parent = makeParent({
      id: 'sc-scene',
      filter: { aiHasScene: true },
      groupBy: 'scenes',
    })

    const assets: Asset[] = [
      makeAsset({ id: 'a1', aiMeta: { scene: 'INT. HAWKINS LAB - NIGHT' } }),
      makeAsset({ id: 'a2', aiMeta: { scene: 'EXT. FOREST CHASE - DUSK' } }),
    ]

    const children = generateChildCollections(parent, assets)

    expect(children).toHaveLength(2)
    expect(children.map(c => c.name)).toEqual(['EXT. FOREST CHASE - DUSK', 'INT. HAWKINS LAB - NIGHT'])
    expect(children[1].filter).toEqual({ aiScene: 'INT. HAWKINS LAB - NIGHT' })
  })

  it('returns empty array when no assets match parent filter', () => {
    const parent = makeParent({
      filter: { department: 'vfx' },
      groupBy: 'characters',
    })

    const assets: Asset[] = [
      makeAsset({ department: 'art-design', aiMeta: { characters: ['Eleven'] } }),
    ]

    expect(generateChildCollections(parent, assets)).toEqual([])
  })

  it('skips assets without aiMeta gracefully', () => {
    const parent = makeParent({
      id: 'sc-char',
      filter: {},
      groupBy: 'characters',
    })

    const assets: Asset[] = [
      makeAsset({ id: 'a1' }), // no aiMeta
      makeAsset({ id: 'a2', aiMeta: { characters: ['Eleven'] } }),
    ]

    const children = generateChildCollections(parent, assets)
    expect(children).toHaveLength(1)
    expect(children[0].name).toBe('Eleven')
  })
})
