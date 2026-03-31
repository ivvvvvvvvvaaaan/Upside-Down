export type ReviewNoteSummary = {
  totalNotes: number
  unresolvedCount: number
  latestSummary: string
  updatedAt: string
  externalUrl: string
}

const REVIEW_NOTE_SUMMARIES: Record<string, ReviewNoteSummary> = {
  'inst-ws-edit-cut-1': {
    totalNotes: 14,
    unresolvedCount: 3,
    latestSummary: 'Director wants to compare Alt B against the tighter performance read.',
    updatedAt: '2026-02-14',
    externalUrl: 'https://review.example.com/monster-sequence/directors-cut-v4',
  },
  'inst-ws-cam-sel-1': {
    totalNotes: 6,
    unresolvedCount: 1,
    latestSummary: 'Show side flagged this take as the preferred emotional read for Scene 12.',
    updatedAt: '2026-02-13',
    externalUrl: 'https://review.example.com/scene-12/take-b-select',
  },
  'inst-ws-edit-exp-2': {
    totalNotes: 9,
    unresolvedCount: 2,
    latestSummary: 'Editorial marked the portal beats and temp timing notes for VFX pull review.',
    updatedAt: '2026-02-12',
    externalUrl: 'https://review.example.com/editorial/ep301-reference-cut-v4',
  },
  'inst-ws-vfx-010-010': {
    totalNotes: 4,
    unresolvedCount: 0,
    latestSummary: 'VFX marked this comp as ready for downstream editorial review.',
    updatedAt: '2026-02-14',
    externalUrl: 'https://review.example.com/vfx/seq010-sh010-comp-v12',
  },
  'ws-edit-coll-for-vfx': {
    totalNotes: 11,
    unresolvedCount: 3,
    latestSummary: 'Editorial collected the reference cut and plates for the current VFX pull.',
    updatedAt: '2026-02-13',
    externalUrl: 'https://review.example.com/editorial/ep301-vfx-pull',
  },
  'ws-vfx-coll-for-editorial': {
    totalNotes: 7,
    unresolvedCount: 1,
    latestSummary: 'VFX grouped the latest comps for editorial timing review.',
    updatedAt: '2026-02-14',
    externalUrl: 'https://review.example.com/vfx/editorial-handoff',
  },
  'coll-hero-shots': {
    totalNotes: 5,
    unresolvedCount: 0,
    latestSummary: 'Sarah confirmed all three hero shots match the approved color grade.',
    updatedAt: '2026-02-10',
    externalUrl: 'https://review.example.com/collections/hero-shots',
  },
  'coll-creature-designs': {
    totalNotes: 8,
    unresolvedCount: 2,
    latestSummary: 'David flagged the Demogorgon petal texture as too uniform — wants more organic variation.',
    updatedAt: '2026-02-09',
    externalUrl: 'https://review.example.com/collections/creature-designs',
  },
  'inst-ws-vfx-010-020': {
    totalNotes: 3,
    unresolvedCount: 0,
    latestSummary: 'Mike signed off on the particle density after the third pass.',
    updatedAt: '2026-02-07',
    externalUrl: 'https://review.example.com/vfx/seq010-sh020-comp-v08',
  },
  'inst-ws-vfx-020-010': {
    totalNotes: 6,
    unresolvedCount: 4,
    latestSummary: 'David flagged the portal timing as too fast — wants 8 more frames before the bloom peak.',
    updatedAt: '2026-02-11',
    externalUrl: 'https://review.example.com/vfx/seq020-sh010-comp-v03',
  },
  'inst-ws-vfx-comp-eleven': {
    totalNotes: 10,
    unresolvedCount: 2,
    latestSummary: 'Sarah noted the nosebleed CG needs to track tighter on the close-up.',
    updatedAt: '2026-02-08',
    externalUrl: 'https://review.example.com/vfx/eleven-powers-comp-v4',
  },
  'inst-ws-art-concept-1': {
    totalNotes: 7,
    unresolvedCount: 0,
    latestSummary: 'Priya incorporated all of David\'s silhouette feedback — approved.',
    updatedAt: '2026-02-06',
    externalUrl: 'https://review.example.com/art/hero-pose-v3',
  },
  'inst-ws-art-concept-demogorgon': {
    totalNotes: 12,
    unresolvedCount: 3,
    latestSummary: 'David wants the jaw hinge redesigned to allow wider gape for the reveal shot.',
    updatedAt: '2026-02-05',
    externalUrl: 'https://review.example.com/art/concept-demogorgon',
  },
  'inst-ws-cam-sel-billy': {
    totalNotes: 3,
    unresolvedCount: 0,
    latestSummary: 'Lisa confirmed this is the preferred take for the confrontation beat.',
    updatedAt: '2026-02-03',
    externalUrl: 'https://review.example.com/camera/billy-closeup-select',
  },
  'inst-ws-edit-cut-locked': {
    totalNotes: 16,
    unresolvedCount: 0,
    latestSummary: 'Picture lock approved by Alex — all review notes resolved.',
    updatedAt: '2026-02-04',
    externalUrl: 'https://review.example.com/editorial/ep07-locked-cut',
  },
}

export function getReviewNoteSummary(resourceId: string): ReviewNoteSummary | null {
  return REVIEW_NOTE_SUMMARIES[resourceId] ?? null
}
