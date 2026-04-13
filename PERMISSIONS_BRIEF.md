# Permission Levels: Research Brief

*April 10, 2026*

*Status: First pass resolved in PERMISSIONS_MODEL.md. May be revisited.*

## The problem

Our current permission levels (Can View, Can Comment, Can Add, Can Edit, Can Manage) don't map to the real CAM platform levels (Viewer, Editor, Manager, Admin). This is a fundamental mismatch called out by the team. We need to:

1. Align with CAM's existing role hierarchy
2. Provide enough granularity for production workflows
3. Keep the UX simple enough that coordinators can assign the right level without a training manual

## Current model (prototype)

```
Owner        — open, download, write, delete, comment, share, edit-acl, upload
Can Manage   — open, download, write, delete, comment, share, edit-acl, upload
Can Edit     — open, download, write, comment, share
Can Add      — open, download, write, comment
Can Comment  — open, download, comment
Can View     — open, download
Link Viewer  — open, download (guest link, no account)
```

These are displayed as role labels in the share dialog dropdown and in the access tab.

## CAM platform levels

The real CAM system uses four levels: **Viewer, Editor, Manager, Admin**. These are capability-based and map to what actions a user can take across the platform. Any solution must either map directly to these or explicitly document where we diverge and why.

## Problems with current model

### P1: Too many levels, unclear distinctions
"Can Add" vs "Can Edit" — what's the practical difference? A coordinator shouldn't need to think about whether someone needs write-without-delete. In production, you either trust someone to modify content or you don't.

### P2: "Can Manage" vs "Owner" are identical
Same permissions, different name. Confusing. What distinguishes them?

### P3: No download control
"Can View" includes download by default. But there are real scenarios where someone should preview content but NOT download it (sensitive media review, early cuts shared with executives). Preview-only is a missing level.

### P4: Extra capabilities don't have a home
Upload, include-new-assets, version-locking — these are grant-level toggles that sit alongside the role. Are they part of the role? Modifiers on top? The UI currently shows them as "+N" badges, but the model is unclear.

### P5: CAM mismatch means integration friction
When CAM integration arrives (late 2026/2027), our roles need to map cleanly. If we have 7 levels and CAM has 4, every integration point requires translation logic.

## Fixed constraints

1. **CAM has 4 levels: Viewer, Editor, Manager, Admin.** We must align or explicitly justify divergence.
2. **Additive access model.** No deny rules. The highest grant wins.
3. **Permission ceiling applies.** You can't grant higher than what you have.
4. **Release vs Share are different paths.** Release is domain-broadcast (CAM-backed). Share is app-specific (person/team grant).
5. **Department membership gives full workspace access.** No role differentiation within a department.
6. **Sensitive media is orthogonal.** A capability flag, not a permission level.
7. **Guest links need a separate, minimal permission set.** No account required.

## Scenarios to stress-test

### S1: Coordinator shares with a reviewer
Lisa shares a collection of EP301 cuts with David (director). David should preview, comment, annotate. He should NOT download, modify, or reshare. Which level is this?

### S2: Vendor turnover
Sarah shares a VFX plate collection with Framestore. Framestore needs to download plates and upload deliveries into the same collection. They should NOT delete existing plates, modify metadata, or reshare. Which level handles bidirectional turnover?

### S3: Executive preview
Alex (studio head) gets a cut for early viewing. He should watch it in-browser. He should NOT download it (leak risk). He can comment. No resharing. Is this "Viewer" with download stripped, or a separate level?

### S4: Department coordinator managing their workspace
Sarah (VFX coordinator) manages the VFX workspace. She adds/removes people, sets permissions, creates collections, manages folder structure. She does NOT have admin-level platform access. Which level is this?

### S5: Cross-department collaborator
Maria (editorial) is temporarily loaned to the VFX team for a sequence. She needs to edit VFX assets but shouldn't manage the VFX workspace or change permissions. Which level applies to her grant?

### S6: Marketing receives released content
Marketing team gets cuts released to their domain. They can preview and download for promotional use. They cannot modify, comment on (that's Creative Review), or reshare. Is this the same "Viewer" as S1, or different?

### S7: Admin investigation
A leak is suspected. An admin needs to audit all access paths for a specific asset, freeze a user's access across all grants, and review historical access. What admin-only capabilities exist above "Manager"?

### S8: Per-grant modifiers
A viewer who can also upload (vendor turnover). A viewer who gets new assets automatically (live collection). A viewer who is locked to a specific version. How do these modifiers interact with the base level?

## Evaluation criteria

1. **CAM alignment**: Can our levels map 1:1 or N:1 to CAM's Viewer/Editor/Manager/Admin?
2. **Coordinator clarity**: Can a coordinator pick the right level without ambiguity in 90% of sharing scenarios?
3. **Scenario coverage**: Do all 8 scenarios resolve cleanly without workarounds?
4. **Modifier orthogonality**: Are extra capabilities (upload, live, version-lock) cleanly separated from the base level?
5. **Minimal levels**: Fewer is better. Each additional level doubles cognitive load in the share dropdown.
6. **Guest link simplicity**: External reviewers get a restricted experience without confusion.
7. **Future-proofing**: Does the model survive CAM integration without a rewrite?

## Prior art

### Iconik
Separates WHO (teams) from WHAT (role groups). Role groups: Core, Upload, Organize, Comments & Approvals. Orthogonal axes.

### Frame.io
Viewer, Collaborator, Admin. Three levels. Collaborator = can comment + upload. Clean.

### ShotGrid
Very granular per-entity permissions. Complex to administer. Not a good UX model.

### PIX
Viewer, Uploader, Admin per folder. Download is a separate toggle.

### Google Drive
Viewer, Commenter, Editor, Owner. Four levels. Download is separate. Widely understood.

## What we need from autoresearch

1. The optimal number and naming of permission levels
2. How they map to CAM's four levels
3. Which capabilities are base-level vs. grant-level modifiers
4. Whether download should be a separate toggle or baked into levels
5. How guest link permissions relate to the main hierarchy
6. A concrete permission matrix showing level × capability
