# Next-Gen Media Library: UX Model

*Last updated: 2026-04-09. Output of autoresearch loop (22 experiments, 17 kept, 5 reverted). Score: 2.1 -> 5.0. See `results.tsv` for experiment log, `RESEARCH_BRIEF.md` for inputs, `PROGRAM.md` for loop methodology. This is the current source of truth for the conceptual model. Supersedes previous ACCESS_CONTROL.md, COLLECTIONS.md, UNIFIED_COLLECTION_MODEL.md, and SHARING_PLAN.md.*

---

## Concepts (what the user must learn)

1. **Domain** -- your team. Managed by CAM, not by this app. You belong to a domain (STUDIO_VFX, PRODUCTION_EDITORIAL, etc.). You see your domain's files. Domains are settled infrastructure: 15+ exist in 3 tiers (Studio/Wide/Other), each CAM-capability-gated.
2. **Workspace** -- your domain's private file system. Folders and files. Only domain members see it. Production domains (STUDIO_VFX, PRODUCTION_EDITORIAL, etc.) have workspaces because they create and organize files. Distribution domains (MARKETING, LEGAL, GLOBALIZATION) don't have workspaces -- they receive content via releases and shares. Not every domain needs a workspace; the model handles both naturally.
3. **Collection** -- a named group of assets. How assets get in is a setting: (a) you pick them manually, (b) a filter picks them automatically, or (c) they mirror a workspace folder. One concept, one share model, regardless of how contents are populated.
4. **Asset** -- an individual file (shot, video, image, audio, text). A cut is a composite asset assembled from source files across domains. **Sharing a cut grants playback access, not constituent access.** The recipient can watch the cut and comment on it. They cannot browse, download, or access the individual source files (VFX plates, audio stems, timeline files) unless those were shared separately. This preserves each domain's control over their source material: VFX decides when plates are ready to share; editorial sharing a cut doesn't override that decision.
5. **Permission level** -- what you can do with what you received. Each level includes everything above it:
   - **View** -- open, preview, download.
   - **Comment** -- leave feedback, annotations, timecoded notes.
   - **Add** -- upload new files into the collection. Cannot modify or delete existing content. The critical boundary for vendor workflows.
   - **Edit** -- modify existing content, reshare with others.
   - **Manage** -- change permissions, remove people, delete the collection.

### Features within sharing (not standalone concepts)

These exist in the share dialog and notification system but are not things users need to learn upfront:

- **Groups**: saved recipient lists. Autocomplete in the share dialog. Expand to individual grants.
- **Review links**: an option in the share dialog for external reviewers. Expiring, passcode-optional, watermark-optional.
- **Inbox**: notification surface for shares received. Not a concept to learn -- it's just where notifications appear.
- **Role templates**: preset permission bundles (e.g., "reviewer" = view + comment). Power feature for coordinators. Appears in the permission picker dropdown.

## Sharing model

One dialog. One action. You share something with a recipient. The recipient can be:
- **A person** -- direct, targeted share.
- **A group** -- address book shortcut; expands to individual grants at share time.
- **A domain** -- broadcast release; everyone in that domain gets access. Labeled "Release to [domain]" for familiarity with existing Content Hub language.

What you can share:
- **Single asset**: direct grant on the asset itself.
- **Collection**: grant on the collection; recipients see everything in it.
- **Folder**: creates a collection behind the scenes; grant on that.

Per-recipient settings: live (synced) or snapshot (frozen), upload enabled, expiration.

**Smart defaults reduce decisions.** Share with a person → defaults to live, view permission. Share with a vendor → defaults to snapshot, add permission, upload enabled. Share with a domain → defaults to view, no expiration. The user can change any default, but the common case is one click: select recipient, hit share. Role templates (e.g., "reviewer" = view + comment) further reduce per-share decisions for coordinators.

Domain recipients appear in a grouped list: Studio tier first, Wide tier second, Other third. Only domains the user has release capability for appear in autocomplete.

**Cross-domain sharing warning.** When sharing with someone outside your domain, the share dialog shows a confirmation: "Sarah Chen is not in your domain (STUDIO_VFX). This share will give her access to [N] assets from your workspace." Similar to Google Docs' "This person is outside your organization" warning. Prevents accidental cross-boundary shares while keeping intentional ones frictionless (one extra click). For domain-level releases, the warning shows the full blast radius: "Release to Wide makes this visible to Marketing, Legal, Globalization... (estimated 47 people)."

## Access control

- Access is additive. No deny rules. The sum of all grants = what you can see.
- Domains are boundaries. Workspace content stays in the domain unless explicitly shared.
- **Moving a file is an access decision.** If an asset is in a folder-linked collection, moving it out of that folder removes it from the collection (and from every share that collection has). The system warns before this happens: "Moving this file will remove it from 2 shared collections. 5 people will lose access." This directly prevents the F1 scenario (hundreds of hours lost to access triaging from folder moves).
- Domain membership is managed by CAM, not by this app. No in-app domain management.
- Groups expand at share time into individual grants. No retroactive inheritance.
- **Leave action.** A recipient can leave a shared collection at any time. Their grant is removed; they stop seeing it. The collection stays intact for everyone else. Leaving is not deleting -- only members of the owning domain can delete a collection. This gives recipients control without affecting others.
- Filtered collections show personalized results: "47 assets match this filter (you can access 23)." Two people see different subsets based on their access. This is correct behavior -- like a search engine returning different results based on your permissions. The filter criteria are always visible.
- Curated/shared collections show everyone the same assets. "12 assets. Everyone with access sees all 12." This is the sharing mode -- you control exactly what the recipient sees.

