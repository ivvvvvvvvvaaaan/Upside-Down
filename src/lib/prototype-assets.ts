import type { Asset, Collection } from '@/lib/data-client'
import type { ProductionDomainId } from '@/components/department/types'
import { mergeWorkspaceAssets, generateAssetInstances } from '@/lib/asset-instances'
import { DEFAULT_GRANTS, getResourceLabel } from '@/lib/grants'
import { getDomainWorkspaceFiles } from '@/lib/workspace-data'
import { SCENARIO } from '@/lib/scenario'
import { listProductionShots, getProductionScene, listCGShots, listCGSequences } from '@/lib/ontology-meta'
import type { ProductionShotMeta, CGShotMeta, CGSequenceMeta } from '@/lib/ontology-meta'
import { pickForDomain } from '@/lib/images'

const ALL_DOMAINS: ProductionDomainId[] = ['art-design', 'vfx', 'editorial']

/**
 * Composite-Concept stress test (Phase A of asset-taxonomy spec work).
 *
 * Seeds Media Asset components for the existing Production Shot Concept
 * `EP301-S05-T03A` (defined in ontology-meta.ts). Each component is a real Asset
 * with mediaAssetType set + aiMeta.productionShot pointing at the parent shot.
 *
 * If a query like `getMediaAssetsByProductionShot('EP301-S05-T03A')` returns
 * these three assets cleanly, the foundation holds and the doc's Composite
 * Concept pattern works in our data layer.
 */
export function getCompositeConceptComponents(): Asset[] {
  const productionShotKey = 'EP301-S05-T03A'
  const narrativeScene = 'INT. APEX GARAGE - RACE DAY'
  const location = 'Apex Garage'
  const episode = 'EP301'
  const characters = ['Marco Vitale']

  return [
    {
      id: `ms-${productionShotKey}-camera-A`,
      name: `${productionShotKey} — Camera A master`,
      type: 'video',
      mediaAssetType: 'camera-clip',
      department: 'editorial',
      episode,
      extension: 'mov',
      shotMeta: {
        scene: narrativeScene,
        take: '3',
        camera: 'A',
        duration: '00:01:42',
      },
      aiMeta: {
        characters,
        scene: narrativeScene,
        location,
        productionShot: productionShotKey,
      },
    },
    {
      id: `ms-${productionShotKey}-audio-boom`,
      name: `${productionShotKey} — Boom audio`,
      type: 'audio',
      mediaAssetType: 'audio-clip',
      department: 'editorial',
      episode,
      extension: 'wav',
      audioMeta: {
        duration: '00:01:42',
        typeTag: 'production sound',
      },
      aiMeta: {
        characters,
        scene: narrativeScene,
        location,
        productionShot: productionShotKey,
      },
    },
    {
      id: `ms-${productionShotKey}-proxy`,
      name: `${productionShotKey} — Editorial proxy`,
      type: 'video',
      mediaAssetType: 'dailies-proxy',
      department: 'editorial',
      episode,
      extension: 'mp4',
      shotMeta: {
        scene: narrativeScene,
        take: '3',
        camera: 'A',
        duration: '00:01:42',
      },
      aiMeta: {
        characters,
        scene: narrativeScene,
        location,
        productionShot: productionShotKey,
      },
    },
  ]
}

/**
 * Concept-Asset Collections — the spec's "folder" side of a Composite Concept.
 *
 * For each scenario cut, we derive a Collection bound 1:1 to its Edit Sequence
 * Concept. The Concept (in ontology-meta.ts) holds identity — stage, version,
 * description. The Collection (here) holds the folder bundle — its `assetIds`
 * are the constituent file IDs that already live in the editorial workspace tree.
 */
function getConceptAssetCollectionsForCuts(): Collection[] {
  return SCENARIO.cuts.map((cut) => ({
    id: `concept-folder-${cut.id}`,
    name: cut.name,
    kind: 'concept-asset',
    conceptKey: cut.id,
    assetCount: cut.constituents.length,
    assetIds: [...cut.constituents],
  }))
}

/**
 * Concept-Asset Collections for Production Shots — same pattern as cuts, but
 * the constituent file IDs are derived dynamically. The collection holds the
 * IDs of every Media Asset (workspace file) whose aiMeta.productionShot points
 * at this Concept, plus the hand-seeded fake Media Assets if any.
 */
