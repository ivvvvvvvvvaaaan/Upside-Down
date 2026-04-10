# Next-Gen Media Library: UX Model

*April 10, 2026*

## The model

1. You belong to a **department**. You see your department's files.
2. Your files live in a **workspace**. Everyone in the department sees everything in it. The workspace and the library are the same files -- folders to organize, search and metadata to discover.
3. To send content outside your department, you **share** it (with a person or team) or **release** it (to an audience like Marketing or Studio Creative).
4. Sharing uses **collections** -- named groups of assets. You control what goes in, who sees it, and what they can do with it.
5. Releasing is a broadcast. You toggle audience groups on/off. Released content travels across apps.
6. What someone can do depends on their **permission level**: view, comment, add, edit, or manage.
7. Content stays in your department until you share or release it. Every permission is traceable and revocable.
8. Release is the formal publication step. Releasing to "Studio VFX" makes the asset visible to the Studio VFX audience -- which is broader than the VFX workspace. Department membership and release audience membership overlap but are not the same.

---

## Concepts

### Department

Your team. VFX, Editorial, Camera, Art & Design, Audio & Sound. Department membership gives you full access to your department's workspace. Everyone inside sees everything -- including work in progress. The boundary protects against cross-department leaks, not within-department visibility.

Membership is seeded from project onboarding and managed in-app by coordinators. The VFX coordinator knows who should be in the VFX workspace. A user can belong to more than one department.

### Workspace

Your department's files. Every file in the workspace is an asset -- no promotion step, no toggle. Drop a file in, it gets a thumbnail, it's searchable, taggable, shareable. The system handles metadata extraction and AI tagging in the background.

Two views of the same data:
- **Workspace view** -- folder tree. How you organize.
- **Library view** -- search, metadata, smart collections. How you discover.

DITs and editors work in the workspace view. Directors and supervisors browse the library view. Both see the same files. Production departments have workspaces. Distribution audiences (Marketing, Legal) don't -- they receive content via releases.

### Collection

A named group of assets. How assets get in is a setting:
- **Manual** -- you pick them.
- **Filtered** -- a filter picks them automatically (e.g., all assets tagged "final").
- **Folder-linked** -- mirrors a workspace folder's contents.

One concept. Same share model regardless of how contents are populated. Filtered collections show personalized results: "47 assets (you can access 23)." Shared collections show everyone the same contents.

### Asset

An individual file -- shot, video, image, audio, text. A cut is a composite asset assembled from files across departments. Sharing a cut grants playback access, not constituent access: the recipient can watch it but can't browse or download the individual source files unless those were shared separately. Each department controls when their source material is ready to share.

### Permission level

What you can do with what you received. Each level includes everything above it:
- **View** -- open, preview, download.
- **Comment** -- leave feedback, annotations, timecoded notes.
- **Add** -- upload new files. Cannot modify or delete existing content.
- **Edit** -- modify existing content, reshare with others.
- **Manage** -- change permissions, remove people, delete.

---

## Sharing and releasing

### One dialog, two tabs

For assets and cuts, the share dialog has two tabs:

**People** -- targeted sharing.
- Search for people and teams.
- Per-recipient settings: live or snapshot, upload enabled, expiration, permission level.
- Smart defaults: vendor gets snapshot + add + upload. Person gets live + view.
- Guest links for external reviewers (expiring, passcode-optional, watermarkable).

**Release** -- broadcast distribution.
- Audience groups organized by tier: Studio, Wide, Other.
- Toggle groups on/off. One-click presets: "Release to all Studio," "Release to all Wide."
- View or Comment only. No upload, no live/snapshot.
- All release audiences available based on your CAM capabilities.
- Released content is CAM-backed. It travels across apps.

For collections and folders: People tab only. Release applies to individual assets and cuts.

### How sharing works

- **Single asset**: direct grant on the asset.
- **Collection**: grant on the collection; recipients see everything in it.
- **Folder**: creates a collection behind the scenes; grant on that.

