# Sharing & Permissions Schema

## Purpose

Next Gen needs one permission model that works the same way across:

- Media Library
- Workspaces
- Creative Review

The current prototype mixes access control, sharing state, and shared content into one flat object shape. That is good enough for early mocks, but it will not support:

- asset-level and folder/collection-level permissions
- access vs. action separation
- inheritance and ripple behavior
- expiring guest links
- explainable lineage and revocation

This document proposes a unified schema for the prototype and for future product thinking.

## Design Goals

- One framework for all surfaces, not separate rules per feature
- Explicit distinction between "can see" and "can do"
- Support direct shares, team shares, collection shares, folder inheritance, and Creative Review set shares
- Support permanent named access and temporary guest access
- Make every effective permission explainable through lineage
- Keep collections virtual and lightweight
- Keep the model prototype-friendly, but avoid painting ourselves into a corner

## Core Principles

### 1. Resources do not own embedded ACL blobs

Permissions live in grants, not inside assets, folders, or collections.

### 2. Access is resolved, not assumed

A user sees a thing because there is a path that grants visibility to it.

### 3. Access and actions are separate

Seeing an asset does not automatically mean you can download, edit, reshare, or delete it.

### 4. Inheritance is different from ripple

- Folder permissions inherit down a containment tree
- Collection permissions ripple to referenced assets
- Creative Review set permissions ripple to included items

These are similar outcomes, but different mechanics and should remain distinct in the schema.

### 5. Every permission should be explainable

For any resource, the system should be able to answer:

- Who can access it?
- Why?
- Through what path?
- Who granted it?
- When does it expire?
- What must be revoked to remove it?

### 6. Departments are isolated by default

Every department is a silo. All members browse and work freely within their department, but nothing leaks out without explicit sharing. Studio and production layers never see raw department work by default. In the prototype, they experience only assets, collections, and Creative Review sets that were explicitly shared to them.

### 7. Workflow signals are UX conventions, not hard gates

Terms like "ready for editorial", "shared to studio", or "surfaced to studio" matter to the experience, but they do not have to be enforced as hard permission transitions.

- Permissions decide who can see and do things
- Workflow signals decide how the UI frames content and what actions it suggests next
- Different teams can use strict sign-off or lightweight handoff without changing the permission model

---

## Roles & Identity

### Organizational Layers

The permission model recognizes three organizational layers plus external access. Each layer has a fundamentally different relationship with the content.

```
┌──────────────────────────────────────────────────────┐
│  STUDIO                                              │
│  Sees: explicitly shared content only                │
│  Studio Executives, Title Managers, Marketing        │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  PRODUCTION (Show-Side)                      │    │
│  │  Sees: shared cuts/assets + review notes      │    │
│  │  Directors, Showrunners                       │    │
│  │  Can explore related assets (high-level)      │    │
│  │  Not department members                       │    │
│  │                                               │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │    │
│  │  │ ART      │ │ VFX      │ │ EDIT     │ ... │    │
│  │  │          │ │          │ │          │     │    │
│  │  │ supe     │ │ supe     │ │ supe     │     │    │
│  │  │ coord    │ │ coord    │ │ coord    │     │    │
│  │  │ artists  │ │ artists  │ │ artists  │     │    │
│  │  └──────────┘ └──────────┘ └──────────┘     │    │
│  │        ▲              ▲                      │    │
│  │        └── explicit ──┘                      │    │
│  │            sharing                           │    │
│  │     (shared by department users)             │    │
│  └──────────────────────────────────────────────┘    │
│               ▲                                      │
│     ┌─────────┐                                      │
│     │ VENDOR  │  external, explicit access only      │
│     └─────────┘                                      │
└──────────────────────────────────────────────────────┘
```

### Roles

Six roles spanning all three layers plus external.

```ts
type UserRole =
  | 'studio-exec'
  | 'creative'
  | 'manager'
  | 'artist'
  | 'vendor'
```

