# Next-Gen Media Library: UX Model

This is the mutable artifact. Each iteration proposes one change to this file.

---

## Concepts (what the user must learn)

1. **Domain** -- your team boundary. Managed by CAM, not by this app. You belong to a domain (STUDIO_VFX, PRODUCTION_EDITORIAL, etc.). You see your domain's files. Domains are settled infrastructure: 15+ exist in 3 tiers (Studio/Wide/Other), each CAM-capability-gated.
2. **Workspace** -- your domain's private file system. Folders and files. Only domain members see it.
3. **Collection (curated)** -- a hand-picked set of assets you created.
4. **Collection (smart)** -- a filter-based view that auto-populates (e.g., all assets tagged "Character: Elena").
5. **Collection (workspace-bound)** -- a collection that mirrors a folder's contents, created when you share a folder.
6. **Asset** -- an individual file (shot, video, image, audio, text).
7. **Cut** -- a composite asset assembled from files across domains (editorial creates these).
8. **Group** -- a saved list of people, like an address book.
9. **Review link** -- an expiring, scoped link for external reviewers.
10. **Inbox** -- where you see things shared with you.
11. **Permission level** -- what you can do: view, comment, contribute, edit, manage.
12. **Role group** -- a template of permission levels (e.g., "reviewer" = view + comment).

## Sharing model

Three paths depending on what you're sharing:
- **Single asset**: direct grant on the asset itself.
- **Collection**: grant on the collection; recipients see everything in it.
- **Folder**: creates a workspace-bound collection behind the scenes; grant on that.

Per-recipient settings: live (synced) or snapshot (frozen), upload enabled, expiration.

**Domain release** is NOT modeled. It exists in the current Content Hub as a separate workflow (select assets, pick domains from Studio/Wide/Other tiers, submit). The next-gen prototype does not handle this yet.

## Access control

- Access is additive. No deny rules. The sum of all grants = what you can see.
- Domains are boundaries. Workspace content stays in the domain unless explicitly shared.
- Domain membership is managed by CAM, not by this app. No in-app domain management.
- Groups expand at share time into individual grants. No retroactive inheritance.
- Smart collections filter by your existing access -- two people may see different assets.
- Curated collections show everyone the same assets.

## Ownership

- Domain collections are owned by the domain (any domain member with manage access can manage).
- Personal collections are owned by the creator.

## VFX turnover support

Modeled as: snapshot collection + upload enabled. Vendor receives a frozen set of assets and can upload deliveries.

Missing: collection versioning (re-turnovers), change deltas, intent metadata (per-shot notes, delivery specs).

## Sensitive media

Not yet modeled. Needed for content with nudity/explicit material that only specific people should see.

## Cross-app behavior

Undefined. "Manual push workflow" mentioned but no mechanism designed.

## Domain integration

Domain replaces "department" as the boundary concept. This aligns with real Content Hub infrastructure where all access control runs through domains. The relationship is now direct: domain = boundary = workspace owner. CAM manages who belongs to which domain.

Domain release (making content visible to everyone in a domain) still exists as a separate workflow in the current Content Hub. Not yet integrated into this model's sharing flow.

## Vocabulary

| This model says | Content Hub says | Creative Review says |
|---|---|---|
| Domain | Domain | (user groups -- CR is its own domain) |
| Collection | Collection | Playlist |
| Workspace | (N/A -- LucidLink file sync) | (folders with mandated templates) |
| Share | Share / Release | Share |
