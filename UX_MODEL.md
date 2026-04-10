# Next-Gen Media Library: UX Model

*Last updated: 2026-04-10. Second autoresearch pass. Corrects the domain/department conflation from the April 9 run. See RESEARCH_BRIEF.md section 5 for updated evaluation criteria.*

---

## Concepts (what the user must learn)

1. **Department** -- your team. You belong to a department (VFX, Editorial, Camera, etc.). Department membership gives you full access to your department's workspace. Intra-department = open. Managed in-app by coordinators.
2. **Workspace** -- your department's private file system. Folders and files. Only department members see it. Production departments have workspaces; distribution domains don't.
3. **Collection** -- a named group of assets. How assets get in is a setting: (a) you pick them manually, (b) a filter picks them automatically, or (c) they mirror a workspace folder. One concept, one share model, regardless of how contents are populated.
4. **Asset** -- an individual file (shot, video, image, audio, text). A cut is a composite asset assembled from files across departments. Sharing a cut grants playback access, not constituent access.
5. **Permission level** -- what you can do with what you received. Each level includes everything above it:
   - **View** -- open, preview, download.
   - **Comment** -- leave feedback, annotations, timecoded notes.
   - **Add** -- upload new files into the collection. Cannot modify or delete existing content.
   - **Edit** -- modify existing content, reshare with others.
   - **Manage** -- change permissions, remove people, delete the collection.

### Features within sharing (not standalone concepts)

- **Groups**: saved recipient lists. Autocomplete in the share dialog. Expand to individual grants.
- **Review links**: option in the share dialog for external reviewers. Expiring, passcode-optional, watermark-optional.
- **Inbox**: notification surface for shares received.
- **Role templates**: preset permission bundles (e.g., "reviewer" = view + comment). Power feature for coordinators.

### Infrastructure concepts (not user-facing, but load-bearing)

- **Domain**: CAM capability layer. Controls tool access and release channels. 15+ domains in 3 tiers (Studio/Wide/Other). Managed by CAM, not by this app. Users have domain capabilities that determine what they can release to. Domains are NOT the same as departments.

---

## Two-layer access model

### Layer 1: Department (workspace boundary)

You belong to a department. You see your department's files. Everyone in VFX sees all VFX files -- including WIP. This is by design: intra-department visibility is the baseline. The boundary protects against cross-department leaks, not within-department visibility.

Department membership is managed in-app (coordinators add/remove people). This is separate from CAM domain membership.

### Layer 2: Share + Release (crossing the boundary)

Two mechanisms for content to cross department boundaries:

**Share** (People tab) -- targeted, relationship-defined.
- Share with a person, a team, or a group.
- App-specific grant. CR doesn't automatically see it.
- Per-recipient settings: live/snapshot, upload enabled, expiration, permission level.
- Smart defaults: vendor → snapshot + add + upload. Person → live + view.

**Release** (Release tab) -- broadcast, audience-defined.
- Release to one or more domains (Studio Creative, Marketing, Legal, etc.).
- CAM-backed grant. Travels across apps. CR can honor domain releases.
- View or Comment only. No upload, no live/snapshot toggle.
- **Release is always outward.** You release FROM your department TO other domains. You never release to your own domain -- it's a no-op (you already have workspace access). The release UI filters out the asset's origin department.
- Release capability is CAM-gated: you can only release to domains you hold the capability for.

---

## Sharing model

One dialog. Two tabs for assets and cuts:

**People tab:**
- Search field for people and teams
- Existing person/team grants with role pickers
- Shared-via-collection grants
- Pending additions with per-recipient settings
- Guest links

**Release tab** (assets and cuts only):
- Domain pills grouped by tier (Studio / Wide / Other)
- Asset's own domain filtered out (no self-release)
- Already-released domains shown as active
- Click to stage/unstage pending releases
- Existing domain release entries below pills

For collections and folders: People tab only (no Release tab -- domain release applies to individual assets/cuts, not containers).

---

## Access control

- Access is additive. No deny rules. The sum of all grants = what you can see.
- Departments are workspace boundaries. Content stays in the department unless explicitly shared or released.
- Department membership is managed in-app by coordinators. This is separate from CAM domain capabilities.
- Groups expand at share time into individual grants. No retroactive inheritance.
- Filtered collections show personalized results: "47 assets (you can access 23)." Filter criteria always visible.
- Curated/shared collections show everyone the same assets.
- Moving a file is an access decision. Warning before moves that affect shared collections: "Moving this file removes it from 2 collections. 5 people lose access."
- Cross-department sharing warning: "Sarah Chen is not in your domain. This share will give her access to [N] assets."
- Release blast radius: "Release to Wide makes this visible to Marketing, Legal, Globalization... (~N people)."

## Ownership

- Department collections are owned by the department (any department member with manage access can manage).
- Personal collections are owned by the creator.

## VFX turnover support

A turnover is a collection pattern, not a separate entity.

**How it works:** Coordinator creates a collection, adds the scoped set of plates/reference/notes, shares as snapshot with upload enabled. Vendor receives the frozen brief, uploads deliveries into the same collection.

**Re-turnovers via collection versioning:** When the cut changes, the coordinator updates the collection contents and re-shares. The system records this as a new version (v2, v3...). Each version captures what changed. The vendor sees "Version 2: +3 assets, -1 asset" with a note from the coordinator.

## Sensitive media

Asset-level flag, set by the creating department. Even if you have access to a collection containing a sensitive asset, you only see it if you hold the "sensitive media" CAM capability. Orthogonal to permission levels. Collections containing sensitive assets show: "3 of 12 assets restricted."

## Cross-app behavior

Two channels, one share dialog:
- **Domain releases travel across apps.** CAM-backed. Content Hub, Creative Review, and future apps read the same domain grants.
- **Person/group shares are app-specific.** CR doesn't automatically see them.
- **Push to CR:** Release to the Creative Review domain. CR honors domain grants.

## Domain ≠ Department

| | Department | Domain |
|---|---|---|
| **What it is** | Workspace boundary | Release channel / tool access |
| **Managed by** | In-app (coordinators) | CAM (capabilities) |
| **Scope** | Asset-level access within the project | Cross-app tool access and content distribution |
| **User relationship** | "I belong to VFX" (see VFX files) | "I can release to Studio Creative" (capability) |
| **Intra-boundary** | Open -- everyone sees everything | N/A -- domains don't have internal content |
| **Cross-boundary** | Gated -- share or release | Release = outward only |

A user belongs to a department (gets workspace access) AND holds domain capabilities (can release to specific domains). These are independent.

## Vocabulary

| Concept | This model | CAM | Content Hub | Creative Review |
|---|---|---|---|---|
| Team boundary | Department | -- | -- | -- |
| File space | Workspace | -- | LucidLink sync | Folders with templates |
| Release channel | Domain | Domain | Domain | Domain |
| Group of assets | Collection | -- | Collection | Playlist |
| Formal distribution | Release (to domain) | -- | Release | -- |
| Targeted collaboration | Share (to person/team) | -- | Share | Share |

"Department" is a new concept introduced by the next-gen library. "Domain" is existing CAM infrastructure. They serve different purposes.
