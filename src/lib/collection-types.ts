/**
 * Unified Collection Type System
 *
 * Three flavors of collection, one shareable concept:
 * - Curated: manual asset picks (replaces UserCollection)
 * - Smart: filter/AI-based auto-population (replaces SmartCollection)
 * - Workspace: bound to a folder path, resolves assets at query time
 *
 * Uses a TypeScript discriminated union so each flavor has only
 * the fields it needs — no optional god-type fields.
 */

import type { DepartmentId } from '@/components/department/types'
import type { AssetFilter, SmartCollectionGroupBy, SmartCollectionIcon, SmartCollectionCategory } from '@/lib/data-client'

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export type CuratedCollection = {
  flavor: 'curated'
  id: string
  name: string
  assetIds: string[]
  createdBy?: string
  createdAt: Date
}

export type SmartCollectionEntry = {
  flavor: 'smart'
  id: string
  name: string
  icon: SmartCollectionIcon
  filter: AssetFilter
  visibleToAll?: boolean
  createdBy?: string
  createdAt: Date
  groupBy?: SmartCollectionGroupBy
  parentId?: string
  category?: SmartCollectionCategory
}

export type WorkspaceCollection = {
  flavor: 'workspace'
  id: string
  name: string
  boundFolderId: string
  boundDepartmentId: DepartmentId
  createdBy?: string
  createdAt: Date
}

export type Collection = CuratedCollection | SmartCollectionEntry | WorkspaceCollection

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isCurated(c: Collection): c is CuratedCollection {
  return c.flavor === 'curated'
}

export function isSmart(c: Collection): c is SmartCollectionEntry {
  return c.flavor === 'smart'
}

export function isWorkspace(c: Collection): c is WorkspaceCollection {
  return c.flavor === 'workspace'
}

// ---------------------------------------------------------------------------
// Conversion helpers (bridge old types to new)
// ---------------------------------------------------------------------------

import type { UserCollection } from '@/hooks/useUserCollections'
import type { SmartCollection } from '@/lib/data-client'

export function fromUserCollection(uc: UserCollection): CuratedCollection {
  return {
    flavor: 'curated',
    id: uc.id,
    name: uc.name,
    assetIds: uc.assetIds,
    createdBy: uc.createdBy,
    createdAt: uc.createdAt,
  }
}

export function fromSmartCollection(sc: SmartCollection): SmartCollectionEntry {
  return {
    flavor: 'smart',
    id: sc.id,
    name: sc.name,
    icon: sc.icon,
    filter: sc.filter,
    visibleToAll: sc.visibleToAll,
    createdBy: sc.createdBy,
    createdAt: sc.createdAt,
    groupBy: sc.groupBy,
    parentId: sc.parentId,
    category: sc.category,
  }
}

export function toUserCollection(c: CuratedCollection): UserCollection {
  return {
    id: c.id,
    name: c.name,
    assetIds: c.assetIds,
    createdBy: c.createdBy,
    createdAt: c.createdAt,
  }
}

export function toSmartCollection(c: SmartCollectionEntry): SmartCollection {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    filter: c.filter,
    visibleToAll: c.visibleToAll,
    createdBy: c.createdBy,
    createdAt: c.createdAt,
    groupBy: c.groupBy,
    parentId: c.parentId,
    category: c.category,
  }
}