| Role | Layer | Has department? | Description |
|------|-------|-----------------|-------------|
| `studio-exec` | Studio | No | Studio executives, title managers, marketing. Search and view content explicitly shared to them, request changes, and explore connected context they already have access to. Not a department member. |
| `creative` | Production | No | Directors, showrunners. View content through Creative Review sets or explicitly shared assets/collections, consume note summaries from Creative Review, and explore related shots/takes/angles at a high level. Not a department member. |
| `manager` | Department | Yes | Department leads and coordinators — VFX Supervisors, Art Directors, Editorial Coordinators, Post Coordinators. Full access within their department. Can edit, organize, create collections, and share outward. |
| `artist` | Department | Yes | Individual contributors — compositors, concept artists, editors, colorists, sound editors, DITs. Full browse and edit within department. Can also share outward in the prototype. |
| `vendor` | External | No | External contractors — VFX houses, post houses. No implicit access. See only resources explicitly shared to them. Upload to designated drop folders. |

### Real-World Title Mapping

Roles are archetypes, not job titles. Many job titles map to the same role.

| Job title | Role | Department |
|-----------|------|------------|
| VP Content, SVP Production | `studio-exec` | — |
| Title Manager | `studio-exec` | — |
| Marketing Manager | `studio-exec` | — |
| Director | `creative` | — |
| Showrunner | `creative` | — |
| VFX Supervisor | `manager` | vfx |
| Art Director / Production Designer | `manager` | art-design |
| Lead Editor | `manager` | editorial |
| Sound Supervisor | `manager` | audio-sound |
| Director of Photography | `manager` | camera |
| VFX Coordinator | `manager` | vfx |
| Post Coordinator | `manager` | editorial |
| Editorial Coordinator | `manager` | editorial |
| Production Coordinator | `manager` | — (cross-cutting) |
| Compositor / VFX Artist | `artist` | vfx |
| Concept Artist / Illustrator | `artist` | art-design |
| Editor / Assistant Editor | `artist` | editorial |
| Colorist | `artist` | camera |
| DIT | `artist` | camera |
| Sound Editor / Sound Mixer | `artist` | audio-sound |
| Vendor Compositor (Framestore, etc.) | `vendor` | — |
| Vendor Producer | `vendor` | — |

### Department Isolation Rules

This is the most important structural rule in the system.

1. **Within a department**: every member (`manager`, `artist`) can browse and edit all department assets freely. An artist can find their own work and their teammates' work without anyone sharing it.

2. **Between departments**: nothing crosses a department boundary without explicit sharing. A VFX artist never sees editorial cuts. An editor never sees raw VFX plates. Sharing happens through a collection, direct asset share, folder grant, or Creative Review set share created by a department user.

3. **Upward to studio/production**: executives and creatives never see raw department work by default. They see only content that has been explicitly shared to them or to a team they belong to. A draft sketch in art stays in art unless someone intentionally shares it.

   In the prototype, "surfaced" just means "explicitly shared in a way meant for that audience." It is an experience convention, not a separate security primitive.

4. **Inward from vendors**: vendors see only what has been explicitly shared to them. They upload to designated drop points. They never browse department folders. Assets they upload should remain visible only to the vendor and the receiving department until someone explicitly reshares them outward.

### Role Defaults (Implicit Grants)

Roles generate implicit grants that exist without anyone explicitly sharing. These are the baseline access every user gets just by being who they are.

| Role | Implicit grant target | Default template | Inheritance | Notes |
|------|----------------------|------------------|-------------|-------|
| `studio-exec` | — | — | — | No implicit grants. Can search and open only content explicitly shared to them, then explore connected context they already have access to. |
| `creative` | — | — | — | No department grants. Typically enters through Creative Review sets or explicitly shared assets/collections, and can explore contextual siblings from that entry point. |
| `manager` | Own department root folder | `manager` (Manager) | `inherit-full` | Full working access within department. Can create collections, share outward, and manage permissions within dept. |
| `artist` | Own department root folder | `editor` (Full edit) | `inherit-full` | Full browse/edit access within department. Prototype assumption: artists can also share outward. |
| `vendor` | — | — | — | No implicit grants. Only explicit shares and designated drop folder access. |

### Sharing Authority

The system does not enforce workflow chains. Whether an artist needs manager review before sharing outward is a team/org relationship, not a permission rule. The system allows department roles to share; orgs decide the workflow.

| Role | Create grants | Create collections | Create guest links | Share outside dept |
|------|--------------|-------------------|-------------------|-------------------|
| `studio-exec` | No | No | No | No |
| `creative` | No | No | No | No |
| `manager` | Yes | Yes | Yes | Yes |
| `artist` | Yes | Yes | Yes | Yes |
| `vendor` | No | No | No | No |

