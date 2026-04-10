# UX Autoresearch Brief

*Last updated: 2026-04-09. Compiled from 3 meeting transcripts, ACCESS_CONTROL.md/COLLECTIONS.md (now superseded), prototype codebase exploration, and real Content Hub codebase analysis. This is the input dataset for the autoresearch loop. Re-run with updated inputs as user personas and requirements evolve.*

This document is the "training dataset" for running an autoresearch-style optimization loop on the next-gen media library's sharing and access model. It captures everything that's fixed, everything that's been observed, and the criteria for evaluating whether a proposed UX model is better or worse.

---

## 1. Fixed Constraints (The Train Tracks)

These are non-negotiable. Any proposed model that contradicts these is invalid.

### 1a. Infrastructure that exists and is staying

| Constraint | Source | Why it's fixed |
|-----------|--------|---------------|
| **CAM (Content Access Management) exists** | Julie, Domenica (CAM team) | Netflix-wide identity and access system. All apps must integrate. |
| **Media domains exist and are staying** | Sally (CAM team): "We are explicitly aligning the concept of a media domain with the media library." 15+ domains in 3 tiers (Studio/Wide/Other), CAM-capability-gated. | Domains are the real access control layer. "Release to domains" is a core Content Hub workflow. The newer Content Hub already unifies People + Domains in one share dialog. |
| **Foundations team is building an access component** | Christina (Foundations), Carol confirmed | Q2 deliverable for another product team. Megan committed: "We will not build; we'll use what they build." |
| **Workspaces exist** | Prototype, team alignment | Users need a private filesystem-like space for department work. Not controversial. |
| **Additive access model** | Design principle | No deny rules. Access is the sum of every grant. To restrict, remove the share. |
| **CAM integration won't be ready until late 2026 or 2027** | Julie (CAM team, via Megan) | Resources and requirements push implementation out. Affects VFX pilot timing. |

### 1b. Organizational realities

| Constraint | Source | Why it matters |
|-----------|--------|---------------|
| **Departments don't want leaks** | VFX users (research sessions) | "VFX editorial music; they never want anyone to see the work that they're doing if it's not ready." Department boundary is sacred. |
| **Sharing must be intentional** | Universal feedback | Every cross-boundary share is a deliberate act. No accidental exposure. |
| **Creative Review is its own domain** | Ian, Carol (CR team) | "Anything that happens in creative review is part of that domain. It won't be something people can onboard themselves through Content Hub." |
| **CR built a separate playlist entity** | Ian (April 9 meeting) | Engineering decision already made on CR side. Ian wants to understand why; XD wasn't consulted. Potential overlap with collections. |
| **Sensitive media requires special handling** | Megan (1:1, April 9) | Nudity/explicit content; very specific people can view. Editorial must have access (they create cuts), but marketing shouldn't browse intimate scenes. |
| **PIX folder templates are the current reality** | Production teams | Standardized folder structures per show type. People navigate by memorized folder names. |

### 1c. User realities

| Constraint | Source | Why it matters |
|-----------|--------|---------------|
| **DITs never open the media library** | Tom persona, confirmed by workflows | They dump files to mounted drives. The library is invisible to them. |
| **Directors want to watch and comment, not file** | David persona, review link model | No workspace, no inbox management. Just open, watch, respond. |
| **Vendors need scoped, bidirectional spaces** | Framestore workflow (Sarah/James) | Receive a brief, upload deliveries. One container, two directions. |
| **Coordinators manage access for their department** | Sarah, Lisa personas; VFX research | "VFX supervisor has high access; can add people to department, change permissions." |
| **Hundreds of hours lost to access triaging** | Ivan (April 9 meeting) | "People lost hundreds of hours triaging why some user lost access because the owner moved the folder." |

---

## 2. Current Conceptual Model (What the prototype says today)

### Entities the user encounters

| Concept | What it is | Where it lives |
|---------|-----------|---------------|
| **Department** | Boundary. Who you are. Access to workspace. | Structural, org-managed. |
| **Workspace** | Private filesystem for a department. Folders and files. | Nested under department. |
| **Collection (curated)** | Hand-picked set of assets. | Created by user. |
| **Collection (smart)** | Filter-based dynamic view. | System-generated from ontology. |
| **Collection (workspace-bound)** | Mirrors a folder's contents. | Created when folder is shared. |
| **Asset** | Individual file (shot, video, image, audio, text). | Lives in workspace folders. |
| **Cut** | Composite; assembled from source files across departments. | Created by editorial. |
| **Group** | Address book; saved list of recipients. | Convenience shortcut. |
| **Grant** | Permission record; who can do what to which resource. | System-managed. |
| **Review link** | Expiring, scoped invitation for external reviewers. | Per-resource. |
| **Inbox** | Feed of shares received. | Per-user. |

