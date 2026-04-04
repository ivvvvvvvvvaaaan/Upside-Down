# Sharing & Access System Overhaul

## Context

The sharing system has the foundation (grants, permissions, ripple policies, guest links) but the UX doesn't surface it well. The Shared page only shows "My Shares" for users. There's no Share button in collection toolbars. The share modal doesn't offer resource-type-specific options like watermarking for cuts or upload permissions for folders.

**Goal**: Make sharing a first-class, consistent experience across all surface areas — with proper options per resource type and a Shared page that shows the full picture.

---

## Phase 0: Pre-work — Fix Existing Bugs & Clean Up ✅ COMPLETE

Before building new features, fix the security and correctness issues found during review.

### 0a. Enforce grant expiration

**File**: `src/lib/grants.ts`

`resolveMatchingGrants` (line 184) filters on `!grant.revokedAt` but never checks `expiresAt`. Expired grants remain active forever. Add expiration check:

```ts
const now = new Date().toISOString().slice(0, 10)
const activeGrants = grants.filter(
  g => g.resource.id === resourceId && !g.revokedAt && (!g.expiresAt || g.expiresAt > now)
)
```

Apply the same check in `getResourceGrants`, `getGrantsByGrantor`, `getGrantsForUser`, `getAllActiveGrants`.

### 0b. Fix per-grant editability mismatch

**File**: `src/hooks/useAccess.tsx`

`revokeGrant` and `updateGrantProfile` gate on `canEditAcl` only. But the UI (`access-panel.tsx` line 157) allows `share` users to manage grants they created via `grantedByUserId` check. The data layer must match:

- Allow if `canEditAcl` (can manage all grants)
- OR if user has `share` AND `grant.grantedByUserId === activePersona.id` (can manage own grants)

### 0c. Add guest link authorization checks

**File**: `src/hooks/useAccess.tsx`

- `createGuestLink`: add `canShareFn(resource)` check before creating
- `revokeGuestLink`: add `canShareFn` check (currently no auth at all)

### 0d. Dead code removal (~150 LOC)

**File**: `src/hooks/useAccess.tsx`

Remove unused context members that run on every render for zero consumers:
- `getAccessPath` (~65 lines) — never consumed outside the hook
- `accessibleFolderIds` (~35 lines) — never consumed outside the hook
- `createProjectGrant` (~18 lines) — duplicate of `createGrant(PROJECT_RESOURCE, ...)`

### 0e. Fix shared-view bugs

**File**: `src/app/nextgen/shared/shared-view.tsx`

- `handleRevokeLink` is a no-op (just deselects) — wire to real `revokeGuestLink`
- `totalCount` mixes admin/non-admin scope inconsistently — should respect active tab

### 0f. Extract guest link IIFE

**File**: `src/components/ui/access-panel.tsx`

Extract the 60-line guest link IIFE (lines 364-424) into a `<GuestLinksSection>` component. Phase 5 will extend this — better to have a clean component than inflate an IIFE.

---

## Phase 1: Shared Page Rework ✅ COMPLETE

**Files**: `src/app/nextgen/shared/shared-view.tsx`, `src/hooks/useAccess.tsx`

Shared page = outgoing shares + shares on resources you can access:

| Tab | Data source | Who sees it |
|-----|-------------|------------|
| (default) | `visibleShares` — all grants on resources user can access | Everyone |
| All | `allProjectShares` | Admin only (toggle) |

Changes made:
- Added `visibleShares` to `useAccess` — filters `allProjectShares` by `canAccess(resourceId)`
- Users see all shares on resources they have access to (dept teammate shares, not just their own)
- "Shared by" column shows **"You"** for your shares, person's name for others — clear distinction without extra tabs
- Admin Mine/All toggle preserved
- Inbox (separate page) handles incoming shares
- Empty state messages updated per tab

---

## Phase 2: Share Button in Toolbars

Add a `Share2` icon button to collection view toolbars, next to PanelRight toggle.

**Files**:
- `src/app/nextgen/collections/[id]/view.tsx` — toolbar gets `[Share2] [PanelRight]`
- `src/app/nextgen/smart-collections/[id]/view.tsx` — toolbar gets `[Share2]` before PanelRight (both mobile + desktop)

