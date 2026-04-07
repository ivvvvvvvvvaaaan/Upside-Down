# Toggle-Based Share Permissions

## Context

The current share modal has a role dropdown (viewer/commenter/editor/manager/etc.) that was designed around file operations. These labels are confusing when sharing collections — "Full access" on a collection doesn't mean full access to the content inside. Users don't think in abstract permission tiers. They think in concrete capabilities: "can they download it? can they leave notes? can they upload into it?"

**Decision**: Replace the role dropdown with toggles. Default is view-only. Each toggle adds a specific capability the sharer understands.

---

## The Share Modal

```
Share "EP301 Assembly Selects" with:
[Search for people...]

☐ Can download
☐ Can comment
☐ Can upload
☐ Expires  [7 days ▾]

[Share]
```

Default: view only (can open, can browse — nothing else).

Each toggle is a yes/no decision:
- **Can download** — save to their machine
- **Can comment** — see + leave review notes (powers creative review tool integration)
- **Can upload** — add files to the collection (dropbox mode)
- **Expires** — time-boxed access with date picker

No dropdown. No role picker. No permission jargon.

---

## What Each Toggle Maps To

| Toggle | Permission added | Use case |
|--------|-----------------|----------|
| (default — always on) | `open` | View the content |
| Can download | `download` | Save locally, pull into Avid/Nuke |
| Can comment | `comment` | See review notes, leave feedback, creative review |
| Can upload | `upload` | Add deliveries, contribute assets |
| Expires | `expiresAt` on grant | Time-boxed access for vendors, temporary reference |

The grant is built from toggle state:

```
Base:           ['open']
+ download:     ['open', 'download']
+ comment:      ['open', 'comment']  
+ upload:       ['open', 'upload']
+ all three:    ['open', 'download', 'comment', 'upload']
```

No `templateId` needed — permissions are explicit on the grant.

---

## Creative Review Integration

`Can comment` is the bridge to whatever review tool the org picks (Frame.io, PIX, etc.). The media library controls the access decision. The review tool reads it:

- Recipient has `comment` → review tool shows notes, annotations, thread history, allows feedback
- Recipient doesn't have `comment` → review tool shows content clean, no conversation

The media library doesn't need to know what the review tool is. It just manages the `comment` permission.

---

## What About "Manage"?

Full control (reshare, delete, modify collection) is not a share toggle — it's a separate action: **Transfer ownership** or **Add as manager**. This is rare enough that it doesn't belong in the default share flow. It lives in the collection settings or a "..." menu, not in the share modal.

---

## Ripple Behavior

For collection shares, the toggles control what the recipient can do. The ripple caps asset-level access at the sharer's own access. So:

- Mike (viewer on a cut) shares a collection containing the cut with "Can download" toggled
- Recipient gets `['open', 'download']` on the cut — capped at Mike's access
- If Mike only has `['open']` (no download), the recipient gets `['open']` — the toggle is irrelevant because Mike can't grant what he doesn't have

The system silently caps. No error, no warning — the recipient just gets the maximum the sharer can provide.

---

## What Changes in Code

### access-panel.tsx — Replace role dropdown with toggles

Remove the `Select` dropdown for role selection. Replace with toggle row:

```tsx
<div className="space-y-3">
  <h3 className="text-label-1-bold text-foreground-dim">Permissions</h3>
  <ToggleRow label="Can download" checked={canDownload} onChange={setCanDownload} />
  <ToggleRow label="Can comment" checked={canComment} onChange={setCanComment} />
  <ToggleRow label="Can upload" checked={canUpload} onChange={setCanUpload} />
  <ToggleRow label="Expires" checked={expires} onChange={setExpires}>
    {expires && <DatePicker value={expiresDate} onChange={setExpiresDate} />}
  </ToggleRow>
</div>
```

### handleAddPrincipal — Build permissions from toggles

```ts
const permissions: Permission[] = ['open']
if (canDownload) permissions.push('download')
if (canComment) permissions.push('comment')
if (canUpload) permissions.push('upload')

createGrant(resourceRef, principal, permissions, {
  expiresAt: expires ? computeExpiresAt(expiresDate) : undefined,
  allowUpload: canUpload,
})
```

### createGrant — Accept permissions directly (not just profileId)

Update `createGrant` to accept either a `profileId` or raw `permissions` array. For toggle-based shares, permissions are explicit. For system/policy grants, profileId is still used.

### Grant display — Show capabilities, not role names

In the access summary and grant rows, show the active capabilities:

```
Sarah Chen    [download] [comment]
James Liu     [upload]
David Park    [comment] [expires Feb 25]
```

Instead of "Viewer" or "Editor."

### Remove old role picker UI

The `addRoleOptions` and `Select` for role selection are removed from `access-panel.tsx`. The `roleGroupOptions` helper becomes unused for the share flow (kept for settings page where you manage role groups).

---

## What Stays the Same

- Role groups still exist — for system/policy grants (department access, project roles)
- `AccessProfileId` still exists — for internal permission templates
- `canAssignProfile` still works — for the settings page
- Grant type unchanged — `permissions` array is already there
- Ripple policy unchanged — still caps at sharer's access

---

## Implementation Steps

### Step 1: Add toggle state to AccessPanel
- Remove role `Select` dropdown
- Add `canDownload`, `canComment`, `canUpload`, `expires` state
- Render toggle rows with `Toggle` component

### Step 2: Update handleAddPrincipal
- Build permissions from toggle state instead of from `addAsRole`
- Pass directly to `createGrant`

### Step 3: Update createGrant signature
- Accept `permissions?: Permission[]` as alternative to `profileId`
- When permissions are provided directly, use them instead of looking up profile

### Step 4: Update grant display
- Show capability tags instead of role labels in access summary
- Show capability tags in grant rows in the share modal

### Step 5: Update share options section
- Remove the old "Share Options" section (snapshot/upload toggles from earlier)
- These are now part of the main toggle list

### Step 6: Bump GRANTS_VERSION

---

## Key Files

| File | Changes |
|------|--------|
| `src/components/ui/access-panel.tsx` | Replace role dropdown with toggles, build permissions from state |
| `src/hooks/useAccess.tsx` | Update createGrant to accept raw permissions |
| `src/components/ui/access-summary.tsx` | Show capability tags |
| `src/components/ui/access-display.ts` | Format capabilities for display |
