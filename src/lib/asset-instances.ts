import type { DomainId } from '@/components/department/types'
import type { Asset, AssetType, AssetTag, MediaAssetType } from '@/lib/data'
import type { UnifiedFileNode } from '@/lib/workspace-data'
import { getAITagsForFile, toAIMeta } from '@/lib/ai-tags'
import type { AITagResult } from '@/lib/ai-tags'
import {
  getCGSequence,
  getCGShot,
  getEditSequence,
  getNarrativeScene,
  getProductionShot,
} from '@/lib/ontology-meta'

/**
 * Bridge between the looser typeTag display string and the controlled
 * MediaAssetType vocabulary. Lets existing AI tag entries auto-classify
 * without an explicit mediaAssetType — the typeTag they already carry
 * (e.g., "Concept Art", "Storyboard", "VFX Plate") maps cleanly to a
 * spec-vocab work product. Entries that DO set mediaAssetType explicitly
 * always win — this is the fallback.
 */
const TYPE_TAG_TO_MEDIA_ASSET_TYPE: Record<string, MediaAssetType> = {
  'Concept Art': 'concept-art',
  'Storyboard': 'storyboard',
  'Reference': 'reference-image',
  'Reference Photo': 'reference-image',
  'Production Photo': 'production-photo',
  'Lookbook': 'lookbook',
  'Score': 'score',
  'Production Audio': 'audio-clip',
  'SFX': 'audio-clip',
  'Sound Effect': 'audio-clip',
  'Foley': 'foley',
  'ADR': 'adr',
  'Daily': 'dailies-proxy',
  'Dailies': 'dailies-proxy',
  'Camera Select': 'camera-clip',
  'VFX Comp': 'vfx-comp',
  'VFX Preview': 'vfx-comp',
  'VFX Plate': 'vfx-plate',
  'Timeline': 'project-file',
  'Reference Cut': 'reel',
}

function inferMediaAssetTypeFromTag(typeTag: string | undefined): MediaAssetType | undefined {
  if (!typeTag) return undefined
  return TYPE_TAG_TO_MEDIA_ASSET_TYPE[typeTag]
}

export interface AssetInstance {
  id: string
  name: string
  sourceFileId: string
  sourceFileName: string
  sourcePath: string
  department: DomainId
  category: string
  type: AssetType
  size?: number
  modifiedAt?: string
  modifiedBy?: string
  aiTags?: AITagResult
  sourceFolderId?: string
  sequenceMeta?: { sequence?: string; shot?: string }
}

const EXTENSION_TO_ASSET_TYPE: Record<string, AssetType> = {
  psd: 'image',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  ai: 'image',
  tiff: 'image',
  exr: 'image',
  tx: 'image',
  mov: 'video',
  mp4: 'video',
  mxf: 'video',
  r3d: 'video',
  braw: 'video',
  avi: 'video',
  mkv: 'video',
  webm: 'video',
  prproj: 'video',
  mb: 'video',
  hip: 'video',
  nk: 'video',
  wav: 'audio',
  mp3: 'audio',
  aac: 'audio',
  flac: 'audio',
  ptx: 'audio',
  pdf: 'text',
  doc: 'text',
  docx: 'text',
  txt: 'text',
  md: 'text',
  xlsx: 'text',
  csv: 'text',
  zip: 'text',
  cube: 'text',
  py: 'text',
}

function mapExtensionToType(ext?: string): AssetType {
  if (!ext) return 'text'
  return EXTENSION_TO_ASSET_TYPE[ext.toLowerCase()] ?? 'text'
}