### Admin / Debug Mode

Admin is not a role. It is a separate flag on a user record (`isAdmin: boolean`). Admin users bypass the permission model entirely for debugging and system administration. In the prototype, "Admin (All Access)" in the user switcher sets this flag.

### Cross-Departmental Sharing Flows

These flows show how content moves between departments, driven by roles.

They are representative workflows, not mandatory system-enforced sequences. Some teams will want manager sign-off; others will allow any department user to route material directly.

**VFX → Editorial**

```
1. Vendor delivers shots to drop folder or       [vendor: upload grant on drop folder,
   "Vendor-to-VFX" collection                     or collection ripple to VFX team]
2. VFX team browses delivered material           [dept user: implicit dept access]
3. VFX lead reviews and says                     [workflow signal — not a permission gate]
   "This is OK to go to Editorial"
4. VFX Coord adds shots to                       [dept user: collection reference]
   "VFX-to-Editorial" collection
5. Editorial gets notification of new material   [collection ripple → editorial team grant]
   — or new additions auto-download to their
   local system
6. Editor has the files and cuts them            [dept user: implicit dept access]
   into the edit
```

**Editorial → VFX**

```
1. Director + Editor work on the MONSTER         [creative + artist: within editorial]
   SEQUENCE. They have cuts they are not
   willing to share. Other departments
   cannot see these.
2. Director is happy and says                    [workflow signal — not a permission gate]
   "Yes, give this to VFX"
3. Editor adds cut to                            [dept user: collection reference]
   "Editorial-to-VFX" collection
4. VFX gets notification or auto-download        [collection ripple → VFX team grant]
5. VFX team decides whether to add to            [dept user: creates downstream collections]
   "VFX-to-Framestore", "VFX-to-DNEG",
   or other vendor collections
```

**Sharing to Studio**

```
1. Department user shares a cut, single asset,   [dept user: creates grant]
   or collection to a studio user or studio team
2. Studio exec can now search and open only      [studio-exec: direct or ripple access]
   the content explicitly shared to them
3. Studio exec can comment/request changes and   [assigned grant permissions decide available actions]
   explore connected context they also have access to
```

### Production / Creative Experience

`creative` users are not department members and should not use the system like artists or managers.

In the prototype, they should experience Next Gen through:

- `review-set` resources
- explicitly shared assets
- explicitly shared collections
- contextual exploration from within that context

They should not:

- browse department folder trees
- search across unrestricted department silos
- see deep technical/file-management detail by default

What they should be able to do:

- open a Creative Review set, directly shared asset, or shared collection
- jump to Creative Review to leave notes and decisions
- jump between adjacent takes from the same scene
- switch between alternate camera angles and related shot coverage
- see shot context like characters in frame when that relationship data exists
- see a high-level library view with enough context to make decisions

They should only see extra context when that connected asset is already accessible through another valid access path.

`studio-exec` users are similar consumers. They can search across what has been explicitly shared to them and use the same contextual exploration rules, but they do not become department users or raw folder browsers.

Creative Review owns notes and playlist-like review sets. Next Gen consumes note summaries and deep links on relevant assets or collections, and can reference a Creative Review set as shared context without owning its workflow lifecycle.

### Users (Demo Data)

```ts
type User = {
  id: string
  email: string
  name: string
  role: UserRole
  title: string                     // display title (job title, not role)
  teamIds: string[]
  departmentId?: DepartmentId       // null for studio-exec, creative, vendor
  isAdmin?: boolean                 // debug/system bypass
}
```

| id | name | email | role | title | dept | teams |
|----|------|-------|------|-------|------|-------|
| `schen` | Sarah Chen | schen@netflix.com | manager | VFX Coordinator | vfx | vfx-core, dailies-review |
| `mtorres` | Mike Torres | mtorres@netflix.com | manager | VFX Supervisor | vfx | vfx-core |
| `dpark` | David Park | dpark@netflix.com | creative | Director | — | dailies-review |
| `msantos` | Maria Santos | msantos@netflix.com | artist | Editor | editorial | editorial |
| `lkim` | Lisa Kim | lkim@netflix.com | manager | Editorial Coordinator | editorial | editorial, dailies-review |
| `psharma` | Priya Sharma | psharma@netflix.com | artist | Concept Artist | art-design | art-design |
| `arivera` | Alex Rivera | arivera@netflix.com | studio-exec | VP Content | — | — |
| `jliu` | James Liu | jliu@framestore.com | vendor | Lead Compositor | — | framestore-la |

