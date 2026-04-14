# Next-Gen Media Library: UX Model

*April 10, 2026*

## The model

1. Your files live in your **department's workspace**. Everyone in the department sees everything. Nothing leaks out.
2. To send content outside, you **share** a collection (with people or teams) or **release** an asset (to an audience like Marketing).
3. You control what goes in each **collection**, who sees it, and what they can do. The recipient sees exactly what you gave them.
4. What someone can do depends on their **permission level** (viewer, editor, manager) plus modifiers (download, comment, upload).
5. Everything is **traceable and revocable**. Every share, every release, every access path.

---

## Concepts

### Department

Your team. VFX, Editorial, Camera, Art & Design, Audio & Sound. Department membership gives you full access to your department's workspace. Everyone inside sees everything -- including work in progress. The boundary protects against cross-department leaks, not within-department visibility.

Membership is seeded from project onboarding and managed in-app by coordinators. The VFX coordinator knows who should be in the VFX workspace. A user can belong to more than one department.

### Workspace

Your department's files, organized in folders. Every file is an asset. Drop a file in, it gets a thumbnail, it's searchable, taggable, shareable.

Search covers everything you have access to: your workspace, shared collections, released content.

### File Identity

A file has one identity regardless of how many places it appears. When you drag a VFX comp from your shots folder into the Framestore delivery folder, the system creates a **reference**, not a copy. The original file stays in place. The reference appears in the target folder. Both point to the same asset.

This matters because:
- No storage duplication. One file, one set of bytes.
- One version history. Updating the comp updates it everywhere.
- One metadata set. Tags, AI analysis, review notes stay unified.
- Independent access paths. The original is accessible via the VFX workspace. The reference is accessible via the Framestore share. Revoking the share removes the reference without touching the original.

The default action is always non-destructive: adding a file to another location creates a reference. The original stays in place. A toast confirms: "Added to Framestore. Keep original. [Move instead]." One click to convert to a move if that's what the user intended. No modal, no interruption, safe default.

### Collection

A named group of assets. How assets get in:
- **You pick them** -- drag assets in, or select and add.
- **A filter picks them** -- automatically matches assets by metadata (e.g., all assets tagged "final").

That's it. Two modes.

**Folders and collections are different things with different jobs.** A folder is how you organize your workspace (spatial, hierarchical, like a filing cabinet). A collection is how you share and group for a purpose (semantic, flat, like a playlist). An asset can be in a folder AND in a collection. The department that created the asset owns it. Folders organize, collections share.

Filtered collections show personalized results: "47 assets (you can access 23)."

**Live or snapshot is a per-share choice.** Synced (live): new assets added to the collection appear, updated versions of existing assets are visible. Frozen (snapshot): both the asset list and asset versions are locked at share time. The vendor sees exactly what was shared. To update, the coordinator re-shares, creating a new version with a change delta. Default is live for internal shares, snapshot for vendor handoffs.

### Asset

An individual file -- shot, video, image, audio, text. An asset exists the moment it enters the system. It does not need a workspace folder. It can be created by dropping a file into a workspace (automatic), uploading to a collection (vendor delivery), or assembling from other assets (cut).

An asset can appear in zero folders, one folder, or many collections. Its identity, metadata, and version history are independent of where it appears.

A cut is a composite asset assembled from files across departments. Sharing a cut grants playback access, not constituent access: the recipient can watch it but can't browse or download the individual source files unless those were shared separately. Each department controls when their source material is ready to share.

### Permission level

What you can do with what you received. Three levels, aligned to CAM:
- **Viewer** -- open and preview.
- **Editor** -- write, modify metadata, reshare.
- **Manager** -- delete, change permissions, manage people.

Extra capabilities are modifiers toggled per-share, not separate levels:
- **Download** -- can download source files.
- **Comment** -- can leave feedback and annotations.
- **Upload** -- can add new files (vendor turnovers).
- **Include new** -- automatically receives newly added assets.

The share dialog shows presets for common combinations (Reviewer = Viewer + Download + Comment, Turnover = Viewer + Download + Upload). One dropdown, one click for 90% of shares.

---

## Sharing and releasing

### One dialog, two tabs

For assets and cuts, the share dialog has two tabs:

**People** -- targeted sharing.
- Search for people and teams.
- Per-recipient settings: live or snapshot, upload enabled, expiration, permission level.
- Smart defaults: vendor gets snapshot + upload. Person gets Reviewer (view + download + comment).
- **Share note**: optional message attached to the share ("EP301 plates, smoke ref coming Thursday. This is turnover 1 of 3."). The note appears in the recipient's inbox and on the collection. The file alone doesn't tell the recipient anything — the note makes it actionable.
- Guest links for external reviewers (expiring, passcode-optional, watermarkable).