### Permission levels (current)

See > Respond > Add > Modify > Control

Mapped to: view > comment > contribute > edit > manage > owner

### How sharing works (current)

1. Single asset: direct grant on the asset
2. Collection: grant on the collection; gives access to contents
3. Folder: creates a workspace-bound collection; grant on that

Per-recipient choice: live (synced) or snapshot (frozen)
Per-recipient option: upload enabled (dropbox mode)

---

## 3. User Scenarios (Training Data)

### 3a. Core workflows from the prototype

**Editorial Cut Progression** (Maria Santos, Editor)
1. Maria creates locked cuts 1-3 in editorial workspace
2. Lisa (coordinator) shares cut with VFX for timing reference (view-only, live)
3. Lisa shares cut with director David (review link, comment, expiring)
4. As cut stabilizes, Lisa shares with broader team (studio, post, marketing)
5. Final cut and EMF shared with wider distribution

**VFX Delivery** (Sarah Chen, VFX Coordinator)
1. Sarah packages approved comps into a collection
2. Shares with editorial as live collection (updates as shots get marked final)
3. Creates snapshot + upload-enabled share for Framestore vendor
4. James (Framestore) receives brief, uploads rendered frames
5. Sarah sees both brief and deliveries in same collection

**Camera Dailies** (Tom Nakamura, DIT)
1. Tom dumps files to `/Camera/Dailies/Day_12/` via mounted drive
2. Lisa shares the dailies folder with editorial (creates workspace-bound collection)
3. Maria accepts; files appear on her mounted drive
4. Maria pulls shots into her editing tool directly from filesystem

**Cross-Department Review** (Alex Rivera, VP Content)
1. Alex gets view-only access to heritage shots collection
2. Navigates via smart collections (characters, scenes)
3. Only sees assets he has access to; filtered by his grants

**Art Reference** (Priya Sharma, Concept Artist)
1. Priya creates concept art in art-design workspace
2. Shares collection of approved concepts with VFX for reference
3. VFX team uses concepts as reference material for shot work

### 3b. Real friction scenarios from meetings

**Scenario F1: "Why did I lose access?"**
- Source: Ivan (April 9 meeting)
- A folder owner moved a folder. Users who had access through the folder's position in the tree lost access. Hundreds of hours of triaging.
- Design response: Access should be asset-level or collection-level, not position-in-tree-level.

**Scenario F2: "Can I just share this folder?"**
- Source: April 9 meeting discussion
- Users think in folders. They want to right-click a folder and share it. But the system needs to create a collection behind the scenes so access is controllable.
- Confusion: "A folder becomes a collection" vs "A folder creates a collection" (specific feedback from April 9 meeting).

**Scenario F3: "Why do we see different things?"**
- Source: April 9 meeting (multiple participants confused)
- Two people looking at the same smart collection see different assets because smart collections filter by existing access.
- Curated collections show everyone the same thing. The distinction is not obvious.

**Scenario F4: "Who owns this collection?"**
- Source: April 9 meeting
- If a user creates a collection and leaves, who manages it? Department collections should be owned by the department (anyone with manage access can manage). Personal collections are owned by the creator.

**Scenario F5: "I shared this in Content Hub; why don't they have access in Creative Review?"**
- Source: Megan/Ian discussion (Next-Gen Blueprint)
- Access granted in one app doesn't flow to another. User expects that sharing a cut in Content Hub means the recipient can review it in Creative Review.
- Current answer: manual push workflow. Not ideal but avoids leaky access.

**Scenario F6: "Marketing wants to know if cuts exist"**
- Source: Megan (1:1)
- Marketing pings editorial on Slack: "Do you have cuts yet?" Post-production: "We don't want them to know anything exists because it's not ready."
- Tension between discovery and privacy. Some departments want zero visibility until intentional release.

**Scenario F7: "The vendor joined the group; now they see everything"**
- Source: Design principle (ACCESS_CONTROL.md)
- If groups carry persistent access, adding someone to a group retroactively gives them access to every collection ever shared with that group.
- Design response: Groups expand at share time. No retroactive inheritance. Manual re-sharing is deliberate.

