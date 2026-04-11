# Permissions Model

*Mutable artifact for autoresearch on access control correctness.*

## Core principle

**No access by default. Access only through explicit grants.** You see nothing unless someone gave you access -- through department membership, a share, or a release. Each grant is a specific, traceable path.

When multiple grants exist for the same asset, the user gets the highest permission level across all paths. This is the standard "additive" model used across the industry (ShotGrid, Iconik, Frame.io, PIX).

The additive model has one override: **blocks**. An admin can block a specific user from a specific asset, and the block wins regardless of grants.

Three access paths:
1. **Department membership** -- workspace access
2. **Share** -- person/team targeted grant
3. **Release** -- domain broadcast grant

## Known problems

### Problem 1: Removing from a share doesn't fully revoke

Lisa shares a collection with David. That collection contains VFX assets that David also has access to through a separate share from Sarah. Lisa removes David from her collection. David still sees the VFX assets through Sarah's share. Lisa thinks she revoked access but she didn't.

**Why this matters:** In movie production, if a coordinator thinks they've cut off access to unreleased footage and they haven't, it's a security incident.

### Problem 2: No visibility into all access paths

When Lisa removes David, the system doesn't tell her "David still has access to 3 of these assets through other shares." She has no way to know the revocation was incomplete.

### Problem 3: No emergency kill switch

If a leak investigation points to a specific user, there's no way to immediately freeze all their access across all paths (department, shares, releases) in one action.

### Problem 4: No explicit deny

If an asset is in a shared collection and the department decides it shouldn't be visible to the collection recipient anymore, there's no way to block it. You'd have to remove the asset from the collection (affects everyone) instead of blocking one person.

### Problem 5: Audit trail gaps

The system can answer "who has access?" but not "who HAD access at this specific point in time?" Revoked grants disappear from the access panel. Investigation needs historical access records.

## The model

### Additive access with full visibility

Access is additive. A user's effective access is the union of all grants. This is the industry standard and the right default for production workflows where people wear multiple hats.

**But additive requires transparency.** The system must show ALL access paths so that revoking is informed, not blind.

### Per-asset access summary

For any asset, the access panel shows every path through which each person has access:

```
Who can see "SEQ010_SH010_comp_v12":
├── VFX department (workspace) — Mike, Sarah [Manage]
├── Collection "EP301 VFX Pulls" — Lisa, Maria [View]
├── Collection "Framestore Handoff" — James [View + Upload]
└── Released to Studio Creative — Alex, David [View]
```

When you revoke one path (remove Lisa from "EP301 VFX Pulls"), the system shows: "Lisa still has access to this asset through 0 other paths. Access fully revoked." OR "Lisa still has access through 1 other path: Department membership."

This is the key: **revocation feedback tells you whether the revocation was complete.**

### Per-user access summary

For any user, the admin can see everything they can access and why:

```
David Park has access to:
├── 3 assets via direct shares
├── 12 assets via "EP301 VFX Pulls" collection
├── 47 assets via release to Studio Creative
└── 0 assets via department (no department membership)
Total: 62 unique assets
```

One view. Complete picture. The "revoke all" button removes everything.

### Revoke all access for a user

From the per-user summary OR from the project settings People tab, an admin can "Revoke all access" for a person. This:
1. Revokes all direct grants (shares) to that user
2. Removes them from all collections they were added to
3. Removes them from department membership (if applicable)
4. Does NOT affect domain releases (those are CAM-managed, not app-managed)

The action is logged. The user sees nothing in the app -- their view goes empty. The admin sees a confirmation: "All 62 assets are no longer accessible to David Park. 3 grants revoked, 1 department membership removed."

This is the "kill switch" for when someone rolls off the project, gets terminated, or is under investigation.

### Revoke all paths to an asset

