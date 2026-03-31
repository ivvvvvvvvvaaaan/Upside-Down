---
title: "feat: Permission Management UI"
type: feat
status: completed
date: 2026-03-31
origin: docs/brainstorms/2026-03-31-permission-management-brainstorm.md
deepened: 2026-03-31
---

# Permission Management UI

## Enhancement Summary

**Deepened on:** 2026-03-31
**Agents used:** architecture-strategist, code-simplicity-reviewer, spec-flow-analyzer, best-practices-researcher (x2), repo-research-analyst, learnings-researcher

### Key Improvements from Deepening
1. Collapsed 4 phases to 2 — removes unnecessary ceremony for a prototype
2. Made parent map reactive (useMemo, not module-scope) — fixes staleness with mutable file tree
3. Added collection-ripple display for assets — separate from folder inheritance per SHARING_SCHEMA
4. Dropped `disabled` prop — use `readOnly` with a hint message instead
5. Kept inheritance as display-only — don't modify `canAccess`/`filterByAccess` hot paths
6. **Adopted Iconik two-system model** — Teams control access scope, Role Groups control capabilities
7. **Configurable collection ripple** — sharer chooses view-only / match-grant / custom per share

### Critical Issues Found and Resolved
- `NODE_TO_PARENT` at module scope would be stale when users create folders (architecture reviewer)
- `getInheritedGrants` only covers folders, not collection ripple (spec flow analyzer)
- `findNodeById` helper referenced but doesn't exist (spec flow analyzer)
- `userHasAccess` code snippet had wrong parameter order (spec flow analyzer)

## Overview

Add inline permission editing to workspace folders, collections, and individual assets. Users can add people/teams via a search dropdown, assign role groups, and remove access — all from existing side panels. Folder grants inherit down the tree. Collection grants ripple with configurable policy.

### Two-System Model (from Iconik comparison)

The permission model separates into two orthogonal axes:

**Teams = access scope (what content you see)**
- A team grant on a folder/collection/asset gives all team members visibility
- Team membership is the primary way access flows through the system

**Role Groups = capabilities (what actions you can take)**
- A role group is a named set of permissions (our existing 7: open, download, write, delete, comment, share, edit-acl)
- Assigned per-grant: "Editorial team gets Viewer role group on this folder"
- Existing templates (viewer, editor, contributor, commenter) become role groups

A grant is: `{ principal (user/team), resource, roleGroupId }` — this is what we already have. The conceptual shift is recognizing that teams and role groups serve different purposes and should be managed independently in the UI.

## Problem Statement

The prototype shows access information in side panels but has no way to actually edit permissions at the resource level. AccessPanel exists with grant CRUD but is only wired in SharedSidePanel. WorkspaceSidePanel shows static scenario data. CollectionSidePanel has dead buttons. AssetDetailPanel has no access section. This makes it impossible to demonstrate core sharing workflows.

(See brainstorm: `docs/brainstorms/2026-03-31-permission-management-brainstorm.md`)

## Implementation Phases

### Phase A: Data Layer + AccessPanel Enhancements

#### A1. Reorder providers (required first)

**File: `src/app/nextgen/layout.tsx`**

Move `FileTreeProvider` above `AccessProvider` so the access hook can consume the live tree:

```
PersonaProvider > UserCollectionsProvider > FileTreeProvider > AccessProvider > SmartCollectionsProvider
```

- [x] Reorder providers in layout.tsx
- [x] Verify no existing code relies on old order (grep for useFileTree inside AccessProvider consumers)

#### A2. Reactive parent map inside AccessProvider

**File: `src/hooks/useAccess.tsx`**

Replace module-scope `NODE_TO_DEPARTMENT` IIFE with `useMemo` inside `AccessProvider`. Add `NODE_TO_PARENT` as a second `useMemo`. Both derive from the live `useFileTree().tree`.

