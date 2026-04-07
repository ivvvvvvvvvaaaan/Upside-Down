// src/lib/scenario.ts — Single source of truth for the prototype permissions scenario

import type { DepartmentId } from '@/components/department/types'
import { DEPARTMENT_FOLDER_MAP, getDepartmentWorkspaceFiles } from '@/lib/workspace-data'
import type { User, UserRole } from '@/lib/personas'
import type { Team } from '@/lib/teams'
import type {
  Grant,
  RoleGroup,
  AccessProfileId,
  Permission,
  ResourceType,
} from '@/lib/grants'
import type { UserCollection } from '@/hooks/useUserCollections'

// --- Scenario shape types ---

type ScenarioPerson = {
  id: string
  name: string
  email: string
  role: UserRole
  title: string
  dept?: DepartmentId
  teams: string[]
}

type ScenarioTeam = {
  id: string
  name: string
  members: string[]
  dept?: DepartmentId
}

type ScenarioRoleGroup = {
  id: AccessProfileId
  name: string
  permissions: Permission[]
}

type ScenarioShareGrant = { to: string; as: AccessProfileId } | { toTeam: string; as: AccessProfileId }

type ScenarioShare = {
  resource: { id: string; type: ResourceType; dept?: DepartmentId }
  label: string
  by: string
  date: string
  context?: string
  grants: ScenarioShareGrant[]
  revoked?: boolean
  /** ISO date — grant expires after this date */
  expiresAt?: string
  /** Live or snapshot share mode */
  shareMode?: 'live' | 'snapshot'
  /** Frozen asset IDs for snapshot shares */
  snapshotAssetIds?: string[]
  /** Allow recipient to upload into this collection */
  allowUpload?: boolean
  /** Review link ID for direct review access */
  reviewLinkId?: string
}

type ScenarioGuestLink = {
  resource: { id: string; type: ResourceType; dept?: DepartmentId }
  label: string
  createdBy: string
  date: string
  expiresAt: string
  context?: string
  allowDownload?: boolean
  passcode?: boolean
}

type ScenarioCollection = {
  id: string
  name: string
  createdBy: string
  assetIds: string[]
  /** If set, this collection resolves assets from a folder at query time */
  boundFolderId?: string
  boundDepartmentId?: string
}

type ScenarioCut = {
  id: string
  name: string
  episode: string
  stage: string
  version: number
  /** Asset version (major.minor) as shown in metadata */
  assetVersion: string
  /** Source files that make up this cut */
  constituents: string[]
  createdBy: string
  date: string
  /** Duration string for display */
  duration: string
  /** What changed in this version */
  note: string
}

type ScenarioDepartmentAccess = {
  dept: DepartmentId
  defaultTeamId: string
  defaultProfile: AccessProfileId
}

type ReleaseDomainGroup = 'Studio' | 'Wide' | 'Other'

type ScenarioReleaseDomain = {
  id: string
  name: string
  group: ReleaseDomainGroup
  /** Which asset types can be released to this domain */
  assetTypes: string[]
  /** Teams that receive grants when content is released to this domain */
  granteeTeamIds: string[]
  /** Individual users that receive grants */
  granteeUserIds?: string[]
  /** The permission profile granted on release */
  defaultProfile: AccessProfileId
}

type Scenario = {
  projectName: string
  /** Project-level: allow users to see restricted assets as blurred tiles */
  discoveryEnabled: boolean
  /** Departments that opt out of discovery even when project has it enabled */
  discoveryDisabledDepartments: DepartmentId[]
  /** System-level release domains configured for this project */
  releaseDomains: ScenarioReleaseDomain[]
  roleGroups: ScenarioRoleGroup[]
  people: ScenarioPerson[]
  teams: ScenarioTeam[]
  departmentAccess: ScenarioDepartmentAccess[]
  projectRoles: {
    people: Record<string, AccessProfileId>
    teams: Record<string, AccessProfileId>
  }
  shares: ScenarioShare[]
  guestLinks: ScenarioGuestLink[]
  collections: ScenarioCollection[]
  cuts: ScenarioCut[]
}

// --- The scenario ---