From the per-asset summary, an admin can "Revoke all access" to a specific asset. This removes the asset from all shared collections and revokes all direct grants. Department access remains (can't remove workspace files without moving them). This is the response when a specific asset is compromised -- lock it down, then investigate.

### Revocation feedback

Every revoke action shows a result:
- **"Access fully revoked."** -- the user has no remaining paths to this asset. Done.
- **"Removed from this collection. David still has access through 2 other paths."** -- with a link to the per-asset access summary so you can revoke the remaining paths if needed.

This is not a modal or a blocking dialog -- it's an inline confirmation that appears after the revoke action completes. The coordinator always knows the result of their action.

### Block: the exception to additive

The access model is additive with one exception: a **block**. An admin can block a specific user from a specific asset. A block overrides all additive grants -- no matter how many paths the user has, the block wins.

Blocks are:
- Rare. Used for security incidents, not routine access control.
- Visible. The asset shows a block indicator in the access panel: "Blocked: David Park (by Lisa Kim, Feb 28)."
- Logged. The audit trail records who blocked whom and why.
- Reversible. Only by an admin with Manage on the asset.

This is NOT a general "deny" rule system. There's no deny-list, no deny-by-group, no deny-by-collection. It's a per-user, per-asset override for when the additive model produces the wrong result and you need to fix it immediately.

**When to use it:** Someone was shared an asset they shouldn't have seen (wrong version, sensitive content, accidental share). You block them from that asset. Even if they have access through their department or another collection, the block stops them.

### Project-level lockdown

An admin can toggle "Lock project" which immediately:
1. Freezes all external access (vendors, review links, cross-department shares)
2. Expires all outstanding guest links
3. Keeps internal department workspace access intact (teams can still work)

This is the emergency response for a leak investigation or a security incident. One toggle. Reversible. Logged with who locked it and when.

For a more targeted response: "Lock all external access to this asset" freezes just one asset's external grants while leaving internal access.

### Audit log (access history)

Every access event is recorded and retained:
- **Grant events**: who shared what with whom, when, at what level
- **Revoke events**: who revoked, when, which path
- **View events**: who opened the asset, when, from what device
- **Download events**: who downloaded, when, what format
- **Release events**: who released to which domains, when

The audit log is queryable: "Show me everyone who had access to cut-ep301-fc between Feb 15 and Feb 28." This answers the investigation question: not just who HAS access now, but who HAD access during the leak window.

Revoked grants are NOT deleted -- they're marked as revoked with a timestamp. The access panel shows active grants; the audit log shows the full history including revoked ones.

---

## Permission levels

Three base levels aligned 1:1 to CAM. Modifiers are strictly additive. One guest tier for external access.

| Level | CAM mapping | Capabilities | When to use |
|-------|-------------|-------------|-------------|
| **Viewer** | Viewer | Open, preview | Minimum access. See the content. |
| **Editor** | Editor | Everything in Viewer + write, modify metadata, reshare | Trusted collaborators who change content. |
| **Manager** | Manager | Everything in Editor + delete, change permissions, add/remove people | Department coordinators. |

Admin is a platform role (CAM-level), not a per-resource grant. Admins inherit Manager on all resources plus audit log access, project lockdown, and block capability.

### Grant modifiers

Additive capabilities toggled per-grant. Every modifier adds something — none subtract.

| Modifier | Effect | Typical use |
|----------|--------|-------------|
| **Download** | Can download source files | Anyone who needs offline access. Off by default for Viewer. |
| **Comment** | Can leave feedback, annotations, timecoded notes | Reviewers, directors, stakeholders. |
| **Upload** | Can add new files to the collection | Vendor turnover deliveries. |
| **Include new** | Automatically receives newly added assets | Live collection sharing. |
| **Version locked** | Sees only a specific version, not newer ones | Vendor reference (locked to LC3). |

The share dialog shows a single dropdown with named presets. Each preset maps to a level + modifiers. An "Customize" link reveals the raw toggles for power users.

| Preset | Level | Modifiers | When shown |
|--------|-------|-----------|------------|
| **Reviewer** | Viewer | +Download +Comment | Default for sharing with a person |
| **Preview only** | Viewer | — | Sensitive content, executives |
| **Turnover** | Viewer | +Download +Upload | Sharing with a vendor/external team |
| **Collaborator** | Editor | +Download | Cross-department working access |
| **Full access** | Manager | +Download | Department coordinator handoff |

The coordinator picks one preset. One click, done. If they need something unusual (Viewer + Comment but no Download), they click "Customize" and toggle individually.

For releases: always Viewer + Download. No preset picker — releases are broadcast, not targeted.

Modifiers appear as `+N` in the access tab UI. Hovering shows the full list.

### Guest links

External reviewers without an account. Preview-only by default (Viewer, no modifiers). Optional toggles: allow download, allow comment, passcode, expiration date, watermark.

### CAM alignment

| Our level | CAM level | Notes |
|-----------|-----------|-------|
| Viewer | Viewer | 1:1. Pure preview. No divergence. |
| Editor | Editor | 1:1 |
| Manager | Manager | 1:1 |
| (Admin) | Admin | Platform role, not a per-resource grant |

True 1:1. No capability bolted onto a CAM level that doesn't naturally belong there. Download and Comment are modifiers that exist at the app level, orthogonal to CAM's identity model.

### Scenario resolution

| Scenario | Level | Modifiers | Smart default? |
|----------|-------|-----------|----------------|
| S1: Reviewer (David reviews cuts) | Viewer | +Download +Comment | Yes (share with person) |
| S2: Vendor turnover (Framestore) | Viewer | +Download +Upload | Yes (share with vendor) |
| S3: Executive preview (Alex) | Viewer | — | Yes (no defaults) |
| S4: Coordinator (Sarah manages VFX) | Manager | — | N/A (department role) |
| S5: Cross-dept collaborator (Maria in VFX) | Editor | — | — |
| S6: Marketing receives release | Viewer | +Download | Yes (release default) |
| S7: Admin investigation | (Admin) | — | Platform role |
| S8: Per-grant modifiers | Any level | Any combination | Override defaults |

---

## What the industry does

- **Additive is standard** (ShotGrid, Iconik, Frame.io, PIX). Most restrictive is rare in media DAM.
- **Explicit deny as override**: some systems allow a hard block on a specific user/asset that overrides all additive grants. Used for security incidents.
- **Per-user access summary**: shows ALL paths a user has to an asset. Critical for complete revocation.
- **Per-asset access summary**: shows ALL users who can reach an asset and why.
- **Project-level lockdown**: one toggle to freeze all external access.
- **Revocation is evaluated at request time**, not cached.
- **Audit logs retained**: every view, download, share event with user, timestamp, IP. Minimum 1 year.
- **Forensic watermarking**: per-user/per-session invisible marks on high-value content.

## Collection ownership risks (unresolved)

### The risk

Collections can exist outside department boundaries. Four scenarios:

**Scenario A: Personal aggregation.** David (director, no department) creates "EP301 Review" containing cuts from Editorial, VFX comps, and art concepts. He shares this with his agent. Three departments' content is now reachable through one collection that no department coordinator controls.

**Scenario B: Creator leaves.** Sarah creates "Framestore Handoff," shares it with James. Sarah leaves. The collection still exists. James still has access. Nobody on VFX can manage or revoke it.

**Scenario C: Stale collection.** Lisa created a review collection 3 months ago. The assets have been superseded. The collection is still shared with 5 people. Old versions are still accessible.

**Scenario D: Re-share chain.** An artist receives VFX comps via a shared collection. They create a NEW personal collection, add the VFX comps, and share that with someone outside the project. The VFX department never authorized this propagation.

### Resolution

#### 1. Department coordinators see all collections containing their assets

If a collection contains assets from the VFX workspace, the VFX coordinator can see that collection in a "Collections containing our assets" view in the department settings. They can see who it's shared with and can revoke the collection's access to their specific assets (without destroying the entire collection).

This means: David shares a collection containing VFX comps with his agent. Sarah (VFX coordinator) sees this in her department settings: "EP301 Review (David Park) — contains 3 VFX assets, shared with 1 external person." Sarah can pull the VFX assets out of David's collection or block the agent from those assets.

The coordinator doesn't own David's collection. But they retain control over their department's assets regardless of which collections they appear in.

#### 2. Collection ownership transfer on creator departure

When a user is removed from the project (via "Revoke all access" or department removal):
- **Department collections** (bound to a workspace folder) transfer to the department. Any coordinator with Manage can manage them. No gap.
- **Personal collections** are flagged for review. The admin who removed the user sees: "Sarah had 3 personal collections shared with others. Transfer ownership or delete?" They can transfer each to a specific person or to the department.
- **If no action taken within 30 days**, personal collections are frozen (no new shares) but existing shares remain active. They appear in a "orphaned collections" view in project settings.

This prevents Scenario B: Sarah leaves, nobody can manage Framestore Handoff. The admin is prompted to transfer it at removal time.

#### 3. Re-share is gated by permission level

The permission ceiling already solves Scenario D. Re-sharing is gated:

- **View and Comment** recipients CANNOT re-share. They can view, comment, but not put the asset in a new collection and share it.
- **Add** recipients can upload new files but cannot re-share existing content.
- **Edit** recipients CAN re-share -- but the ceiling applies. They can only grant up to their own level.
- **Manage** recipients have full control including re-share.

An artist who receives VFX comps at View level through a collection CANNOT add those comps to a new collection and share it. The "share" permission is only available at Edit level and above. View and Comment are consumption-only.

This was in the permission model from the start but wasn't highlighted as a re-share prevention mechanism. It's load-bearing for content security.

#### 4. Stale collection notifications

For Scenario C: collections shared with others that haven't been modified in 90 days get flagged in the creator's inbox: "Your collection 'EP301 Review' hasn't been updated in 90 days. Review or archive?" The creator can dismiss, update, or archive (revokes all shares, marks inactive).

Department coordinators see the same flag for department collections in their settings.

#### Summary: collection governance rules

1. **You can only share what you have.** Permission ceiling. No escalation.
2. **You can only re-share if you have Edit or Manage.** View and Comment are consumption-only.
3. **Department coordinators see everything containing their assets.** Regardless of who created the collection.
4. **When a creator leaves, their collections are transferred or frozen.** No orphaned active shares.
5. **Stale collections get flagged.** 90-day inactivity triggers a review prompt.

---

## Evaluation criteria

1. **Revocation completeness**: can I cut someone off in one action?
2. **Transparency**: does the revoker see all remaining paths?
3. **Audit trail**: historical access reconstruction?
4. **Emergency lockdown**: admin freeze in one action?
5. **No accidental leakage**: can the system prevent unauthorized propagation?
6. **Collection governance**: who controls a collection that crosses department boundaries?
7. **Creator departure**: what happens when the collection creator leaves?
8. **Re-share control**: can a department limit how their assets propagate?
9. **Simplicity**: can a coordinator reason about the model?