**Scenario F8: "This is a turnover, not just a share"**
- Source: VFX industry standard workflow
- VFX coordinator builds a scoped package of plates, reference cuts, EDLs, notes for a specific vendor. The package has version lineage (re-turnovers when cuts change). The vendor delivers back into the same scoped space.
- Current prototype models this as snapshot + upload-enabled collection. Missing: version lineage, change deltas, intent metadata, delivery specs.
- Design response: Turnover is a collection pattern, not a separate entity. But the collection needs versioning and metadata slots.

**Scenario F9: "Release this to Studio and Wide"**
- Source: Real Content Hub workflow (production)
- Editorial coordinator releases a locked cut to STUDIO_POST, STUDIO_VFX, MARKETING. Each domain gets a grantset. Users in those domains can now see the asset.
- Current prototype has no domain release workflow. ACCESS_CONTROL.md punts on domain/department mapping.
- Design response: Domain release should be a type of share (share with a domain group), not a separate workflow. The new Content Hub already puts People and Domains in the same share dialog.

**Scenario F10: "I need to share this with 5 people from different departments"**
- Source: General workflow
- The current model requires selecting individuals or groups. There's no concept of "share with everyone in VFX + 2 specific people from editorial."
- Groups as address books help, but department-level sharing is the workspace model, not the collection model.

---

## 4. Friction Points from Meetings (What Confused People in the Room)

Section 3b captures workflow failures. This section captures **conceptual confusion** -- moments where smart people couldn't follow the model. These are the signals that the concept count is too high or the relationships are unclear.

### From the Access Management Review meeting

| # | Confusion | Who raised it | Root cause |
|---|-----------|--------------|------------|
| 1 | "Is the folder the collection?" | Carol | Mental model split between workspace and collections |
| 2 | "Multiple assets become a collection; is that sharing individual files or creating a collection?" | Carol | Doc said multi-select creates collection; unclear when this happens |
| 3 | "Collections could be private or shared?" | Carol | Yes, but the doc didn't make this explicit |
| 4 | "Does a collection overwrite workspace access?" | Multiple | Unclear relationship between department access and collection grants |
| 5 | "Who owns the collection?" | Carol | Department vs creator ownership unclear |
| 6 | "Two people see different results in the same collection" | Multiple | Smart collections filter by access; curated don't. Not obvious. |
| 7 | "What's a department vs a domain?" | Carol, Sally | Ivan's prototype uses "department"; CAM uses "domain". Are they the same? |
| 8 | "What's the difference between user groups and departments?" | Carol, CR team | CR uses user groups instead of departments. Ivan's model has both. |
| 9 | "Can a department just be a user group?" | Carol | CR doesn't want departments at all; uses dynamic user groups |
| 10 | "What's edit vs contribute?" | Carol | Permission labels unclear; naming not final |
| 11 | "CR playlists vs library collections; same thing?" | Ian, Ivan | Conceptual overlap but CR engineered a separate entity |
| 12 | "If I share in Content Hub, does it flow to CR?" | Megan | Cross-app access propagation unclear |
| 13 | "How does onboarding work; who adds people to departments?" | Julie (CAM) | "Set off alarm bells" when Ivan showed in-app department management |

### From the Next-Gen Blueprint meeting

| # | Insight | Who | Implication |
|---|---------|-----|------------|
| 14 | "Collections could be one of the benefits; sort of auto-magic curated process" | Ian | Collections should feel like smart albums on your phone, not manual filing |
| 15 | "What's the benefit to a user to have something different than a folder?" | Ian | If collections behave like folders, why have a new concept? They need to do something folders can't. |
| 16 | "Does the new share module need to think about canvas-based collaboration?" | Ian | 3-year horizon: folder (2010s) -> collection (2020s) -> canvas (future) |
| 17 | "Not every asset is a 1:1 relationship to Creative Review" | Megan | CR only needs a subset; manual push, not auto-sync |
| 18 | "CR in its infancy is a lot like Content Hub workspaces; files and folders with mandated templates" | Ian | Similar starting points; diverging implementations |

### From Ivan/Meghan 1:1

| # | Decision/insight | Implication |
|---|-----------------|------------|
| 19 | "Can there be one concept? Collection is everything." | Push for maximum consolidation |
| 20 | "I'm sometimes confused about it myself" | If the designer is confused, users will be more confused |
| 21 | "Iconic has one thing; multiple things behind the scenes but one concept" | Reference product validates the single-concept approach |
| 22 | "Playlist means collection in one world" | Language mapping needed between teams |
| 23 | "Sensitive media" needs a permission level | Not just access; what you're allowed to see at all |
| 24 | "Role groups are templates with predefined permission sets" | Reduces per-share decision-making |
| 25 | "Foundations is building a component; should we use theirs or build ours?" | Build dependency; alignment needed |