```ts
const { tree: fileTree } = useFileTree()

const { nodeToDepartment, nodeToParent } = useMemo(() => {
  const deptMap = new Map<string, DepartmentId>()
  const parentMap = new Map<string, string>()
  for (const dept of ALL_DEPARTMENTS) {
    const walk = (nodes: WorkspaceFileNode[], parentId?: string) => {
      for (const node of nodes) {
        deptMap.set(node.id, dept)
        if (parentId) parentMap.set(node.id, parentId)
        if (node.children) walk(node.children, node.id)
      }
    }
    walk(getDepartmentWorkspaceFiles(dept))
    // Also walk the live tree for user-created folders
    const deptRoot = fileTree.find(n => n.id === DEPARTMENT_WRAPPER_IDS[dept])
    if (deptRoot?.children) walk(deptRoot.children, deptRoot.id)
  }
  return { nodeToDepartment: deptMap, nodeToParent: parentMap }
}, [fileTree])
```

- [x] Import `useFileTree` in AccessProvider
- [x] Replace module-scope `NODE_TO_DEPARTMENT` with reactive `nodeToDepartment`
- [x] Add reactive `nodeToParent`
- [x] Update all references to use the new maps

#### A3. Inherited grants resolution (display only)

**File: `src/hooks/useAccess.tsx`**

Add `getInheritedGrants(resourceId)` — walks parent chain, collects ancestor grants. Does NOT modify `canAccess` or `filterByAccess` (those hot paths stay unchanged).

```ts
const getInheritedGrants = useCallback((resourceId: string): { grant: Grant; fromResourceId: string; fromResourceName: string }[] => {
  const inherited: { grant: Grant; fromResourceId: string; fromResourceName: string }[] = []
  let parentId = nodeToParent.get(resourceId)
  while (parentId) {
    const parentGrants = grants.filter(g => g.resource.id === parentId && !g.revokedAt)
    if (parentGrants.length > 0) {
      const name = findNodeInTree(fileTree, parentId)?.name ?? parentId
      for (const g of parentGrants) {
        inherited.push({ grant: g, fromResourceId: parentId, fromResourceName: name })
      }
    }
    parentId = nodeToParent.get(parentId)
  }
  return inherited
}, [nodeToParent, grants, fileTree])
```

Also add `findNodeInTree` utility to `src/lib/workspace-data.ts`:

```ts
export function findNodeInTree(nodes: WorkspaceFileNode[], id: string): WorkspaceFileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}
```

- [x] Add `findNodeInTree` to workspace-data.ts
- [x] Add `getInheritedGrants` to AccessProvider
- [x] Expose in context value

#### A4. Collection ripple grants for display

**File: `src/hooks/useAccess.tsx`**

Add `getCollectionRippleGrants(assetId)` — returns grants that reach an asset through collection membership, with the collection name as source label:

```ts
const getCollectionRippleGrants = useCallback((assetId: string): { grant: Grant; fromResourceId: string; fromResourceName: string }[] => {
  const rippled: { grant: Grant; fromResourceId: string; fromResourceName: string }[] = []
  for (const collection of collections) {
    if (!collection.assetIds.includes(assetId)) continue
    const collGrants = grants.filter(g => g.resource.id === collection.id && !g.revokedAt)
    for (const g of collGrants) {
      rippled.push({ grant: g, fromResourceId: collection.id, fromResourceName: collection.name })
    }
  }
  return rippled
}, [collections, grants])
```

- [x] Add `getCollectionRippleGrants` to AccessProvider
- [x] Expose in context value

#### A5. Configurable collection ripple

**Files: `src/lib/grants.ts`, `src/hooks/useAccess.tsx`**

Add `RipplePolicy` to the Grant type and enforce it in `collectionAssetAccessById`:

```ts
// grants.ts
export type RipplePolicy = 'view-only' | 'match-grant' | 'custom'

// On Grant type, add optional field:
ripplePolicy?: RipplePolicy
ripplePermissions?: Permission[]  // only used when ripplePolicy === 'custom'
```

In `collectionAssetAccessById`, apply the ripple policy:

```ts
const VIEW_ONLY_CAP: Permission[] = ['open', 'download']

// For each collection grant:
const policy = grant.ripplePolicy ?? 'view-only'  // default to view-only
const rippled = policy === 'view-only'
  ? collectionPerms.filter(p => VIEW_ONLY_CAP.includes(p))
  : policy === 'match-grant'
  ? collectionPerms
  : (grant.ripplePermissions ?? VIEW_ONLY_CAP)
```