Pattern: `<Button variant="icon" onClick={openShareModal}><Share2 /></Button>`, gated by `canShare(resourceRef)`.

Opens `AccessModal` with the collection's resourceRef.

**Note**: Smart-collections view does NOT currently import `useAccess`. Must add it and construct a ResourceRef:
```ts
const resourceRef: ResourceRef = { id: collectionId, type: 'smart-collection' }
```

---

## Phase 3: Data Layer — Extract Pure Mutations + New Options

### 3a. Extract pure grant mutation functions

**New file**: `src/lib/grant-mutations.ts`

Move write operations out of React context into pure functions that operate on arrays:

```ts
export function applyCreateGrant(grants: Grant[], resource: ResourceRef, principal: PrincipalRef, profileId: AccessProfileId, grantorUserId: string, roleGroups: RoleGroup[], options?: GrantOptions): { grants: Grant[]; created: Grant }

export function applyRevokeGrant(grants: Grant[], grantId: string): Grant[]

export function applyUpdateGrantProfile(grants: Grant[], grantId: string, profileId: AccessProfileId): Grant[]
```

The React hook calls these internally. Tests and agents can call them directly.

Export named option types:
```ts
export type GrantOptions = {
  expiresInDays?: number
  watermark?: boolean
  ripplePolicy?: RipplePolicy
  ripplePermissions?: Permission[]
}

export type GuestLinkOptions = {
  allowDownload: boolean
  passcode: boolean
  expiresInDays: number
  watermark?: boolean
}
```

### 3b. Add watermark field

**Files**:
- `src/lib/grants.ts` — add `watermark?: boolean` to `Grant` type
- `src/lib/scenario.ts` — add `watermark?: boolean` to `GuestLinkSeed`, set true on the EP301 watermarked link seed

### 3c. Update useAccess.tsx

- Refactor `createGrant`, `revokeGrant`, `updateGrantProfile` to call the pure functions from 3a
- Extend `createGuestLink` options with `watermark?: boolean`
- Add guest link localStorage persistence (currently only seed data persists — runtime links lost on refresh)
- Bump `GRANTS_VERSION` to force re-seed (note: wipes user-created grants from localStorage)

### 3d. Restrict `match-grant` ripple policy

Only users with `edit-acl` should be able to set `ripplePolicy: 'match-grant'` when sharing a collection. Users with just `share` default to `view-only`. This prevents collection sharing from escalating asset permissions beyond what the sharer intended.

---

## Phase 4: Share Modal Enhancements

**File**: `src/components/ui/access-panel.tsx`

Add a "Share Options" section between the search row and the grant list. Show toggles conditionally based on `resourceRef.type`:

| Option | Toggle | Visible when | Maps to |
|--------|--------|-------------|---------|
| Watermark | `Toggle` | `type === 'cut'` or video asset | `Grant.watermark` / `GuestLink.watermark` |
| Expiration | `Toggle` + date `Input` | Always | `Grant.expiresAt` / `GuestLink.expiresAt` |
| Can download | `Toggle` | `type === 'collection'` | `ripplePolicy: 'custom'` + `ripplePermissions: ['open', 'download']` vs `view-only` |
| Can upload | `Toggle` | `type === 'folder'` | Default role picker to write-capable profile when on, read-only when off |

**Watermark semantics**: per-resource policy, not per-grant. When watermark is enabled for a cut, all grants and guest links on that resource get `watermark: true`. The toggle reflects the resource's current watermark state. (Note: prototype display-only — production requires server-side enforcement.)

**Can upload**: Don't filter `getGrantableProfiles`. Instead, default the role picker to `contributor` when toggled on, and to `viewer` when off. `getGrantableProfiles` remains the single authority for which profiles are assignable.

Implementation:
- Pass options to `createGrant` / `createGuestLink` via the new `GrantOptions`/`GuestLinkOptions` types from Phase 3
- Show watermark/expiration/download indicators on existing grant rows and guest link rows
- Use existing `Toggle` component from `src/components/ui/switch.tsx`

Also update:
- `src/components/ui/batch-share-modal.tsx` — same options section. Enrich `SelectionEntity` with `resourceType` field so the modal knows which options to show. For mixed types, show only universally applicable options (expiration).
- Guest link display rows — show watermark badge alongside existing download/expiry/passcode indicators

