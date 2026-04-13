// src/lib/scenario.ts — Single source of truth for the prototype permissions scenario

import type { DomainId, ProductionDomainId } from '@/components/department/types'
import { DOMAIN_FOLDER_MAP, getDomainWorkspaceFiles } from '@/lib/workspace-data'
import type { User, UserRole } from '@/lib/personas'
import type { Team } from '@/lib/teams'
import type {
  Grant,
  PrincipalRef,
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
  domain?: DomainId
  teams: string[]
  /** Whether this persona can view sensitive/restricted media */
  sensitiveMediaCapability?: boolean
}

type ScenarioTeam = {
  id: string
  name: string
  members: string[]
  domain?: DomainId
}

type ScenarioRoleGroup = {
  id: AccessProfileId
  name: string
  permissions: Permission[]
}

type ScenarioShareGrant = { to: string; as: AccessProfileId } | { toTeam: string; as: AccessProfileId } | { toDomain: string; as: AccessProfileId }

type ScenarioShare = {
  resource: { id: string; type: ResourceType; domain?: DomainId }
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
  /** Allow recipient to download source files */
  allowDownload?: boolean
  /** Allow recipient to comment and annotate */
  allowComment?: boolean
  /** Allow recipient to upload into this collection */
  allowUpload?: boolean
  /** Review link ID for direct review access */
  reviewLinkId?: string
  /** Version number for versioned re-shares (turnovers) */
  version?: number
  /** Note describing what changed in this version */
  versionNote?: string
}

type ScenarioGuestLink = {
  resource: { id: string; type: ResourceType; domain?: DomainId }
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
  boundDomainId?: string
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
  /** Override the default version group (for parallel cuts like director's cut vs studio cut) */
  cutGroupId?: string
}

type ScenarioDomainAccess = {
  domain: DomainId
  defaultTeamId: string
  defaultProfile: AccessProfileId
}

type DiscoveryResourceType = 'asset' | 'cut'

type ScenarioDiscoveryRule = {
  enabled: boolean
  allowedRoles: UserRole[]
  disabledDomains: DomainId[]
}

type ReleaseDomainGroup = 'Studio' | 'Wide' | 'Other'

type ScenarioReleaseDomain = {
  id: string
  name: string
  group: ReleaseDomainGroup
  /** Which asset types can be released to this domain */
  assetTypes: string[]
  /** The production department this release domain maps to (filtered from release pills for own-department assets) */
  originDepartmentId?: string
  /** Teams that receive grants when content is released to this domain */
  granteeTeamIds: string[]
  /** Individual users that receive grants */
  granteeUserIds?: string[]
  /** The permission profile granted on release */
  defaultProfile: AccessProfileId
}

type Scenario = {
  projectName: string
  /** Project-level discovery policy for sensitive media */
  discovery: Record<DiscoveryResourceType, ScenarioDiscoveryRule>
  /** System-level release domains configured for this project */
  releaseDomains: ScenarioReleaseDomain[]
  roleGroups: ScenarioRoleGroup[]
  people: ScenarioPerson[]
  teams: ScenarioTeam[]
  domainAccess: ScenarioDomainAccess[]
  projectRoles: {
    people: Record<string, AccessProfileId>
    teams: Record<string, AccessProfileId>
  }
  shares: ScenarioShare[]
  guestLinks: ScenarioGuestLink[]
  collections: ScenarioCollection[]
  cuts: ScenarioCut[]
  /** Asset IDs flagged as containing sensitive media */
  sensitiveAssetIds: string[]
}

// --- The scenario ---

