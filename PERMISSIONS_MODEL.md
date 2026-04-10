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

## What the industry does

- **Additive is standard** (ShotGrid, Iconik, Frame.io, PIX). Most restrictive is rare in media DAM.
- **Explicit deny as override**: some systems allow a hard block on a specific user/asset that overrides all additive grants. Used for security incidents.
- **Per-user access summary**: shows ALL paths a user has to an asset. Critical for complete revocation.
- **Per-asset access summary**: shows ALL users who can reach an asset and why.
- **Project-level lockdown**: one toggle to freeze all external access.
- **Revocation is evaluated at request time**, not cached.
- **Audit logs retained**: every view, download, share event with user, timestamp, IP. Minimum 1 year.
- **Forensic watermarking**: per-user/per-session invisible marks on high-value content.

## Evaluation criteria for this loop

1. **Revocation completeness**: if I want to cut someone off from an asset, can I do it in one action regardless of how many paths they have?
2. **Transparency**: does the revoker see all remaining access paths?
3. **Audit trail**: can we reconstruct who had access at any historical point?
4. **Emergency lockdown**: can an admin freeze all access in one action?
5. **No accidental leakage**: can the system prevent a grant from reaching someone the grantor didn't intend?
6. **Simplicity**: does the model stay understandable? Can a coordinator reason about it?
7. **Compatibility**: does it work with the existing share/release model without breaking it?
