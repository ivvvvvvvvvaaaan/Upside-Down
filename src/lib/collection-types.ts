/**
 * Unified Collection Type System
 *
 * Two source types, one union:
 * - UserCollection (flavor: 'collection') — manual or folder-bound asset collections
 * - SmartCollection (flavor: 'smart') — filter/AI-based dynamic collections
 *
 * No conversion layer. The storage types ARE the display types.
 */

import type { UserCollection } from '@/hooks/useUserCollections'
import type { SmartCollection } from '@/lib/data-client'

// SmartCollectionEntry is just SmartCollection — kept as alias for backward compat
export type SmartCollectionEntry = SmartCollection

export type Collection = UserCollection | SmartCollectionEntry

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isCollection(c: Collection): c is UserCollection {
  return c.flavor === 'collection'
}

export function isSmart(c: Collection): c is SmartCollectionEntry {
  return c.flavor === 'smart'
}

// ---------------------------------------------------------------------------
// Capabilities — what operations a collection supports, derived from its data
// ---------------------------------------------------------------------------

export interface CollectionCapabilities {
  canRename: boolean
  canEditFilter: boolean
  canDelete: boolean
  canAddAssets: boolean
  canShare: boolean
  canMount: boolean
  showAccessTab: boolean
  /** Display label for the entity type — "Collection", "Character", "Location", etc. */
  typeLabel: string
  /** Icon key for the header */
  icon: 'collection' | 'character' | 'location' | 'scene' | 'smart' | 'folder'
}

const ONTOLOGY_ICON_TO_LABEL: Record<string, { label: string; icon: CollectionCapabilities['icon'] }> = {
  character: { label: 'Character', icon: 'character' },
  location: { label: 'Location', icon: 'location' },
  scene: { label: 'Scene', icon: 'scene' },
}

export function getCollectionCapabilities(c: Collection): CollectionCapabilities {
  if (isSmart(c)) {
    const isDerived = !!c.parentId
    const ontology = ONTOLOGY_ICON_TO_LABEL[c.icon]

    if (isDerived && ontology) {
      // Ontology entity — Character, Location, Scene
      return {
        canRename: false,
        canEditFilter: false,
        canDelete: true,
        canAddAssets: false,
        canShare: false,
        canMount: true,
        showAccessTab: false,
        typeLabel: ontology.label,
        icon: ontology.icon,
      }
    }

    return {
      canRename: true,
      canEditFilter: true,
      canDelete: true,
      canAddAssets: false,
      canShare: true,
      canMount: true,
      showAccessTab: true,
      typeLabel: 'Smart Collection',
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
    canMount: true,
    showAccessTab: true,
    typeLabel: c.boundFolderId ? 'Folder' : 'Collection',
    icon: c.boundFolderId ? 'folder' : 'collection',
  }
}
