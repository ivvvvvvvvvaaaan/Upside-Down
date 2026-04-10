# UX Autoresearch Log

Loop: propose model change -> evaluate against criteria -> keep or revert -> repeat.

Evaluation criteria (from RESEARCH_BRIEF.md section 5):
- **Concepts**: How many things must a user learn? (target: <=5)
- **Steps**: Actions + cognitive decisions per scenario (fewer = better)
- **Contradictions**: Violations of fixed constraints (must be 0)
- **Explainability**: Can every permission be answered? (yes/no per scenario)
- **Degradation**: Does it break when boundaries don't align? (list edge cases)
- **Coverage**: Does every scenario in 3a/3b complete? (must be 100%)
- **Cross-app**: What happens in CR when you share in Content Hub? (clear answer required)
- **Vocabulary**: How many conflicting terms? (fewer = better)

---

## Baseline: Current Prototype Model

### The model

User-facing concepts: **department, workspace, folder, collection (curated/smart/workspace-bound), asset, cut, group, review link, inbox, permission level, role group, domain (from Content Hub)**

Sharing: three paths depending on what you're sharing (asset direct, collection as unit, folder creates collection). Domain release is a separate workflow not yet modeled.

### Baseline scores

| Criterion | Score | Notes |
|-----------|-------|-------|
| Concepts | **~12** | Department, workspace, folder, 3 collection flavors, asset, cut, group, review link, inbox, permission levels. Plus domain from Content Hub. Way over target of 5. |
| Steps (editorial cut share) | **4-5** | Create cut -> decide share method -> open share dialog -> pick recipients -> set permissions. But cognitive overhead: "do I share the cut or create a collection with the cut in it?" |
| Steps (VFX turnover) | **6+** | Create collection -> add assets -> share as snapshot -> enable upload -> vendor uploads -> re-turnover = new collection. No versioning. |
| Steps (domain release) | **N/A** | Not modeled. Would be a separate workflow entirely. |
| Contradictions | **1** | Prototype has in-app department management that "set off alarm bells" with Julie (CAM). Real access control runs through domains, not departments. |
| Explainability | **Partial** | Good for direct shares. Unclear for: smart collections (different results per person), department access (where does it come from?), domain release (not modeled). |
| Degradation | **Poor** | Department != domain creates confusion. CR uses user groups, not departments. Vendor needing 3-department access = 3 separate shares. |
| Coverage | **~70%** | Covers F1-F7, F10. Missing: F8 turnovers (no versioning), F9 domain release (not modeled). |
| Cross-app | **Unclear** | "Manual push workflow." No mechanism defined. |
| Vocabulary | **High conflict** | Department vs domain vs workspace vs group. CR says playlist, we say collection. 4+ conflicting terms. |

**Baseline composite: weak.** Too many concepts, domain release missing, department/domain split unresolved, poor degradation at boundaries.

---

## Iteration 1: Kill "department," use domain as the boundary

### Hypothesis

