import { describe, expect, it } from 'vitest'
import { getSharedResourceHref } from '@/lib/shared-resources'

describe('getSharedResourceHref', () => {
  it('routes assets to asset pages', () => {
    expect(getSharedResourceHref({
      resourceId: 'asset-1',
      resourceType: 'asset',
    })).toBe('/nextgen/assets/asset-1')
  })

  it('routes collections to collection pages', () => {
    expect(getSharedResourceHref({
      resourceId: 'collection-1',
      resourceType: 'collection',
    })).toBe('/nextgen/collections/collection-1')
  })

  it('routes smart collections to smart collection pages', () => {
    expect(getSharedResourceHref({
      resourceId: 'smart-finals',
      resourceType: 'smart-collection',
    })).toBe('/nextgen/collections/smart-finals')
  })

  it('routes folders through domain workspaces', () => {
    expect(getSharedResourceHref({
      resourceId: 'ws-vfx-shots',
      resourceType: 'folder',
      domainId: 'vfx',
    })).toBe('/nextgen/workspace/vfx/ws-vfx-shots')
  })
})