### Teams (Demo Data)

```ts
type Team = {
  id: string
  name: string
  departmentId?: DepartmentId
  memberUserIds: string[]
}
```

| id | name | dept | members |
|----|------|------|---------|
| `vfx-core` | VFX Core | vfx | schen, mtorres |
| `editorial` | Editorial | editorial | msantos, lkim |
| `art-design` | Art & Design | art-design | psharma |
| `framestore-la` | Framestore LA | — | jliu |
| `dailies-review` | Dailies Review | — | schen, dpark, lkim |

---

## Unified Model

### Surfaces

```ts
type Surface = 'media-library' | 'workspace' | 'creative-review'
```

Surfaces are presentation contexts, not separate permission systems.

### Resources

```ts
type ResourceType =
  | 'asset'
  | 'folder'
  | 'collection'
  | 'review-set'
```

```ts
type ResourceRef = {
  id: string
  type: ResourceType
  surface?: Surface
  departmentId?: DepartmentId
}
```

`review-set` is a thin reference to a playlist-like object owned by Creative Review. Next Gen can share and resolve access through it, but does not own note authoring, review state, or review lifecycle.

```ts
type CreativeReviewSet = {
  id: string
  name: string
  kind: 'playlist' | 'review-set'
  externalUrl: string
  itemRefs: ResourceRef[]
  experience?: ExperienceModel
}

type ReviewNoteSummary = {
  target: ResourceRef
  externalUrl: string
  hasNotes: boolean
  noteCount?: number
  latestActivityAt?: string
}
```

### Prototype Experience Signals

These fields are intentionally not part of access resolution. They exist so the prototype can model the right UI flows without turning every workflow preference into a security rule.

```ts
type AudienceLayer = 'department' | 'production' | 'studio' | 'external'

type ExplorationHint =
  | 'adjacent-takes'
  | 'same-scene'
  | 'alternate-angle'
  | 'same-collection'
  | 'related-character'

type ExperienceModel = {
  audienceLayer: AudienceLayer
  detailLevel: 'high-level' | 'full'
  explorationHints?: ExplorationHint[]
  noteSurfacePolicy?: 'external-link-only' | 'library-summary'
}
```

Examples:

- A Creative Review set might use `audienceLayer: 'production'`, `detailLevel: 'high-level'`, `explorationHints: ['adjacent-takes', 'alternate-angle']`
- A studio share might use `audienceLayer: 'studio'`, `detailLevel: 'high-level'`, `explorationHints: ['same-scene', 'alternate-angle']`
- A department working collection might use `audienceLayer: 'department'`, `detailLevel: 'full'`

### Principals

```ts
type PrincipalType = 'user' | 'team' | 'link'
```

```ts
type PrincipalRef =
  | { type: 'user'; userId: string }
  | { type: 'team'; teamId: string }
  | { type: 'link'; linkId: string }
```

```ts
type NamedPrincipalRef =
  | { type: 'user'; userId: string }
  | { type: 'team'; teamId: string }
```

Notes:

- `user` and `team` are named principals with durable access
- `link` is an anonymous or guest principal with temporary token-based access
- External users without accounts should usually use `link`, not fake user records

## Permissions

### Canonical Permission Set

Permissions are the source of truth.

They answer both:

- can this principal see and open the resource?
- what can this principal do once they have access?

```ts
type Permission =
  | 'open'       // View — can see and open the resource
  | 'download'   // Save — can download/export
  | 'write'      // Edit — can modify content
  | 'delete'     // Delete — can remove
  | 'comment'    // Note — can add comments/notes
  | 'share'      // Share — can share with others
  | 'edit-acl'   // Admin — can change access settings
```

Notes:

- `discover` was merged into `open` — in practice they were always granted together and the distinction added complexity without value
- `write` intentionally stays broad in the prototype. It covers edits that change the resource or its working content without forcing us to model every sub-action yet
- `edit-acl` means changing who has access to the resource
- `approve` is intentionally not part of the permission model. Decision-making lives in Creative Review workflow tooling, not in ACLs

Examples:

- Internal team share: `open`, `comment`
- Guest Creative Review link: `open`, optional `comment`
- Department folder grant: `open`, `write`, `share`

