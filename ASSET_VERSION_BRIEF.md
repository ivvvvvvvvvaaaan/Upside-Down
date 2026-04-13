# Asset Versioning: Research Brief

*Early draft -- April 13, 2026. This brief is exploratory and will change as open questions are resolved.*

## Model: versioning is intrinsic to the asset, not the folder

An asset can have a version history. Multiple files representing iterations of the same creative work are not separate assets -- they are one asset with multiple versions. The UI shows the latest version by default with a version switcher to browse history. Same pattern as cuts.

Not all assets are versioned. Reference photos, storyboards, documents are standalone. Versioning applies to assets where iterative work produces discrete outputs: comps, plates, audio mixes, grades.

## How versions are created

The app is the ingest point. There is no upstream pipeline handing pre-versioned metadata. The app is the version authority.

Version relationships can be established by:

- **Auto-detection at ingest.** A file arrives with a recognizable version pattern in its name. The system finds earlier versions already in the workspace and proposes a version group. Production naming conventions are disciplined (Netflix has explicit naming specs for vendors), so pattern matching is reliable in this context.
- **Manual stacking.** A user uploads a new file as a version of an existing asset ("New Version" on the asset page), or drags one asset onto another to merge them into a version group. Handles edge cases where naming doesn't follow conventions.
- **Merging standalone assets.** Sometimes a file gets uploaded as a standalone asset before anyone realizes it's a new version of something. The system lets you merge it into an existing asset's version history after the fact, choosing what to keep: metadata, comments, or transcriptions from either the current or incoming asset.
- **Auto-versioning from connected storage.** When the workspace is connected to external storage (e.g., LucidLink), the system watches for file changes and auto-creates versions. A throttle (e.g., 60 seconds minimum between versions) prevents version spam from autosaves. Ignore patterns filter out temp files and intermediaries.
- **Future pipeline integration.** An upstream system (ShotGrid, AYON, ftrack) pushes version metadata at ingest time. The product model doesn't depend on this but can accept it.

All methods produce the same result: two or more files linked as versions of a single asset.

### Open question: confirmation at auto-detection

When the system auto-detects a version relationship, does it apply silently or propose and wait for confirmation? Silent is efficient but risks wrong groupings. Confirmation adds friction but is safer for a system where wrong version associations could mean someone sees the wrong iteration of sensitive footage. **To be decided.**

## Promoting and comparing versions

**Promote to current.** Any older version can be promoted to become the "current" version without re-uploading. Director says "v2 was better" -- the coordinator promotes v2 to current. This doesn't rewrite history; the version timeline stays intact, but "latest" now points to the promoted version.

**Version comparison.** Users can compare two versions side-by-side, overlaid with adjustable opacity, or with a wipe slider to spot differences. This is essential for the review workflow -- "what changed between v2 and v3?"

**Per-version feedback.** Comments, annotations, and transcriptions are tied to the version they were given on. Feedback on v2 stays on v2 when v3 is uploaded. When creating a new version, the user can choose whether to copy metadata, comments, or transcriptions from the previous version or start fresh.

## Versioning vs. cuts

Cuts and assets both have version histories. The ingestion process is the same -- a file is uploaded/ingested and the system detects or establishes a version relationship. The differences are structural, not mechanical:

| | Cuts | Assets |
|---|---|---|
| **Version labeling** | Named stages (locked-cut, final-cut, emf) | Sequential numbers only (v1, v2, v3) |
| **Constituents** | A cut is assembled from source assets | An asset is a single file |
| **Ingestion** | Same upload/ingest process | Same upload/ingest process |

The version access model is the same for both: in-department sees all, outside-department sees what the collection provides.

## Access: who sees which versions

### In-department (workspace)

Everyone sees all versions of all assets. The workspace is open internally. The version switcher shows the full history. No restrictions.

### Outside-department (collection share)

Version access is controlled by a per-collection toggle: **"Include version history."**

| Setting | Recipient sees | Use case |
|---------|---------------|----------|
| **Off** (default) | Latest version only. A "v3" badge indicates the asset has history. | Vendor handoff, executive review, general distribution |
| **On** | Full version history with version switcher and comparison tools. | Supervisor review, director review, cross-department collaboration |

The toggle is set by the sharer at share time, alongside the existing live/snapshot and "include new" settings. It applies to all versioned assets in the collection.

**Why per-collection, not per-department:** The same coordinator shares one collection with a vendor (latest only) and another with a supervisor (full history). The decision depends on the recipient's need, which the sharer knows at share time. A department-level setting would force one policy for all shares.

**Why default off:** Earlier versions may contain unapproved work, wrong color grades, sensitive iterations. The department should opt in to sharing history, not opt out.

### Version badge

Every versioned asset shows a version badge ("v3") regardless of whether the recipient has access to older versions. The badge is informational -- it tells the recipient "this is the third iteration" and "this is current." It does not grant access to earlier versions.

## Navigating from cuts to constituent versions

A cut is assembled from constituent assets (plates, comps, audio). The cut detail view shows its constituent list.

**The use case:** A VFX supervisor is reviewing a cut with the director. The director says "I don't like the new comp on shot 3 -- what was the previous one?" The supervisor drills into the constituent comp asset and switches to the previous version.

How this works at minimum:

1. Cut detail shows constituents (source asset list).
2. Each constituent is a link. If the supervisor has access to that asset (through any collection or share), the link is navigable.
3. If the constituent asset's collection has "include version history" on, the supervisor can switch versions.
4. If not, they see the latest version only.