function getConceptAssetCollectionsForProductionShots(): Collection[] {
  const allAssets = [
    ...getPromotedWorkspaceAssets(),
    ...getCompositeConceptComponents(),
  ]
  return listProductionShots().map(([key]) => {
    const constituentIds = allAssets
      .filter((a) => a.aiMeta?.productionShot === key && (!a.kind || a.kind === 'file'))
      .map((a) => a.id)
    return {
      id: `concept-folder-${key}`,
      name: key,
      kind: 'concept-asset',
      conceptKey: key,
      assetCount: constituentIds.length,
      assetIds: constituentIds,
    } satisfies Collection
  })
}

/**
 * Concept-Asset Collections for CG Shots — Media Assets tagged with cgShot.
 */
function getConceptAssetCollectionsForCGShots(): Collection[] {
  const allAssets = getPromotedWorkspaceAssets()
  return listCGShots().map(([key]) => {
    const constituentIds = allAssets
      .filter((a) => a.aiMeta?.cgShot === key && (!a.kind || a.kind === 'file'))
      .map((a) => a.id)
    return {
      id: `concept-folder-${key}`,
      name: key,
      kind: 'concept-asset',
      conceptKey: key,
      assetCount: constituentIds.length,
      assetIds: constituentIds,
    } satisfies Collection
  })
}

/**
 * Concept-Asset Collections for CG Sequences — child CG Shots (the structural
 * children, not the underlying file constituents which live one level down).
 */
function getConceptAssetCollectionsForCGSequences(): Collection[] {
  return listCGSequences().map(([key]) => {
    const childShotIds = listCGShots()
      .filter(([, meta]) => meta.cgSequence === key)
      .map(([childKey]) => childKey)
    return {
      id: `concept-folder-${key}`,
      name: key,
      kind: 'concept-asset',
      conceptKey: key,
      assetCount: childShotIds.length,
      assetIds: childShotIds,
    } satisfies Collection
  })
}

/** Public — return all Concept-Asset Collections across every Composite Concept type. */
export function listConceptAssetCollections(): Collection[] {
  return [
    ...getConceptAssetCollectionsForCuts(),
    ...getConceptAssetCollectionsForProductionShots(),
    ...getConceptAssetCollectionsForCGShots(),
    ...getConceptAssetCollectionsForCGSequences(),
  ]
}

/** Public — look up the Concept-Asset Collection bound to a given Concept. */
export function getConceptAssetCollection(conceptKey: string): Collection | undefined {
  return listConceptAssetCollections().find((c) => c.conceptKey === conceptKey)
}

/**
 * Shared base fields for any Composite Concept projected as an Asset.
 * Production Shots, CG Shots, and CG Sequences all wrap this with their own
 * kind-specific metadata; the common shape (id/name/type/kind/department/
 * episode/thumbnail) lives here once.
 */
type ConceptDomain = 'editorial' | 'vfx'

function buildConceptAssetBase(params: {
  kind: NonNullable<Asset['kind']>
  id: string
  type: Asset['type']
  department: ConceptDomain
  episode?: string
}): Asset {
  return {
    id: params.id,
    name: params.id,
    type: params.type,
    kind: params.kind,
    department: params.department,
    episode: params.episode,
    thumbnail: pickForDomain(params.department, params.id)[0],
  }
}

/**
 * Project a Production Shot Concept into an Asset record so it flows through
 * the canonical asset-detail pipeline. Carries shotMeta + scene aiMeta so it
 * appears in scene smart-collection grids alongside the loose dailies.
 */
export function seedProductionShotToAsset(key: string, meta: ProductionShotMeta): Asset {
  const productionScene = getProductionScene(meta.productionScene)
  return {
    ...buildConceptAssetBase({
      kind: 'production-shot',
      id: key,
      type: 'shot',
      department: 'editorial',
      episode: meta.episode,
    }),
    shotMeta: {
      scene: meta.narrativeScene,
      take: String(meta.take),
      camera: meta.camera,
    },
    aiMeta: {
      scene: meta.narrativeScene,
    },
    isCircleTake: meta.circle ?? false,
    created_at: productionScene?.shootDate,
  }
}

/** All Production Shot Concepts projected as Assets. */
export function getProductionShotAssets(): Asset[] {
  return listProductionShots().map(([key, meta]) => seedProductionShotToAsset(key, meta))
}

/**
 * Project a CG Shot Concept into an Asset record. Carries version + isFinal
 * (from status) + aiMeta back-refs to its parent CG Sequence and the Production
 * Shot it replaces.
 */