### Permission Templates

Templates are reusable presets for the UI.

They are not the source of truth for access resolution. They exist so the prototype can offer familiar assignments like "Viewer" or "Editor" in settings, while still allowing a grant to be customized.

```ts
type PermissionTemplateId =
  | 'manager'
  | 'editor'
  | 'contributor'
  | 'commenter'
  | 'viewer'
  | 'link-viewer'
```

```ts
type PermissionTemplate = {
  id: PermissionTemplateId
  label: string
  permissions: Permission[]
}
```

Recommended template semantics:

| Template | Display Name | Typical permissions | Intended use |
|----------|-------------|---------------------|--------------|
| `manager` | Manager | `open`, `download`, `write`, `delete`, `comment`, `share`, `edit-acl` | Department owners/managers and high-trust internal admins on a resource |
| `editor` | Can edit & share | `open`, `download`, `write`, `comment`, `share` | Day-to-day collaborators who can modify and reshare |
| `contributor` | Can edit | `open`, `write` | Working contributors with edit rights but no sharing/admin rights |
| `commenter` | Can comment | `open`, `comment` | Review participants who should discuss but not modify |
| `viewer` | View only | `open`, optional `download` | Read-only access for internal users and teams |
| `link-viewer` | View only | `open`, optional `download` | External/guest direct-open access |

### Hybrid Rule

The model should support both preset assignment and custom permission sets:

- the grant stores the actual `permissions`
- `templateId` is optional metadata that says which preset the UI started from
- if someone customizes a preset, we keep the customized `permissions` on the grant instead of re-resolving from the template later

That keeps the prototype lean for sharing dialogs, but flexible enough for a richer permissions settings view.

## Canonical Data Model

### 1. Resource Relationships

This is the graph that access can travel through.

```ts
type ResourceEdgeType =
  | 'contains'        // folder -> folder or folder -> asset
  | 'references'      // collection -> asset
  | 'review-set-item' // review-set -> asset / collection
```

```ts
type ResourceEdge = {
  id: string
  from: ResourceRef
  to: ResourceRef
  type: ResourceEdgeType
  createdAt: string
}
```

Rules:

- Folder inheritance follows `contains`
- Collection ripple follows `references`
- Creative Review set ripple follows `review-set-item`

### 1b. Context Relationships

These relationships support high-level exploration after something is already visible.

```ts
type ContextRelationshipType =
  | 'adjacent-take'
  | 'same-scene'
  | 'alternate-angle'
  | 'related-character'

type ContextRelationship = {
  id: string
  fromAssetId: string
  toAssetId: string
  type: ContextRelationshipType
  createdAt: string
}
```

Rules:

- Context relationships never grant access by themselves
- They help the UI surface connected options from a directly shared asset, collection item, or review-set item
- The UI should only open related assets if the user already has access through a grant, inheritance path, or ripple path
- If a related asset is not accessible, the UI can still show lightweight metadata such as "3 alternate angles available"

### 2. Named Grants

Named grants are the durable source of truth for internal sharing.

```ts
type GrantMode = 'permanent' | 'expires-at'
```

```ts
type Grant = {
  id: string
  resource: ResourceRef
  principal: NamedPrincipalRef
  permissions: Permission[]
  templateId?: PermissionTemplateId
  mode: GrantMode
  expiresAt?: string
  grantedByUserId: string
  grantedAt: string
  revokedAt?: string
  revokedByUserId?: string
  inheritancePolicy?: InheritancePolicy
  ripplePolicy?: RipplePolicy
}
```

### 3. Guest Links

Guest/external access is modeled separately from named grants.

```ts
type LinkShare = {
  id: string
  resource: ResourceRef
  permissions: Permission[]
  templateId?: 'link-viewer' | 'commenter'
  tokenHash: string
  expiresAt: string
  grantedByUserId: string
  grantedAt: string
  revokedAt?: string
  revokedByUserId?: string
  passcodeHash?: string
  maxViews?: number
  maxUses?: number
  allowDownload?: boolean
}
```

Rules:

- Links should be temporary by default
- Links should be scoped to specific resources, not broad browse access
- Links should usually be scoped to a collection, review-set, or single asset
- Permanent access should use named grants, not never-expiring links

### 4. Audit Events

Lineage needs an append-only event log.

