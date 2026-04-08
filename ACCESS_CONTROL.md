# Sharing & Permissions — Design Principles

## The two layers of access

### Departments: who you are
You belong to a department. You see your department's files. This is structural — managed at the org level by production coordinators. It doesn't change per-project or per-share. Editorial sees editorial files. VFX sees VFX files. That's the baseline.

### Collections: what you're working on
Collections are how work crosses department boundaries. An editor shares a cut with the VFX supervisor. A DIT sends camera selects to editorial. A coordinator packages approved shots for a vendor. These are intentional acts — someone decided you should see this.

Departments give you a home. Collections give you reach.

---

## Why collections are the sharing unit

Every sharing action produces a collection. Even when you share a folder, you're really sharing a collection that stays in sync with that folder's contents. We made this choice because:

- **One mental model.** Users don't need to learn the difference between "sharing a folder" and "sharing a collection." They share. The system handles the rest.
- **Consistent controls.** Every share has the same options: role, expiration, live/snapshot, upload permission. Whether it started as a folder or a hand-picked set of assets.
- **Clean revocation.** Revoking a share means revoking the collection grant. No ambiguity about folder ACLs, inheritance chains, or orphaned permissions.

A folder-bound collection auto-updates when files land in the source folder. A curated collection contains exactly what was selected. Both are collections. Both share the same way.

---

## Access is additive

A user's effective permissions are the union of everything that grants them access — direct grants, team membership, department membership, collection shares. You can't "take away" access that another path provides. To restrict, you revoke the specific grant.

We chose this because the alternative — subtractive permissions where a deny overrides an allow — creates invisible conflicts. A coordinator shares a collection with view access, but a department policy already grants edit. Does the share downgrade the user? In our model: no. The user gets the higher of the two. Predictable. Explainable.

---

## Snapshots are per-recipient

The same collection can be shared live with one person and as a snapshot with another. The collection itself is always live — it's a source of truth. A snapshot freezes what a specific recipient sees at the moment of sharing.

This matters because different recipients have different needs. A vendor gets a frozen delivery package (snapshot) — they shouldn't see next week's shots leaking in. An internal supervisor gets the live view — they want to see updates as they happen. Same collection, different views, no duplication.

---

## Upload is not write

Giving someone upload permission means they can add new files. It does not mean they can modify or delete existing ones. This distinction exists because the most common cross-department workflow is a delivery: a vendor uploads rendered frames, but must not touch the brief or the reference material they received.

---

## Department members can manage their department's collections

If you have manage-level access on your department, you can manage any collection that belongs to that department — regardless of who created it. Lisa creates "Dailies Review Cuts" in editorial. Maria, also in editorial with manage access, can share it, change permissions, add people. The collection belongs to the department, not to Lisa.

This prevents the "Lisa is on vacation and nobody can share the dailies" problem.

---

## The ontology is not the collection

Characters, scenes, and locations are facts about the content — discovered from scripts, metadata, and AI tagging. "AR-24" is a character. "Pit Lane" is a location. These exist whether or not anyone creates a collection for them.

Smart collections are views into the ontology. The "Character" collection is a lens that groups assets by character tag. You can rename it, change its filters, delete it. The characters don't disappear — they're still tagged on the assets. The ontology persists. Collections are how you browse it.

A derived entity like "AR-24" under the Character collection can be removed from the browsing view, but its name and filter can't be edited — because the name IS the data. You can't rename a character from a collection panel.

---

## Inbox is notification, not gatekeeping

When someone shares a collection with you, you have access immediately. The inbox tells you it happened. There's no accept/reject gate. We chose this because:

- In production workflows, time matters. An editor shouldn't wait for a coordinator to "accept" before they can pull VFX shots into the timeline.
- The share is the decision. The sharer already decided you should have access. Adding an accept step is friction with no security benefit — the grant is already made.
- The inbox becomes useful for what it's good at: awareness. "Sarah shared B-Roll Highlights with you." You see it, you open it when you need it.

---

## Mount to Drive is a local choice

Mounting a collection to your local drive (via LucidLink) makes the files available at a filesystem path for tools like Premiere, Nuke, or DaVinci. You're working off the shared originals — not copies.

Mounting is explicit and per-user. You receive many shares. You mount the ones you're actively working with. The mounted folder is a read window. If you need your own copy to modify without affecting the original, that's a deliberate action — you lose the live link.

Not everything needs to be mounted. Some collections you just browse in the web UI. Mount is for when the files need to be on disk.

---

## Departments and teams

| Concept | Purpose |
|---|---|
| **Department** | Where the content lives. Organizes the workspace. Provides default access via inheritance. |
| **Team / group** | Who gets access. A named list of people. Can span departments (e.g., "Dailies Review" includes editorial + VFX + director). |
| **Role group** | What they can do. View, comment, contribute, edit, manage — each a bundle of permissions. |

Departments organize content. Teams distribute access. Both exist because:
- Departments alone can't express cross-functional groups.
- Teams alone can't provide the stable content structure and default inheritance that departments give.

---

## Review links

A review link is an invitation to respond, not a key to the library. The recipient must be authenticated. The link resolves to a grant for a specific user — forwarding the URL doesn't forward access. Links expire. Links can require a passcode. Links can restrict download.

This exists because external stakeholders (executive producers, marketing agencies) need to see content without getting accounts in the system. The link gives them a scoped, time-limited, watermarked view.

---

## Summary of beliefs

1. One sharing mechanism. Collections. Always.
2. Access is additive. No deny rules. Revoke to restrict.
3. Department access is structural. Collection access is intentional. Both coexist.
4. Department members manage their department's collections collectively.
5. The ontology (characters, scenes, locations) is data. Collections are views into it.
6. Inbox notifies. It doesn't gate.
7. Mount is a local choice for filesystem access. Not every share needs it.
8. Snapshots and live views are per-recipient, not per-collection.
9. Upload doesn't mean write.
10. Review links are scoped, expiring, authenticated invitations.
