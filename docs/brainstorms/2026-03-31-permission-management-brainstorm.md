# Permission Management UI

## What We're Building

Inline permission editing on workspace folders, collections, and individual assets. Users can add people/teams, assign roles, and remove access — all from the existing side panels. No modal needed.

## Why This Approach

The AccessPanel component already supports grant CRUD (add by email, change role, remove). The gap is that it's only wired up in SharedSidePanel, not in WorkspaceSidePanel, CollectionSidePanel, or AssetDetailPanel. The approach is to expand AccessPanel to support teams, then embed it in all three panel types.

## Key Decisions

### 1. Scope: Folders + Collections + Assets
All three resource types get permission editing in their side panels. This covers the three core sharing scenarios:
- VFX coordinator shares a workspace folder with Editorial
- User shares a collection with specific people
- User shares a single asset with a stakeholder

### 2. UI: Inline in side panel
No sharing modal. The AccessPanel in each side panel handles everything — add person/team, change role, remove. Consistent across all resource types.

### 3. Principals: Users + Teams
The add-person input becomes a unified search that finds both people (by name/email) and teams (by name). Type "VFX" → see "VFX Core" team and individual VFX members.

### 4. Folder inheritance: Yes, inherit by default
Granting access on a folder gives access to everything inside it. This follows SHARING_SCHEMA.md principle #4 (inheritance). No `no-inherit` breaking for now — keep it simple.

### 5. Display: Grouped sections for inherited vs. direct
When viewing a child item that inherits from a parent:
- **Direct access** section at top (editable — add/remove/change role)
- **Inherited from [folder name]** section below (read-only — shows what comes from the parent, user can't change it here)

### 6. Collection ripple: Read-only
Sharing a collection as "viewer" gives view+download on the assets inside. No write/delete rights ripple through. This matches the schema's recommended default ripple policy and prevents accidental privilege escalation.

## Changes Required

### AccessPanel enhancements
- **Team search**: Input searches both PERSONAS and TEAMS, shows results in a dropdown
- **Team grants**: `createGrant` already supports team principals, just need UI
- **Inherited grants display**: New read-only section showing grants inherited from parent resource
- **Resource context**: Panel needs to know the parent resource (for inheritance display)

### WorkspaceSidePanel
- Replace static "Access" section with interactive `AccessPanel`
- Pass `resourceRef` so grants can be created on the selected folder/file
- Show inherited grants from department root

### CollectionSidePanel
- Wire up the "Share Collection" button to add a person/team inline
- Embed `AccessPanel` with the collection as resource
- Wire up "Manage members" button (currently dead)

### AssetDetailPanel
- Add `AccessPanel` section for direct asset sharing
- Show inherited grants from parent collection (if viewed within a collection)

### useAccess hook
- Add inheritance resolution: when checking a child resource, walk up the folder tree to find parent grants
- Cap collection ripple at read-only (viewer permissions only, regardless of collection-level role)

## Resolved Questions

1. **Search dropdown vs plain email?** → Search dropdown (combobox). Type-ahead matching for both people and teams. Matches the Settings Modal pattern and is more discoverable.

2. **Inheritance display depth?** → Immediate parent only. "Inherited from SEQ010" — simple, one level. User can navigate to the parent if they need to change inherited access.

## Open Questions

1. **What happens visually when you share?** Should there be a confirmation, a toast, or just the grant appearing in the list? The prototype doesn't have a notification system — probably just the grant appearing inline is enough.
