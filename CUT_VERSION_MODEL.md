# Cut Version Model

*Mutable artifact for autoresearch.*

## Model: Cut is one entity, versions are its history

A cut is one thing. EP301 is EP301. It has a version history: LC1 → LC2 → LC3 → FC → EMF. The UI shows the latest version by default with a version switcher to browse history.

## Sharing

You share the cut, not a version. "Share EP301 with David" gives David access to the cut and all its versions. The grant is on the cut entity. When a new version is published, everyone who has access to the cut sees it.

## Versioning

Versions are ordered entries in the cut's history. Each has: version number, stage (locked-cut / final-cut / emf), date, note, constituents (source files). Publishing a new version is an action by the editor: "Publish LC3" adds it to the cut's history.

## Release

Releasing a cut to a domain releases the cut entity. The domain sees the latest version. As new versions are published, the domain sees those too. The release widens over time (LC1 released to Studio VFX only, then FC released to all Studio domains) -- each release is a separate grant on the same cut entity.

## Revocation

Revoke = revoke access to the cut. All versions go. There's no "keep LC1 but revoke FC." If VFX finishes their work and you want to cut them off, you revoke their cut access. They lose everything.

## Scenario results

- S1 (progressive widening): WORKS. LC1 released to Studio VFX. LC2 adds Studio Creative release. Each is a new domain grant on the same cut. Audience widens. History shows when each domain was added.
- S2 (David sees FC after LC2): WORKS. David has access to the cut since LC2. When FC is published, he sees it. He can browse back to LC2 and see his old comments.
- S3 (vendor gets one version): TENSION. If you share the cut with Framestore, they see all versions including FC. Solution: share a **snapshot** of a specific version. The snapshot is a frozen curated collection containing the cut at that version's constituents. The vendor sees the snapshot, not the cut entity. Same pattern as smart collection sharing.
- S4 (revoke future, keep past): FAILS as described. Revoking cuts off all versions. MITIGATION: this is acceptable. If VFX is done, they don't need the cut at all. If they need historical reference, the coordinator keeps their access -- it's view-only, low risk.
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

- Cuts view: shows one entry per cut, not per version
- Cut detail: version switcher (dropdown or timeline) to browse history
- Share modal: "Share EP301" (the cut, not a version)
- Release tab: release the cut, latest version is what the audience sees