export function seedCGShotToAsset(key: string, meta: CGShotMeta): Asset {
  return {
    ...buildConceptAssetBase({
      kind: 'cg-shot',
      id: key,
      type: 'video',
      department: 'vfx',
      episode: meta.episode,
    }),
    version: meta.version,
    versionGroupId: `cg:${meta.cgSequence}:${key.split('_').slice(-1)[0]}`,
    isFinal: meta.status === 'final',
    aiMeta: {
      scene: meta.narrativeScene,
      cgSequence: meta.cgSequence,
      cgShot: key,
      ...(meta.replacesProductionShot ? { productionShot: meta.replacesProductionShot } : {}),
    },
  }
}

/** All CG Shot Concepts projected as Assets. */
export function getCGShotAssets(): Asset[] {
  return listCGShots().map(([key, meta]) => seedCGShotToAsset(key, meta))
}

/**
 * Project a CG Sequence Concept into an Asset record. A CG Sequence is the
 * VFX vendor's wrapper around a set of CG Shots — the unit of vendor
 * accountability and version lineage.
 */
export function seedCGSequenceToAsset(key: string, meta: CGSequenceMeta): Asset {
  return {
    ...buildConceptAssetBase({
      kind: 'cg-sequence',
      id: key,
      type: 'video',
      department: 'vfx',
      episode: meta.episode,
    }),
    isFinal: meta.status === 'final',
    aiMeta: {
      scene: meta.narrativeScene,
    },
  }
}

/** All CG Sequence Concepts projected as Assets. */
export function getCGSequenceAssets(): Asset[] {
  return listCGSequences().map(([key, meta]) => seedCGSequenceToAsset(key, meta))
}

export function getPromotedWorkspaceAssets(): Asset[] {
  const domainInstances = ALL_DOMAINS.flatMap((domainId) => {
    const files = getDomainWorkspaceFiles(domainId)
    return generateAssetInstances(files, domainId)
  })

  return mergeWorkspaceAssets([], domainInstances)
}

/**
 * Build shared snapshot assets from DEFAULT_GRANTS (asset-level shares only).
 * No accessMap dependency — reads directly from grants seed data.
 */
function getSharedSnapshotAssets(): Asset[] {
  const sharedAssets: Asset[] = []

  // Asset-level shares from DEFAULT_GRANTS (non-collection resources)
  for (const grant of DEFAULT_GRANTS) {
    if (grant.revokedAt) continue
    if (grant.resource.type === 'asset') {
      // Deduplicate by resource id
      if (sharedAssets.some((a) => a.id === grant.resource.id)) continue
      sharedAssets.push({
        id: grant.resource.id,
        name: getResourceLabel(grant.resource.id),
        type: 'video',
        department: grant.resource.domainId,
        created_at: grant.grantedAt,
      })
    }
  }

  return sharedAssets
}

export function mergePrototypeAssets(apiAssets: Asset[]): Asset[] {
  const seen = new Set<string>()
  const merged = [
    ...mergeWorkspaceAssets(apiAssets, []),
    ...getPromotedWorkspaceAssets(),
    ...getSharedSnapshotAssets(),
    ...getCompositeConceptComponents(),
    ...getProductionShotAssets(),
    ...getCGShotAssets(),
    ...getCGSequenceAssets(),
  ]

  return merged.filter((asset) => {
    if (seen.has(asset.id)) return false
    seen.add(asset.id)
    return true
  })
}

/**
 * Composite Concept query: return all Media Assets that are components of
 * the given Production Shot. The relationship lives on aiMeta.productionShot.
 */
export function getMediaAssetsByProductionShot(shotKey: string): Asset[] {
  const allAssets = mergePrototypeAssets([])
  return allAssets.filter(asset =>
    asset.aiMeta?.productionShot === shotKey
    && (!asset.kind || asset.kind === 'file')
  )
}

/**
 * Composite Concept query: return all Media Assets that are components of
 * the given Edit Sequence Concept.
 *
 * Clean path: read the Concept-Asset Collection bound to this Concept and
 * resolve its `assetIds` against the merged asset pool. The folder IS the
 * Collection, so we just dereference what the spec already names.
 */
export function getMediaAssetsByEditSequence(seqKey: string): Asset[] {
  const collection = getConceptAssetCollection(seqKey)
  if (!collection?.assetIds || collection.assetIds.length === 0) return []

  const allAssets = mergePrototypeAssets([])
  const byId = new Map(allAssets.map((a) => [a.id, a]))
  return collection.assetIds
    .map((id) => byId.get(id))
    .filter((a): a is Asset => a != null)
}