export const SCENARIO: Scenario = {
  projectName: 'Apex S1',
  discoveryEnabled: true,
  discoveryDisabledDepartments: ['audio-sound'],

  // Release domains — system-level config, maps real Content Hub release targets
  // Each domain defines WHO gets grants when content is released to that domain
  releaseDomains: [
    // Studio tier — internal Netflix studio teams
    { id: 'studio-creative',    name: 'Studio Creative',    group: 'Studio', assetTypes: ['cut', 'asset'], granteeTeamIds: ['studio-leadership'],  defaultProfile: 'viewer' },
    { id: 'studio-post',        name: 'Studio Post',        group: 'Studio', assetTypes: ['cut', 'asset'], granteeTeamIds: ['netflix-post'],       defaultProfile: 'viewer' },
    { id: 'studio-production',  name: 'Studio Production',  group: 'Studio', assetTypes: ['cut', 'asset'], granteeTeamIds: ['super-prod'],         defaultProfile: 'viewer' },
    { id: 'studio-vfx',         name: 'Studio VFX',         group: 'Studio', assetTypes: ['cut'],          granteeTeamIds: ['vfx-core'],           defaultProfile: 'viewer' },
    // Wide tier — broader Netflix org
    { id: 'globalization',      name: 'Globalization',       group: 'Wide',   assetTypes: ['cut'],          granteeTeamIds: ['team-globalization'],      defaultProfile: 'viewer' },
    { id: 'marketing',          name: 'Marketing',           group: 'Wide',   assetTypes: ['cut', 'asset'], granteeTeamIds: ['team-marketing'],          defaultProfile: 'viewer' },
    { id: 'legal',              name: 'Legal',               group: 'Wide',   assetTypes: ['cut'],          granteeTeamIds: ['team-legal'],              defaultProfile: 'viewer' },
    { id: 'music',              name: 'Music',               group: 'Wide',   assetTypes: ['cut'],          granteeTeamIds: ['team-music'],              defaultProfile: 'viewer' },
    // Other tier
    { id: 'consumer-insights',  name: 'Consumer Insights',   group: 'Other',  assetTypes: ['cut'],          granteeTeamIds: ['team-consumer-insights'],  defaultProfile: 'viewer' },
    { id: 'content-preview',    name: 'Content Preview',     group: 'Other',  assetTypes: ['cut'],          granteeTeamIds: ['team-content-preview'],    defaultProfile: 'viewer' },
  ],

  roleGroups: [
    { id: 'owner',       name: 'Owner',       permissions: ['open', 'download', 'write', 'delete', 'comment', 'share', 'edit-acl'] },
    { id: 'manager',     name: 'Full access', permissions: ['open', 'download', 'write', 'delete', 'comment', 'share', 'edit-acl'] },
    { id: 'editor',      name: 'Can edit & share', permissions: ['open', 'download', 'write', 'comment', 'share'] },
    { id: 'contributor', name: 'Can edit',    permissions: ['open', 'write'] },
    { id: 'commenter',   name: 'Can comment', permissions: ['open', 'comment'] },
    { id: 'viewer',      name: 'View only',   permissions: ['open', 'download'] },
    { id: 'link-viewer', name: 'View only',   permissions: ['open', 'download'] },
  ],

  people: [
    { id: 'studio-alex',           name: 'Alex Rivera',   email: 'arivera@netflix.com',  role: 'studio-exec', title: 'VP Content',             dept: undefined,    teams: [] },
    { id: 'creative-david',        name: 'David Park',    email: 'dpark@netflix.com',    role: 'creative',    title: 'Director',               dept: undefined,    teams: [] },
    { id: 'vfx-supervisor',        name: 'Mike Torres',   email: 'mtorres@netflix.com',  role: 'manager',     title: 'VFX Supervisor',         dept: 'vfx',        teams: ['vfx-core'] },
    { id: 'vfx-coordinator',       name: 'Sarah Chen',    email: 'schen@netflix.com',    role: 'manager',     title: 'VFX Coordinator',        dept: 'vfx',        teams: ['vfx-core'] },
    { id: 'editorial-coordinator', name: 'Lisa Kim',      email: 'lkim@netflix.com',     role: 'manager',     title: 'Editorial Coordinator',  dept: 'editorial',  teams: ['editorial'] },
    { id: 'editorial-artist',      name: 'Maria Santos',  email: 'msantos@netflix.com',  role: 'artist',      title: 'Editor',                 dept: 'editorial',  teams: ['editorial'] },
    { id: 'art-artist',            name: 'Priya Sharma',  email: 'psharma@netflix.com',  role: 'artist',      title: 'Concept Artist',         dept: 'art-design', teams: ['art-design'] },
    { id: 'vendor-framestore',     name: 'James Liu',     email: 'jliu@framestore.com',  role: 'vendor',      title: 'Lead Compositor',        dept: undefined,    teams: [] },
    { id: 'camera-dit',            name: 'Tom Nakamura',  email: 'tnakamura@netflix.com', role: 'manager',     title: 'DIT',                    dept: 'camera',     teams: ['camera-team'] },
    { id: 'audio-supervisor',      name: 'Rachel Obi',    email: 'robi@netflix.com',      role: 'manager',     title: 'Sound Supervisor',       dept: 'audio-sound', teams: ['audio-team'] },
  ],

  teams: [
    { id: 'vfx-core',       name: 'VFX',            members: ['vfx-supervisor', 'vfx-coordinator'],                        dept: 'vfx' },
    { id: 'editorial',      name: 'Editorial',      members: ['editorial-coordinator', 'editorial-artist'],                 dept: 'editorial' },
    { id: 'art-design',     name: 'Art & Design',   members: ['art-artist'],                                               dept: 'art-design' },
    { id: 'camera-team',    name: 'Camera',         members: ['camera-dit'],                                                dept: 'camera' },
    { id: 'audio-team',     name: 'Audio & Sound',  members: ['audio-supervisor'],                                           dept: 'audio-sound' },
    // Cross-department teams (referenced by release domains as grantees)
    { id: 'studio-leadership', name: 'Studio Leadership', members: ['studio-alex', 'creative-david'] },
    { id: 'netflix-studio',    name: 'Netflix Studio',    members: ['studio-alex'] },
    { id: 'netflix-post',      name: 'Netflix Post',      members: ['vfx-supervisor', 'editorial-coordinator', 'audio-supervisor'] },
    { id: 'super-prod',        name: 'Super Prod',        members: ['studio-alex', 'creative-david', 'vfx-coordinator', 'editorial-coordinator'] },
    // Wide/Other org teams — exist in the broader Netflix org, no prototype personas
    { id: 'team-globalization',     name: 'Globalization',      members: [] },
    { id: 'team-marketing',         name: 'Marketing',          members: [] },
    { id: 'team-legal',             name: 'Legal',              members: [] },
    { id: 'team-music',             name: 'Music',              members: [] },
    { id: 'team-consumer-insights', name: 'Consumer Insights',  members: [] },
    { id: 'team-content-preview',   name: 'Content Preview',    members: [] },
  ],

  departmentAccess: [
    { dept: 'vfx', defaultTeamId: 'vfx-core', defaultProfile: 'manager' },
    { dept: 'editorial', defaultTeamId: 'editorial', defaultProfile: 'editor' },
    { dept: 'art-design', defaultTeamId: 'art-design', defaultProfile: 'editor' },
    { dept: 'camera', defaultTeamId: 'camera-team', defaultProfile: 'manager' },
    { dept: 'audio-sound', defaultTeamId: 'audio-team', defaultProfile: 'manager' },
  ],

  projectRoles: {
    people: {
      'studio-alex':           'viewer',
      'creative-david':        'commenter',
      'vfx-supervisor':        'editor',
      'vfx-coordinator':       'editor',
      'editorial-coordinator': 'contributor',
      'editorial-artist':      'contributor',
      'art-artist':            'contributor',
      'vendor-framestore':     'viewer',
      'camera-dit':            'contributor',
      'audio-supervisor':      'contributor',
    },
    teams: {},
  },

  shares: [
    {
      resource: { id: 'ws-vfx-coll-for-editorial', type: 'collection', dept: 'vfx' },
      label: 'VFX shots for edit review',
      by: 'vfx-coordinator',
      date: '2026-01-28',
      context: 'Sarah packages the latest VFX comps for editorial. These are the approved plates from SEQ010 (pit lane crash) and SEQ020 (podium celebration) that Maria and Lisa need to cut into the EP301 timeline. View-only so editorial sees the work but can\'t modify source files.',
      grants: [
        { to: 'editorial-coordinator', as: 'viewer' },
        { to: 'editorial-artist',      as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-vfx-coll-for-vendor', type: 'collection', dept: 'vfx' },
      label: 'EP301 comp package',
      by: 'vfx-coordinator',
      date: '2026-01-20',
      context: 'Sarah sends Framestore the approved comp direction for EP301. James needs to see the internal shot breakdown and reference comps before starting his team\'s delivery pass. Viewer access only — vendor cannot reshare or download without watermark.',
      grants: [
        { to: 'vendor-framestore', as: 'viewer' },
      ],
    },
    // --- Cut shares (composite entities, not raw files) ---
    // Locked Cut 1: Maria shares first lock with VFX for timing + dailies review team
    {
      resource: { id: 'cut-ep301-lc-1', type: 'cut', dept: 'editorial' },
      label: 'EP301 Locked Cut 1',
      by: 'editorial-artist',
      date: '2026-02-08',
      context: 'Maria shares the first picture lock with VFX for timing reference. Mike and Sarah need exact in/out points so their comps match the edit duration. Also shared to the dailies review group for the regular review cycle.',
      grants: [
        { toTeam: 'vfx-core', as: 'viewer' },
        { to: 'creative-david', as: 'commenter' },
      ],
    },
    // Locked Cut 2: Lisa shares updated cut with David for review + Alex for studio sign-off
    {
      resource: { id: 'cut-ep301-lc-2', type: 'cut', dept: 'editorial' },
      label: 'EP301 Locked Cut 2',
      by: 'editorial-coordinator',
      date: '2026-02-13',
      context: 'Lisa shares the second lock — David\'s pacing notes from the last review session are incorporated. Alex needs to see it before the marketing team can start pulling frames for the campaign.',
      grants: [
        { toTeam: 'studio-leadership', as: 'viewer' },
        { toTeam: 'vfx-core', as: 'viewer' },
        { to: 'creative-david', as: 'commenter' },
      ],
    },
    // Locked Cut 3: shared to audio for sound design + Netflix Post for oversight
    {
      resource: { id: 'cut-ep301-lc-3', type: 'cut', dept: 'editorial' },
      label: 'EP301 Locked Cut 3',
      by: 'editorial-coordinator',
      date: '2026-02-18',
      context: 'Lisa sends the third lock to Rachel so the sound team can begin spotting and designing the final mix. Audio needs the exact edit to place SFX, music, and ADR cues frame-accurately. Netflix Post gets it for cross-department oversight.',
      grants: [
        { to: 'audio-supervisor', as: 'viewer' },
        { toTeam: 'netflix-post', as: 'viewer' },
        { toTeam: 'studio-leadership', as: 'viewer' },
        { toTeam: 'vfx-core', as: 'viewer' },
      ],
    },
    // Netflix Cut: shared to Netflix Studio for formal Netflix review
    {
      resource: { id: 'cut-ep301-nc', type: 'cut', dept: 'editorial' },
      label: 'EP301 Netflix Cut',
      by: 'editorial-coordinator',
      date: '2026-02-22',
      context: 'Lisa promotes to the Netflix Cut — near-final VFX with full 5.1 temp mix. This is the formal Netflix internal review. Alex reviews on behalf of studio.',
      grants: [
        { toTeam: 'netflix-studio', as: 'viewer' },
        { toTeam: 'netflix-post', as: 'viewer' },
        { toTeam: 'studio-leadership', as: 'viewer' },
        { toTeam: 'vfx-core', as: 'viewer' },
        { to: 'creative-david', as: 'commenter' },
      ],
    },
    // Final Cut: shared to Super Prod for delivery approval
    {
      resource: { id: 'cut-ep301-fc', type: 'cut', dept: 'editorial' },
      label: 'EP301 Final Cut',
      by: 'editorial-coordinator',
      date: '2026-02-28',
      context: 'Final picture and sound — all VFX final, approved for delivery. Super Prod team reviews before the EMF gets generated for downstream localization.',
      grants: [
        { toTeam: 'super-prod', as: 'viewer' },
        { toTeam: 'netflix-studio', as: 'viewer' },
        { toTeam: 'netflix-post', as: 'viewer' },
        { toTeam: 'studio-leadership', as: 'viewer' },
        { toTeam: 'vfx-core', as: 'viewer' },
      ],
    },
    // EP302 Locked Cut 1: early stage shared to dailies review
    {
      resource: { id: 'cut-ep302-lc-1', type: 'cut', dept: 'editorial' },
      label: 'EP302 Locked Cut 1',
      by: 'editorial-artist',
      date: '2026-02-20',
      context: 'Maria shares the first EP302 lock for the regular dailies review. Early stage — temp sound only, no VFX yet.',
      grants: [
        { to: 'creative-david', as: 'commenter' },
        { toTeam: 'vfx-core', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-art-concept-1', type: 'asset', dept: 'art-design' },
      label: 'Hero Pose v3',
      by: 'art-artist',
      date: '2026-02-08',
      context: 'Priya shares her latest hero concept with the revised AR-24 livery design. David wants to see how the new color scheme reads at small sizes for social media. Alex needs sign-off authority before the art department sends to print production.',
      grants: [
        { to: 'studio-alex',    as: 'viewer' },
        { to: 'creative-david', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-cam-sel-1', type: 'asset', dept: 'camera' },
      label: 'Scene 12 Take B Selected',
      by: 'editorial-artist',
      date: '2026-02-10',
      context: 'Maria pulls the selected camera take from the grid start sequence and shares it with David and Alex. This is the hero angle for the opening — David chose Take B for the tighter framing on Vitale\'s helmet. Needs studio confirmation before the edit locks.',
      grants: [
        { to: 'studio-alex',    as: 'viewer' },
        { to: 'creative-david', as: 'viewer' },
      ],
    },
    // Smart collection share: Sarah Chen shares "Finals" with editorial team
    {
      resource: { id: 'smart-finals', type: 'smart-collection' },
      label: 'Finals',
      by: 'vfx-coordinator',
      date: '2026-02-12',
      context: 'Sarah shares a smart collection that auto-updates as VFX shots get marked final. Maria can check this anytime to see which shots are locked and ready to conform into the master timeline. No manual curation needed — the filter catches everything tagged "Final" across VFX.',
      grants: [
        { to: 'editorial-artist', as: 'viewer' },
      ],
    },
    // Revoked: vendor had an earlier comp share that was superseded
    {
      resource: { id: 'ws-vfx-010-030', type: 'asset', dept: 'vfx' },
      label: 'SEQ010 SH030 Comp v5 (superseded)',
      by: 'vfx-coordinator',
      date: '2026-02-06',
      context: 'Sarah had shared an earlier comp version with Framestore for reference. After David\'s review session changed the creative direction on this shot, the v5 comp became invalid. Sarah revokes the share to prevent James from working against outdated direction. The replacement v8 will be shared once approved.',
      revoked: true,
      grants: [
        { to: 'vendor-framestore', as: 'viewer' },
      ],
    },
    // Dailies Review channel — standing review access for the core creative team
    {
      resource: { id: 'ws-edit-coll-dailies', type: 'collection', dept: 'editorial' },
      label: 'Dailies Review Cuts',
      by: 'editorial-coordinator',
      date: '2026-01-20',
      context: 'Lisa sets up the daily review channel for the core creative team. As Maria publishes new cuts, the team sees updates here. David and Sarah use it to stay aligned on the edit — new locks land here automatically.',
      grants: [
        { to: 'creative-david', as: 'commenter' },
        { toTeam: 'vfx-core', as: 'viewer' },
      ],
    },
    // Vendor drop collection: VFX coordinator gives Framestore a scoped upload point
    {
      resource: { id: 'coll-vfx-vendor-drop', type: 'collection', dept: 'vfx' },
      label: 'Framestore Drop',
      by: 'vfx-coordinator',
      date: '2026-01-15',
      context: 'Sarah creates a collection for Framestore deliveries. James can see the brief and upload comp deliveries — he cannot browse the rest of the VFX workspace.',
      allowUpload: true,
      grants: [
        { to: 'vendor-framestore', as: 'viewer' },
      ],
    },
    // (Stale cut shares removed — VFX timing now via cut-ep301-lc-1 share)
    // --- Camera department shares ---
    // Camera DIT shares selected takes with editorial + director
    {
      resource: { id: 'coll-cam-selects', type: 'collection', dept: 'camera' },
      label: 'Camera Selects',
      by: 'camera-dit',
      date: '2026-02-05',
      shareMode: 'live',
      context: 'Tom shares camera selects as a live collection with editorial — Maria and Lisa see new selects as Tom adds them. They pull camera-original takes into the timeline as they cut.',
      grants: [
        { toTeam: 'editorial', as: 'viewer' },
      ],
    },
    // Camera DIT shares lens distortion data with VFX for comp accuracy
    {
      resource: { id: 'coll-cam-lens-data', type: 'collection', dept: 'camera' },
      label: 'Lens Data',
      by: 'camera-dit',
      date: '2026-01-25',
      shareMode: 'live',
      context: 'Tom shares lens distortion maps and test charts as a live collection with VFX. Mike and Sarah need these for accurate lens-matching in Nuke — new lens data auto-syncs as Tom adds it.',
      grants: [
        { to: 'vfx-supervisor', as: 'viewer' },
        { to: 'vfx-coordinator', as: 'viewer' },
      ],
    },
    // Camera DIT shares curated B-roll highlights with art + editorial
    {
      resource: { id: 'ws-cam-coll-broll', type: 'collection', dept: 'camera' },
      label: 'B-Roll Highlights',
      by: 'camera-dit',
      date: '2026-02-11',
      context: 'Tom curates the best B-roll from location shoots — aerial circuits, paddock atmosphere, and forest drone footage. Priya uses these as reference for environment concepts, and Maria pulls them for montage sequences.',
      grants: [
        { to: 'art-artist', as: 'viewer' },
        { to: 'editorial-artist', as: 'viewer' },
      ],
    },
    // --- Audio department shares ---
    // Audio supervisor packages temp sound for editorial
    {
      resource: { id: 'ws-audio-coll-for-editorial', type: 'collection', dept: 'audio-sound' },
      label: 'Temp Sound Kit',
      by: 'audio-supervisor',
      date: '2026-02-07',
      context: 'Rachel packages engine sounds, pit lane ambience, and score cues so Maria can lay a temp mix under the Director Cut. Cutting in silence makes it impossible to evaluate pacing — the temp mix helps David and Alex feel the energy of the race sequences.',
      grants: [
        { to: 'editorial-coordinator', as: 'viewer' },
        { to: 'editorial-artist', as: 'viewer' },
      ],
    },
    // (Audio handoff now via cut-ep301-lc-3 share above)
    // --- Expiring grants ---
    // Framestore gets time-boxed access to VFX reference package (delivery window)
    {
      resource: { id: 'ws-vfx-coll-for-vendor', type: 'collection', dept: 'vfx' },
      label: 'EP301 comp package (delivery window)',
      by: 'vfx-coordinator',
      date: '2026-02-15',
      expiresAt: '2026-03-15',
      context: 'Sarah extends Framestore\'s comp package access for the EP301 delivery window. James\'s team has four weeks to complete their pass. After the deadline, access auto-revokes to prevent work against stale reference material.',
      grants: [
        { to: 'vendor-framestore', as: 'viewer' },
      ],
    },
    // Temporary cross-department access: art gets camera dailies for 2 weeks of concept work
    {
      resource: { id: 'coll-cam-dailies', type: 'collection', dept: 'camera' },
      label: 'Dailies (concept reference)',
      by: 'camera-dit',
      date: '2026-02-10',
      expiresAt: '2026-02-24',
      shareMode: 'snapshot',
      snapshotAssetIds: ['ws-cam-daily-1', 'ws-cam-daily-2', 'ws-cam-daily-3', 'ws-cam-daily-4', 'ws-cam-daily-5'],
      context: 'Tom gives Priya a two-week snapshot of raw dailies for concept painting reference. Snapshot mode — Priya sees exactly these 5 takes, not future dailies. Time-boxed because ungraded footage shouldn\'t circulate long-term.',
      grants: [
        { to: 'art-artist', as: 'viewer' },
      ],
    },

    // --- Unified Collection Model scenarios ---

    // Snapshot share: Sarah shares VFX delivery package with vendor (frozen contents)
    {
      resource: { id: 'ws-vfx-coll-for-vendor', type: 'collection', dept: 'vfx' },
      label: 'Framestore Week 12 Delivery',
      by: 'vfx-coordinator',
      date: '2026-02-16',
      context: 'Sarah sends Framestore the approved shots for this week. Snapshot mode freezes the 8 shots at share time — next week\'s batch won\'t leak into this delivery. Upload enabled so James can deliver rendered frames back.',
      shareMode: 'snapshot',
      snapshotAssetIds: ['ws-vfx-010-010', 'ws-vfx-010-020', 'ws-vfx-010-030', 'ws-vfx-020-010', 'ws-vfx-020-020'],
      allowUpload: true,
      grants: [
        { to: 'vendor-framestore', as: 'viewer' },
      ],
    },

    // Review link: Maria shares assembly with David for review (direct link, expiring)
    {
      resource: { id: 'ws-edit-coll-dailies', type: 'collection', dept: 'editorial' },
      label: 'EP301 Assembly Review',
      by: 'editorial-artist',
      date: '2026-02-18',
      expiresAt: '2026-02-25',
      context: 'Maria sends David a review link for the EP301 assembly. He gets a focused review surface — playback, comments, ontology. No workspace, no filing. Link expires after one week.',
      reviewLinkId: 'review-ep301-assembly-david',
      grants: [
        { to: 'creative-david', as: 'commenter' },
      ],
    },
  ],

  guestLinks: [
    // External producer review link — watermarked, passcode-protected, 48h window
    {
      resource: { id: 'cut-ep301-lc-3', type: 'cut', dept: 'editorial' },
      label: 'EP301 Locked Cut 3',
      createdBy: 'editorial-coordinator',
      date: '2026-02-19',
      expiresAt: '2026-02-21',
      context: 'Lisa creates a watermarked review link for an external executive producer who needs to sign off on the latest lock before the Netflix Cut gets promoted. 48-hour window with passcode — no download, no resharing.',
      allowDownload: false,
      passcode: true,
    },
    // Studio marketing needs temporary asset access for campaign
    {
      resource: { id: 'ws-art-concept-1', type: 'asset', dept: 'art-design' },
      label: 'Hero Pose v3',
      createdBy: 'art-artist',
      date: '2026-02-12',
      expiresAt: '2026-02-19',
      context: 'Priya sends a one-week review link to the marketing agency so they can evaluate the hero concept for print campaign sizing. Download disabled until final approval.',
      allowDownload: false,
      passcode: false,
    },
  ],

  collections: [
    // Shared collections (referenced by grants)
    { id: 'ws-vfx-coll-for-editorial', name: 'EP301 VFX Pulls - Edit Review',  createdBy: 'schen@netflix.com',   assetIds: ['ws-vfx-010-010', 'ws-vfx-010-020', 'ws-vfx-020-010'] },
    { id: 'ws-vfx-coll-for-vendor',    name: 'Framestore Handoff - EP301',     createdBy: 'schen@netflix.com',   assetIds: ['ws-vfx-010-030', 'ws-vfx-020-020', 'ws-vfx-ref-brief'] },
    { id: 'ws-edit-coll-dailies', name: 'Dailies Review Cuts', createdBy: 'lkim@netflix.com', assetIds: ['ws-edit-cut-1', 'ws-edit-cut-2', 'ws-edit-cut-3'] },
    // Camera collections
    { id: 'ws-cam-coll-broll', name: 'B-Roll Highlights', createdBy: 'tnakamura@netflix.com', assetIds: ['ws-cam-broll-town', 'ws-cam-broll-forest', 'ws-cam-aerial-dawn', 'ws-cam-aerial-quarry'] },
    // Audio collections
    { id: 'ws-audio-coll-for-editorial', name: 'Temp Sound Kit', createdBy: 'robi@netflix.com', assetIds: ['ws-audio-sfx-1', 'ws-audio-sfx-2', 'ws-audio-music-1', 'ws-audio-music-2', 'ws-audio-sfx-ambience'] },
    // Everyday organising collections
    { id: 'coll-creature-designs',  name: 'Car Designs', createdBy: 'psharma@netflix.com', assetIds: ['ws-art-concept-demogorgon', 'ws-art-concept-creature', 'ws-art-char-eleven'] },
    { id: 'coll-key-locations',     name: 'Key Circuits',    createdBy: 'psharma@netflix.com', assetIds: ['ws-art-concept-ud-env', 'ws-art-concept-lab', 'ws-art-env-byers', 'ws-art-env-starcourt'] },
    { id: 'coll-hero-shots',        name: 'Hero Shots',       createdBy: 'schen@netflix.com',   assetIds: ['ws-vfx-010-010', 'ws-vfx-020-010', 'ws-vfx-comp-eleven'] },
    // Workspace collections (folder-bound, live sync) — ongoing cross-department workflows
    { id: 'coll-cam-selects',      name: 'Camera Selects',   createdBy: 'tnakamura@netflix.com', assetIds: [], boundFolderId: 'ws-cam-selects', boundDepartmentId: 'camera' },
    { id: 'coll-cam-lens-data',    name: 'Lens Data',        createdBy: 'tnakamura@netflix.com', assetIds: [], boundFolderId: 'ws-cam-lensmaps', boundDepartmentId: 'camera' },
    // Curated collections (snapshot shares — discrete handoffs)
    { id: 'coll-cam-dailies',      name: 'Dailies (concept reference)', createdBy: 'tnakamura@netflix.com', assetIds: ['ws-cam-daily-1', 'ws-cam-daily-2', 'ws-cam-daily-3', 'ws-cam-daily-4', 'ws-cam-daily-5'] },
    { id: 'coll-vfx-vendor-drop',  name: 'Framestore Drop',  createdBy: 'schen@netflix.com', assetIds: [] },
  ],

  cuts: [
    // EP301 — full progression: Locked Cut 1-3 → Netflix Cut → Final Cut → EMF
    { id: 'cut-ep301-lc-1', name: 'EP301 Locked Cut 1', episode: 'EP301', stage: 'locked-cut', version: 1, assetVersion: '1.0',
      constituents: ['ws-edit-cut-1', 'ws-audio-sfx-1', 'ws-audio-sfx-2', 'ws-audio-music-1', 'ws-audio-music-theme'],
      createdBy: 'msantos@netflix.com', date: '2026-02-08', duration: '51:20',
      note: 'Initial picture lock; temp sound/music, no VFX' },
    { id: 'cut-ep301-lc-2', name: 'EP301 Locked Cut 2', episode: 'EP301', stage: 'locked-cut', version: 2, assetVersion: '2.0',
      constituents: ['ws-edit-cut-1', 'ws-edit-exp-1', 'ws-audio-sfx-1', 'ws-audio-sfx-2', 'ws-audio-music-1', 'ws-audio-music-2'],
      createdBy: 'msantos@netflix.com', date: '2026-02-13', duration: '50:18',
      note: 'Updated picture per David\'s pacing notes; added score cues for race sequences' },
    { id: 'cut-ep301-lc-3', name: 'EP301 Locked Cut 3', episode: 'EP301', stage: 'locked-cut', version: 3, assetVersion: '3.6',
      constituents: ['ws-edit-cut-1', 'ws-edit-exp-1', 'ws-audio-mix-1', 'ws-audio-sfx-1', 'ws-audio-sfx-2', 'ws-audio-music-1', 'ws-audio-music-2'],
      createdBy: 'msantos@netflix.com', date: '2026-02-18', duration: '50:05',
      note: 'Updated picture & subtitles; temp sound/music/ADR/VFX' },
    { id: 'cut-ep301-nc', name: 'EP301 Netflix Cut', episode: 'EP301', stage: 'netflix-cut', version: 1, assetVersion: '4.0',
      constituents: ['ws-edit-cut-1', 'ws-edit-exp-1', 'ws-audio-mix-1', 'ws-audio-sfx-1', 'ws-audio-music-1', 'ws-audio-music-2'],
      createdBy: 'lkim@netflix.com', date: '2026-02-22', duration: '49:52',
      note: 'Netflix internal review cut; near-final VFX, full 5.1 temp mix' },
    { id: 'cut-ep301-fc', name: 'EP301 Final Cut', episode: 'EP301', stage: 'final-cut', version: 1, assetVersion: '5.0',
      constituents: ['ws-edit-cut-1', 'ws-edit-exp-final', 'ws-audio-mix-1', 'ws-audio-mix-2'],
      createdBy: 'lkim@netflix.com', date: '2026-02-28', duration: '49:48',
      note: 'Final picture and sound; all VFX final; approved for delivery' },
    { id: 'cut-ep301-emf', name: 'EP301 EMF', episode: 'EP301', stage: 'emf', version: 1, assetVersion: '5.0',
      constituents: ['ws-edit-exp-final', 'ws-edit-exp-textless', 'ws-audio-mix-1', 'ws-audio-mix-2'],
      createdBy: 'lkim@netflix.com', date: '2026-03-05', duration: '49:48',
      note: 'Delivery master; includes textless elements for localization' },
    // EP302 — early stage
    { id: 'cut-ep302-lc-1', name: 'EP302 Locked Cut 1', episode: 'EP302', stage: 'locked-cut', version: 1, assetVersion: '1.0',
      constituents: ['ws-edit-cut-rough2', 'ws-audio-sfx-ambience'],
      createdBy: 'msantos@netflix.com', date: '2026-02-20', duration: '57:30',
      note: 'Initial lock; temp sound only, no VFX' },
  ],
}

// --- Builder functions ---

export function buildPersonas(): User[] {
  return SCENARIO.people.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    title: p.title,
    departmentId: p.dept,
    teamIds: p.teams,
  }))
}

export function buildTeams(): Team[] {
  return SCENARIO.teams.map((t) => ({
    id: t.id,
    name: t.name,
    memberUserIds: t.members,
    departmentId: t.dept,
  }))
}

export function buildRoleGroups(): RoleGroup[] {
  return SCENARIO.roleGroups.map((rg) => ({
    id: rg.id,
    name: rg.name,
    permissions: [...rg.permissions],
    builtIn: true,
  }))
}

export function buildLabels(): Record<string, string> {
  const labels: Record<string, string> = {
    project: SCENARIO.projectName,
  }

  // Build a flat lookup of all workspace nodes across departments
  const allDeptIds: DepartmentId[] = Object.keys(DEPARTMENT_FOLDER_MAP) as DepartmentId[]
  const walk = (nodes: { id: string; name: string; children?: { id: string; name: string; children?: unknown[] }[] }[]) => {
    for (const node of nodes) {
      labels[node.id] = node.name
      if (node.children) walk(node.children as typeof nodes)
    }
  }
  for (const deptId of allDeptIds) {
    walk(getDepartmentWorkspaceFiles(deptId))
  }

  // Collection names
  for (const coll of SCENARIO.collections) {
    labels[coll.id] = coll.name
  }

  // Cut names
  for (const cut of SCENARIO.cuts) {
    labels[cut.id] = cut.name
  }

  // Scenario share labels as fallback for resources not in the workspace tree
  for (const share of SCENARIO.shares) {
    if (!labels[share.resource.id]) {
      labels[share.resource.id] = share.label
    }
  }

  return labels
}

export function buildGrants(): Grant[] {
  let counter = 0
  function grantId(): string {
    return `grant-${++counter}`
  }

  function permissionsForTemplate(templateId: AccessProfileId): Permission[] {
    const group = SCENARIO.roleGroups.find((roleGroup) => roleGroup.id === templateId)
    return group ? [...group.permissions] : []
  }

  const grants: Grant[] = []

  // Resource-level shares
  const sharerGrantsSeen = new Set<string>()
  for (const share of SCENARIO.shares) {
    const resource = {
      id: share.resource.id,
      type: share.resource.type,
      departmentId: share.resource.dept,
    }

    // Sharer gets an explicit manager grant on the resource
    const sharerKey = `${share.by}:${share.resource.id}`
    if (!sharerGrantsSeen.has(sharerKey)) {
      sharerGrantsSeen.add(sharerKey)
      grants.push({
        id: grantId(),
        resource,
        principal: { type: 'user', userId: share.by },
        templateId: 'manager',
        permissions: permissionsForTemplate('manager'),
        grantedByUserId: share.by,
        grantedAt: share.date,
      })
    }

    for (const g of share.grants) {
      const principal = 'to' in g
        ? { type: 'user' as const, userId: g.to }
        : { type: 'team' as const, teamId: (g as { toTeam: string }).toTeam }
      const grant: Grant = {
        id: grantId(),
        resource,
        principal,
        templateId: g.as,
        permissions: permissionsForTemplate(g.as),
        grantedByUserId: share.by,
        grantedAt: share.date,
      }
      if (share.revoked) {
        grant.revokedAt = share.date
      }
      if (share.expiresAt) {
        grant.expiresAt = share.expiresAt
      }
      if (share.shareMode) {
        grant.shareMode = share.shareMode
      }
      if (share.snapshotAssetIds) {
        grant.snapshotAssetIds = share.snapshotAssetIds
      }
      if (share.allowUpload) {
        grant.allowUpload = true
        grant.permissions = [...grant.permissions, 'upload']
      }
      if (share.reviewLinkId) {
        grant.reviewLinkId = share.reviewLinkId
      }
      grants.push(grant)
    }
  }

  // Project-level grants — people
  const projectResource = { id: 'project', type: 'project' as const }
  for (const [userId, profileId] of Object.entries(SCENARIO.projectRoles.people)) {
    grants.push({
      id: grantId(),
      resource: projectResource,
      principal: { type: 'user', userId },
      templateId: profileId,
      permissions: permissionsForTemplate(profileId),
      grantedByUserId: 'studio-alex',
      grantedAt: '2026-01-01',
    })
  }

  // Project-level department-team grants (unused in the simplified prototype, but kept for compatibility)
  for (const [teamId, profileId] of Object.entries(SCENARIO.projectRoles.teams)) {
    grants.push({
      id: grantId(),
      resource: projectResource,
      principal: { type: 'team', teamId },
      templateId: profileId,
      permissions: permissionsForTemplate(profileId),
      grantedByUserId: 'studio-alex',
      grantedAt: '2026-01-01',
    })
  }

  // Department root folder grants — each department has a single team default.
  for (const policy of SCENARIO.departmentAccess) {
    const folderId = DEPARTMENT_FOLDER_MAP[policy.dept]?.id
    if (!folderId) continue

    grants.push({
      id: grantId(),
      resource: { id: folderId, type: 'folder' as const, departmentId: policy.dept },
      principal: { type: 'team', teamId: policy.defaultTeamId },
      templateId: policy.defaultProfile,
      permissions: permissionsForTemplate(policy.defaultProfile),
      grantedByUserId: 'studio-alex',
      grantedAt: '2026-01-01',
    })
  }

  return grants
}

export type GuestLinkSeed = {
  id: string
  resource: { id: string; type: ResourceType; departmentId?: DepartmentId }
  label: string
  permissions: Permission[]
  templateId?: 'link-viewer' | 'commenter'
  createdByUserId: string
  createdAt: string
  expiresAt: string
  allowDownload: boolean
  passcode: boolean
  context?: string
}

export function buildGuestLinks(): GuestLinkSeed[] {
  let counter = 0
  function linkId(): string {
    return `link-${++counter}`
  }

  return SCENARIO.guestLinks.map((link) => ({
    id: linkId(),
    resource: { id: link.resource.id, type: link.resource.type, departmentId: link.resource.dept },
    label: link.label,
    permissions: link.allowDownload ? ['open', 'download'] : ['open'],
    templateId: 'link-viewer' as const,
    createdByUserId: link.createdBy,
    createdAt: link.date,
    expiresAt: link.expiresAt,
    allowDownload: link.allowDownload ?? false,
    passcode: link.passcode ?? false,
    context: link.context,
  }))
}

export type ReleaseDomain = {
  id: string
  name: string
  group: 'Studio' | 'Wide' | 'Other'
  assetTypes: string[]
  granteeTeamIds: string[]
  granteeUserIds?: string[]
  defaultProfile: AccessProfileId
}

export function buildReleaseDomains(): ReleaseDomain[] {
  return SCENARIO.releaseDomains.map(d => ({ ...d }))
}

export type SeedCut = {
  id: string
  name: string
  episode: string
  stage: string
  version: number
  assetVersion: string
  constituents: string[]
  createdBy: string
  date: string
  duration: string
  note: string
}

export function buildCuts(): SeedCut[] {
  return SCENARIO.cuts.map(c => ({ ...c }))
}

export function buildSeedCollections(): UserCollection[] {
  return SCENARIO.collections.map((c) => ({
    id: c.id,
    name: c.name,
    assetIds: c.assetIds,
    createdAt: new Date('2026-02-14'),
    createdBy: c.createdBy,
    boundFolderId: c.boundFolderId,
    boundDepartmentId: c.boundDepartmentId,
  }))
}
