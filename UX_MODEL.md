# Next-Gen Media Library: UX Model

This is the mutable artifact. Each iteration proposes one change to this file.

---

## Concepts (what the user must learn)

1. **Department** -- your team boundary. You belong to a department (VFX, Editorial, Camera, etc.). You see your department's files.
2. **Workspace** -- your department's private file system. Folders and files. Only department members see it.
3. **Collection (curated)** -- a hand-picked set of assets you created.
4. **Collection (smart)** -- a filter-based view that auto-populates (e.g., all assets tagged "Character: Elena").
5. **Collection (workspace-bound)** -- a collection that mirrors a folder's contents, created when you share a folder.
6. **Asset** -- an individual file (shot, video, image, audio, text).
7. **Cut** -- a composite asset assembled from files across departments (editorial creates these).
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
- Departments are boundaries. Workspace content stays in the department unless explicitly shared.
- Groups expand at share time into individual grants. No retroactive inheritance.
- Smart collections filter by your existing access -- two people may see different assets.
- Curated collections show everyone the same assets.

## Ownership

- Department collections are owned by the department (any department member with manage access can manage).
- Personal collections are owned by the creator.

## VFX turnover support

Modeled as: snapshot collection + upload enabled. Vendor receives a frozen set of assets and can upload deliveries.

Missing: collection versioning (re-turnovers), change deltas, intent metadata (per-shot notes, delivery specs).

## Sensitive media

Not yet modeled. Needed for content with nudity/explicit material that only specific people should see.

## Cross-app behavior

Undefined. "Manual push workflow" mentioned but no mechanism designed.

## Domain integration

Not modeled. The prototype uses "department" as the boundary. The real Content Hub uses "domain" (15+ domains in 3 tiers: Studio/Wide/Other). The relationship between prototype departments and real domains is described as "an integration question."

## Vocabulary

| This prototype says | Content Hub says | Creative Review says |
|---|---|---|
| Department | Domain | (user groups) |
| Collection | Collection | Playlist |
| Workspace | (N/A -- LucidLink file sync) | (folders with mandated templates) |
| Share | Share / Release | Share |