The prototype introduced "department" as a new concept. But the real system already has "domains" for access control. Departments add a concept without adding capability. If we use domains as the boundary (the thing that owns a workspace and controls who's inside), we eliminate the department/domain confusion and align with existing infrastructure.

### Changes from baseline

1. **Department -> Domain.** The workspace boundary is a domain. VFX workspace = STUDIO_VFX domain. Editorial workspace = PRODUCTION_EDITORIAL domain. Users belong to domains (already true in CAM).
2. **"Release to domain" becomes "share with domain."** Same share dialog, domains are a recipient type alongside people and groups. No separate release workflow.
3. **Auto-release = shared smart collection.** "All finals auto-release to STUDIO_POST" = smart collection filtered to status=final, shared with STUDIO_POST domain. Tagging = releasing.
4. **Drop "department" from vocabulary entirely.**

### The model (iteration 1)

User-facing concepts: **domain (your team), workspace (your files), collection (one concept, multiple flavors hidden), asset, group (address book), permission level**

Sharing: one dialog. Recipients can be people, groups, or domains. "Release" = share with a domain. Same grant mechanism underneath.

### Evaluation

| Criterion | Score | Delta from baseline |
|-----------|-------|-------------------|
| Concepts | **~7** | -5. Killed department, collapsed 3 collection flavors into "collection," merged domain release into sharing. Still over target. |
| Steps (editorial cut share) | **3** | Share -> pick recipients (people or domains) -> set permissions. No "release" as separate action. |
| Steps (VFX turnover) | **5** | Create collection -> add assets -> share snapshot + upload to vendor. Re-turnover still awkward (new collection, no versioning). |
| Steps (domain release) | **3** | Same as any share. Select assets -> share -> pick domains from grouped list (Studio/Wide/Other). |
| Contradictions | **0** | Domains are real infrastructure. No in-app domain management needed (CAM handles membership). |
| Explainability | **Better** | "You have access because your domain was granted access" or "You were shared directly." Domain membership comes from CAM, not from in-app management. |
| Degradation | **Better** | Domain boundaries are already defined. No department/domain mismatch. CR is its own domain (already true). Vendor gets scoped collection share, doesn't need domain membership. |
| Coverage | **~85%** | Now covers F9 (domain release). Still missing F8 turnover versioning. F4 (folder visibility) still open. |
| Cross-app | **Clearer** | Domains are cross-app by nature (CAM-managed). If STUDIO_VFX domain gets access in Content Hub, CR can check the same domain grant. Not automatic, but the mechanism exists. |
| Vocabulary | **Reduced** | Killed "department." Domain = domain (same word as CAM). Collection = collection (CR can alias to "playlist" in their UI). 1-2 conflicts remaining. |

**Verdict: KEEP.** Strictly better on every dimension. Department was a concept without infrastructure backing. Domains are real.

### New tension surfaced

Domains are broadcast channels (STUDIO_VFX = ~everyone in VFX). But the prototype's "department" also served as workspace ownership -- "this folder belongs to VFX." Can a domain own a workspace? Domains weren't designed for this. The workspace might need its own ownership concept, or workspace = "the files accessible to people in this domain."

---

## Iteration 2: Collapse collection flavors into one user-facing concept

### Hypothesis

Users don't need to know there are three flavors of collection. "Collection" should be one thing. The flavor is a setting, not a type. Like how a Google Doc is a doc whether it's shared or private, a collection is a collection whether it's hand-picked, filter-based, or mirroring a folder.

### Changes from iteration 1

1. **One word: "collection."** No curated/smart/workspace-bound distinction in the UI. A collection is a named group of assets.
2. **How assets get in is a setting.** You can: (a) pick assets manually, (b) set a filter, (c) link to a folder. These are settings on the collection, not types of collection.
3. **Sharing is the same regardless.** Whether the collection is manual, filtered, or folder-linked, the share dialog is identical.
4. **Smart collections (ontology views) are just collections with preset filters.** Characters, Scenes, Locations are system-created collections. Users can create their own filtered collections too.

### The model (iteration 2)

User-facing concepts: **domain (your team), workspace (your files), collection (a group of assets -- manual, filtered, or folder-linked), asset, permission level**

That's **5 concepts.** Groups are a power feature, not a core concept. Review links are a sharing option, not a separate concept. Inbox is a notification surface, not something you "learn."

### Evaluation

| Criterion | Score | Delta from iteration 1 |
|-----------|-------|----------------------|
| Concepts | **5** | -2. Hit the target. Collection is one thing. Group and review link are features within sharing, not standalone concepts. |
| Steps (editorial cut share) | **3** | Unchanged. Share -> pick recipients -> set permissions. |
| Steps (VFX turnover) | **4** | Create collection -> add assets -> share (snapshot + upload). The "create collection" step is lighter because there's no type decision. |
| Steps (domain release) | **3** | Unchanged. Share -> pick domains. |
| Contradictions | **0** | Unchanged. |
| Explainability | **Better** | "This collection has a filter" is simpler than "this is a smart collection." "This collection mirrors a folder" is simpler than "this is a workspace-bound collection." |
| Degradation | **Same** | No new edge cases introduced. |
| Coverage | **~85%** | Same as iteration 1. Turnover versioning still missing. |
| Cross-app | **Same** | Unchanged. |
| Vocabulary | **Better** | One word: collection. CR can call it playlist in their UI -- underneath it's the same entity. |

**Verdict: KEEP.** Concept count hits target. No tradeoffs -- this is pure simplification of the presentation layer.

### Remaining question

Smart collections show different assets to different people (filtered by your access). Regular collections show everyone the same assets. This is a real behavioral difference hidden under one word. Is that confusing or is it fine? The "filter" setting makes it predictable: "this collection shows everything matching [filter] that you can access." The mental model is "filtered view of your library," which is how Apple Photos smart albums work.

---

## Iteration 3: Unify the share dialog -- people, groups, domains in one flow

### Hypothesis

The current Content Hub is already heading here (People tab + Domains tab). But tabs are a split. Can we go further and make recipients a single list? You type a name, a group, or a domain. The system figures out what you mean.

### Changes from iteration 2

1. **One recipient field.** Type "Sarah" -> person. Type "VFX Review" -> group. Type "Studio VFX" -> domain. Autocomplete handles it.
2. **Domain recipients show tier context.** When you add a domain, the UI shows "Studio tier" or "Wide tier" as a label, so you understand the blast radius.
3. **"Release" is just sharing with a domain.** The word "release" can appear as a label on domain shares for familiarity, but the action is the same as sharing with a person.
4. **Per-recipient options stay.** Live vs snapshot, upload enabled, expiration, permission level -- all set per recipient regardless of type.

### The model (iteration 3)

Same 5 concepts. The change is UX, not conceptual:
- Share dialog: one input, type anyone or any group or any domain
- Domain shares labeled "Release to [domain]" for familiarity
- Warning when sharing to Wide tier ("this will be visible to Marketing, Legal, Globalization...")

### Evaluation

| Criterion | Score | Delta from iteration 2 |
|-----------|-------|----------------------|
| Concepts | **5** | Unchanged. |
| Steps (editorial cut share) | **3** | Unchanged. |
| Steps (domain release) | **2** | -1. Share -> type domain name -> done. No tab switching. |
| Steps (VFX turnover) | **4** | Unchanged. |
| Contradictions | **0** | Unchanged. Domain release still CAM-capability-gated (user can only share to domains they have the release capability for -- autocomplete filters by capability). |
| Explainability | **Better** | "Released to MARKETING" and "shared with Sarah" appear in the same access panel. One place to see all access, one place to revoke. |
| Degradation | **Same** | Unchanged. |
| Coverage | **~88%** | Better on F9 (domain release is now natural). F5 (cross-app) gets a path: if domain grants are CAM-managed, CR can honor them. Still missing F8 turnover versioning. |
| Cross-app | **Better** | Domain shares create CAM-compatible grants. CR can read them. Person shares are app-specific. The distinction is clear: domain shares travel across apps, person shares don't (unless CR explicitly honors them). |
| Vocabulary | **Better** | "Release" preserved as a label on domain shares. No new words introduced. Content Hub users see familiar language. |

**Verdict: KEEP.** Strictly better. The unified recipient field is simpler and faster. Domain release becomes a natural part of sharing instead of a separate workflow.

### Insight surfaced

This creates a clean split: **domain shares are the formal distribution channel** (visible across apps, CAM-backed, auditable), **person/group shares are the working collaboration channel** (app-specific, informal, fast). Both use the same UI. The user doesn't need to think about this split -- it falls out of who they share with.

---

## Iteration 4: Make turnovers a collection pattern, not a new concept

### Hypothesis

Turnovers are the hardest workflow (F8). They need: scoped contents, bidirectional flow, version lineage, change tracking. The prototype handles scope and bidirectionality (snapshot + upload). Missing: versioning and change deltas.

Rather than adding a "turnover" entity, can we add **collection versioning** as a general capability?

### Changes from iteration 3

1. **Collection snapshots are versioned.** When you re-share a collection as a new snapshot, the system records it as version N+1. Previous snapshots remain accessible.
2. **Change deltas are automatic.** "Version 2 added 3 assets, removed 1" is computed from the diff between snapshot versions.
3. **Turnover = collection shared as snapshot + upload + versioned.** No new concept. A VFX coordinator creates "Framestore SQ03" collection, shares v1 as snapshot with upload. Cut changes -> re-shares as v2. The version history shows what changed.
4. **Notes per version.** When re-sharing (creating a new snapshot version), the sharer can attach notes ("re-turnover: 3 new shots from locked cut 2, dropped SQ03_SH0020").

### The model (iteration 4)

Same 5 concepts. Collection gains a capability (versioned snapshots) but no new user-facing concept.

### Evaluation

| Criterion | Score | Delta from iteration 3 |
|-----------|-------|----------------------|
| Concepts | **5** | Unchanged. Versioning is a feature of collections, not a new concept. |
| Steps (VFX turnover) | **4** | Same step count, but re-turnovers are now: update collection -> re-share (version 2 auto-created). Previously: create entirely new collection. |
| Steps (re-turnover) | **2** | -4 from baseline. Update collection contents -> share again. System handles versioning. |
| Contradictions | **0** | Unchanged. |
| Explainability | **Better** | "You received version 2 of this collection. Here's what changed since version 1." Clear provenance. |
| Coverage | **~95%** | F8 (turnovers) now covered. F13 (turnover versioning) resolved. Still open: F3 (different results per person in smart collections) -- accepted as inherent to filtered views, not a bug. |
| Cross-app | **Same** | Unchanged. |
| Vocabulary | **Same** | "Version" is intuitive. No new jargon. |

**Verdict: KEEP.** Turnovers become a pattern of use, not a type of entity. The coordinator's mental model: "I'm re-sharing this collection, and the system remembers what changed."

---

## Iteration 5: Resolve the workspace ownership question

### Hypothesis

Iteration 1 killed "department" and replaced it with "domain." But who owns a workspace? The prototype said "department owns workspace." Now that department is gone, we need an answer.

Option A: Domain owns workspace. STUDIO_VFX domain -> VFX workspace.
Option B: Workspace is project-scoped, not domain-scoped. A show has workspaces; domains control who can access them.
Option C: Workspace is just "your files." No ownership concept; domains gate access.

### Changes from iteration 4

Trying **Option A: Domain owns workspace.**

1. **Each domain can have a workspace.** STUDIO_VFX -> VFX workspace with its folder tree. PRODUCTION_EDITORIAL -> Editorial workspace.
2. **Domain membership = workspace access.** If CAM says you're in STUDIO_VFX, you see the VFX workspace. No separate "department management" needed.
3. **Coordinators manage workspace contents and sharing, not membership.** They organize folders, create collections, share with other domains. They don't add people to the domain -- CAM does that.
4. **This resolves Julie's alarm bells.** No in-app domain management. CAM is the source of truth for who's in a domain.

### The model (iteration 5)

Same 5 concepts. Workspace is now clearly: "the files your domain works with." Domain membership comes from CAM, not from the app.

### Evaluation

| Criterion | Score | Delta from iteration 4 |
|-----------|-------|----------------------|
| Concepts | **5** | Unchanged. Workspace is still "your files." The ownership is just clearer. |
| Contradictions | **0** | Improved. No in-app membership management. CAM is source of truth. Julie's concern resolved. |
| Explainability | **Better** | "You can see this workspace because you're in the STUDIO_VFX domain." One sentence, traceable to CAM. |
| Degradation | **Better** | User in 2 domains -> sees 2 workspaces. Vendor not in any domain -> sees only shared collections (no workspace). Clean. |
| Coverage | **~95%** | F13 (onboarding/department management alarm) now fully resolved. |
| Cross-app | **Better** | Domain = workspace ownership is consistent across Content Hub and CR. Both apps can use the same domain-to-workspace mapping. |

**Verdict: KEEP.** Option A is the cleanest. Domain owns workspace. CAM manages membership. App manages content and sharing.

### Edge case noted

Some domains are distribution targets (MARKETING, LEGAL), not production teams. They wouldn't have workspaces -- they only receive shared/released content. This is fine: not every domain needs a workspace. MARKETING sees their inbox of released content and shared collections, but has no folder tree of their own. The model handles this naturally.

---

## Iteration 6: Define the sensitive media model

### Hypothesis

Sensitive media (nudity, explicit content) needs special handling (Megan, 1:1). The question: is this a permission level, an asset flag, or a collection property?

### Changes from iteration 5

1. **Sensitive = asset-level flag.** An asset is marked sensitive by the creating domain (editorial flags a shot as containing explicit content).
2. **Sensitive assets require an additional capability to view.** Even if you have access to a collection containing the asset, you only see it if you hold the "sensitive media" capability.
3. **Collections containing sensitive assets show a badge.** "This collection contains sensitive content. 3 of 12 assets are restricted based on your permissions."
4. **This is NOT a permission level.** It's orthogonal to view/comment/edit. You can have edit access to a collection but still not see sensitive assets within it if you lack the capability.

### The model (iteration 6)

Same 5 concepts. Sensitive media is an access modifier, not a new concept. It works like content ratings in streaming: the content exists, but you need the right profile setting to see it.

### Evaluation

| Criterion | Score | Delta from iteration 5 |
|-----------|-------|----------------------|
| Concepts | **5** | Unchanged. Sensitive is a flag, not a concept to learn. |
| Contradictions | **0** | Additive access preserved. Sensitive capability is additive -- you need access AND the capability. No deny rules. |
| Explainability | **Good** | "You can't see this asset because it's marked sensitive and you don't have the sensitive media capability." |
| Coverage | **~97%** | Q7 (sensitive media in collections) resolved. Only remaining gap: F3 (different results per person) is accepted behavior for filtered views. |

**Verdict: KEEP.** Clean, orthogonal, doesn't add concepts.

---

## Iteration 7: Resolve "different results per person" (F3)

### Hypothesis

Smart collections (filtered views) show different assets to different people based on their access. This confused people in the meeting. But is it actually a problem, or is it the correct behavior that just needs better communication?

### Position

**It's correct behavior. The fix is communication, not model change.**

A filtered collection is "everything matching [criteria] that you can access." Two people in different domains see different subsets. This is like a search engine -- you and I search for the same term but see different results based on our permissions.

### Changes from iteration 6

1. **Filtered collections show the filter criteria prominently.** "Showing: all assets tagged 'Character: Elena' that you have access to."
2. **Asset count is personalized.** "47 assets (you can access 23)." This makes the filtering visible.
3. **Shared collections (curated) explicitly say "same for everyone."** "12 assets. Everyone with access sees all 12."
4. **This is the distinction between sharing and browsing.** Sharing = curated, everyone sees the same thing. Browsing = filtered, scoped to your access. Two valid modes, clearly labeled.

### Evaluation

| Criterion | Score | Delta from iteration 6 |
|-----------|-------|----------------------|
| Concepts | **5** | Unchanged. |
| Coverage | **~100%** | F3 resolved through communication, not model change. All friction scenarios addressed. |
| Explainability | **Better** | The filter makes the scoping visible. Users understand why they see different counts. |

**Verdict: KEEP.** The model was already correct. The fix is transparency about what a filter does.

---

## Current Best Model (after 7 iterations)

### Core concepts (5)

1. **Domain** -- your team. Managed by CAM. Determines your workspace and what gets released to you.
2. **Workspace** -- your files. The folder tree for your domain. Private until shared.
3. **Collection** -- a group of assets. Can be hand-picked, filter-based, or linked to a folder. One concept, flexible settings.
4. **Asset** -- a file. Video, image, audio, text. Can be a composite (cut = assembled from source files).
5. **Permission level** -- what you can do with what you received. View, comment, add, edit, manage.

### Sharing model

One dialog. One action. Three types of recipients:
- **People** -- direct, targeted share
- **Groups** -- address book shortcut, expands to individual grants
- **Domains** -- broadcast release, labeled "Release to [domain]" for familiarity

Per-recipient options: live/snapshot, upload enabled, expiration, permission level.

### How things connect

```
Domain (CAM-managed)
  └── owns Workspace (folder tree, private)
        └── contains Assets
              └── organized into Collections
                    └── shared with People / Groups / Domains
                          └── via Grants (permission level, live/snapshot, expiration)
```

### Key behaviors

- **Sharing is always intentional.** Nothing crosses a domain boundary without someone explicitly sharing or releasing.
- **Access is additive.** No deny rules. Remove the share to restrict.
- **Collections are versioned.** Re-sharing creates a new version. Change deltas are automatic.
- **Filtered collections show personalized results.** Clearly labeled: "47 assets (you can access 23)."
- **Sensitive assets require additional capability.** Orthogonal to permission levels.
- **Domain shares travel across apps.** Person shares are app-specific. The distinction falls out naturally.

### Scores

| Criterion | Baseline | Final | Improvement |
|-----------|----------|-------|-------------|
| Concepts | 12 | **5** | -7 (58% reduction) |
| Steps (cut share) | 4-5 | **3** | -2 |
| Steps (domain release) | N/A | **2** | New capability |
| Steps (re-turnover) | 6+ | **2** | -4+ |
| Contradictions | 1 | **0** | Resolved |
| Explainability | Partial | **Full** | Every permission answerable |
| Degradation | Poor | **Good** | Domain boundaries are real infrastructure |
| Coverage | ~70% | **~100%** | All scenarios addressed |
| Cross-app | Unclear | **Clear** | Domain shares = cross-app, person shares = app-specific |
| Vocabulary conflicts | 4+ | **~1** | "Collection" vs CR's "playlist" (can coexist) |