---

## 5. Evaluation Criteria (The Loss Function)

For any proposed UX model, score against these dimensions:

### 5a. Concept count (fewer = better)

How many distinct concepts does a user need to learn before they can share content?

Current model concepts: department, workspace, folder, collection (3 flavors), asset, cut, group, grant, review link, inbox, permission level, role group = **~12 concepts**

Target: A new user should be productive after learning **5 or fewer** concepts.

### 5b. Steps to complete each scenario (fewer = better)

For each of the core workflows in section 3a, count the number of user decisions and actions. Include cognitive decisions ("do I share the folder or create a collection?").

### 5c. Contradiction check (zero contradictions required)

Does the model contradict any fixed constraint in section 1? Common failure modes:
- Requires deny rules (violates additive access)
- Bypasses CAM integration path
- Creates access that Foundations component can't model
- Leaks content across department boundaries without intentional share
- Auto-grants access when someone joins a group (violates no-retroactive-inheritance)

### 5d. Explainability (every permission answerable)

For any asset, can the system answer: who has access, why, through what path, who shared it, when it expires, how to remove it?

If the model introduces implicit access (e.g., "you can see this because you're in the project"), explainability degrades.

### 5e. Graceful degradation

When boundaries don't align cleanly:
- Department != domain (e.g., VFX spans multiple CAM domains)
- A user belongs to 2 departments
- A vendor needs access to assets from 3 departments
- A group contains people from different departments
- CR's domain model doesn't map to Content Hub's department model

Does the model still work, or does it produce confusing edge cases?

### 5f. Scenario coverage (100% required)

Every workflow in section 3a must complete. Every friction scenario in section 3b must be addressed (either solved or explicitly deferred with rationale).

### 5g. Cross-app coherence

If a user shares content in Content Hub, what happens in Creative Review? The model should have a clear answer, even if that answer is "nothing; CR is separate."

### 5h. Vocabulary alignment

How many terms does the system introduce that conflict with existing vocabulary (domain, workspace, collection, playlist, folder, department, group, team)?

Ideal: the model uses terms that map cleanly to what each team already calls things, or introduces one new term that subsumes multiple existing ones.

---

## 6. Open Questions (Things the Research Should Resolve)

These are questions that the current docs and meetings have not answered. A good UX model should take a position on each.

| # | Question | Current state | Why it matters |
|---|----------|--------------|---------------|
| Q1 | Is "department" the same as "domain"? | **Critical finding:** the real Content Hub has no department-based access control. Departments exist only as asset type tags for metadata. All real access runs through domains. The prototype's department-as-boundary concept is entirely new. | Three options: (a) departments are a new layer on top of domains (more concepts), (b) departments ARE domains with a friendlier name (simpler, but domains weren't designed as workspace boundaries), (c) skip departments entirely (fewest concepts, but lose the "team space" model). |
| Q2 | Should smart collections be shareable? | Deferred ("when tagging infrastructure is ready") | If yes, filter = access gate. If no, only curated collections cross boundaries. |
| Q3 | What happens when you share a cut? | Open question in ACCESS_CONTROL.md | Playback-only vs full constituent access. |
| Q4 | Should folders be visible outside departments? | Some departments want zero visibility | Discovery vs privacy tension. |
| Q5 | Can the Foundations access component model everything we need? | Unknown; Foundations wasn't in the room | Risk: we design something their component can't support. |
| Q6 | CR playlist = collection? | Conceptually yes, technically no (separate entity) | If we can't unify, we need a clear boundary. |
| Q7 | How does sensitive media permission interact with collections? | "Add it" (Megan) | A collection could contain sensitive assets; does the collection grant override the sensitive flag? |
| Q8 | Who manages access when the coordinator leaves? | Department owns department collections | But what about personal collections shared widely? |
| Q9 | Should groups carry persistent access or expand-at-share-time? | Current: expand-at-share-time | CR prefers dynamic groups. Library prefers static expansion. |
| Q10 | Is "mount to drive" a real workflow or a prototype concept? | In prototype; maps to real DIT workflow | If real, the filesystem<->collection bridge is critical infrastructure. |
| Q11 | What is the minimum viable access model for the VFX pilot? | Unknown | CAM won't be ready. What can we ship without it? |
| Q12 | Should "release to domain" be a type of collection share? | New Content Hub already unifies people + domains in one dialog | If yes, domains are just another recipient type. If no, release remains a separate workflow. |
| Q13 | How do VFX turnovers map to collections? | Prototype has snapshot + upload; missing versioning and change deltas | Turnovers are the most demanding collection use case. If collections can't model turnovers, they're incomplete. |
| Q14 | Should auto-release be a shared smart collection? | Content Hub has auto-release config per asset type + domain | "All finals auto-release to STUDIO_POST" = shared smart collection with filter "status=final" and recipient = STUDIO_POST domain. Elegant unification or dangerous conflation? |

