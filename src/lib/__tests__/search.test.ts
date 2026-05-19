import { describe, expect, it } from 'vitest'
import { parseQuery, replaceTrailingFreeText } from '@/lib/search'
import { matchesFilter } from '@/lib/smart-collection-filters'
import type { Asset } from '@/lib/data'

describe('search query parsing', () => {
  it('parses season episode phrases without leaving stray free text', () => {
    const parsed = parseQuery('season 3 episode 1 final cut')

    expect(parsed.chips).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'episode', value: 'EP301' }),
      expect.objectContaining({ kind: 'stage', value: 'final-cut' }),
    ]))
    expect(parsed.freeText).toBe('')
  })

  it('replaces only the trailing typed suggestion text', () => {
    expect(replaceTrailingFreeText('marketing mar', 'mar', 'Marco Vitale')).toBe('marketing Marco Vitale')
  })

  it('appends suggestions when parsed free text is not trailing', () => {
    expect(replaceTrailingFreeText('mar marketing', 'mar', 'Marco Vitale')).toBe('mar marketing Marco Vitale')
  })

  it('lets specific episode and cut chips narrow wildcard scopes', () => {
    const asset = {
      id: 'asset-1',
      name: 'EP301 Final',
      type: 'video',
      episode: 'EP301',
      stage: 'final-cut',
    } as Asset

    expect(matchesFilter(asset, { hasEpisode: true, episode: 'EP301' })).toBe(true)
    expect(matchesFilter(asset, { hasEpisode: true, episode: 'EP302' })).toBe(false)
    expect(matchesFilter(asset, { hasStage: true, stage: 'final-cut' })).toBe(true)
    expect(matchesFilter(asset, { hasStage: true, stage: 'locked-cut' })).toBe(false)
  })
})