**Release** -- broadcast distribution.
- Audience groups organized by tier: Studio, Wide, Other.
- Toggle groups on/off. One-click presets: "Release to all Studio," "Release to all Wide."
- View or Comment only. No upload, no live/snapshot.
- All release audiences available based on your CAM capabilities.
- Released content is CAM-backed. It travels across apps.

For collections and folders: People tab only. Release applies to individual assets and cuts.

### How sharing works

A single asset is shared as-is. A folder creates a collection when shared. The folder stays in the department; the collection mirrors its contents and is what the recipient sees. The department can reorganize, rename, or restructure the folder without breaking the share. When new content lands in the folder, it appears in the collection automatically. This is how department work reaches people outside the department without giving them access to the whole workspace.

How multi-select sharing works (selecting several assets and clicking Share) is an open question. The system could auto-create a collection, but that introduces naming and visibility questions. The alternative is two intentional steps: create a collection, then share it.

The permission level applies to every asset in the collection. The system caps per-asset permissions by what the sharer actually has. This is invisible in most cases.

Shares are app-specific -- Creative Review doesn't automatically see them. Releases are CAM-backed -- any app that reads domain grants can honor them.

### Groups, review links, and role templates

These are features within sharing, not standalone concepts:
- **Groups**: saved recipient lists. Expand to individual grants at share time. No retroactive inheritance.
- **Review links**: expiring, scoped invitations for external reviewers. No account needed.
- **Role templates**: preset permission bundles for coordinators ("reviewer" = view + comment).

---

## Access control

Access is additive. No deny rules. The sum of all grants determines what you can see. To restrict, remove the specific share that gave them access. If they have access through multiple paths (department, collection, direct share), the permissions panel shows every path and lets you revoke each one. Removing one path tells you if others remain.

When content has versions (cuts progressing through locked cut, final cut, EMF), access is to the entity, not the version. Internal recipients see all versions and future versions automatically. Vendors are locked to the version current at share time. A coordinator can downgrade any share to version-locked.

Three access paths, each traceable and displayed in the access tab of every asset:
1. **Department** -- "You're in VFX, so you see VFX workspace files."
2. **Share** -- "Lisa shared this collection with you on Feb 13." Shows the sharer, date, and note.
3. **Release** -- "This was released to Studio Creative on Feb 18."

Any user can open the access tab on any asset they can see and understand exactly why they have access. No ambiguity.

### Coordinator visibility

Department coordinators see a complete picture of what's shared:
- **Shared page**: every active share involving their department's assets. Who shared, who received, when, what permission level. Filterable by outgoing (shares I created), incoming (shares to my department), and all (admin view).
- **Per-asset access tab**: every path someone has to a specific asset (department, collection, release). One view, complete trail. Shows "Shared by [name] on [date]" for each path.
- **Per-collection access tab**: who has access, what they can do. For recipients: simplified view showing only their own access and the share note.

A coordinator can answer "who has access to this?" in one click. They can revoke any share with one action. They can see every collection containing their department's assets, even collections created by other departments.

### Safety mechanisms

- **Cross-department warning**: sharing outside your department triggers a confirmation: "Sarah Chen is not in your department. This share will give her access to N assets." Names the recipients and their departments.
- **Vendor warning**: sharing with a vendor team triggers: "This is an external vendor. N assets will be accessible outside Netflix."
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

Vendor uploads become assets in the collection. They do not automatically appear in the coordinator's workspace. The coordinator gets a notification: "Framestore uploaded 3 assets to Framestore EP301." The coordinator reviews deliveries in the collection and files approved ones into their workspace when ready. This gives the coordinator a gate: the team sees only what the coordinator has reviewed and approved.

When the cut changes, the coordinator updates the collection and re-shares. The system records this as a new version with a change delta. The vendor sees "Version 2: +3 assets, -1 asset" with a note from the coordinator.

---

## The reviewer experience

Directors, VPs, and other reviewers don't manage files. Their entire experience:

1. A notification arrives (email, Slack, or in-app inbox): "Lisa shared EP301 Locked Cut 2."
2. They click. The content plays. They comment. They close the tab.
3. They never see a workspace, a folder tree, or a permission dialog.

If the reviewer was added to a collection, they see the collection contents — not the sender's workspace structure. If they received a review link, they see one asset. The tool is invisible.

For reviewers who want to browse: the library view shows everything they have access to, organized by smart collections (characters, scenes, locations). They search and discover. They never manage.

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

