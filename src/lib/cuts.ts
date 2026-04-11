import type { Asset, CutStage } from '@/lib/data'
import { pickForDepartment } from '@/lib/images'
import type { SeedCut } from '@/lib/scenario'

const CUT_STAGE_LABELS: Record<CutStage, string> = {
  'locked-cut': 'Locked Cut',
  'final-cut': 'Final Cut',
  'emf': 'EMF',
}

const CUT_STAGE_ORDER: CutStage[] = [
  'locked-cut',
  'final-cut',
  'emf',
]

type ReleaseTagInfo = {
  labels: string[]
  isAll: boolean
}

function abbreviateLabel(name: string): string {
  return name.split(/\s+/).map((word) => word[0]).join('').toUpperCase()
}

export function getCutStageLabel(stage?: string | null): string {
  if (!stage) return ''
  return CUT_STAGE_LABELS[stage as CutStage] ?? stage
}

function buildCutReleaseTags(info: ReleaseTagInfo): Asset['tags'] {
  if (info.labels.length === 0) return []
  if (info.isAll) {
    return [{ label: 'ALL', source: 'system', description: `Released to all domains:\n${info.labels.join('\n')}` }]
  }

  const tags: Asset['tags'] = [
    { label: abbreviateLabel(info.labels[0]), source: 'system', description: info.labels[0] },
  ]

  if (info.labels.length > 1) {
    const others = info.labels.slice(1).join('\n')
    tags.push({ label: `+${info.labels.length - 1}`, source: 'system', description: `Also released to:\n${others}` })
  }

  return tags
}

export function seedCutToAsset(cut: SeedCut, releaseInfo?: ReleaseTagInfo): Asset {
  const stageLabel = getCutStageLabel(cut.stage)
  const typeTag = stageLabel

  return {
    id: cut.id,
    name: cut.name,
    type: 'video',
    kind: 'cut',
    stage: cut.stage as CutStage,
    version: cut.version,
    versionGroupId: cut.cutGroupId ?? `cut:${cut.episode}`,
    episode: cut.episode,
    constituents: cut.constituents,
    thumbnail: pickForDepartment('editorial', cut.id)[0],
    tags: [
      { label: typeTag, source: 'system' },
      ...(releaseInfo ? buildCutReleaseTags(releaseInfo) : []),
    ],
    videoMeta: { duration: cut.duration },
    department: 'editorial',
    created_at: cut.date,
    modifiedBy: cut.createdBy,
  }
}

function getCutStageOrder(stage?: string): number {
  const normalizedStage = (stage ?? 'locked-cut') as CutStage
  const index = CUT_STAGE_ORDER.indexOf(normalizedStage)
  return index === -1 ? -1 : index
}

export function compareCutsByStageAndVersion(
  left: Pick<Asset, 'stage' | 'version'>,
  right: Pick<Asset, 'stage' | 'version'>,
): number {
  const stageDiff = getCutStageOrder(right.stage) - getCutStageOrder(left.stage)
  if (stageDiff !== 0) return stageDiff
  return (right.version ?? 0) - (left.version ?? 0)
}
