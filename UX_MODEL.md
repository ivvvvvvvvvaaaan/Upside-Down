# Next-Gen Media Library: UX Model

This is the mutable artifact. Each iteration proposes one change to this file.

---

## Concepts (what the user must learn)

1. **Domain** -- your team. Managed by CAM, not by this app. You belong to a domain (STUDIO_VFX, PRODUCTION_EDITORIAL, etc.). You see your domain's files. Domains are settled infrastructure: 15+ exist in 3 tiers (Studio/Wide/Other), each CAM-capability-gated.
2. **Workspace** -- your domain's private file system. Folders and files. Only domain members see it.
3. **Collection** -- a named group of assets. How assets get in is a setting: (a) you pick them manually, (b) a filter picks them automatically, or (c) they mirror a workspace folder. One concept, one share model, regardless of how contents are populated.
4. **Asset** -- an individual file (shot, video, image, audio, text). A cut is a composite asset assembled from files across domains.
5. **Permission level** -- what you can do with what you received: view, comment, contribute, edit, manage.

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

Domain recipients appear in a grouped list: Studio tier first, Wide tier second, Other third. The user sees the blast radius ("Release to Wide makes this visible to Marketing, Legal, Globalization..."). Only domains the user has release capability for appear in autocomplete.

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

Domain release is integrated into the share flow. "Release to MARKETING" = share with the MARKETING domain. Same grant mechanism as sharing with a person. The word "release" is preserved as a label for domain shares because it carries meaning and history in the Content Hub ecosystem. The newer Content Hub already unifies People and Domains in one share dialog (two tabs); this model takes it further with a single unified recipient field.

## Vocabulary

| This model says | Content Hub says | Creative Review says |
|---|---|---|
| Domain | Domain | (user groups -- CR is its own domain) |
| Collection | Collection | Playlist |
| Workspace | (N/A -- LucidLink file sync) | (folders with mandated templates) |
| Share | Share / Release | Share |