```ts
type ShareEventType =
  | 'grant-created'
  | 'grant-updated'
  | 'grant-revoked'
  | 'link-created'
  | 'link-revoked'
  | 'resource-added-to-collection'
  | 'resource-removed-from-collection'
```

```ts
type ShareEvent = {
  id: string
  type: ShareEventType
  actorUserId: string
  resource?: ResourceRef
  grantId?: string
  linkId?: string
  relatedResourceId?: string
  createdAt: string
  metadata?: Record<string, string | number | boolean | null>
}
```

This is how we answer:

- "Who shared this?"
- "When?"
- "What path gave Editorial access to this shot?"
- "What changed when the collection membership changed?"

### 5. Computed Lineage View

Events tell us what happened. Lineage tells us why access exists right now.

```ts
type ShareLineage = {
  principal: PrincipalRef
  resource: ResourceRef
  rootGrantId?: string
  rootLinkId?: string
  path: Array<
    | { kind: 'grant'; grantId: string; resource: ResourceRef; permissions: Permission[]; templateId?: PermissionTemplateId }
    | { kind: 'edge'; edgeType: ResourceEdgeType; from: ResourceRef; to: ResourceRef }
  >
  effectivePermissions: Permission[]
  expiresAt?: string
}
```

This is the shape we should be able to query for screens like:

- "Why can this user see this asset?"
- "Show everyone who got access through this collection"
- "If I revoke this collection share, what downstream access disappears?"

## Inheritance and Ripple Semantics

### Folder Inheritance

Folder access should inherit down the containment tree.

```ts
type InheritancePolicy = 'inherit-full' | 'inherit-readonly' | 'no-inherit'
```

Recommended behavior:

- Default folder shares: `inherit-full`
- Sensitive subfolders can break inheritance with `no-inherit`
- Inherited folder access can grant asset visibility and workspace actions

Example:

- Grant "Can edit & share" on folder `ws-vfx-shots` to team `vfx-core`
- All descendant folders/assets are visible and editable unless a boundary breaks inheritance

### Collection Ripple

Collection access should ripple to referenced assets, but not become full workspace access.

```ts
type RipplePolicy =
  | 'visibility-only'
  | 'read-only'
  | 'comment-only'
  | 'custom'
```

Recommended behavior:

- Default collection share: `read-only`
- Collection ripple grants access to the assets in that collection
- Collection ripple does not grant parent folder browsing
- Collection ripple does not grant destructive asset actions by default

Example:

- Editorial gets "View only" on `VFX-to-Editorial`
- Editorial can open the shots in that collection
- Editorial does not gain general access to the `ws-vfx-shots` folder

### Creative Review Set Ripple

Creative Review set access is specialized.

- A Creative Review set share should ripple to included items
- Creative Review set shares usually emphasize `open`, `comment`, and optionally `download`
- It should not imply general edit or workspace upload rights

## Access Resolution

Effective access is computed from all active paths.

### Resolution Order

1. Direct named grants on the resource
2. Team grants on the resource
3. Inherited folder grants through ancestor `contains` edges
4. Collection ripple through `references` edges
5. Creative Review set ripple through `review-set-item` edges
6. Active guest link grants, only when a valid token is presented

### Merge Rules

- `open` is additive across paths
- Action permissions are additive, but constrained by path type
- The most permissive valid path wins for visibility-related permissions
- Destructive/admin actions should only come from direct or inherited folder/resource grants
- Collection and Creative Review set ripple should never silently grant ownership-like powers
- `ExperienceModel` does not grant access by itself; it only shapes presentation and UX behavior once access exists

### Explainability

The system should be able to produce an access path like:

```ts
type AccessPath = {
  principal: PrincipalRef
  resource: ResourceRef
  source: 'direct-grant' | 'folder-inheritance' | 'collection-ripple' | 'review-set-ripple' | 'guest-link'
  grantId?: string
  linkId?: string
  viaResources: ResourceRef[]
  permissions: Permission[]
  templateId?: PermissionTemplateId
  expiresAt?: string
}
```

Example explanation:

"Maria Santos can open `shot-010-020` because team `editorial` has "View only" access to collection `VFX-to-Editorial`, and that collection references this asset."

## Sharing Mechanics

### Permanent Access

Use named grants for:

- internal users
- internal teams
- long-lived cross-functional access

Examples:

- VFX Core gets "Can edit & share" on a folder
- Editorial gets "View only" on a collection
- Creative leads get "Can comment" on a review set

