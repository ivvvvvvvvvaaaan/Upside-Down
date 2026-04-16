/**
 * Unified Collection Type System
 *
 * Two source types, one union:
 * - UserCollection (flavor: 'collection') — curated asset collections
 * - SmartCollection (flavor: 'smart') — filter/AI-based dynamic collections
 *
 * No conversion layer. The storage types ARE the display types.
 */

import type { UserCollection } from '@/hooks/useUserCollections'
import type { SmartCollection } from '@/lib/data-client'


export type SmartCollectionEntry = SmartCollection

export type Collection = UserCollection | SmartCollectionEntry

// Type guards

export function isCollection(c: Collection): c is UserCollection {
  return c.flavor === 'collection'
}

export function isSmart(c: Collection): c is SmartCollectionEntry {
  return c.flavor === 'smart'
}

// Capabilities — what operations a collection supports, derived from its data

export interface CollectionCapabilities {
  canRename: boolean
  canEditFilter: boolean
  canDelete: boolean
  canAddAssets: boolean
  canShare: boolean
  showAccessTab: boolean
  /** Display label for the entity type in panels — keep collection as the primary concept. */
  typeLabel: string
  /** Icon key for the header */
  icon: 'collection' | 'character' | 'location' | 'scene' | 'smart' | 'folder'
}

const ONTOLOGY_ICON_TO_LABEL: Record<string, { label: string; icon: CollectionCapabilities['icon'] }> = {
  character: { label: 'Character Collection', icon: 'character' },
  location: { label: 'Location Collection', icon: 'location' },
  scene: { label: 'Scene Collection', icon: 'scene' },
}

export function getCollectionCapabilities(c: Collection): CollectionCapabilities {
  if (isSmart(c)) {
    const isDerived = !!c.parentId
    const ontology = ONTOLOGY_ICON_TO_LABEL[c.icon]

    const isUserCreated = !!c.createdBy

    if (ontology) {
      return {
        canRename: false,
        canEditFilter: false,
        canDelete: false,
        canAddAssets: false,
        canShare: !isDerived,
        showAccessTab: !isDerived,
        typeLabel: ontology.label,
        icon: ontology.icon,
      }
    }

    return {
      canRename: isUserCreated,
      canEditFilter: isUserCreated,
      canDelete: isUserCreated,
      canAddAssets: false,
      canShare: isUserCreated,
      showAccessTab: isUserCreated,
      typeLabel: 'Collection',
      icon: 'smart',
    }
  }

  // User collections — fully mutable
  return {
    canRename: true,
    canEditFilter: false,
    canDelete: true,
    canAddAssets: true,
    canShare: true,
    showAccessTab: true,
    typeLabel: 'Collection',
    icon: 'collection',
  }
}
