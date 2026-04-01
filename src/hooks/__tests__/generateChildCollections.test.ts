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
      makeAsset({ id: 'a1', aiMeta: { characters: ['James Ashworth', 'Marco Vitale'] } }),
      makeAsset({ id: 'a2', aiMeta: { characters: ['Marco Vitale', 'Elena Richter'] } }),
    ]

    const children = generateChildCollections(parent, assets)

    expect(children).toHaveLength(3)
    expect(children.map(c => c.name)).toEqual(['Elena Richter', 'James Ashworth', 'Marco Vitale'])
    expect(children[0].id).toBe('sc-char--elena-richter')
    expect(children[1].id).toBe('sc-char--james-ashworth')
    expect(children[2].id).toBe('sc-char--marco-vitale')

    // Each child has correct filter
    expect(children[2].filter).toEqual({ aiCharacters: ['Marco Vitale'] })
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
      makeAsset({ id: 'a1', aiMeta: { location: 'Apex Garage' } }),
      makeAsset({ id: 'a2', aiMeta: { location: 'FIA Stewards Office' } }),
      makeAsset({ id: 'a3', aiMeta: { location: 'Apex Garage' } }),
    ]

    const children = generateChildCollections(parent, assets)

    expect(children).toHaveLength(2)
    expect(children.map(c => c.name)).toEqual(['Apex Garage', 'FIA Stewards Office'])
    expect(children[0].id).toBe('sc-loc--apex-garage')
    expect(children[0].filter).toEqual({ aiLocation: 'Apex Garage' })
  })

  it('groups by scenes', () => {
    const parent = makeParent({
      id: 'sc-scene',
      filter: { aiHasScene: true },
      groupBy: 'scenes',
    })

    const assets: Asset[] = [
      makeAsset({ id: 'a1', aiMeta: { scene: 'INT. APEX GARAGE - RACE DAY' } }),
      makeAsset({ id: 'a2', aiMeta: { scene: 'EXT. CIRCUIT - LAP 52' } }),
    ]

    const children = generateChildCollections(parent, assets)

    expect(children).toHaveLength(2)
    expect(children.map(c => c.name)).toEqual(['EXT. CIRCUIT - LAP 52', 'INT. APEX GARAGE - RACE DAY'])
    expect(children[1].filter).toEqual({ aiScene: 'INT. APEX GARAGE - RACE DAY' })
  })

  it('returns empty array when no assets match parent filter', () => {
    const parent = makeParent({
      filter: { department: 'vfx' },
      groupBy: 'characters',
    })

    const assets: Asset[] = [
      makeAsset({ department: 'art-design', aiMeta: { characters: ['Marco Vitale'] } }),
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
      makeAsset({ id: 'a2', aiMeta: { characters: ['Marco Vitale'] } }),
    ]

    const children = generateChildCollections(parent, assets)
    expect(children).toHaveLength(1)
    expect(children[0].name).toBe('Marco Vitale')
  })
})
