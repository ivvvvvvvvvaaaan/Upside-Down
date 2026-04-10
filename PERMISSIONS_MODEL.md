# Permissions Model

*Mutable artifact for autoresearch on access control correctness.*

## Current position

Access is additive. No deny rules. The sum of all grants = what you can see. To restrict, remove the share.

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
