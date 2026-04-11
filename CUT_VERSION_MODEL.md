# Cut Version Model

*Mutable artifact for autoresearch.*

## Model: Cut is one entity, versions are its history

A cut is one thing. EP301 is EP301. It has a version history: LC1 → LC2 → LC3 → FC → EMF. The UI shows the latest version by default with a version switcher to browse history.

## Sharing

You share the cut, not a version. Two modes, chosen automatically:

- **Internal share** (person in a production department or domain release): grants access to the cut. Recipient sees all versions and receives future versions automatically. This is the default.
- **External share** (vendor): grants access locked to the current version. Recipient sees only that version. No future versions unless re-shared.

The coordinator doesn't choose -- smart defaults handle it based on who the recipient is. The grant stores a `lockedToVersion` field (null for internal = all versions, set for external = that version only).

To lock an internal recipient later: change their grant from open to version-locked. "VFX, you're done -- locking at LC3."

## Versioning

Versions are ordered entries in the cut's history. Each has: version number, stage (locked-cut / final-cut / emf), date, note, constituents (source files). Publishing a new version is an action by the editor: "Publish LC3" adds it to the cut's history.

## Release

Releasing a cut to a domain releases the cut entity. The domain sees the latest version. As new versions are published, the domain sees those too.

The release history is the provenance trail. Each release is timestamped and tied to the version that was current at release time:

```
Feb 8   Released to Studio VFX        (at Locked Cut 1)
Feb 13  Released to Studio Creative   (at Locked Cut 2)
Feb 18  Released to Studio Post       (at Locked Cut 3)
Feb 28  Released to all Studio        (at Final Cut)
```

This answers: "When did Marketing first get access to this cut?" and "Which version was current when we released to Studio Post?" -- critical for leak investigation and compliance.

Each domain release grant stores the version number that was current at release time. The domain sees all versions from that point forward (not earlier). This means Studio Post sees LC3, FC, EMF but not LC1-2. Studio VFX sees everything from LC1. The progressive widening is baked into the grant model.

## Revocation

Revoke = revoke access to the cut. All versions go. There's no "keep LC1 but revoke FC." If VFX finishes their work and you want to cut them off, you revoke their cut access. They lose everything.

## Scenario results

- S1 (progressive widening): WORKS. LC1 released to Studio VFX. LC2 adds Studio Creative release. Each is a new domain grant on the same cut. Audience widens. History shows when each domain was added.
- S2 (David sees FC after LC2): WORKS. David has access to the cut since LC2. When FC is published, he sees it. He can browse back to LC2 and see his old comments.
- S3 (vendor gets one version): WORKS via snapshot. When sharing the cut, you can choose "Share latest" (ongoing access, sees new versions) or "Share this version" (snapshot of the current version). "Share this version" creates a frozen grant that locks to that version's constituents. The vendor sees only that version -- no history, no future versions. Same snapshot pattern used for collections. The share dialog shows: "Share EP301 — Locked Cut 3" with a toggle: "Include future versions" (default on for internal, default off for vendors via smart defaults).
- S4 (revoke future, keep past): WORKS via downgrade. Instead of revoking entirely, the coordinator changes the grant from "Include future versions" to "Up to version N." This freezes the recipient's access at that version -- they keep historical access but don't see new versions. The grant becomes a version-locked snapshot. In practice: "VFX, you're done. I'm locking your access at LC3." VFX can still reference LC1-3 but won't see FC or EMF.
- S5 (parallel cuts): WORKS. Director's cut and studio cut are separate cut entities with separate version histories. Different `versionGroupId`.
- S6 (EMF as derivative): POSITION: EMF is a version of the cut, not a separate entity. Stage = "emf". It's the delivery format of the final cut. It lives in the same version history after FC.
- S7 (re-lock after final): WORKS. LC4 is published after FC. Version history: LC1 → LC2 → LC3 → FC → LC4 → FC2. Non-linear stage names are fine -- the ordering is by date, not by stage label.
- S8 (different levels per stage): TENSION. The grant is on the cut, not the version. Everyone with access gets the same permission level on all versions. MITIGATION: this is acceptable. The realistic pattern is View for everyone except the director who gets Comment. The director's Comment grant applies to all versions -- that's fine, he might want to comment on historical versions too.

## Data model changes

```
Cut entity: {
  id: string              // e.g., 'cut-ep301'
  name: string            // e.g., 'EP301'
  episode: string
  department: DomainId
  versions: CutVersion[]  // ordered by date
}

CutVersion: {
  id: string              // e.g., 'cut-ep301-lc-1'
  stage: string           // 'locked-cut' | 'final-cut' | 'emf'
  version: number         // 1, 2, 3...
  date: string
  note: string
  constituents: string[]  // source file IDs
  duration: string
  assetVersion: string    // e.g., '3.6'
}
```

Grants are on the cut entity ID (`cut-ep301`), not on version IDs.

## UI changes

### Cuts view
One card per cut, not per version. Card shows: cut name, latest version stage badge (e.g., "Final Cut"), version count ("5 versions"), thumbnail from latest version.

### Cut detail (side panel or full page)
- Playback of the current (latest) version
- Version switcher: dropdown showing the progression with stage labels and dates
  ```
  ▾ Final Cut (v4) — Feb 28
    Locked Cut 3 (v3) — Feb 18
    Locked Cut 2 (v2) — Feb 13
    Locked Cut 1 (v1) — Feb 8
  ```
- Selecting a version loads that version's playback, constituents, and comments
- Comments are per-version (you commented on LC2, that comment stays on LC2)

### Share modal
"Share EP301" -- the cut entity. Status card shows: "Editorial · 4 versions · Released to 3 domains · 8 people." No per-version sharing UI. Smart defaults handle internal vs vendor.

### Access tab
Shows who has access to the cut and whether they follow all versions or are locked to a specific one:
```
Editorial          Follow all
David Park         Follow all (Comment)
Studio VFX         Follow all (View)
Studio Creative    Follow all (View) — since v2
Framestore         Locked to v3 (View)
```

### Release tab
Release the cut (latest version). Release history shows when each domain was added:
```
Studio VFX         Released at v1
Studio Creative    Released at v2
Studio Post        Released at v3
All Studio         Released at v4 (Final)
```
