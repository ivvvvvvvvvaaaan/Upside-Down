import { describe, expect, it } from 'vitest'
import type { SmartCollection } from '@/lib/data-client'
import { getCollectionCapabilities } from '@/lib/collection-types'

describe('collection capabilities', () => {
  it('keeps ontology smart collection parents locked', () => {
    const collection: SmartCollection = {
      flavor: 'smart',
      id: 'smart-character',
      name: 'Character',
      icon: 'character',
      filter: { aiHasCharacters: true },
      visibleToAll: true,
      createdAt: new Date('2026-01-15'),
      groupBy: 'characters',
    }

    expect(getCollectionCapabilities(collection)).toMatchObject({
      canRename: false,
      canEditFilter: false,
      canDelete: false,
      typeLabel: 'Character Collection',
    })
  })

  it('keeps generated ontology child collections locked', () => {
    const collection: SmartCollection = {
      flavor: 'smart',
      id: 'smart-scene--pit-lane',
      name: 'Pit Lane',
      icon: 'scene',
      filter: { aiScene: 'Pit Lane' },
      visibleToAll: true,
      createdAt: new Date('2026-01-15'),
      parentId: 'smart-scene',
    }

    expect(getCollectionCapabilities(collection)).toMatchObject({
      canRename: false,
      canEditFilter: false,
      canDelete: false,
      typeLabel: 'Scene Collection',
    })
  })

  it('allows user-authored smart collections to use ontology-style icons and remain editable', () => {
    const collection: SmartCollection = {
      flavor: 'smart',
      id: 'smart-key-art',
      name: 'Key Art',
      icon: 'scene',
      filter: { isKeyArt: true },
      createdBy: 'psharma@netflix.com',
      createdAt: new Date('2026-02-08'),
    }

    expect(getCollectionCapabilities(collection)).toMatchObject({
      canRename: true,
      canEditFilter: true,
      canDelete: true,
      typeLabel: 'Collection',
    })
  })
})