/** Parse shot metadata from filename patterns like ep01_scene12_take3, chase_scene_steadicam_take2 */
/** Parse sequence metadata from VFX filename patterns like SEQ010_SH010_comp_v12 */
function parseSequenceMeta(filename: string): { sequence?: string; shot?: string } | null {
  const name = filename.replace(/\.[^.]+$/, '').toUpperCase()
  const seqMatch = name.match(/SEQ[\s_-]?(\d+)/)
  const shotMatch = name.match(/SH[\s_-]?(\d+)/)
  if (!seqMatch) return null
  return {
    sequence: `SEQ${seqMatch[1]}`,
    shot: shotMatch ? `SH${shotMatch[1]}` : undefined,
  }
}

function inferAssetType(ext?: string): AssetType {
  return mapExtensionToType(ext)
}

/**
 * Derive asset.episode from AI-tag ontology references. Walks the most
 * specific layer first; returns the first hit. Returns undefined if no
 * reference resolves — leaves callers to keep any pre-existing value.
 */
function deriveEpisodeFromAITags(tags: AITagResult): string | undefined {
  if (tags.editSequence) {
    const meta = getEditSequence(tags.editSequence)
    if (meta?.episode) return meta.episode
  }
  if (tags.productionShot) {
    const meta = getProductionShot(tags.productionShot)
    if (meta?.episode) return meta.episode
  }
  if (tags.cgShot) {
    const meta = getCGShot(tags.cgShot)
    if (meta?.episode) return meta.episode
  }
  if (tags.cgSequence) {
    const meta = getCGSequence(tags.cgSequence)
    if (meta?.episode) return meta.episode
  }
  if (tags.scene) {
    const meta = getNarrativeScene(tags.scene)
    if (meta?.episode) return meta.episode
  }
  return undefined
}

/** Walk workspace folders and generate instances for all files within */
export function generateAssetInstances(
  files: UnifiedFileNode[],
  domainId: DomainId,
): AssetInstance[] {
  const instances: AssetInstance[] = []

  function walk(
    nodes: UnifiedFileNode[],
    pathParts: string[],
    category: string,
    containingFolderId?: string,
  ) {
    for (const node of nodes) {
      if (node.type === 'file') {
        const name = node.name.replace(/\.[^.]+$/, '')
        const sequenceMeta = parseSequenceMeta(node.name)
        instances.push({
          id: node.id,
          name,
          sourceFileId: node.id,
          sourceFileName: node.name,
          sourcePath: [...pathParts, node.name].join(' / '),
          department: domainId,
          category,
          type: inferAssetType(node.extension),
          ...(sequenceMeta && { sequenceMeta }),
          size: node.size,
          modifiedAt: node.modifiedAt,
          modifiedBy: node.modifiedBy,
          aiTags: getAITagsForFile(node.id, node.name),
          // Track the immediate containing folder so direct folder shares
          // can resolve workspace membership accurately.
          sourceFolderId: containingFolderId,
        })
      }
      if (node.type === 'folder' && node.children) {
        const nextCategory = node.name
        walk(node.children, [...pathParts, node.name], nextCategory, node.id)
      }
    }
  }

  walk(files, [], '')
  return instances
}

import { pickForDomain } from '@/lib/images'

/** Generate a deterministic fake duration from an asset ID, scaled to the asset kind.
 *  Sequences/shots: 2–30s, video files: 30s–10min, audio: 10s–5min */
function fakeDuration(id: string, kind: 'sequence' | 'video' | 'audio' = 'video'): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  h = Math.abs(h)

  let totalSeconds: number
  switch (kind) {
    case 'sequence': totalSeconds = 2 + (h % 29); break    // 0:02 – 0:30
    case 'audio':    totalSeconds = 10 + (h % 290); break   // 0:10 – 5:00
    default:         totalSeconds = 30 + (h % 570); break   // 0:30 – 10:00
  }

  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** Parse version number from a filename (e.g. "comp_v12.exr" → 12) */
function parseVersion(name: string): number | undefined {
  const match = name.match(/_v(\d+)\b/i)
  return match ? parseInt(match[1], 10) : undefined
}

