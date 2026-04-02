import { describe, expect, it } from 'vitest'
import { DEFAULT_GRANTS, buildSharesReceivedByMe } from '@/lib/grants'
import { buildSeedCollections } from '@/lib/scenario'
import { getSharePreviewImages } from '@/lib/data-client'

describe('getSharePreviewImages', () => {
  it('builds previews for seeded shared collections', () => {
    const entry = buildSharesReceivedByMe('editorial-coordinator', DEFAULT_GRANTS)
      .find((share) => share.resourceId === 'ws-vfx-coll-for-editorial')

    expect(entry).toBeDefined()

    const previews = getSharePreviewImages(entry!, buildSeedCollections())

    expect(previews).toBeDefined()
    expect(previews!.length).toBeGreaterThan(0)
    expect(new Set(previews).size).toBe(previews!.length)
  })

  it('builds previews for shared folders from promoted workspace assets', () => {
    const previews = getSharePreviewImages({
      resourceId: 'ws-vfx-shots',
      resourceType: 'folder',
      departmentId: 'vfx',
    }, buildSeedCollections())

    expect(previews).toBeDefined()
    expect(previews!.length).toBeGreaterThan(0)
  })

  it('builds deterministic previews for smart collection shares', () => {
    const entry = buildSharesReceivedByMe('editorial-artist', DEFAULT_GRANTS)
      .find((share) => share.resourceId === 'smart-finals')

    expect(entry).toBeDefined()

    const previews = getSharePreviewImages(entry!, buildSeedCollections())

    expect(previews).toBeDefined()
    expect(previews).toHaveLength(3)
    expect(new Set(previews).size).toBe(previews!.length)
  })
})