export const SCENARIO: Scenario = {
  projectName: 'Apex S1',
  discovery: {
    asset: {
      enabled: true,
      allowedRoles: ['studio-exec', 'creative', 'manager', 'artist'],
      disabledDomains: ['audio-sound'],
    },
    cut: {
      enabled: true,
      allowedRoles: ['studio-exec', 'creative', 'manager', 'artist'],
      disabledDomains: [],
    },
  },

  // Release domains — system-level config, maps real Content Hub release targets
  // Each domain defines WHO gets grants when content is released to that domain
  releaseDomains: [
    // Studio tier — internal Netflix studio teams
    { id: 'studio-creative',    name: 'Studio Creative',    group: 'Studio', assetTypes: ['cut', 'asset'], originDepartmentId: 'art-design',  granteeTeamIds: ['studio-leadership'],  defaultProfile: 'viewer' },
    { id: 'studio-post',        name: 'Studio Post',        group: 'Studio', assetTypes: ['cut', 'asset'], originDepartmentId: 'editorial',   granteeTeamIds: ['netflix-post'],       defaultProfile: 'viewer' },
    { id: 'studio-production',  name: 'Studio Production',  group: 'Studio', assetTypes: ['cut', 'asset'],                                    granteeTeamIds: ['super-prod'],         defaultProfile: 'viewer' },
    { id: 'studio-vfx',         name: 'Studio VFX',         group: 'Studio', assetTypes: ['cut'],          originDepartmentId: 'vfx',         granteeTeamIds: ['vfx-core'],           defaultProfile: 'viewer' },
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
    { id: 'manager',     name: 'Manager',      permissions: ['open', 'download', 'write', 'delete', 'comment', 'share', 'edit-acl', 'upload'] },
    { id: 'editor',      name: 'Editor',       permissions: ['open', 'download', 'write', 'comment', 'share'] },
    { id: 'viewer',      name: 'Viewer',       permissions: ['open'] },
    { id: 'link-viewer', name: 'Link Viewer',  permissions: ['open'] },
  ],

  people: [
    { id: 'studio-alex',           name: 'Alex Rivera',   email: 'arivera@netflix.com',  role: 'studio-exec', title: 'VP Content',             domain: undefined,    teams: [], sensitiveMediaCapability: true },
    { id: 'creative-david',        name: 'David Park',    email: 'dpark@netflix.com',    role: 'creative',    title: 'Director',               domain: undefined,    teams: [] },
    { id: 'vfx-supervisor',        name: 'Mike Torres',   email: 'mtorres@netflix.com',  role: 'manager',     title: 'VFX Supervisor',         domain: 'vfx',        teams: ['vfx-core'] },
    { id: 'vfx-coordinator',       name: 'Sarah Chen',    email: 'schen@netflix.com',    role: 'manager',     title: 'VFX Coordinator',        domain: 'vfx',        teams: ['vfx-core'] },
    { id: 'editorial-coordinator', name: 'Lisa Kim',      email: 'lkim@netflix.com',     role: 'manager',     title: 'Editorial Coordinator',  domain: 'editorial',  teams: ['editorial'], sensitiveMediaCapability: true },
    { id: 'editorial-artist',      name: 'Maria Santos',  email: 'msantos@netflix.com',  role: 'artist',      title: 'Editor',                 domain: 'editorial',  teams: ['editorial'], sensitiveMediaCapability: true },
    { id: 'art-artist',            name: 'Priya Sharma',  email: 'psharma@netflix.com',  role: 'artist',      title: 'Concept Artist',         domain: 'art-design', teams: ['art-design'] },
    { id: 'vendor-framestore',     name: 'James Liu',     email: 'jliu@framestore.com',  role: 'vendor',      title: 'Lead Compositor',        domain: undefined,    teams: [] },
    { id: 'camera-dit',            name: 'Tom Nakamura',  email: 'tnakamura@netflix.com', role: 'manager',     title: 'DIT',                    domain: 'camera',     teams: ['camera-team'] },
    { id: 'audio-supervisor',      name: 'Rachel Obi',    email: 'robi@netflix.com',      role: 'manager',     title: 'Sound Supervisor',       domain: 'audio-sound', teams: ['audio-team'] },
    { id: 'marketing-coordinator', name: 'Nina Garcia',   email: 'ngarcia@netflix.com',   role: 'manager',     title: 'Marketing Coordinator',  domain: 'marketing',   teams: ['team-marketing'] },
    { id: 'legal-reviewer',        name: 'Sam Patel',     email: 'spatel@netflix.com',    role: 'manager',     title: 'Legal Reviewer',         domain: 'legal',       teams: ['team-legal'] },
  ],

  teams: [
    { id: 'vfx-core',       name: 'VFX',            members: ['vfx-supervisor', 'vfx-coordinator'],                        domain: 'vfx' },
    { id: 'editorial',      name: 'Editorial',      members: ['editorial-coordinator', 'editorial-artist'],                 domain: 'editorial' },
    { id: 'art-design',     name: 'Art & Design',   members: ['art-artist'],                                               domain: 'art-design' },
    { id: 'camera-team',    name: 'Camera',         members: ['camera-dit'],                                                domain: 'camera' },
    { id: 'audio-team',     name: 'Audio & Sound',  members: ['audio-supervisor'],                                           domain: 'audio-sound' },
    // Cross-department teams (referenced by release domains as grantees)
    { id: 'studio-leadership', name: 'Studio Leadership', members: ['studio-alex', 'creative-david'] },
    { id: 'netflix-studio',    name: 'Netflix Studio',    members: ['studio-alex'] },
    { id: 'netflix-post',      name: 'Netflix Post',      members: ['vfx-supervisor', 'editorial-coordinator', 'audio-supervisor'] },
    { id: 'super-prod',        name: 'Super Prod',        members: ['studio-alex', 'creative-david', 'vfx-coordinator', 'editorial-coordinator'] },
    // Wide/Other org teams — exist in the broader Netflix org, no prototype personas
    { id: 'team-globalization',     name: 'Globalization',      members: [] },
    { id: 'team-marketing',         name: 'Marketing',          members: ['marketing-coordinator'] },
    { id: 'team-legal',             name: 'Legal',              members: ['legal-reviewer'] },
    { id: 'team-music',             name: 'Music',              members: [] },
    { id: 'team-consumer-insights', name: 'Consumer Insights',  members: [] },
    { id: 'team-content-preview',   name: 'Content Preview',    members: [] },
  ],

  domainAccess: [
    { domain: 'vfx', defaultTeamId: 'vfx-core', defaultProfile: 'manager' },
    { domain: 'editorial', defaultTeamId: 'editorial', defaultProfile: 'manager' },
    { domain: 'art-design', defaultTeamId: 'art-design', defaultProfile: 'manager' },
    { domain: 'camera', defaultTeamId: 'camera-team', defaultProfile: 'manager' },
    { domain: 'audio-sound', defaultTeamId: 'audio-team', defaultProfile: 'manager' },
  ],

  projectRoles: {
    people: {
      'studio-alex':           'viewer',
      'creative-david':        'viewer',
      'vfx-supervisor':        'editor',
      'vfx-coordinator':       'editor',
      'editorial-coordinator': 'editor',
      'editorial-artist':      'editor',
      'art-artist':            'editor',
      'vendor-framestore':     'viewer',
      'camera-dit':            'editor',
      'audio-supervisor':      'editor',
      'marketing-coordinator': 'viewer',
      'legal-reviewer':        'viewer',
    },
    teams: {},
  },

  shares: [
    {
      resource: { id: 'ws-vfx-coll-for-editorial', type: 'collection', domain: 'vfx' },
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
      resource: { id: 'coll-vfx-vendor-drop', type: 'collection', domain: 'vfx' },
      label: 'Framestore',
      by: 'vfx-coordinator',
      date: '2026-01-15',
      expiresAt: '2026-06-15',
      allowUpload: true,
      shareMode: 'snapshot',
      version: 1,
      context: 'Sarah shares the Framestore workspace folder. James can see the brief, download plates, and upload comp deliveries. Time-boxed to the delivery window.',
      grants: [
        { to: 'vendor-framestore', as: 'viewer' },
      ],
    },
    // --- Cut shares (composite entities, not raw files) ---
    // Locked Cut 1: Maria releases first lock to Studio VFX + shares with David for review
    {
      resource: { id: 'cut-ep301-lc-1', type: 'cut', domain: 'editorial' },
      label: 'EP301 Locked Cut 1',
      by: 'editorial-artist',
      date: '2026-02-08',
      context: 'Maria releases the first picture lock to Studio VFX for timing reference. Mike and Sarah need exact in/out points so their comps match the edit duration. David gets direct share for review notes.',
      grants: [
        { toDomain: 'studio-vfx', as: 'viewer' },
        { to: 'creative-david', as: 'viewer' },
      ],
    },
    // Locked Cut 2: Lisa releases to Studio Creative + Studio VFX, shares with David
    {
      resource: { id: 'cut-ep301-lc-2', type: 'cut', domain: 'editorial' },
      label: 'EP301 Locked Cut 2',
      by: 'editorial-coordinator',
      date: '2026-02-13',
      context: 'Lisa releases the second lock — David\'s pacing notes from the last review session are incorporated. Released to Studio Creative for leadership visibility and Studio VFX for continued timing work.',
      grants: [
        { toDomain: 'studio-creative', as: 'viewer' },
        { toDomain: 'studio-vfx', as: 'viewer' },
        { to: 'creative-david', as: 'viewer' },
      ],
    },
    // Locked Cut 3: released to Studio Post, Studio Creative, Studio VFX + direct share to audio
    {
      resource: { id: 'cut-ep301-lc-3', type: 'cut', domain: 'editorial' },
      label: 'EP301 Locked Cut 3',
      by: 'editorial-coordinator',
      date: '2026-02-18',
      context: 'Lisa releases the third lock. Audio supervisor gets a direct share for spotting. Released to Studio Post for cross-domain oversight, Studio Creative for leadership, and Studio VFX for final comp timing.',
      grants: [
        { to: 'audio-supervisor', as: 'viewer' },
        { toDomain: 'studio-post', as: 'viewer' },
        { toDomain: 'studio-creative', as: 'viewer' },
        { toDomain: 'studio-vfx', as: 'viewer' },
      ],
    },
    // Final Cut: released to Studio Production, Studio Post, Studio Creative, Studio VFX + Alex direct
    {
      resource: { id: 'cut-ep301-fc', type: 'cut', domain: 'editorial' },
      label: 'EP301 Final Cut',
      by: 'editorial-coordinator',
      date: '2026-02-28',
      context: 'Final picture and sound — all VFX final, approved for delivery. Released to Studio Production for delivery sign-off, Studio Post for oversight, and all Studio domains for visibility.',
      grants: [
        { toDomain: 'studio-production', as: 'viewer' },
        { toDomain: 'studio-post', as: 'viewer' },
        { toDomain: 'studio-creative', as: 'viewer' },
        { toDomain: 'studio-vfx', as: 'viewer' },
        { to: 'studio-alex', as: 'viewer' },
      ],
    },
    // EP302 Locked Cut 1: early stage — released to Studio VFX, shared with David
    {
      resource: { id: 'cut-ep302-lc-1', type: 'cut', domain: 'editorial' },
      label: 'EP302 Locked Cut 1',
      by: 'editorial-artist',
      date: '2026-02-20',
      context: 'Maria releases the first EP302 lock to Studio VFX. Early stage — temp sound only, no VFX yet. David gets direct share for review.',
      grants: [
        { to: 'creative-david', as: 'viewer' },
        { toDomain: 'studio-vfx', as: 'viewer' },
      ],
    },
    {
      resource: { id: 'ws-art-concept-1', type: 'asset', domain: 'art-design' },
      label: 'Hero Pose v3',
      by: 'art-artist',
      date: '2026-02-08',
      context: 'Priya shares her latest hero concept with the revised AR-24 livery design. David wants to see how the new color scheme reads at small sizes for social media. Alex needs sign-off authority before the art department sends to print production.',
      grants: [
        { to: 'studio-alex',    as: 'viewer' },
        { to: 'creative-david', as: 'viewer' },
      ],
    },
    // (Camera selects shared via collection, not per-asset — Alex and David added to Camera Selects collection instead)
    // Smart collection share: Sarah snapshots "Finals" into a curated collection for editorial
    {
      resource: { id: 'coll-smart-finals-shared', type: 'collection', domain: 'vfx' },
      label: 'Finals (shared)',
      by: 'vfx-coordinator',
      date: '2026-02-12',
      context: 'Sarah shares the Finals smart collection with editorial. The filter snapshots at share time into a fixed collection, so Maria sees the same approved finals every time instead of a live personalized smart collection.',
      grants: [
        { to: 'editorial-artist', as: 'viewer' },
      ],
    },
    // Revoked: vendor had an earlier comp share that was superseded
    {
      resource: { id: 'ws-vfx-010-030', type: 'asset', domain: 'vfx' },
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
      resource: { id: 'ws-edit-coll-dailies', type: 'collection', domain: 'editorial' },
      label: 'Dailies Review Cuts',
      by: 'editorial-coordinator',
      date: '2026-01-20',
      context: 'Lisa sets up the daily review channel for the core creative team. As Maria publishes new cuts, the team sees updates here. David and Sarah use it to stay aligned on the edit — new locks land here automatically.',
      grants: [
        { to: 'creative-david', as: 'viewer' },
        { toTeam: 'vfx-core', as: 'viewer' },
      ],
    },
    // Vendor drop v2: re-turnover after locked cut 2
    {
      resource: { id: 'coll-vfx-vendor-drop', type: 'collection', domain: 'vfx' },
      label: 'Framestore',
      by: 'vfx-coordinator',
      date: '2026-02-15',
      context: 'Sarah re-shares after locked cut 2. Three new shots added from the updated edit, one dropped (client approved alternate take).',
      allowUpload: true,
      shareMode: 'snapshot',
      version: 2,
      versionNote: 're-turnover: +3 shots from LC2, dropped SQ03_SH0020',
      grants: [
        { to: 'vendor-framestore', as: 'viewer' },
      ],
    },
    // (Stale cut shares removed — VFX timing now via cut-ep301-lc-1 share)
    // --- Camera department shares ---
    // Camera DIT shares selected takes with editorial + director
    {
      resource: { id: 'coll-cam-selects', type: 'collection', domain: 'camera' },
      label: 'Camera Selects',
      by: 'camera-dit',
      date: '2026-02-05',
      shareMode: 'live',
      context: 'Tom shares camera selects as a live collection with editorial, plus David and Alex for review. New selects appear automatically as Tom adds them.',
      grants: [
        { toTeam: 'editorial', as: 'viewer' },
        { to: 'creative-david', as: 'viewer' },
        { to: 'studio-alex', as: 'viewer' },
      ],
    },
    // Camera DIT shares lens distortion data with VFX for comp accuracy
    {
      resource: { id: 'coll-cam-lens-data', type: 'collection', domain: 'camera' },
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
      resource: { id: 'ws-cam-coll-broll', type: 'collection', domain: 'camera' },
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
      resource: { id: 'ws-audio-coll-for-editorial', type: 'collection', domain: 'audio-sound' },
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
    // Temporary cross-department access: art gets camera dailies for 2 weeks of concept work
    {
      resource: { id: 'coll-cam-dailies', type: 'collection', domain: 'camera' },
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


    // Review link: Maria shares assembly with David for review (direct link, expiring)
    {
      resource: { id: 'ws-edit-coll-dailies', type: 'collection', domain: 'editorial' },
      label: 'EP301 Assembly Review',
      by: 'editorial-artist',
      date: '2026-02-18',
      expiresAt: '2026-02-25',
      context: 'Maria sends David a review link for the EP301 assembly. He gets a focused review surface — playback, comments, ontology. No workspace, no filing. Link expires after one week.',
      reviewLinkId: 'review-ep301-assembly-david',
      grants: [
        { to: 'creative-david', as: 'viewer' },
      ],
    },
  ],

  guestLinks: [
    // External producer review link — watermarked, passcode-protected, 48h window
    {
      resource: { id: 'cut-ep301-lc-3', type: 'cut', domain: 'editorial' },
      label: 'EP301 Locked Cut 3',
      createdBy: 'editorial-coordinator',
      date: '2026-02-19',
      expiresAt: '2026-02-21',
      context: 'Lisa creates a watermarked review link for an external executive producer who needs to sign off on the latest lock before the Final Cut gets promoted. 48-hour window with passcode — no download, no resharing.',
      allowDownload: false,
      passcode: true,
    },
    // Studio marketing needs temporary asset access for campaign
    {
      resource: { id: 'ws-art-concept-1', type: 'asset', domain: 'art-design' },
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
    { id: 'ws-vfx-coll-for-editorial', name: 'EP301 VFX Pulls - Edit Review',  createdBy: 'schen@netflix.com',   assetIds: ['ws-vfx-010-010', 'ws-vfx-010-020', 'ws-vfx-020-010'], boundDomainId: 'vfx' },
    { id: 'coll-smart-finals-shared',  name: 'Finals (shared)',                createdBy: 'schen@netflix.com',   assetIds: ['ws-vfx-010-010', 'ws-vfx-010-020'], boundDomainId: 'vfx' },
    { id: 'ws-edit-coll-dailies', name: 'Dailies Review Cuts', createdBy: 'lkim@netflix.com', assetIds: ['ws-edit-cut-1', 'ws-edit-cut-2', 'ws-edit-cut-3'], boundDomainId: 'editorial' },
    // Camera collections
    { id: 'ws-cam-coll-broll', name: 'B-Roll Highlights', createdBy: 'tnakamura@netflix.com', assetIds: ['ws-cam-broll-town', 'ws-cam-broll-forest', 'ws-cam-aerial-dawn', 'ws-cam-aerial-quarry'], boundDomainId: 'camera' },
    // Audio collections
    { id: 'ws-audio-coll-for-editorial', name: 'Temp Sound Kit', createdBy: 'robi@netflix.com', assetIds: ['ws-audio-sfx-1', 'ws-audio-sfx-2', 'ws-audio-music-1', 'ws-audio-music-2', 'ws-audio-sfx-ambience'], boundDomainId: 'audio-sound' },
    // Everyday organising collections
    { id: 'coll-creature-designs',  name: 'Car Designs', createdBy: 'psharma@netflix.com', assetIds: ['ws-art-concept-demogorgon', 'ws-art-concept-creature', 'ws-art-char-eleven'], boundDomainId: 'art-design' },
    { id: 'coll-key-locations',     name: 'Key Circuits',    createdBy: 'psharma@netflix.com', assetIds: ['ws-art-concept-ud-env', 'ws-art-concept-lab', 'ws-art-env-byers', 'ws-art-env-starcourt'], boundDomainId: 'art-design' },
    { id: 'coll-hero-shots',        name: 'Hero Shots',       createdBy: 'schen@netflix.com',   assetIds: ['ws-vfx-010-010', 'ws-vfx-020-010', 'ws-vfx-comp-eleven'], boundDomainId: 'vfx' },
    // Workspace collections (folder-bound, live sync) — ongoing cross-department workflows
    { id: 'coll-cam-selects',      name: 'Camera Selects',   createdBy: 'tnakamura@netflix.com', assetIds: [], boundFolderId: 'ws-cam-selects', boundDomainId: 'camera' },
    { id: 'coll-cam-lens-data',    name: 'Lens Data',        createdBy: 'tnakamura@netflix.com', assetIds: [], boundFolderId: 'ws-cam-lensmaps', boundDomainId: 'camera' },
    // Curated collections (snapshot shares — discrete handoffs)
    { id: 'coll-cam-dailies',      name: 'Dailies (concept reference)', createdBy: 'tnakamura@netflix.com', assetIds: ['ws-cam-daily-1', 'ws-cam-daily-2', 'ws-cam-daily-3', 'ws-cam-daily-4', 'ws-cam-daily-5'], boundDomainId: 'camera' },
    { id: 'coll-vfx-vendor-drop',  name: 'Framestore',  createdBy: 'schen@netflix.com', assetIds: [], boundFolderId: 'ws-vfx-vendor-framestore', boundDomainId: 'vfx' },
  ],

  sensitiveAssetIds: ['ws-edit-cut-1', 'ws-edit-cut-2'],

  cuts: [
    // EP301 — full progression: Locked Cut 1-3 → Final Cut → EMF
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
    domainId: p.domain,
    teamIds: p.teams,
    sensitiveMediaCapability: p.sensitiveMediaCapability,
  }))
}

/** Set of asset IDs flagged as sensitive */
export const SENSITIVE_ASSET_IDS = new Set(SCENARIO.sensitiveAssetIds)

export function buildTeams(): Team[] {
  return SCENARIO.teams.map((t) => ({
    id: t.id,
    name: t.name,
    memberUserIds: t.members,
    domainId: t.domain,
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

  // Build a flat lookup of all workspace nodes across domains
  const allDomainIds: ProductionDomainId[] = Object.keys(DOMAIN_FOLDER_MAP) as ProductionDomainId[]
  const walk = (nodes: { id: string; name: string; children?: { id: string; name: string; children?: unknown[] }[] }[]) => {
    for (const node of nodes) {
      labels[node.id] = node.name
      if (node.children) walk(node.children as typeof nodes)
    }
  }
  for (const domainId of allDomainIds) {
    walk(getDomainWorkspaceFiles(domainId))
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
  // Track grants by resource+principal key for version linking
  const grantsByResourcePrincipal = new Map<string, string>()
  for (const share of SCENARIO.shares) {
    const resource = {
      id: share.resource.id,
      type: share.resource.type,
      domainId: share.resource.domain,
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
      const principal: PrincipalRef = 'to' in g
        ? { type: 'user', userId: g.to }
        : 'toTeam' in g
          ? { type: 'team', teamId: g.toTeam }
          : { type: 'domain', domainId: (g as { toDomain: string }).toDomain }
      const grant: Grant = {
        id: grantId(),
        resource,
        principal,
        templateId: g.as,
        permissions: permissionsForTemplate(g.as),
        grantedByUserId: share.by,
        grantedAt: share.date,
      }
      // Smart defaults for viewer grants: persons get +Download +Comment, domains get +Download
      if (g.as === 'viewer' && !share.allowDownload && !share.allowComment && !share.allowUpload) {
        if (principal.type === 'user' || principal.type === 'team') {
          grant.allowDownload = true
          grant.allowComment = true
          grant.permissions = [...grant.permissions, 'download', 'comment']
        } else if (principal.type === 'domain') {
          grant.allowDownload = true
          grant.permissions = [...grant.permissions, 'download']
        }
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
      if (share.allowDownload) {
        grant.allowDownload = true
        if (!grant.permissions.includes('download')) grant.permissions = [...grant.permissions, 'download']
      }
      if (share.allowComment) {
        grant.allowComment = true
        if (!grant.permissions.includes('comment')) grant.permissions = [...grant.permissions, 'comment']
      }
      if (share.allowUpload) {
        grant.allowUpload = true
        grant.allowDownload = grant.allowDownload ?? true
        if (!grant.permissions.includes('upload')) grant.permissions = [...grant.permissions, 'upload']
        if (!grant.permissions.includes('download')) grant.permissions = [...grant.permissions, 'download']
      }
      if (share.reviewLinkId) {
        grant.reviewLinkId = share.reviewLinkId
      }
      // Version tracking for turnovers
      if (share.version !== undefined) {
        grant.version = share.version
      }
      if (share.versionNote) {
        grant.versionNote = share.versionNote
      }
      // Link to previous version grant on same resource+principal
      const principalKey = principal.type === 'user'
        ? `user:${principal.userId}`
        : principal.type === 'team'
          ? `team:${principal.teamId}`
          : `domain:${principal.domainId}`
      const versionKey = `${share.resource.id}:${principalKey}`
      const previousId = grantsByResourcePrincipal.get(versionKey)
      if (previousId && share.version && share.version > 1) {
        grant.previousVersionId = previousId
      }
      grantsByResourcePrincipal.set(versionKey, grant.id)
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
  for (const policy of SCENARIO.domainAccess) {
    const folderId = DOMAIN_FOLDER_MAP[policy.domain]?.id
    if (!folderId) continue

    grants.push({
      id: grantId(),
      resource: { id: folderId, type: 'folder' as const, domainId: policy.domain },
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
  resource: { id: string; type: ResourceType; domainId?: DomainId }
  label: string
  permissions: Permission[]
  templateId?: 'link-viewer' | 'viewer'
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
    resource: { id: link.resource.id, type: link.resource.type, domainId: link.resource.domain },
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
  /** The production department this release domain maps to (for filtering own-domain releases) */
  originDepartmentId?: string
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
  cutGroupId?: string
}

export function buildCuts(): SeedCut[] {
  return SCENARIO.cuts.map(c => ({ ...c }))
}

export function buildSeedCollections(): UserCollection[] {
  return SCENARIO.collections.map((c) => ({
    flavor: 'collection' as const,
    id: c.id,
    name: c.name,
    assetIds: c.assetIds,
    createdAt: new Date('2026-02-14'),
    createdBy: c.createdBy,
    boundFolderId: c.boundFolderId,
    boundDomainId: c.boundDomainId,
  }))
}
