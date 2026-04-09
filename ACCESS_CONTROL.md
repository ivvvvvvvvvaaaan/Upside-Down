# Sharing & Permissions; Design Principles

## The two layers of access

### Departments: who you are
You belong to a department. You see your department's files. This is structural; managed at the org level by production coordinators. Editorial sees editorial files. VFX sees VFX files. That's the baseline.

### Collections: what you're working on
Collections are how work crosses department boundaries. An editor shares a cut with the VFX supervisor. A DIT sends camera selects to editorial. A coordinator packages approved shots for a vendor. These are intentional acts; someone decided you should see this.

Departments give you a home. Collections give you reach.

---

## One way to share

You can share a single asset, a selection of assets, or a folder. The experience is the same: same dialog, same role options, same expiration controls.

A single asset is shared as-is. Multiple assets become a collection. A folder becomes a collection that stays in sync with the folder's contents. The folder stays inside the department; the collection is what crosses the boundary. When new content lands in the folder, it appears in the shared collection automatically. This is how department work reaches people outside the department without giving them access to the whole workspace.

**Easy to take back.** Remove a person from a share; they lose access. Remove an asset from the collection; everyone loses access to that asset. Remove the whole collection; all access gone. The folder and its contents stay in the department. Every level works the same way, in the same place.

---

## Access is additive

A user's permissions are the sum of every way they got access; being added directly, being on a team, belonging to a department, receiving a shared collection. You can't override one path with another. To restrict, you remove the specific share that gave them access.

Other systems let you block people, take the most restrictive path, or let the latest change win. All of these create the same problem: nobody can explain why someone can't access something.

We take the simplest position: if any path gives you access, you have access. If someone shouldn't see something, you don't share it with them. If they already have access through their department, that's by design; their department decided they belong there.

---

## Every permission should be explainable

For any asset, any collection, any folder; the system should be able to answer:

- **Who can access it?**
- **Why?** Department membership, collection share, team membership.
- **Through what path?** "Via Dailies Review Cuts." "Editorial department access." "Direct share from Priya."
- **Who shared it?**
- **When does it expire?**
- **How do I remove it?** Remove the person, remove the asset, or remove the collection. Each level is one action.

A coordinator should be able to look at any asset, see exactly who has access, understand why, and remove it in one step if needed.

---

## Sharing can be synced or frozen

When you share a collection, you choose whether the recipient sees the collection as it evolves, or sees a frozen copy of what was in it at that moment.

This is a per-recipient choice. The same collection can be shared both ways. A vendor gets a frozen delivery; they shouldn't see next week's shots leaking in. An internal supervisor stays synced; they want updates as they happen. You don't need separate collections for this.

---

## Permission levels

When you share, you choose what the recipient can do:

- **View**: open and download files.
- **Comment**: everything in View, plus leave feedback and annotations.
- **Contribute**: everything in Comment, plus upload new files. Cannot modify or delete existing ones.
- **Edit**: everything in Contribute, plus modify and reshare with others.
- **Manage**: full control; edit permissions, remove people, delete the collection.

The important distinction: **Contribute lets you add, not change.** A vendor uploads rendered frames, but cannot touch the brief or reference material they received.

---

## Departments, groups, and roles

**Departments** organize content and provide default access. Everyone in VFX sees VFX files. Everyone in Editorial sees editorial files. This is managed at the org level, not per-share. Department members with manage access can manage any collection that belongs to their department; regardless of who created it. The collection belongs to the department, not to one person.

**Groups** are saved lists of recipients. The dailies review includes the director, the editorial coordinator, and the VFX supervisor; three different departments. Without a group, you'd add all three individually every time a new cut lands. Create a group once ("Dailies Review," "Super Prod," "Localization"), share to the group, and when someone joins or leaves, their access updates automatically.

**Roles** define what someone can do with what they received. View, comment, contribute, edit, manage. Each role is a bundle of permissions. Roles are assigned per-share; the same person can have different roles on different collections.

---

## Sharing is immediate

When someone shares a collection with you, you have access immediately. The inbox tells you it happened; you open things when you need them.

The sharer already made the decision. An accept step would slow down real work; an editor shouldn't have to wait before pulling shared shots into the timeline.

---

## Mount to Drive is a local choice

Mounting a collection to your local drive makes the files available at a filesystem path for tools like Premiere, Nuke, or DaVinci. You're working off the shared originals; not copies.

Mounting is explicit and per-user. You receive many shares; you mount the ones you're actively working with. If you need your own copy to modify without affecting the original, that's a deliberate action; you lose the live link.

---

## Review links

A review link is an invitation to respond, not a key to the library. Links expire. Links can require a passcode. Links can restrict download. Whether the recipient needs to be authenticated or can view anonymously is a decision that depends on the use case.

This exists because external stakeholders need to see content without getting accounts in the system. The link gives them a scoped, time-limited, watermarked view.

---

## How access works for cuts (open question)

A cut is assembled from source files across departments; video timeline from editorial, audio mix from sound, VFX plates from VFX. When someone receives access to a cut, the question is: what exactly can they see?

There's a tension. A director reviewing a cut needs to watch it and understand what's in it. But the individual VFX plates that make up a shot may not have been released by the VFX department yet. Does sharing the cut override the VFX department's control over their files?

Two possible positions:

- **Playback access**: you can watch the cut. The system resolves the source files internally to play it back. You don't get direct access to browse or download individual constituent files unless they were shared separately.
- **Full access**: sharing the cut shares everything it's made of. If you can see the cut, you can see the plates, the audio stems, the timeline files.

This needs to be resolved based on how departments actually want to control their work product as it moves through the pipeline.

---

## Summary of beliefs

1. Sharing works the same way regardless of what you're sharing.
2. Access is additive. No deny rules. Remove the share to restrict.
3. Every permission is explainable and removable.
4. Department access is structural. Collection access is intentional. Both coexist.
5. Department members manage their department's collections collectively.
6. Sharing is immediate. The inbox is a feed, not a queue.
7. Mount is a local choice for filesystem access. Not every share needs it.
8. Synced or frozen is a per-recipient choice, not a per-collection choice.
9. Contributing means adding, not changing.
10. Review links are scoped, expiring invitations.
11. How cuts share access to their source files is an open question.