---

## 7. VFX Turnovers (Scoped Deliveries)

A turnover is a critical real-world workflow that maps directly to "collections with scoped access." Understanding it validates and constrains the collection model.

### What is a turnover?

The formal handoff of shot work from editorial to VFX. It defines **scope** (which shots need VFX work), **materials** (source plates and references), and **intent** (what the VFX should achieve). Triggered when a cut is locked or stable enough to commit vendor work against it.

### Turnover package contents

| Material | Purpose |
|----------|---------|
| **Plates** | Camera-original frames per shot (EXR/DPX sequences) |
| **Reference cut** | ProRes with burn-ins (timecode, shot IDs, frame counts) for editorial context |
| **EDL/AAF/XML** | Edit decision list mapping source timecode to record timecode, exact frame ranges |
| **Audio guide track** | Mixdown for sync reference |
| **Camera/lens metadata** | Focal length, sensor size, LUT info for CG integration |
| **Editorial VFX notes** | Per-shot descriptions ("wire removal on frames 1042-1078") |
| **Vendor bid/scope sheet** | Shot count, complexity tier, frame ranges, delivery specs |

### Lifecycle

1. **Editorial locks a cut** (or sequence)
2. **VFX coordinator** pulls plates, builds package, assigns shot IDs (e.g., `SQ0100_SH0040_v001`)
3. **Package transmitted** to vendor (Aspera/drives, now increasingly platform delivery)
4. **Vendor works shots**, delivers temps back for editorial review
5. **Re-turnovers** when cut changes: updated EDLs, new/modified plates, shot adds/drops. Carry version lineage (turnover v2, v3...)

### Scope and access control

Turnovers are **scoped by vendor AND by sequence**. A vendor working on creature FX for sequences 3 and 7 receives only those shots -- never the full cut or other vendors' work. This is both security (preventing leaks) and practical (vendors only need their slice).

### How turnovers map to the collection model

| Turnover concept | Collection equivalent |
|-----------------|----------------------|
| Turnover package | **Versioned, scoped collection** with access intent |
| Scope (shot/sequence filter) | Collection contents (curated or filter-based) |
| Per-vendor access | **Grants** with specific permissions |
| Re-turnover | **New version** of the collection (or snapshot) with change delta |
| Bidirectional flow (plates out, renders back) | **Dropbox mode** -- upload-enabled collection |
| Asymmetric access | **Different permission levels** -- vendor sees their shots, studio sees everything |

### Key insight for the model

A turnover is NOT just "sharing files." It is a **scoped delivery with bidirectional flow** (plates out, renders back), **version lineage** (re-turnovers track what changed), and **asymmetric access** (vendor sees only their shots, studio sees everything). The collection model must handle all three dimensions to replace the current manual turnover workflow.

### What's missing from the current prototype

- **Versioned collections** -- re-turnovers need version history ("v1 had 8 shots, v2 added 3, dropped 1")
- **Change deltas** -- "what changed since last turnover?" is a critical coordinator question
- **Intent metadata** -- per-shot notes, delivery specs, bid information attached to the collection

These aren't blockers for the pilot but they determine whether collections can fully replace the current turnover workflow long-term.

---

## 8. Domain Release (Real Content Hub)

Domains are how Content Hub controls who sees what at scale. They predate and will coexist with the next-gen library. The domain names are settled -- changing or adding one requires organizational alignment across Netflix. This is infrastructure, not a design choice we get to revisit.

### What are domains?

Organizational groups that content can be released to. Each is CAM-capability-gated: you must hold the right capability to release content to a domain, and users in that domain see content released to them. Think of them as broadcast channels for content distribution -- not person-to-person sharing, but "make this available to everyone in Marketing."

### The domains (stable, settled over years)

**Studio** (production-internal):
PRODUCTION_VFX, STUDIO_VFX, STUDIO_POST, STUDIO_CREATIVE, STUDIO_PRODUCTION, STUDIO_DUBBING

