# Sharing & Permissions Roadmap

## Context

Ongoing project to simplify and improve the sharing and permissions system across folders, collections, and assets. Informed by user feedback, Iconik/Frame.io research, and prototype learnings.

### Guiding principles
- Folder sharing is already good — two roles, simple, keep it
- Collections are a frame for assets; recipients never manage the container
- Content access and invite authority are orthogonal (Iconik model)
- Sharing with existing project users is low-stakes and broadly available
- `canOnboard` scoped to a folder node is the onboarding control system
- Build phases in order — Phase 1 changes what later phases sit on

---

## Share modal target state (post Phase 1)

### Folders
Binary choice, no toggles:
```
○ Full Access   Can edit files and manage access
○ View only     Can browse and view files
Set expiry  [toggle → date picker]
```

### Collections
Toggles only. View is implicit.
```
Download     [toggle]
Comment      [toggle]
Expires      [toggle → date picker]
```

### Assets
Toggles only. View is implicit.
```
Download     [toggle]
Edit         [toggle]   ← write access to the file itself
Comment      [toggle]
Expires      [toggle → date picker]
```

### Onboarding (separate from share flow)
`canOnboard` is a **user-level capability**, not a per-grant toggle.
- Super admin (isAdmin) can always onboard
- Team managers (managerUserIds on any group-kind team) can onboard
- Derived from existing data — no new permission needed
- In the share search: typing an unknown email shows "Invite [email] to project" only for users with canOnboard
- Managed via Settings → Groups (who is a team manager)

---

## User stories

### Phase 1 — Permission model

**As a VFX supervisor sharing a folder with an editor,** I want to choose between "they can view files" or "they can edit files" — nothing in between — so I don't have to reason about what a named role like "Review & Share" actually means.

**As a VFX supervisor sharing a collection of approved shots with editorial,** I want to share the collection and only decide if they can download or comment, not whether they can "manage" the collection — because the collection is mine, I'm just letting them see what's inside it.

**As a post supervisor onboarding a new editor onto the project,** I want the system to let me add them to `/Editorial` without needing to ask an admin — because I have onboarding authority on that folder and nobody else should need to be involved.

**As a VFX coordinator sharing a vendor folder,** I want to bring a net-new external vendor email into `/VFX/Framestore` — and I have that ability specifically because I was given `Can onboard` on `/VFX`, not because I'm an admin.

**As a vendor artist who was given access to `/VFX/Framestore/Sandy`,** I should not be able to invite anyone else — I can work in my folder but onboarding is not my authority to delegate.

**As an editorial assistant with access to `/Editorial/Episode 101`,** I want to share that folder with a colleague already on the project — I don't need any special permission to do this, they're already in the system and I have access to the folder.

### Phase 2 — Per-grant granularity

**As a colorist sharing a specific comp file with a client for sign-off,** I want to share it view-only but explicitly allow them to download it — because the brief says they need an offline copy but shouldn't be able to edit anything.

**As an editorial coordinator sharing a cut with a director,** I want to allow them to leave timecoded notes but not download the file — so feedback stays in the system and source files don't leak.

**As a VFX supervisor sharing a comp with a vendor for a short turnaround,** I want their access to expire automatically in 7 days — so I don't have to remember to revoke it manually after delivery.

**As a producer reviewing who has access to an asset,** I want to be able to change someone's download or comment permission after the fact — without revoking and re-sharing the whole grant.

### Phase 3 — Guest links

**As a post supervisor sharing a review link with an external stakeholder,** I want to protect it with a passphrase I can communicate separately — so if the link leaks, it's not immediately accessible.

**As an editorial coordinator sending a review link to a specific client,** I want the link to only work for that client's email address — not anyone who gets forwarded the URL.

### Phase 4 — Access requests

**As a director who clicks a link to an asset they don't have access to,** I want to be able to request access in one click — rather than emailing someone to ask.

**As a VFX supervisor who owns a folder,** I want to see access requests in my inbox and approve or deny them — so I stay in control of who enters my folder scope.

### Phase 5 — Share activity

**As a post supervisor who shared a review collection with a studio exec,** I want to know if they've actually opened it — so I can follow up if they haven't before the decision deadline.

**As a VFX coordinator who shared a guest link with a vendor,** I want to see a log of every time they opened it, what they viewed, and whether they downloaded anything — so there's accountability on what they accessed.

---

## Phase 1 — Permission model foundation ✅

- [x] Remove `manager` from collection `profileIds` — collections now only allow downloader and viewer
- [x] Replace `share` permission with `onboard` across the Permission union and access engine
- [x] Strip `share`/`onboard` out of editor and downloader role defaults — only manager carries `onboard`
- [x] `canShare` is now implicit with any access (`allowed === true`) — sharing with existing project members needs no special permission
- [x] `canOnboard` is a derived user-level capability (isAdmin or team manager) — not a per-grant permission
- [x] Toggle-only share UI for assets and collections — no role radios, just capability toggles (Download, Edit, Comment, Set expiry)
- [x] Folder share keeps Full Access / View only radios + Set expiry
- [x] "Invite [email] to project" shown in share search when user is admin or team manager and query looks like an email
- [x] Role Groups matrix cleaned up (Read, Download, Write, Delete, Comment, Upload, Admin)

---

## Phase 2 — Per-grant granularity

Builds on Phase 1. Roles are clean so extras are unambiguous.

- [x] Download / comment toggles always visible in step 2 for non-folder resources
- [x] Expiry toggle in step 2 for all resource types
- [ ] Make download / comment / expiry editable inline on existing grant rows — currently set at creation time only, no way to change after the fact

---

## Phase 3 — Guest link overhaul

Independent of Phase 1 data model but benefits from it being done first.

- [ ] Real passphrase — change `passcode: boolean` stub to an actual string field with text input
- [ ] Invite-only link mode — link restricted to named email addresses, not public to anyone with the URL
- [ ] Evaluate unifying guest links and review links — they are very similar concepts

---

## Phase 4 — Access request approval

Independent. Data model already exists (`accessRequests` state), no approval UI yet.

- [ ] Approval flow in Inbox — resource owner sees pending requests and can approve / deny
- [ ] Notification to owner when someone hits a restricted resource and requests access

---

## Phase 5 — Share activity

Independent. Not started.

- [ ] Per-share view tracking: who opened, viewed, downloaded, commented via a share link
- [ ] Activity feed on a share (Frame.io pattern — chronological log per share)

---

## Already shipped

- Toggle-only share UI for assets and collections (Phase 1)
- Folder share: Full Access / View only radios + Can onboard + Set expiry (Phase 1)
- `onboard` permission in the Permission union; `canOnboard` in access context (Phase 1)
- `canShare` implicit with any access — no special permission needed to share with existing users (Phase 1)
- Collections restricted to downloader / viewer profileIds — manager removed (Phase 1)
- Expiry toggle in step 2 for all resource types (Phase 2)
- Download / comment toggles in step 2, always visible for non-folder resources (Phase 2)
- Live vs snapshot share mode on collections
- Snapshot asset ID freezing on collection grants
- Access request storage (no approval UI yet)
- Audit log (grant/revoke events)
- Guest links with boolean passcode, expiry days, download toggle
- Review links (authenticated expiring grants via `/review/[linkId]`)
- Project lock / unlock
- Blocks (per-user, per-resource deny override)
- Sensitive media capability flag
- Role Groups matrix (admin-only, Settings → Role Groups tab)