The cut is the navigation context. The asset is where versioning lives. At minimum, the supervisor navigates to the constituent asset and switches versions there. Whether per-constituent version toggling within the cut itself (e.g., "swap the comp on shot 3 without leaving the cut view") is also supported is an open question -- see below.

**Coordinator workflow for this use case:** Create a collection containing the cuts AND the relevant source assets. Share with "include version history" on. The supervisor can review the cut, drill into any constituent, and flip through versions with the director.

## Interaction with sharing modes

Version history interacts with the existing live/snapshot share modes:

| Share mode | Include version history OFF | Include version history ON |
|------------|---------------------------|--------------------------|
| **Live** | Recipient sees latest version of each asset as it evolves. When v4 is published, they see v4. v3 disappears. | Recipient sees all versions and receives new ones as they're published. |
| **Snapshot** | Recipient sees the version that was latest at snapshot time. Frozen. | Recipient sees all versions that existed at snapshot time. Frozen -- no new versions unless re-shared. |

## What the industry does

- **Iconik** (closest reference): Automatic versioning on upload. Multiple creation paths: upload new file, merge existing assets, auto-detect from storage gateway. Version comparison (side-by-side, overlay, wipe). Promote older versions to current. Per-version comments and transcriptions. Version count badge in search results. Version viewing gated behind a role (`web_can_view_versions`). ACLs are additive only -- no negative ACLs.
- **Frame.io:** Version Stacks. Manual -- drag new upload onto old one. Latest on top. Side-by-side comparison. All versions visible within the stack.
- **ShotGrid/Flow:** Two entities: Version (WIP iterations for review) and PublishedFile (approved output for downstream). Structurally separate. Studios configure their own pipeline integration.
- **LucidLink:** No per-file versioning. Filespace-level snapshots (point-in-time restore). Version discipline is file naming.

**Where this model goes further than existing tools:** None of these systems provide version-aware access control at the collection level. Iconik gates version viewing behind an all-or-nothing role. This model's per-collection "include version history" toggle gives the sharer granular control over who sees history and who sees latest-only, per share.

## The rules

1. **An asset can have a version history.** Not all assets do -- versioning applies to iterative creative work.
2. **The app is the version authority.** Versions are established at ingest via auto-detection, manual stacking, merge, or storage gateway.
3. **Version relationships are intrinsic to the asset.** They travel with the asset across collections, shares, and re-shares. Not folder-dependent.
4. **In-department: all versions visible.** The workspace is open.
5. **Outside-department: latest by default.** "Include version history" toggle on the collection controls access to older versions.
6. **Version badge is always visible.** "v3" tells the recipient this is iterative work, regardless of history access.
7. **Promote, don't re-upload.** Older versions can be promoted to current without creating a duplicate.
8. **Feedback is per-version.** Comments and annotations stay on the version they were given on.
9. **Cuts link to constituent assets.** Drill from cut to constituent, switch versions there.
10. **Default to safe.** History is hidden outside the department unless the sharer explicitly enables it.

## Scenario results

- **S1 (supervisor reviews with director):** WORKS. Collection contains cuts + source assets with "include version history" on. Supervisor drills into constituent comp, switches to previous version. Director compares side-by-side.
- **S2 (vendor receives plates):** WORKS. Collection shared with "include version history" off (default). Vendor sees latest plate versions only. "v3" badge tells them it's current.
- **S3 (coordinator re-shares updated turnover):** WORKS. Snapshot mode with "include version history" off. Vendor sees exactly what was current at snapshot time. Re-share creates new snapshot version with updated assets.
- **S4 (cross-department collaboration):** WORKS. Editor shares comp collection with audio team, "include version history" on. Audio team can browse comp iterations to understand creative direction changes.
- **S5 (asset shared two hops away):** WORKS. Version badge ("v3") travels with the asset. History access depends on the collection settings at each hop. If the re-sharer's collection has history off, the downstream recipient sees latest only -- even if the re-sharer has full history access. Permission ceiling applies.
- **S6 (director prefers older version):** WORKS. Coordinator promotes v2 to current. Everyone who sees latest-only now sees v2. Version history still shows v1, v2, v3 in order -- promotion changes what "current" points to, not the timeline.
- **S7 (wrong version grouped):** WORKS. User ungroups the wrongly associated version. The asset becomes standalone again or can be merged into the correct group.
- **S8 (file updated on connected storage):** WORKS. Storage gateway detects the change, creates a new version after throttle period. Users see the update in the workspace. Shared collections with live mode reflect the new version; snapshot collections stay frozen.

## Open questions

1. **Auto-detection confirmation:** Silent grouping vs. propose-and-confirm at ingest time.
2. **Ungrouping:** Can a user break a version group? If a file was wrongly grouped, can they remove it and make it standalone?
3. **Cross-department version groups:** Can assets from different departments be versions of the same logical asset? (Probably not -- version groups should be within a single workspace.)
4. **Version deletion:** If v2 is deleted from the workspace, does the version group maintain gaps (v1, v3) or renumber? Maintaining gaps preserves the badge meaning.
5. **Per-constituent version toggling in cuts:** Can a reviewer swap a constituent's version directly within the cut view (e.g., "show me this cut but with the previous comp on shot 3")? This would be more powerful than navigating away to the asset. Needs UX exploration.
6. **Metadata carry-over defaults:** When a new version is created, should metadata (tags, descriptions) carry over automatically? Should comments? What's the right default vs. what should be a choice?
7. **Storage gateway scope:** Which connected storage changes trigger auto-versioning vs. create new standalone assets? How does the system distinguish "updated file" from "new file"?