**Wide** (Netflix divisions):
DISTRIBUTION, GLOBALIZATION, PUBLICITY, MARKETING, LEGAL, PRODUCT_CREATIVE, PRODUCT_METADATA_AND_RATINGS, GENERAL, MUSIC, CASTING, PRODUCTION_EDITORIAL, PRODUCTION_PICTURE_FINISHING, CONTENT_PREVIEW

**Other**:
CONSUMER_INSIGHTS

### The release action

"Release" = make content visible to everyone in one or more domains. It's a broadcast, not a targeted share. You select assets, pick domains from a grouped checklist (Studio / Wide / Other), and submit. Everyone in those domains can now see the assets. Release can be undone. Notes can be attached. Some domains have auto-release rules (e.g., all editorial assets auto-release to STUDIO_POST on creation).

The key difference from person-to-person sharing: **release is audience-defined (who should see this category of content), not relationship-defined (who am I working with right now).**

### Where Content Hub is already heading

The newer Content Hub UI already puts **People and Domains in the same share dialog** (two tabs). This is the natural direction: one dialog, two modes of distribution. The next-gen model should embrace this rather than reinvent it.

### What this means for the next-gen model

1. **Domains are a recipient type, not a separate workflow.** "Release to MARKETING" is conceptually "share with the Marketing group." The grant mechanism can be the same. The language ("release") can stay -- it carries meaning and history.

2. **Auto-release maps to smart collection sharing.** "All finals auto-release to STUDIO_POST" = a shared filter where tagging an asset as "final" is the release action. The system does the distribution; the user just tags.

3. **Domain tiers (Studio/Wide) are permission escalation.** Releasing to Studio is narrower than releasing to Wide. The share dialog should reflect this hierarchy -- Studio domains first, Wide second -- just as the current Content Hub already does.

4. **The vocabulary question.** Our prototype uses "department" for the boundary; Content Hub uses "domain." They may or may not be the same thing (Q1 in Open Questions). But the release-to-domain workflow is proven and must be supported regardless of naming.

---

## 9. Reference Products

| Product | What it does well | What we can learn |
|---------|------------------|-------------------|
| **Iconik** | Single collection concept; object-level permissions; role groups as templates | One container type with flexible permissions. Users don't choose between folder/collection/playlist. |
| **Frame.io** | Review-focused; comment-at-timecode; version stacks | Review as a first-class flow, not an afterthought. |
| **Google Drive** | Folder sharing that "just works"; external sharing warnings | Cross-boundary warning when sharing outside org. |
| **Apple Photos** | Smart albums; zero-concept learning curve | Smart collections should feel this natural. |
| **Notion** | Workspace + page sharing; granular permissions | One share model regardless of content type. |

---

## 10. People & Their Priorities

| Person | Role | What they care about most |
|--------|------|--------------------------|
| **Ivan** (you) | Design lead | Consolidation; one concept; elegant system underneath |
| **Megan** | PM | Pilot readiness; alignment with Craig; clear priorities |
| **Carol** | CR PM | Playlists; user groups over departments; CR independence |
| **Ian** | CR XD | Collection/playlist overlap; canvas future; design alignment |
| **Julie** | CAM team | Domain integrity; onboarding flow; "alarm bells" about in-app dept management |
| **Sally** | Content Hub | Domain-first; push for department = domain alignment |
| **Christina** | Foundations | Building access component for Q2; wants to be used, not bypassed |
| **David Park** | Director (persona) | Just wants to watch and comment |
| **Sarah Chen** | VFX Coordinator (persona) | Manage vendor deliveries; package shots for editorial |
| **James Liu** | Vendor (persona) | Scoped access; upload deliveries; nothing leaks |

---

## 11. What Success Looks Like

A user opens the media library for the first time. Within 5 minutes, without training:

1. They understand where their files are (workspace/department)
2. They understand how to share something (one action, one dialog)
3. They understand what they received (inbox/notification)
4. They understand how to control who sees what (permissions panel)
5. They never encounter a concept split ("is this a folder or a collection?")

A coordinator manages access for their department. They can:

1. See every share that involves their department's content
2. Remove any share with one action
3. Answer "who has access to this?" instantly
4. Share with a vendor without creating access they can't revoke
5. Never accidentally expose unreleased content

A VP/director reviews content. They:

1. Click a link or notification
2. Watch, comment, move on
3. Never think about workspaces, collections, or permissions