## What distribution-domain users see

Users in distribution domains (MARKETING, LEGAL, GLOBALIZATION, etc.) don't have workspaces. Their experience is:

- **Released content.** Assets released to their domain appear in their library, organized by smart collections (characters, scenes, locations) and by release date. This is their primary content surface.
- **Shared collections.** Collections shared with them directly (person or group share) appear in their inbox and collections list.
- **No workspace, no folder tree.** They browse, search, and filter -- they don't organize files. They're consumers, not producers.

This is clean: production domains produce and organize (workspace + collections). Distribution domains consume and respond (released content + shared collections). The same 5 concepts apply to both, but the workspace concept simply doesn't appear for distribution users.

## Ownership

- Domain collections are owned by the domain (any domain member with manage access can manage).
- Personal collections are owned by the creator.

## VFX turnover support

A turnover is a collection pattern, not a separate entity.

**How it works:** Coordinator creates a collection (e.g., "Framestore SQ03"), adds the scoped set of plates/reference/notes, shares as snapshot with upload enabled. Vendor receives the frozen brief, uploads deliveries into the same collection.

**Re-turnovers via collection versioning:** When the cut changes, the coordinator updates the collection contents and re-shares. The system records this as a new version (v2, v3...). Each version captures: what was added, what was removed, what changed. The vendor sees "Version 2: +3 assets, -1 asset" with a note from the coordinator.

**Version history** is not a new concept -- it's a property of sharing. Every re-share of a snapshot collection creates a version. The coordinator can see the full version timeline. The vendor sees their current version and what changed from the previous one.

**Notes per version:** When re-sharing, the coordinator attaches notes ("re-turnover: 3 new shots from locked cut 2, dropped SQ03_SH0020 -- client approved alternate take").

## Sensitive media

An asset-level flag, set by the creating domain. Even if you have access to a collection containing a sensitive asset, you only see it if you hold the "sensitive media" CAM capability. This is orthogonal to permission levels -- you can have edit access to a collection and still not see sensitive assets within it.

Collections containing sensitive assets show a badge: "3 of 12 assets are restricted based on your capabilities." No new concept for the user to learn -- it works like content ratings. The flag is set by people who create the content (editorial), not by people who share it.

## Cross-app behavior

Two channels, one share dialog:

- **Domain shares travel across apps.** When you release content to STUDIO_VFX, the grant is CAM-backed. Any app that checks CAM domain grants can honor it. Content Hub, Creative Review, and future apps all read the same domain grants. This is the formal distribution channel.

- **Person/group shares are app-specific.** When you share a collection with Sarah, that's a Content Hub grant. Creative Review doesn't automatically see it. If CR needs it, someone pushes it to CR explicitly (or CR builds the ability to read Content Hub grants -- a future integration).

This distinction falls out naturally from how sharing works: domains are CAM infrastructure (cross-app by nature), people are app-level grants (app-specific by nature). The user doesn't need to think about this split -- they share with whoever they want, and the system handles where the grant lives.

**The "push to CR" workflow:** If a coordinator shares a cut in Content Hub and wants it reviewable in CR, they share it with the CREATIVE_REVIEW domain (which is a real domain in CAM). CR honors domain grants. No separate "push" action needed -- domain release IS the cross-app mechanism.

## Domain integration

Domain replaces "department" as the boundary concept. This aligns with real Content Hub infrastructure where all access control runs through domains. The relationship is now direct: domain = boundary = workspace owner. CAM manages who belongs to which domain.

Domain release is integrated into the share flow. "Release to MARKETING" = share with the MARKETING domain. Same grant mechanism as sharing with a person. The word "release" is preserved as a label for domain shares because it carries meaning and history in the Content Hub ecosystem. The newer Content Hub already unifies People and Domains in one share dialog (two tabs); this model takes it further with a single unified recipient field.

**Auto-release** stays as a project-level setting, not a collection: "All assets of type EDITORIAL auto-release to STUDIO_POST on ingest." This is admin configuration, not a user-facing concept. It maps directly to the existing Content Hub auto-release feature. The setting is configured per project by a coordinator/admin and lives in project settings, not in the collection system. When auto-release fires, it creates the same domain grant as a manual release -- the audit trail is identical.

## Vocabulary

| Concept | This model | Content Hub | Creative Review | Conflict? |
|---|---|---|---|---|
| Team boundary | Domain | Domain | Domain (CR is its own) | **None.** Aligned. |
| File organization | Workspace | LucidLink file sync | Folders with templates | **None.** Different implementations, same idea. |
| Group of assets | Collection | Collection | Playlist | **Manageable.** CR can label their UI "playlist" while the underlying entity is "collection." Same concept, different skin. Not a system conflict -- a branding choice. |
| Distribute to audience | Share / Release | Share / Release | Share | **None.** "Release" preserved for domain shares; "share" for person shares. Both terms survive. |

**Net conflicts: 0 system-level, 1 branding-level** (collection vs playlist). This is acceptable -- CR controls their UI label. The model, API, and grants all use "collection."