---

## Phase 5: Guest Link UI Polish

**File**: `src/components/ui/ontology-section.tsx` → the `<GuestLinksSection>` extracted in Phase 0f

Current: bare "Create link" button. Enhance to:
- Show options inline before creating: watermark toggle (for video/cuts), expiration picker, download toggle, passcode toggle
- After creation: display link card with all settings, copy button, revoke button
- Watermark indicator on existing links

---

## Implementation Order

| Phase | Depends on | Scope |
|-------|-----------|-------|
| **0. Pre-work** | None | `grants.ts`, `useAccess.tsx`, `access-panel.tsx`, `shared-view.tsx` |
| 1. Shared page rework | Phase 0e | `shared-view.tsx` |
| 2. Toolbar share buttons | None | 2 view files |
| 3. Data layer + pure mutations | Phase 0a-d | `grant-mutations.ts` (new), `grants.ts`, `scenario.ts`, `useAccess.tsx` |
| 4. Modal enhancements | Phase 3 | `access-panel.tsx`, `batch-share-modal.tsx` |
| 5. Guest link polish | Phase 0f, Phase 3 | `access-panel.tsx` (GuestLinksSection) |

Phase 0 first. Then 1, 2, 3 in parallel. Then 4 and 5.

---

## Key Files

| File | Changes |
|------|---------|
| `src/lib/grants.ts` | Add `watermark` to Grant, enforce expiration in filters |
| `src/lib/grant-mutations.ts` | **NEW** — pure mutation functions + exported option types |
| `src/lib/scenario.ts` | Add `watermark` to GuestLinkSeed, update seed |
| `src/hooks/useAccess.tsx` | Fix per-grant editability, guest link auth, dead code removal, refactor to use pure mutations, persist guest links |
| `src/app/nextgen/shared/shared-view.tsx` | Rework tabs, fix revoke no-op, fix totalCount |
| `src/app/nextgen/collections/[id]/view.tsx` | Add Share button to toolbar |
| `src/app/nextgen/smart-collections/[id]/view.tsx` | Add Share button + `useAccess` import + ResourceRef |
| `src/components/ui/access-panel.tsx` | Extract GuestLinksSection, add share options toggles |
| `src/components/ui/batch-share-modal.tsx` | Share options + SelectionEntity enrichment |
| `src/components/ui/switch.tsx` | Existing Toggle component (reuse) |

---

## Verification

- `npx tsc --noEmit` after each phase
- `npx vitest run` — existing tests should pass
- **New tests**: write tests for expiration enforcement, pure mutation functions, GrantOptions/GuestLinkOptions
- Visual: switch personas to verify Share button visibility (owner sees it, viewer doesn't)
- Visual: open share modal on a cut → watermark toggle visible; on a collection → download toggle visible; on a folder → upload toggle visible
- Visual: Shared page shows both tabs for all personas
- Visual: as Maria (editor), create a grant → verify she can modify/remove it but not grants created by Lisa

---

## Review Findings Addressed

| # | Finding | Severity | Where addressed |
|---|---------|----------|----------------|
| 1 | Grant expiration never enforced | P1 | Phase 0a |
| 2 | Per-grant editability UI/data mismatch | P1 | Phase 0b |
| 3 | Write ops trapped in React context | P1 | Phase 3a |
| 4 | Smart-collections missing useAccess | P2 | Phase 2 (noted) |
| 5 | Watermark semantics unclear | P2 | Phase 4 (clarified: per-resource) |
| 6 | Guest link auth gaps | P2 | Phase 0c |
| 7 | match-grant ripple escalation | P2 | Phase 3d |
| 8 | Guest links not persisted | P2 | Phase 3c |
| 9 | canUpload fights authority model | P2 | Phase 4 (changed to role picker default) |
| 10 | BatchShareModal lacks type metadata | P2 | Phase 4 (enrich SelectionEntity) |
| 11 | ~150 LOC dead code | P3 | Phase 0d |
| 12 | Guest link IIFE | P3 | Phase 0f |
| 13 | handleRevokeLink no-op | P3 | Phase 0e |
| 14 | No new tests planned | P3 | Verification section |