In the UI (CollectionSidePanel), when sharing a collection, show a ripple policy picker below the role dropdown:

```
[Viewer ▾]  [View only ▾]
             View only — can see and download
             Match role — same permissions as above
             Custom — pick specific permissions
```

- [x] Add `RipplePolicy` type to grants.ts
- [x] Add `ripplePolicy` + `ripplePermissions` to Grant type
- [x] Apply policy in `collectionAssetAccessById`
- [x] Default to `view-only` for backwards compatibility
- [x] Add ripple policy picker to AccessPanel when `resourceRef.type === 'collection'`

#### A6. canShare guard

**File: `src/hooks/useAccess.tsx`**

```ts
const canShare = useCallback((): boolean => {
  if (!activePersona) return false
  return activePersona.role === 'manager' || activePersona.role === 'artist'
}, [activePersona])
```

Guard `createGrant`, `revokeGrant`, `updateGrantProfile` — reject if `!canShare()`.

- [x] Add `canShare` to context
- [x] Guard mutation functions

#### A7. Search dropdown in AccessPanel

**File: `src/components/ui/access-panel.tsx`**

Replace the email input with a filtered dropdown that searches both PERSONAS and TEAMS:

- Text input triggers filtering on change
- Results in absolutely-positioned list (same pattern as `PermissionDropdown` in access-panel.tsx lines 73-99)
- People: show initials avatar + name + email
- Teams: show Users icon + name + member count
- People shown first, then teams, each alphabetical
- Click to add with default `viewer` role (user changes via existing dropdown after)
- Deduplicate: skip if same principal already has a direct grant on this resource
- No keyboard navigation (YAGNI for prototype with 13 searchable items)

```tsx
const [query, setQuery] = useState('')
const [showDropdown, setShowDropdown] = useState(false)

const results = useMemo(() => {
  if (!query.trim()) return { people: [], teams: [] }
  const q = query.toLowerCase()
  const people = PERSONAS.filter(p =>
    p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
  ).slice(0, 5)
  const teams = TEAMS.filter(t =>
    t.name.toLowerCase().includes(q)
  ).slice(0, 3)
  return { people, teams }
}, [query])
```

- [x] Replace email input with search input + dropdown
- [x] Filter PERSONAS by name/email
- [x] Filter TEAMS by name
- [x] Show people with initials, teams with Users icon
- [x] Click to add (default viewer)
- [x] Deduplicate against existing direct grants
- [x] Close dropdown on add or click-outside

#### A8. Inherited grants display in AccessPanel

**File: `src/components/ui/access-panel.tsx`**

Add `inheritedGrants` prop. Render read-only section below direct grants:

```tsx
interface AccessPanelProps {
  resourceId: string
  resourceRef?: ResourceRef
  readOnly?: boolean
  emptyLabel?: string
  inheritedGrants?: { grant: Grant; fromResourceName: string }[]  // NEW
}
```

Inherited entries: static role label (no dropdown), no remove button, dimmed text. Grouped by source with "Inherited from [name]" subheading.

For unauthorized roles, show `readOnly` with hint text "You don't have permission to manage access" above the list.

- [x] Add `inheritedGrants` prop
- [x] Render "Inherited from [name]" section with read-only entries
- [x] Inherited entries: dimmed, static label, no actions

#### A9. Seed folder-level grants

**File: `src/lib/scenario.ts`**

```ts
{
  resource: { id: 'ws-vfx-shots', type: 'folder', dept: 'vfx' },
  label: 'VFX Shots',
  by: 'vfx-coordinator',
  date: '2026-01-15',
  grants: [{ toTeam: 'editorial', as: 'viewer' }],
},
{
  resource: { id: 'ws-editorial-cuts', type: 'folder', dept: 'editorial' },
  label: 'Editorial Cuts',
  by: 'editorial-coordinator',
  date: '2026-01-20',
  grants: [{ toTeam: 'dailies-review', as: 'commenter' }],
},
```

- [x] Add 2 folder grants to scenario shares

### Phase B: Wire AccessPanel into All Panels

#### B1. WorkspaceSidePanel

**File: `src/components/department/WorkspaceSidePanel.tsx`**