/** Strip version from filename to create a version group key (e.g. "SEQ010_SH010_comp_v12.exr" → "SEQ010_SH010_comp") */
function versionGroupKey(name: string): string | undefined {
  const match = name.match(/^(.+?)_v\d+\.\w+$/i)
  return match ? match[1] : undefined
}

/** TypeTags that indicate a playable rendered sequence (not a source/project file) */
const SEQUENCE_TYPE_TAGS = new Set(['VFX Comp', 'VFX Preview'])

/** File extensions that represent playable video containers (not project/source files) */
const PLAYABLE_EXTENSIONS = new Set(['mov', 'mp4', 'avi', 'mkv', 'webm'])

/** Assets marked as final — approved and locked */
const FINAL_ASSET_IDS = new Set([
  'ws-vfx-010-010',  // SEQ010 SH010 comp — approved by Mike
  'ws-vfx-010-020',  // SEQ010 SH020 comp — signed off after third pass
])

// Shooting day assignments — inferred from folder/path or production report
const SHOOTING_DAY_MAP = new Map<string, number>([
  // Camera dailies — Feb 14 shoot block (Day 12)
  ['ws-cam-daily-1', 12],
  ['ws-cam-daily-2', 12],
  ['ws-cam-daily-3', 12],
  // Camera dailies — Feb 13 shoot block (Day 11)
  ['ws-cam-daily-4', 11],
  ['ws-cam-daily-5', 11],
  // Camera scenes — Feb 12 (Day 10)
  ['ws-cam-scene12-take3', 10],
  ['ws-cam-scene08-take1', 10],
  ['ws-cam-scene15-take1', 10],
  // B-roll (Day 9)
  ['ws-cam-broll-town', 9],
  ['ws-cam-broll-forest', 9],
  // Aerials (Day 8)
  ['ws-cam-aerial-dawn', 8],
  ['ws-cam-aerial-quarry', 8],
  // Steadicam / tracking (Day 7)
  ['ws-cam-steadicam-chase', 7],
  ['ws-cam-tracking-hall', 7],
  // Selects (tagged to original shoot day)
  ['ws-cam-sel-1', 10],
  ['ws-cam-sel-2', 10],
  ['ws-cam-sel-billy', 11],
  ['ws-cam-sel-eleven', 12],
  ['ws-cam-sel-portal', 9],
])

// Circle takes — director/DP picks marked by the DIT on set
const CIRCLE_TAKE_IDS = new Set([
  'ws-cam-sel-1',       // Scene12_TakeB — director circled
  'ws-cam-sel-2',       // Scene15_TakeD — DP pick
  'ws-cam-sel-billy',   // ferreira_closeup — director circled
  'ws-cam-sel-eleven',  // vitale_victory_lap — DP pick
  'ws-cam-sel-portal',  // pit_lane_lights_out — director circled
])

/** Extensions for project/source files that should not get image previews (show icon instead) */
const NO_PREVIEW_EXTENSIONS = new Set(['nk', 'mb', 'hip', 'prproj'])

/** Only visual media and playable video get preview thumbnails */
function getThumbnail(instance: AssetInstance): string | undefined {
  const ext = instance.sourceFileName.split('.').pop()?.toLowerCase() ?? ''
  if (NO_PREVIEW_EXTENSIONS.has(ext)) return undefined
  if (instance.type === 'image' || instance.type === 'video') {
    return pickForDomain(instance.department, instance.id, 1)[0]
  }
  return undefined
}

/** Convert an AssetInstance to an Asset with full metadata (AI tags, typeTag, workspacePath).
 *  Single conversion function — same asset data everywhere. */
