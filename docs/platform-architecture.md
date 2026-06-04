# Platform Architecture — Media Library + Creative Review

*Work in progress 2026-06-04. These are the decisions until explicitly revisited.*

---

## The two products

**Media Library** — organizational layer, asset lifecycle, access control, release
**Creative Review** — screening experience, annotations, approval workflow, notes delivery

They share a single foundational layer: asset identity, versions, permissions, identity.

---

## The five decisions

**1. The library owns the organizational layer**
Project folder structure, access control, session creation, asset states. The review app does not have its own project templates or folder organization. It reads from the library.

**2. The review app owns the experience layer**
Screening, timecoded annotations, frame-accurate comments, the approval action, notes delivery. Nothing organizational. Its value is entirely in how it presents and facilitates review.

**3. The editorial assistant lives in the library**
Upload, organize, build session playlist, manage who's invited — all in the library. They push to review. They receive notes back in the library. They never need to open the review app.

**4. Reviewers only open the review app**
Directors and execs are invited to sessions. They see what they're invited to. No folder browsing, no project navigation. Session is their entire context.

**5. The contract between the two products is the session**
Library creates a session playlist → review app renders it. Approved signal flows back → library changes asset state. That is the entire integration surface.

---

## Container model

Folders, collections, and playlists are the same concept — a container with different properties:

```
Container {
  parentId?      // hierarchical if set (folder), free-floating if not (collection)
  ownerTeamId?   // dept-owned if set, project-level if not  ← library-only concept
  ordered?       // playlist behavior if true
}
```

An asset is a **member** of one or more containers. Not a copy — a membership. Same asset ID, multiple organizational contexts.

`ownerTeamId` is a library concept only. The review app never sees or uses it.

---

## Organizational layers

```
DEPT LAYER (owned containers)          PROJECT LAYER (unowned containers)
──────────────────────────────         ──────────────────────────────────
Team-bound, dept team sees only        No owner, project-wide visibility

/Editorial/                            /Cuts/   ← smart, post-approval
  /Cuts/                               /Shots/  ← smart, post-approval
  /Selects/
/VFX/Framestore/                       + Session playlists (ordered)
/Costume/                                "Ep101 Director Review — S3"
/Locations/                              "Day 23 Selects"
```

**Smart containers** (`/Cuts/`, `/Shots/`) auto-populate on approval — not before. They are post-lock visibility containers for cross-department access, not pre-review staging areas.

Session playlists are built by the editorial assistant directly from dept-layer folders. No intermediate "Review Ready" flag is needed — the session creation IS the deliberate promotion decision.

---

## Asset lifecycle

```
working  →  [session created]  →  approved  →  released
              (elevated path)
              creative review
              renders session

working  →  [comments in place]  →  approved  →  released
              (operational path)
              library surface only
```

**State meanings:**
- `working` — in dept folder, dept team only, active iteration
- `approved` — creative review sends signal back OR dept owner marks approved
- `released` — access expands; for some asset types this is automatic on approval

**Release behavior is set at the folder level:**
- `/Editorial/` → `releaseOnApproval: 'project'` — locked cut auto-surfaces in `/Cuts/` project-wide
- `/VFX/Framestore/` → `releaseOnApproval: 'none'` — manual targeted release to specific depts

---

## Two review modes

**Elevated review** (creative review app surface)
- Audience: showrunner, director, studio exec
- Trigger: editorial assistant builds session playlist, pushes to review app
- Experience: polished screening, frame-accurate annotations, structured notes
- Outcome: approved signal → library changes asset state
- Editor is not in the room; receives distilled notes back

**Operational review** (library surface)
- Audience: dept supervisors, assistants, internal collaborators
- Trigger: none — comments happen directly on assets in place
- Experience: comment thread on asset, no session structure
- Outcome: owner marks approved; no formal approval workflow
- e.g. VFX QC, costume approval, location selects

---

## The editorial assistant's workflow

Entirely in the library:

```
Editor exports from Avid
    ↓
Asset lands in /Editorial/Cuts/  (dept-owned, editorial team only)
    ↓
Editorial assistant selects cuts, builds session playlist
    ↓
Session pushed to creative review app  (library creates → review renders)
    ↓
Director reviews, annotates, sends notes
    ↓
Notes delivered back to library  (surfaced on asset as structured feedback)
    ↓
Editor revises → new version → new asset in /Editorial/Cuts/
    ↓
Loop repeats
    ↓
Creative review marks approved → library receives signal
    ↓
Asset state → approved → auto-released → appears in /Cuts/ project-wide
```

---

## Integration contract

The session playlist is the entire seam between the two products.

**Library → Review app:** session object (ordered asset list, reviewer invites, expiry)
**Review app → Library:** approved signal (assetId, approvedBy, approvedAt, notes[])

Everything else stays on its side of the boundary.

Two open questions (not yet resolved — mark as branches in workshop):
1. Does the library push the session, or does the review app pull from the library?
2. Does the approved signal arrive via API (automatic) or manual action (editorial assistant bridges)?

---

## What creative review does NOT own

- Project folder structure or templates
- Access control / permissions
- Session creation UX (editorial assistant builds in library)
- Asset organizational metadata
- Release logic

These belong entirely to the library. The review app is a consumer of sessions, not an organizer of content.
