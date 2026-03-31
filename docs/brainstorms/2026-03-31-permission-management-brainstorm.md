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

## Iconik Comparison (added 2026-03-31)

### What Iconik Does

Iconik separates permissions into two orthogonal systems:
- **Teams** = WHO can access WHAT content (access scope)
- **Role Groups** = WHAT actions users can take (capabilities)

These are independent. A user's effective permissions = team membership (what they see) + role group (what they can do). You can change either without affecting the other.

Additionally:
- ACL on any object type (assets, collections, metadata views, storage locations)
- Role groups are optional and fine-grained (core, upload, organize, comments & approvals)
- Collection propagation: new assets added to a shared collection auto-get permissions

### What We're Adopting

**Two-system split: Teams for scope, Role Groups for capabilities.**

A grant becomes: `{ principal, resource, roleGroupId }` where:
- The principal (user or team) + resource defines the access scope
- The `roleGroupId` defines what capabilities they have within that scope

This solves the case where you want someone to "see everything editors see but only comment" — currently impossible with our single-axis template system.

**Keeping our current 7 permissions** (open, download, write, delete, comment, share, edit-acl) as the atomic capability set. Role groups are named presets of these permissions. No new permission atoms needed.

**Configurable collection propagation.** When sharing a collection, the sharer chooses a ripple policy:
- `view-only` — assets get open + download (current default)
- `match-grant` — assets get the same permissions as the collection grant
- `custom` — pick specific permissions to propagate

### What We're Keeping From Our Model

- Department isolation as a structural principle (Iconik doesn't have this)
- Folder inheritance vs collection ripple as distinct mechanics
- Access explainability (ShareLineage, AccessPath)
- Review-set as a first-class shareable resource
- `no-inherit` for breaking inheritance (deferred but designed for)

## Resolved Questions

1. **Search dropdown vs plain email?** → Search dropdown (combobox). Type-ahead matching for both people and teams. Matches the Settings Modal pattern and is more discoverable.

2. **Inheritance display depth?** → Immediate parent only. "Inherited from SEQ010" — simple, one level. User can navigate to the parent if they need to change inherited access.

## Open Questions

1. **What happens visually when you share?** Should there be a confirmation, a toast, or just the grant appearing in the list? The prototype doesn't have a notification system — probably just the grant appearing inline is enough.