export function promotedInstanceToAsset(instance: AssetInstance): Asset {
  const typeTag = instance.aiTags?.typeTag
  const isSequence = typeTag ? SEQUENCE_TYPE_TAGS.has(typeTag) : false
  const version = parseVersion(instance.sourceFileName)
  const groupKey = versionGroupKey(instance.sourceFileName)

  const ext = instance.sourceFileName.includes('.')
    ? instance.sourceFileName.split('.').pop()?.toLowerCase()
    : undefined

  const base: Asset = {
    id: instance.id,
    name: instance.name,
    type: isSequence ? 'video' : instance.type,
    kind: isSequence ? 'sequence' : undefined,
    extension: ext,
    department: instance.department,
    created_at: instance.modifiedAt,
    modifiedBy: instance.modifiedBy,
    isAutoPromoted: true,
    workspacePath: instance.sourcePath,
    sourceFolderIds: instance.sourceFolderId ? [instance.sourceFolderId] : undefined,
    thumbnail: getThumbnail(instance),
    isFinal: FINAL_ASSET_IDS.has(instance.id),
    isCircleTake: CIRCLE_TAKE_IDS.has(instance.id),
    shootingDay: SHOOTING_DAY_MAP.get(instance.id),
    version,
    versionGroupId: groupKey ? `${instance.department ?? 'unknown'}:${groupKey}` : undefined,
  }

  // Set type-specific metadata
  if (typeTag) {
    if (isSequence) {
      base.videoMeta = { typeTag, duration: fakeDuration(instance.id, 'sequence') }
      if (instance.sequenceMeta) {
        base.sequenceMeta = instance.sequenceMeta
      }
    } else {
      const isPlayable = PLAYABLE_EXTENSIONS.has(instance.sourceFileName.split('.').pop()?.toLowerCase() ?? '')
      switch (instance.type) {
        case 'image':
          base.imageMeta = { typeTag }
          break
        case 'video':
          base.videoMeta = isPlayable
            ? { typeTag, duration: fakeDuration(instance.id) }
            : { typeTag }
          break
        case 'audio':
          base.audioMeta = { typeTag, duration: fakeDuration(instance.id, 'audio') }
          break
        case 'text':
          base.textMeta = { typeTag }
          break
      }
    }
  }

  // Populate AI metadata + mediaAssetType (work-product classification from AI).
  // Prefer explicit mediaAssetType; fall back to inferring from typeTag so
  // existing AI tag entries without mediaAssetType still classify correctly.
  if (instance.aiTags) {
    base.aiMeta = toAIMeta(instance.aiTags)
    const explicit = instance.aiTags.mediaAssetType
    const inferred = inferMediaAssetTypeFromTag(instance.aiTags.typeTag)
    if (explicit ?? inferred) {
      base.mediaAssetType = explicit ?? inferred
    }
    // Derive asset.episode from any of the aiMeta ontology references so
    // episode filters/facets/badges work without per-asset episode hand-tagging.
    // Order: edit sequence > production shot > CG shot > CG sequence > scene.
    // (Edit/production refs are most specific; scene fallback handles plain
    // dailies/board files that are scene-tagged only.)
    base.episode = deriveEpisodeFromAITags(instance.aiTags) ?? base.episode
  }

  // Build unified tags (Title Case all labels)
  const toTitleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())
  const tags: AssetTag[] = []
  if (typeTag) tags.push({ label: toTitleCase(typeTag), source: 'system' })
  if (base.isKeyArt) tags.push({ label: 'Key Art', source: 'system' })
  if (base.isFinal) tags.push({ label: 'Final', source: 'system' })
  if (base.isCircleTake) tags.push({ label: 'Circle Take', source: 'user' })
  if (instance.aiTags?.keywords) {
    for (const k of instance.aiTags.keywords) {
      tags.push({ label: toTitleCase(k), source: 'ai' })
    }
  }
  base.tags = tags

  return base
}

/** Merge curated API assets with promoted workspace instances. */
export function mergeWorkspaceAssets(
  apiAssets: Asset[],
  instances: AssetInstance[],
): Asset[] {
  const promoted = instances.map(promotedInstanceToAsset)
  return [...apiAssets, ...promoted]
}
