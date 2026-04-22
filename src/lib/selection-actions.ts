import type { Asset } from '@/lib/data'
import type { AccessProfileId, ResourceRef } from '@/lib/grants'

export type SelectionEntityKind = 'asset' | 'folder' | 'collection' | 'smart-collection'

export type SelectionEntity = {
  id: string
  kind: SelectionEntityKind
  label: string
  resourceRef: ResourceRef
  previewAsset?: Asset
  canAddToCollection?: boolean
  addToCollectionReason?: string
  supportsShare?: boolean
  shareUnsupportedReason?: string
}

export type SelectionActionId = 'add-to-collection' | 'share'

export type SelectionActionState = {
  id: SelectionActionId
  label: string
  visible: boolean
  enabled: boolean
  reason?: string
}

export type SelectionActionEvaluation = {
  count: number
  selectionKind: SelectionEntityKind | 'mixed' | null
  selectedResourceRefs: ResourceRef[]
  selectedAssets: Asset[]
  allowedShareProfiles: AccessProfileId[]
  shareMode: 'single' | 'batch' | null
  actions: {
    addToCollection: SelectionActionState
    share: SelectionActionState
  }
}

export function assetToResourceRef(asset: Asset): ResourceRef {
  return {
    id: asset.id,
    type: asset.kind === 'cut' ? 'cut' : 'asset',
    domainId: asset.department,
  }
}

export function assetToSelectionEntity(asset: Asset, options?: {
  canAddToCollection?: boolean
  addToCollectionReason?: string
  resourceId?: string
}): SelectionEntity {
  return {
    id: asset.id,
    kind: 'asset',
    label: asset.name,
    resourceRef: options?.resourceId
      ? { ...assetToResourceRef(asset), id: options.resourceId }
      : assetToResourceRef(asset),
    previewAsset: asset,
    canAddToCollection: options?.canAddToCollection,
    addToCollectionReason: options?.addToCollectionReason,
  }
}

export function collectionToSelectionEntity(
  collection: { id: string; name: string },
  kind: 'collection' | 'smart-collection',
): SelectionEntity {
  return {
    id: collection.id,
    kind,
    label: collection.name,
    resourceRef: {
      id: collection.id,
      type: kind,
    },
  }
}

export function folderToSelectionEntity({
  id,
  label,
  domainId,
  resourceId = id,
}: {
  id: string
  label: string
  domainId?: ResourceRef['domainId']
  resourceId?: string
}): SelectionEntity {
  return {
    id,
    kind: 'folder',
    label,
    resourceRef: {
      id: resourceId,
      type: 'folder',
      domainId,
    },
  }
}

const MIXED_SELECTION_REASON = 'Select one type of item to use bulk actions.'

function intersectProfiles(profileSets: AccessProfileId[][]): AccessProfileId[] {
  if (profileSets.length === 0) return []
  const [first, ...rest] = profileSets
  return rest.reduce<AccessProfileId[]>((current, next) => current.filter((profile) => next.includes(profile)), first)
}

export function getSelectionCountLabel(selectedEntities: SelectionEntity[]): string {
  return `${selectedEntities.length} selected`
}

export function evaluateSelectionActions({
  selectedEntities,
  canShareResource,
  getGrantableProfiles,
}: {
  selectedEntities: SelectionEntity[]
  canShareResource: (resource: ResourceRef) => boolean
  getGrantableProfiles: (resource: ResourceRef) => AccessProfileId[]
}): SelectionActionEvaluation {
  const kinds = Array.from(new Set(selectedEntities.map((entity) => entity.kind)))
  const mixedKinds = kinds.length > 1
  const selectionKind = selectedEntities.length === 0
    ? null
    : mixedKinds
      ? 'mixed'
      : kinds[0]

  const selectedAssets = selectedEntities
    .map((entity) => entity.previewAsset)
    .filter((asset): asset is Asset => Boolean(asset))

  const selectedResourceRefs = selectedEntities.map((entity) => entity.resourceRef)
  const allowedShareProfiles = mixedKinds
    ? []
    : intersectProfiles(selectedEntities.map((entity) => getGrantableProfiles(entity.resourceRef)))

  const allAssets = selectionKind === 'asset'
  const showAddToCollection = allAssets || mixedKinds
  const showShare = selectionKind !== null

  let addToCollectionEnabled = false
  let addToCollectionReason: string | undefined

  if (selectedEntities.length === 0) {
    addToCollectionReason = undefined
  } else if (mixedKinds) {
    addToCollectionReason = MIXED_SELECTION_REASON
  } else if (!allAssets) {
    addToCollectionReason = 'Only assets can be added to collections.'
  } else if (selectedAssets.length !== selectedEntities.length) {
    addToCollectionReason = 'Only real assets can be added to collections.'
  } else {
    const blockedEntities = selectedEntities.filter((entity) => entity.canAddToCollection === false)
    if (blockedEntities.length > 0) {
      addToCollectionReason = blockedEntities.length === 1
        ? `You don't have access to ${blockedEntities[0].label}.`
        : `You don't have access to ${blockedEntities.length} of ${selectedEntities.length} selected items.`
    } else {
      addToCollectionEnabled = true
    }
  }

  let shareEnabled = false
  let shareReason: string | undefined
  let shareMode: 'single' | 'batch' | null = null

  if (selectedEntities.length === 0) {
    shareReason = undefined
  } else if (mixedKinds) {
    shareReason = MIXED_SELECTION_REASON
  } else {
    const unsupportedEntity = selectedEntities.find((entity) => entity.supportsShare === false)
    if (unsupportedEntity) {
      shareReason = unsupportedEntity.shareUnsupportedReason ?? `${unsupportedEntity.label} can't be shared.`
    } else if (selectedEntities.some((entity) => !canShareResource(entity.resourceRef))) {
      shareReason = selectedEntities.length === 1
        ? "You don't have permission to share this item."
        : "You don't have permission to share all selected items."
    } else if (selectedEntities.length > 1 && allowedShareProfiles.length === 0) {
      shareReason = 'These selected items do not share a common permission level.'
    } else {
      shareEnabled = true
      shareMode = selectedEntities.length > 1 ? 'batch' : 'single'
    }
  }

  return {
    count: selectedEntities.length,
    selectionKind,
    selectedResourceRefs,
    selectedAssets,
    allowedShareProfiles,
    shareMode,
    actions: {
      addToCollection: {
        id: 'add-to-collection',
        label: 'Add to Collection',
        visible: showAddToCollection,
        enabled: addToCollectionEnabled,
        reason: addToCollectionReason,
      },
      share: {
        id: 'share',
        label: selectedEntities.length <= 1
          ? 'Share'
          : `Share ${selectedEntities.length} items`,
        visible: showShare,
        enabled: shareEnabled,
        reason: shareReason,
      },
    },
  }
}
