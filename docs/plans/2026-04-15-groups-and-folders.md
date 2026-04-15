# Groups and Folders

*April 15, 2026.*

## The insight

A department is just a group with access to a root folder. There's no special concept. It's groups and folders all the way down.

## The model

A **folder** has one or more **groups** that can see its contents. A **subfolder** can have a different set of groups, narrowing or expanding access. That's it.

- VFX department = a group called "VFX" with access to the `/VFX` root folder
- Framestore = a group called "Framestore" with access to `/VFX/Vendor Deliveries/Framestore`
- James navigates to `/VFX/Vendor Deliveries/Framestore` because his group has access there. He can't go up to `/VFX` because his group doesn't have access to the root.

No special "department" permission layer. No "department boundary" that needs special-case code. Folder permissions ARE the boundary.

## What "department" was doing and what replaces it

| Department function | What replaces it |
|---|---|
| Gives you a workspace root folder | Group + root folder grant |
| Defines the privacy boundary | Folder permission (same group check) |
| Shows up in nav as top-level section | UI convention: root folders with groups appear as workspace sections |
| Determines who coordinates | Manager role on the group |
| Maps to release domains | Stays separate. Release domains are a CAM concept, not a folder concept. |

## How access works

A user sees a folder if any of their groups has a grant on that folder or any ancestor folder. Access inherits downward. A subfolder can add new groups (expanding access) or the UI can show it as restricted if the user's group doesn't have access to it specifically.

**Example: VFX workspace with vendor subfolder**

```
/VFX (group: VFX team)
  /Shots (inherits from /VFX)
  /Reference (inherits from /VFX)
  /Vendor Deliveries
    /Framestore (group: Framestore + VFX team)
    /DNEG (group: DNEG + VFX team)
```

- Mike (VFX Supervisor, in VFX group): sees everything
- James (Framestore, in Framestore group): sees only `/VFX/Vendor Deliveries/Framestore`
- Navigation: James opens the app, sees "Framestore" in his workspace. No `/VFX` in his nav. The UI scopes to what his groups can access.

## What this simplifies

1. **No department vs group distinction.** One concept: groups. Some groups map to what we used to call departments. Some are vendor teams. Some are cross-functional.

2. **No special-case workspace access code.** The workspace view checks folder grants. If your group has access, you see it. If not, you don't. Same check for VFX members and Framestore vendors.

3. **Subfolder sharing is natural.** Share a subfolder with a new group = that group sees the subfolder and its contents. No "punching holes in department boundaries." The folder IS the boundary.

4. **Coordinator role is per-group.** The VFX coordinator has Manager on the VFX group. They manage who's in the group and what the group can access. Same mechanism for vendor groups.

## What stays the same

- Folder tree UI and workspace navigation
- Collections for manual curation
- Smart collections for discovery
- Permission levels (Viewer/Editor/Manager + modifiers)
- Share dialog, notes, synced/frozen
- Search (covers everything you have access to)
- Release (separate CAM concept, unchanged)

## What the nav looks like

For Mike (VFX team member):
```
Workspaces
  VFX
    Shots
    Reference
    Vendor Deliveries
      Framestore
      DNEG
```

For James (Framestore team member):
```
Workspaces
  Framestore
```

For Alex (Studio Leadership, no production group):
```
(no workspaces section)
Collections
  EP301 Review Package
```

The nav shows root-level folders you have access to. If your only access is a subfolder deep in someone else's tree, that subfolder appears as your root.

## Release domains

Release domains stay separate. They're a CAM concept for cross-app content distribution. A release audience (Marketing, Studio Creative) is not a group with a folder. It's a broadcast channel.

The mapping between groups and release domains is configuration:
- VFX group's root folder → can release to Studio VFX domain
- Editorial group's root folder → can release to Production Editorial, Studio Post

This mapping doesn't change with the groups-and-folders model.

## Open questions

1. **Group hierarchy**: Can groups contain other groups? "Studio Leadership" contains "VP Content" and "Director." For now, flat groups are sufficient.

2. **Inheritance override**: If `/VFX` gives VFX team Manager access, can `/VFX/Vendor Deliveries/Framestore` give Framestore team Viewer access without downgrading VFX team? Yes, access is additive. VFX team still has Manager on the subfolder (inherited). Framestore has Viewer (direct).

3. **Root folder creation**: Who creates the root folders? Today, departments are seeded from project onboarding. In this model, root folders are created by admins and assigned to groups. Same onboarding process, different implementation.

4. **Naming**: Do we call the top-level sections "Workspaces" in the nav? Or just show the folder names? If James sees "Framestore" as his workspace, is that confusing? He's not in a "workspace" in the department sense. He has access to a folder.

## Impact on prototype

The prototype currently has:
- `Department` as a concept in personas, nav, and access checks
- `domainId` on various types (assets, folders, grants)
- Department-specific access resolution in `useAccess.tsx`
- Nav sidebar with hardcoded department sections

To implement groups-and-folders:
- Remove department as a permission concept (keep as a UI label for root folders)
- Groups replace department membership for access checks
- Folder grants replace domain root grants
- Nav sidebar renders based on accessible root folders, not departments
- `domainId` on assets becomes the group/root-folder they belong to

This is a significant refactor but it's a genuine simplification. The access model becomes: groups have grants on folders. That's it.