### Expiring Named Access

Use named grants with `expiresAt` for:

- temporary contractor access
- short-lived Creative Review windows
- short-lived cross-department access

Example:

- Vendor team gets "Can edit" on `ws-vfx-vendor-drop` until Friday

### Guest / External Access

Use guest links for:

- people without accounts
- temporary review sessions
- one-off review access

Recommended constraints:

- expires by default
- direct-open only, not discoverable
- optional passcode
- optional max uses
- optional watermark/download restriction

## Direct Share vs. Share via Collection

### Direct Share to User or Team

Best when:

- the target needs durable access
- the resource itself is the thing being shared
- you want clear ownership and explicit audit

Example:

- Share cut `monster-sequence-v12` directly to the director
- Share folder `ws-camera-selects` directly to the dailies review team

### Share via Collection

Best when:

- the target should see a curated subset
- the source assets live across folders or departments
- you want to revoke by removing access to the collection or removing an asset from it

Example:

- Share `VFX-to-Editorial` instead of the whole VFX shots folder

### Key Rule

Collections should grant access to their members, but not silently change the underlying folder ACL.

## Revocation Model

Revocation must work at the source of access.

### Revoke a direct grant

Effect:

- Removes that principal's direct access
- Does not affect unrelated access paths

### Revoke a collection share

Effect:

- Removes access that comes through the collection
- Does not affect direct asset shares or folder inheritance

### Remove asset from collection

Effect:

- Removes access that depended on that collection membership
- Leaves the collection itself intact

### Revoke a guest link

Effect:

- Immediately invalidates token-based access
- Does not affect named users or teams

## Recommended Product Rules

### Rule 1: Separate durable access from temporary access

- Durable access = named grant
- Temporary guest access = link

### Rule 2: Separate ownership from sharing

In the prototype, department users may share outward even if they are not owners. Broad grant administration and revocation should still remain manager/owner behavior.

### Rule 3: Keep collection shares safe by default

Collection shares should default to read-only ripple, not edit ripple.

### Rule 4: Never use "null user = admin" in the long-term model

Admin/debug mode should be explicit, not a side effect of missing identity.

### Rule 5: Support both team shares and direct shares

Teams are useful for shared destinations, but the model should also treat direct user-to-user and direct asset shares as first-class.

### Rule 6: Keep the prototype additive

The prototype should use additive access only. We do not need explicit deny rules or embargo logic yet.

## Suggested TypeScript Shapes

Identity shapes are defined in the Roles & Identity section above. Summary:

```ts
type UserRole = 'studio-exec' | 'creative' | 'manager' | 'artist' | 'vendor'

type User = {
  id: string
  email: string
  name: string
  role: UserRole
  title: string
  teamIds: string[]
  departmentId?: DepartmentId
  isAdmin?: boolean
}

type Team = {
  id: string
  name: string
  memberUserIds: string[]
  departmentId?: DepartmentId
}
```

```ts
type Collection = {
  id: string
  name: string
  kind: 'curated' | 'smart'
  createdByUserId: string
  departmentId?: DepartmentId
  createdAt: string
  assetIds?: string[]
  filter?: AssetFilter
  experience?: ExperienceModel
}
```

```ts
type CreativeReviewSet = {
  id: string
  name: string
  kind: 'playlist' | 'review-set'
  externalUrl: string
  itemRefs: ResourceRef[]
  experience?: ExperienceModel
}

type ReviewNoteSummary = {
  target: ResourceRef
  externalUrl: string
  hasNotes: boolean
  noteCount?: number
  latestActivityAt?: string
}
```

## How This Improves the Current Prototype

This schema intentionally fixes the biggest issues in the current model:

- no more single `AccessEntry` trying to be ACL + share + content payload
- no more confusion between direct access and collection-derived visibility
- no more treating links like normal users
- no more conflating "can see" with "can edit"
- cleaner Creative Review integration boundary instead of pretending Next Gen owns review workflow
- clearer path to explainable revocation and audit

## Open Questions

- Should collection ripple allow `download` by default, or should that be opt-in?
- What note summary fields from Creative Review should Next Gen surface by default?
- How much of `adjacent-take`, `alternate-angle`, `same-scene`, and `related-character` should be modeled as first-class relationship data in the prototype vs. derived metadata?
