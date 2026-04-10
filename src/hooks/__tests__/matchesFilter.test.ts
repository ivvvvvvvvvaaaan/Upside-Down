import { describe, it, expect } from 'vitest'
import { matchesFilter } from '@/lib/smart-collection-filters'
import type { Asset, AssetFilter } from '@/lib/data'

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'a1',
    name: 'Test Asset',
    type: 'image',
    ...overrides,
  }
}

describe('matchesFilter', () => {
  it('empty filter matches any asset', () => {
    expect(matchesFilter(makeAsset(), {})).toBe(true)
    expect(matchesFilter(makeAsset({ type: 'video' }), {})).toBe(true)
  })

  // ── query ──
  describe('query', () => {
    it('matches substring in name', () => {
      const asset = makeAsset({ name: 'Hero Concept Art' })
      expect(matchesFilter(asset, { query: 'concept' })).toBe(true)
    })

    it('matches substring in aiMeta characters', () => {
      const asset = makeAsset({ aiMeta: { characters: ['Marco Vitale'] } })
      expect(matchesFilter(asset, { query: 'vitale' })).toBe(true)
    })

    it('matches substring in aiMeta keywords', () => {
      const asset = makeAsset({ aiMeta: { keywords: ['overtake'] } })
      expect(matchesFilter(asset, { query: 'overtake' })).toBe(true)
    })

    it('matches substring in aiMeta location', () => {
      const asset = makeAsset({ aiMeta: { location: 'Apex Garage' } })
      expect(matchesFilter(asset, { query: 'apex' })).toBe(true)
    })

    it('matches substring in aiMeta scene', () => {
      const asset = makeAsset({ aiMeta: { scene: 'INT. APEX GARAGE - RACE DAY' } })
      expect(matchesFilter(asset, { query: 'apex garage' })).toBe(true)
    })

    it('returns false when query does not match', () => {
      const asset = makeAsset({ name: 'Forest' })
      expect(matchesFilter(asset, { query: 'ocean' })).toBe(false)
    })

    it('ignores blank / whitespace-only query', () => {
      expect(matchesFilter(makeAsset(), { query: '   ' })).toBe(true)
    })
  })

  // ── types ──
  describe('types', () => {
    it('matches when asset type is in the list', () => {
      const asset = makeAsset({ type: 'video' })
      expect(matchesFilter(asset, { types: ['video', 'audio'] })).toBe(true)
    })

    it('rejects when asset type is not in the list', () => {
      const asset = makeAsset({ type: 'text' })
      expect(matchesFilter(asset, { types: ['video', 'audio'] })).toBe(false)
    })

    it('ignores empty types array', () => {
      expect(matchesFilter(makeAsset(), { types: [] })).toBe(true)
    })
  })

  // ── domain (department field) ──
  describe('department', () => {
    it('matches exact domain', () => {
      const asset = makeAsset({ department: 'vfx' })
      expect(matchesFilter(asset, { department: 'vfx' })).toBe(true)
    })

    it('rejects different domain', () => {
      const asset = makeAsset({ department: 'vfx' })
      expect(matchesFilter(asset, { department: 'editorial' })).toBe(false)
    })
  })

  // ── typeTags ──
  describe('typeTags', () => {
    it('matches case-insensitive typeTag from imageMeta', () => {
      const asset = makeAsset({ type: 'image', imageMeta: { typeTag: 'Concept Art' } })
      expect(matchesFilter(asset, { typeTags: ['concept art'] })).toBe(true)
    })

    it('matches typeTag from videoMeta', () => {
      const asset = makeAsset({ type: 'video', videoMeta: { typeTag: 'Animatic' } })
      expect(matchesFilter(asset, { typeTags: ['Animatic'] })).toBe(true)
    })

    it('matches typeTag from audioMeta', () => {
      const asset = makeAsset({ type: 'audio', audioMeta: { typeTag: 'SFX' } })
      expect(matchesFilter(asset, { typeTags: ['sfx'] })).toBe(true)
    })

    it('matches typeTag from textMeta', () => {
      const asset = makeAsset({ type: 'text', textMeta: { typeTag: 'Script' } })
      expect(matchesFilter(asset, { typeTags: ['Script'] })).toBe(true)
    })

    it('rejects when no typeTag matches', () => {
      const asset = makeAsset({ type: 'image', imageMeta: { typeTag: 'Storyboard' } })
      expect(matchesFilter(asset, { typeTags: ['Concept Art'] })).toBe(false)
    })

    it('shot type has no typeTag — always rejected', () => {
      const asset = makeAsset({ type: 'shot' })
      expect(matchesFilter(asset, { typeTags: ['CG'] })).toBe(false)
    })
  })

  // ── isKeyArt ──
  describe('isKeyArt', () => {
    it('matches when isKeyArt is true', () => {
      const asset = makeAsset({ isKeyArt: true })
      expect(matchesFilter(asset, { isKeyArt: true })).toBe(true)
    })

    it('rejects when isKeyArt does not match', () => {
      const asset = makeAsset({ isKeyArt: false })
      expect(matchesFilter(asset, { isKeyArt: true })).toBe(false)
    })

    it('treats missing isKeyArt as false', () => {
      const asset = makeAsset()
      expect(matchesFilter(asset, { isKeyArt: true })).toBe(false)
      expect(matchesFilter(asset, { isKeyArt: false })).toBe(true)
    })
  })

  // ── AI presence filters ──
  describe('aiHasCharacters', () => {
    it('passes when characters exist', () => {
      const asset = makeAsset({ aiMeta: { characters: ['Marco Vitale'] } })
      expect(matchesFilter(asset, { aiHasCharacters: true })).toBe(true)
    })

    it('fails when characters array is empty', () => {
      const asset = makeAsset({ aiMeta: { characters: [] } })
      expect(matchesFilter(asset, { aiHasCharacters: true })).toBe(false)
    })

    it('fails when aiMeta is missing', () => {
      expect(matchesFilter(makeAsset(), { aiHasCharacters: true })).toBe(false)
    })
  })

  describe('aiHasLocation', () => {
    it('passes when location exists', () => {
      const asset = makeAsset({ aiMeta: { location: 'Monaco' } })
      expect(matchesFilter(asset, { aiHasLocation: true })).toBe(true)
    })

    it('fails when location is missing', () => {
      const asset = makeAsset({ aiMeta: {} })
      expect(matchesFilter(asset, { aiHasLocation: true })).toBe(false)
    })
  })

  describe('aiHasScene', () => {
    it('passes when scene exists', () => {
      const asset = makeAsset({ aiMeta: { scene: 'INT. LAB' } })
      expect(matchesFilter(asset, { aiHasScene: true })).toBe(true)
    })

    it('fails when scene is missing', () => {
      expect(matchesFilter(makeAsset(), { aiHasScene: true })).toBe(false)
    })
  })

  // ── aiCharacters (intersection) ──
  describe('aiCharacters', () => {
    it('matches when ANY character intersects (case-insensitive)', () => {
      const asset = makeAsset({ aiMeta: { characters: ['Marco Vitale', 'James Ashworth'] } })
      expect(matchesFilter(asset, { aiCharacters: ['marco vitale'] })).toBe(true)
      expect(matchesFilter(asset, { aiCharacters: ['JAMES ASHWORTH'] })).toBe(true)
    })

    it('rejects when no intersection', () => {
      const asset = makeAsset({ aiMeta: { characters: ['Marco Vitale'] } })
      expect(matchesFilter(asset, { aiCharacters: ['Elena'] })).toBe(false)
    })

    it('rejects when aiMeta has no characters', () => {
      const asset = makeAsset({ aiMeta: { characters: [] } })
      expect(matchesFilter(asset, { aiCharacters: ['Marco Vitale'] })).toBe(false)
    })
  })

  // ── aiLocation / aiScene (exact, case-insensitive) ──
  describe('aiLocation', () => {
    it('matches exact location case-insensitively', () => {
      const asset = makeAsset({ aiMeta: { location: 'Apex Garage' } })
      expect(matchesFilter(asset, { aiLocation: 'apex garage' })).toBe(true)
    })

    it('rejects different location', () => {
      const asset = makeAsset({ aiMeta: { location: 'Apex Garage' } })
      expect(matchesFilter(asset, { aiLocation: 'FIA Stewards Office' })).toBe(false)
    })

    it('rejects when aiMeta has no location', () => {
      const asset = makeAsset({ aiMeta: {} })
      expect(matchesFilter(asset, { aiLocation: 'Apex Garage' })).toBe(false)
    })
  })

  describe('aiScene', () => {
    it('matches exact scene case-insensitively', () => {
      const asset = makeAsset({ aiMeta: { scene: 'INT. APEX GARAGE - RACE DAY' } })
      expect(matchesFilter(asset, { aiScene: 'int. apex garage - race day' })).toBe(true)
    })

    it('rejects different scene', () => {
      const asset = makeAsset({ aiMeta: { scene: 'INT. APEX GARAGE - RACE DAY' } })
      expect(matchesFilter(asset, { aiScene: 'EXT. FOREST' })).toBe(false)
    })
  })

  // ── combined filters ──
  describe('combined filters (AND logic)', () => {
    it('all predicates must pass', () => {
      const asset = makeAsset({
        type: 'image',
        department: 'art-design',
        imageMeta: { typeTag: 'Concept Art' },
        aiMeta: { characters: ['Marco Vitale'], location: 'Apex Garage' },
      })

      const filter: AssetFilter = {
        types: ['image'],
        department: 'art-design',
        typeTags: ['Concept Art'],
        aiHasCharacters: true,
        aiLocation: 'Apex Garage',
      }

      expect(matchesFilter(asset, filter)).toBe(true)
    })

    it('fails if any one predicate fails', () => {
      const asset = makeAsset({
        type: 'image',
        department: 'art-design',
        aiMeta: { characters: ['Marco Vitale'] },
      })

      // domain mismatch
      expect(matchesFilter(asset, { types: ['image'], department: 'vfx' })).toBe(false)
    })
  })

  // ── missing aiMeta ──
  describe('missing aiMeta', () => {
    const asset = makeAsset() // no aiMeta

    it('fails aiHasCharacters gracefully', () => {
      expect(matchesFilter(asset, { aiHasCharacters: true })).toBe(false)
    })

    it('fails aiHasLocation gracefully', () => {
      expect(matchesFilter(asset, { aiHasLocation: true })).toBe(false)
    })

    it('fails aiHasScene gracefully', () => {
      expect(matchesFilter(asset, { aiHasScene: true })).toBe(false)
    })

    it('fails aiCharacters gracefully', () => {
      expect(matchesFilter(asset, { aiCharacters: ['Marco Vitale'] })).toBe(false)
    })

    it('fails aiLocation gracefully', () => {
      expect(matchesFilter(asset, { aiLocation: 'Monaco' })).toBe(false)
    })

    it('fails aiScene gracefully', () => {
      expect(matchesFilter(asset, { aiScene: 'INT. LAB' })).toBe(false)
    })
  })
})
