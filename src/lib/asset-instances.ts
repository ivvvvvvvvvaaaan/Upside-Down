import type { DomainId } from '@/components/department/types'
import type { Asset, AssetType, AssetTag } from '@/lib/data'
import type { UnifiedFileNode } from '@/lib/workspace-data'
import { getAITagsForFile, toAIMeta } from '@/lib/ai-tags'
import type { AITagResult } from '@/lib/ai-tags'

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
  shotMeta?: { scene?: string; take?: string; camera?: string }
  sequenceMeta?: { sequence?: string; shot?: string }
}

export interface AssetInstanceGroup {
  category: string
  instances: AssetInstance[]
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
function parseShotMeta(filename: string): { scene?: string; take?: string; camera?: string } | null {
  const name = filename.replace(/\.[^.]+$/, '').toLowerCase()
  const sceneMatch = name.match(/scene[\s_-]?(\w+)/)
  const takeMatch = name.match(/take[\s_-]?(\w+)/)
  if (!sceneMatch && !takeMatch) return null
  const cameraMatch = name.match(/^([a-z])[\s_-]?\d/) // e.g. "A_0305C014..."
  return {
    scene: sceneMatch ? sceneMatch[1].toUpperCase() : undefined,
    take: takeMatch ? `t${takeMatch[1]}` : undefined,
    camera: cameraMatch ? cameraMatch[1].toUpperCase() : undefined,
  }
}

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

/** Determine asset type — video files with shot patterns become shots */
function inferAssetType(ext?: string, filename?: string): AssetType {
  const baseType = mapExtensionToType(ext)
  if (baseType === 'video' && filename && parseShotMeta(filename)) return 'shot'
  return baseType
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
        const shotMeta = parseShotMeta(node.name)
        const sequenceMeta = parseSequenceMeta(node.name)
        instances.push({
          id: node.id,
          name,
          sourceFileId: node.id,
          sourceFileName: node.name,
          sourcePath: [...pathParts, node.name].join(' / '),
          department: domainId,
          category,
          type: inferAssetType(node.extension, node.name),
          ...(shotMeta && { shotMeta }),
          ...(sequenceMeta && { sequenceMeta }),
          size: node.size,
          modifiedAt: node.modifiedAt,
          modifiedBy: node.modifiedBy,
          aiTags: getAITagsForFile(node.id),
          // Track the immediate containing folder so folder-backed collections
          // can resolve membership for any shared workspace folder.
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

/** Group instances by category (parent managed folder) */
export function groupInstancesByCategory(
  instances: AssetInstance[],
): AssetInstanceGroup[] {
  const map = new Map<string, AssetInstance[]>()
  for (const inst of instances) {
    const list = map.get(inst.category) ?? []
    list.push(inst)
    map.set(inst.category, list)
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    instances: items,
  }))
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
  const typeTag = instance.aiTags?.typeTag ?? instance.category
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
    version,
    versionGroupId: groupKey ? `${instance.department ?? 'unknown'}:${groupKey}` : undefined,
  }

  // Set type-specific metadata
  if (instance.type === 'shot' && instance.shotMeta) {
    base.shotMeta = {
      ...instance.shotMeta,
      duration: fakeDuration(instance.id),
    }
  } else if (typeTag) {
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

  // Populate AI metadata
  if (instance.aiTags) {
    base.aiMeta = toAIMeta(instance.aiTags)
  }

  // Build unified tags (Title Case all labels)
  const toTitleCase = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())
  const tags: AssetTag[] = []
  if (typeTag) tags.push({ label: toTitleCase(typeTag), source: 'system' })
  if (base.isKeyArt) tags.push({ label: 'Key Art', source: 'system' })
  if (base.isFinal) tags.push({ label: 'Final', source: 'system' })
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

/** Convert a single file tree node to a full Asset via the standard promotion pipeline. */
export function fileNodeToAsset(
  node: UnifiedFileNode,
  domainId: DomainId,
  parentFolderName?: string,
): Asset {
  const instances = generateAssetInstances([node], domainId)
  if (instances.length > 0) return promotedInstanceToAsset(instances[0])
  // Fallback for empty (shouldn't happen for file nodes)
  return promotedInstanceToAsset({
    id: node.id,
    name: node.name.replace(/\.[^.]+$/, ''),
    sourceFileId: node.id,
    sourceFileName: node.name,
    sourcePath: parentFolderName ? `${parentFolderName} / ${node.name}` : node.name,
    department: domainId,
    category: parentFolderName ?? '',
    type: mapExtensionToType(node.extension),
    size: node.size,
    modifiedAt: node.modifiedAt,
    modifiedBy: node.modifiedBy,
  })
}
