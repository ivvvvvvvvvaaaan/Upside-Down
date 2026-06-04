# Prototype Gap Analysis
# Media Library ↔ Creative Review Ecosystem

*Assessed 2026-06-04 against decisions in `docs/platform-architecture.md`*

---

## What the prototype does well (keep as-is)

- **Folder hierarchy with hierarchical access propagation** — parent grants ripple to children, correctly models dept folder inheritance
- **Collections with ripple access** — granting a collection gives access to member assets, correctly distinct from folder semantics
- **Smart collections** — query-based, ontology-driven, correctly NOT an access-granting mechanism (viewer sees their slice)
- **Release domains** — domain-targeted grants, 10 domains configured, aligns with targeted release model
- **Teams** — group and domain kinds, managerUserIds, correctly powers canOnboard derivation
- **Permission model** — Phase 1 complete: toggle-only for assets/collections, folder radios, canShare implicit, canOnboard derived
- **Cut as Asset kind** — `kind: 'cut'`, stages (locked-cut/final-cut/emf), versionGroupId — correct primitive
- **Review links** — expiring authenticated grants via `/review/[linkId]`
- **Access request storage** — data exists, needs UI (Phase 4)

---

## Gaps by layer

### 1. Asset lifecycle — no explicit state field

**Current:** Status inferred from grants (has a release grant = released). No first-class `status` field.

**Needed:** Explicit `status: 'working' | 'approved' | 'released'` on assets.

- `working` — in dept folder, dept team only, active iteration
- `approved` — creative review sent signal back OR dept owner marked approved
- `released` — access expanded; auto or targeted depending on folder config

**Steps:**
- [ ] Add `status` field to Asset type in scenario/data-client
- [ ] Add `approvedAt`, `approvedBy` fields for audit trail
- [ ] Update asset detail UI to surface status badge
- [ ] Add "Mark approved" action for dept owners (operational review path)
- [ ] Wire release logic: on `approved` → check folder `releaseOnApproval` → auto-grant if set

---

### 2. Folder dept ownership — no ownerTeamId

**Current:** Folders have `domainId` (which domain they belong to) but no explicit team ownership signal. Dept access is configured manually.

**Needed:** `ownerTeamId` on folders — the team whose membership grants implicit access.

**Steps:**
- [ ] Add `ownerTeamId?: string` to folder/UnifiedFileNode type
- [ ] Update access engine: if `folder.ownerTeamId` is set and user is a member of that team → implicit open grant
- [ ] Add folder creation flow: option to assign an owner team
- [ ] Three access paths to dept folder:
  - Manual invite (already exists)
  - Access request → approval (Phase 4 roadmap, needs UI)
  - Onboarding dept flag: `user.departmentId === folder.ownerTeamId` → auto-grant (needs user dept field + logic)

---

### 3. Folder release behavior — no releaseOnApproval

**Current:** Release is always manual (explicit domain grant action).

**Needed:** `releaseOnApproval: 'project' | 'none'` on folders.

- `/Editorial/` → `releaseOnApproval: 'project'` — locked cut auto-surfaces project-wide on approval
- `/VFX/Framestore/` → `releaseOnApproval: 'none'` — manual targeted release

**Steps:**
- [ ] Add `releaseOnApproval` field to folder type
- [ ] When asset status changes to `approved`: check folder config → fire auto-release grant if `'project'`
- [ ] Project-level smart containers (`/Cuts/`, `/Shots/`) auto-populate from approved assets (see §5)

---

### 4. Session — no formal entity

**Current:** Collections exist but there's no concept of a "session" or any push-to-CR mechanism. Review links are the closest thing but they're individual asset grants, not a playlist pushed to CR.

**Needed:** A collection can be pushed as a session to CR. Session has a state.

**Steps:**
- [ ] Add `sessionState: null | 'pending' | 'in-review' | 'approved'` to Collection type
- [ ] "Push for review" action on an ordered collection → sets `sessionState: 'in-review'`
- [ ] In the prototype, CR side is mocked: "session sent" notification, simulated exec approval
- [ ] "Mark approved" on a session (mocked CR signal) → updates constituent assets to `status: 'approved'`
- [ ] EA workflow surface: list sessions in progress, notes received, next action

---

### 5. Smart folders — no workflow-aware typed containers

**Current:** Folders are standard hierarchy nodes. `/Cuts/` and `/Shots/` don't exist as special entities. No auto-populating project-level containers.

**Needed:** Typed smart folders at project level that auto-populate based on asset status.