- Remove static `departmentTeams` section, `SCENARIO` import, `getTeamById` import
- Import `useAccess`, `AccessPanel`
- Construct `resourceRef: { id: node.id, type: node.type === 'folder' ? 'folder' : 'asset', departmentId }`
- Compute inherited grants: `getInheritedGrants(node.id)`
- Pass `readOnly={!canShare()}` for unauthorized roles

- [x] Remove static team section
- [x] Embed AccessPanel with resourceRef + inheritedGrants
- [x] Pass readOnly based on canShare

#### B2. CollectionSidePanel

**File: `src/components/ui/collection-side-panel.tsx`**

- Replace Members section + dead "Manage members" button with `AccessPanel`
- Remove "Share Collection" button (AccessPanel's input replaces it)
- Remove `onShare` prop (dead after button removal)
- Construct `resourceRef: { id: collection.id, type: 'collection' }`
- Pass `readOnly={!canShare()}`

- [x] Replace Members section with AccessPanel
- [x] Remove Share button + onShare prop
- [x] Remove Manage members button

#### B3. AssetDetailPanel

**File: `src/components/ui/asset-detail-panel.tsx`**

- Add Access section after "Appears in"
- Construct `resourceRef: { id: asset.id, type: 'asset', departmentId: asset.department }`
- Inherited grants: combine `getInheritedGrants(asset.id)` (folder ancestry) + `getCollectionRippleGrants(asset.id)` (collection ripple)
- Pass `readOnly={!canShare()}`

- [x] Import useAccess, AccessPanel
- [x] Construct resourceRef
- [x] Compute combined inherited grants (folder + collection)
- [x] Add Access section

#### B4. Acceptance testing

- [x] Scenario 1: VFX coordinator shares folder with Editorial team — grant appears, child items show inherited
- [x] Scenario 2: User shares collection with a person — grant appears, assets ripple read-only
- [x] Scenario 3: User shares asset with studio exec — grant appears, exec sees it in inbox
- [x] Switch to vendor persona — controls are read-only
- [x] Grants persist across page reload
- [x] `npx tsc --noEmit` passes

## Technical Considerations

### Performance
- Parent map is `useMemo` — recomputed only when file tree changes (rare)
- `getInheritedGrants` filters grants per ancestor — negligible at prototype scale (~50 nodes, ~30 grants)
- Search dropdown filters 8 people + 5 teams — instant
- Inheritance is display-only — `canAccess`/`filterByAccess` hot paths unchanged

### Architecture
- Provider order: `FileTreeProvider` must wrap `AccessProvider` (mutable tree consumed reactively)
- Folder inheritance and collection ripple are separate APIs per SHARING_SCHEMA principle #4
- AccessPanel gets additive optional props — backwards compatible
- `canShare` enforces role-based sharing authority per SHARING_SCHEMA

### Known Gaps (deferred)
- `no-inherit` flag for breaking folder inheritance on sensitive subfolders
- `InheritancePolicy` / `RipplePolicy` on Grant type
- Guest link sharing (`LinkShare`)
- Expiring grants (`expiresAt`)
- Audit events (`ShareEvent`)

## Sources & References

### Origin
- **Brainstorm:** [docs/brainstorms/2026-03-31-permission-management-brainstorm.md](docs/brainstorms/2026-03-31-permission-management-brainstorm.md)
- Key decisions: inline side panel, users + teams, folder inheritance, grouped direct/inherited, read-only ripple

### Internal References
- AccessPanel: `src/components/ui/access-panel.tsx`
- useAccess: `src/hooks/useAccess.tsx`
- grants.ts: `src/lib/grants.ts`
- scenario.ts: `src/lib/scenario.ts`
- Settings Modal team-add pattern: `src/components/ui/settings-modal.tsx`
- workspace-data.ts: `src/lib/workspace-data.ts`
- SHARING_SCHEMA.md

### Review Findings Applied
- Architecture: reactive parent map, provider reordering (architecture-strategist)
- Simplicity: 2 phases not 4, no `disabled` prop, no keyboard nav, display-only inheritance (code-simplicity-reviewer)
- Spec flow: collection ripple display, findNodeInTree utility, role selection after add (spec-flow-analyzer)
- Learnings: email validation already fixed (#037), NODE_TO_DEPARTMENT pattern reused (#047)