Shares are app-specific -- Creative Review doesn't automatically see them. Releases are CAM-backed -- any app that reads domain grants can honor them.

### Groups, review links, and role templates

These are features within sharing, not standalone concepts:
- **Groups**: saved recipient lists. Expand to individual grants at share time. No retroactive inheritance.
- **Review links**: expiring, scoped invitations for external reviewers. No account needed.
- **Role templates**: preset permission bundles for coordinators ("reviewer" = view + comment).

---

## Access control

Access is additive. No deny rules. The sum of all grants determines what you can see. To restrict, remove the share.

Three access paths, each traceable:
1. **Department membership** -- "You're in VFX, so you see VFX workspace files."
2. **Share** -- "Lisa shared this collection with you on Feb 13."
3. **Release** -- "This was released to Studio Creative on Feb 18."

### Safety mechanisms

- **Cross-department warning**: "Sarah Chen is not in your department. This share will give her access to N assets."
- **Release blast radius**: "Release to Wide makes this visible to Marketing, Legal, Globalization... (~N people)."
- **File move warning**: "Moving this file removes it from 2 shared collections. 5 people lose access."
- **Leave action**: recipients can leave a shared collection. Their grant is removed; the collection stays for everyone else.
- **Access requests**: discover an asset through search, request access. The request goes to the department coordinator who approves or denies.

### Sensitive media

Asset-level flag set by the creating department. Even with collection access, you only see sensitive assets if you hold the sensitive media capability. Orthogonal to permission levels. Collections show: "3 of 12 assets restricted."

---

## Turnovers

A turnover is a collection pattern, not a separate entity.

The coordinator creates a collection, adds the scoped set of plates, reference cuts, and notes, then shares it as a snapshot with upload enabled. The vendor receives the frozen brief and uploads deliveries into the same collection.

When the cut changes, the coordinator updates the collection and re-shares. The system records this as a new version with a change delta. The vendor sees "Version 2: +3 assets, -1 asset" with a note from the coordinator.

---

## Distribution audiences

Users in distribution domains (Marketing, Legal, Globalization) don't have workspaces. Their experience:

- Released content fills their library, organized by smart collections and release date.
- Shared collections appear in their inbox.
- They can comment and request access but don't create content or organize files.

The same 5 concepts apply. The workspace concept simply doesn't appear for them.

---

## Cross-app behavior

- **Releases travel across apps.** CAM-backed. Content Hub, Creative Review, and future apps read the same grants.
- **Shares are app-specific.** Creative Review doesn't automatically see Content Hub shares.
- **Push to CR**: release to the Creative Review domain. One action.

---

## Department and domain

These are different things.

| | Department | Domain |
|---|---|---|
| What it is | Workspace boundary | Release channel |
| Managed by | In-app (coordinators) | CAM (capabilities) |
| Scope | Files within a project | Cross-app content distribution |
| User relationship | "I belong to VFX" | "I can release to Studio Creative" |
| Internal visibility | Open -- everyone sees everything | N/A |
| Cross-boundary | Gated by share or release | Outward only |

Each production department maps to release domains:

| Department | Release domain(s) |
|---|---|
| VFX | Studio VFX |
| Editorial | Production Editorial, Studio Post |
| Art & Design | Studio Creative |
| Camera | -- (shares via collections) |
| Audio & Sound | -- (shares via collections) |

Not every department releases. Some distribute exclusively via collections. The mapping is project configuration.

---

## Vocabulary

| Concept | This model | Content Hub | Creative Review | CAM |
|---|---|---|---|---|
| Team boundary | Department | -- | -- | -- |
| File space | Workspace | CDrive + LucidLink | Folders | -- |
| Group of assets | Collection | Collection | Playlist | -- |
| Release channel | (audience groups) | Domain | Domain | Domain |
| Broadcast | Release | Release | -- | -- |
| Targeted share | Share | Share | Share | -- |