- `/Cuts/` — auto-populates with assets of `kind: 'cut'` and `status: 'approved'` from across the project
- `/Shots/` — similar for shots/VFX deliveries
- These are post-approval visibility containers, not pre-review staging

**Steps:**
- [ ] Add `folderKind: 'standard' | 'smart' | 'dept'` to folder type
- [ ] Smart folder definition: `{ query: { kind: 'cut', status: 'approved' } }` — same mechanism as smart collections
- [ ] Smart folders are project-level (no `ownerTeamId`), visible to all project members
- [ ] Project template: default template creates `/Cuts/` and `/Shots/` smart folders at project root
- [ ] Small-team path: editor uploads directly to `/Cuts/` smart folder (skips dept layer)

---

### 6. Collection ordering — no playlist behavior

**Current:** Collections are unordered sets of asset IDs (`assetIds[]`).

**Needed:** Collections can be ordered for use as session playlists.

**Steps:**
- [ ] Change `assetIds: string[]` to ordered array (it may already be ordered by index — confirm)
- [ ] Add drag-to-reorder in collection detail UI
- [ ] "Build session" action: converts a collection to an ordered playlist ready to push
- [ ] Display ordering in collection view when `sessionState` is set

---

### 7. Annotation/notes model — no data structure

**Current:** `allowComment` permission flag exists on grants but there is no Comment or Annotation data structure anywhere.

**Needed:** Notes attached to asset versions in the shared foundation. Library shows summary; CR shows full timecoded detail.

**Steps:**
- [ ] Add `Note` type: `{ id, assetId, versionId?, text, author, createdAt, timecode?, source: 'library' | 'cr-session', sessionId? }`
- [ ] Add `notes: Note[]` to scenario state
- [ ] Library asset detail: show note summary ("3 notes from Director — Session 2")
- [ ] For prototype: mock CR notes as pre-seeded data on approved-path assets
- [ ] EA workflow: view notes on asset, flag specific notes for editor
- [ ] "Notes resolved" action when editor addresses feedback

---

### 8. Integration contract surface — not modeled

**Current:** No representation of the CR ↔ ML boundary in the prototype. The CR app doesn't exist.

**Needed:** The prototype should model the integration points even if CR is mocked.

**Integration contract (to mock):**

Library → CR:
- Session object: `{ id, collectionId, assetIds (ordered), reviewerIds, expiresAt }`
- Action: "Push for review" sends this (mocked: logs to console / shows confirmation)

CR → Library:
- Approved signal: `{ sessionId, assetId, approvedBy, approvedAt, notes[] }`
- Action: "Simulate CR approval" button in prototype for EA to trigger (mocked)

**Steps:**
- [ ] Add session push action to collection UI (EA-only)
- [ ] Add "Simulate approval received from CR" action in prototype (dev/demo mode)
- [ ] Approval signal handler: updates asset `status`, attaches notes, fires releaseOnApproval logic
- [ ] EA inbox: shows sessions awaiting approval, sessions with notes returned

---

## Gaps already in the roadmap (carry forward)

| Gap | Roadmap phase |
|-----|---------------|
| Inline grant edit (download/comment/expiry after creation) | Phase 2 |
| Guest link real passphrase (string, not boolean) | Phase 3 |
| Invite-only link mode | Phase 3 |
| Access request approval UI in inbox | Phase 4 |
| Per-share view tracking | Phase 5 |

---

## Recommended build order

**Step 1 — Data model** *(foundation for everything else)*
Asset status field, folder ownerTeamId, folder releaseOnApproval, collection ordering, Note type

**Step 2 — Smart folders + dept ownership**
Folder kinds, smart folder auto-population, ownerTeamId access rule, project template

**Step 3 — Session concept**
Collection → session push (mocked), sessionState on collection, mocked CR approval signal, asset status update on approval

**Step 4 — Notes model**
Note data structure, library note summary on asset detail, mock CR notes on demo assets, EA note review surface

**Step 5 — EA workflow surface**
EA-specific view: sessions in progress, notes returned, next action queue, "push for review" and "simulate approval" actions

**Step 6 — Roadmap phases 2–4**
Inline grant edit, access request UI, guest link improvements

---

## What this prototype will demonstrate when complete

A single media library surface where:
- An editor uploads a cut and it lands in their dept folder, invisible to others
- An editorial assistant curates a session playlist and pushes it to CR (mocked)
- A mocked CR approval signal arrives, asset status changes, notes attach
- The locked cut auto-releases to the project-level `/Cuts/` smart folder
- VFX and music can now find and access the locked cut
- An exec (operational review path) leaves a comment directly on a shot in the library, no session needed
- Small teams skip the dept layer entirely and work flat
