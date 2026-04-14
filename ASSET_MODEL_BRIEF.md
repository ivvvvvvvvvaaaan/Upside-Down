# Asset Model Research Brief

*April 14, 2026. Input for autoresearch loop comparing two asset storage models.*

## The problem

When a vendor uploads to a shared collection, the files don't persist unless the collection is folder-bound. The proposed solution (assets exist independently of folders) is architecturally clean but potentially over-engineered for the actual user need. We need to validate whether the new model is genuinely better or whether a simpler fix to the current model solves the same problems.

## Two competing models

### Model A: Current model (folders are truth)

Assets are derived from workspace files. Every asset lives in a folder. Collections reference assets by ID. Folder-bound collections auto-sync with folder contents. Non-folder-bound collections store asset IDs but uploads to them create temporary assets that don't persist.

Fix for vendor uploads: auto-create a workspace folder when upload is enabled on a collection. The folder lives in the department workspace (e.g., VFX/Incoming/Framestore). Vendor uploads land there. The coordinator sees them in the workspace AND in the collection.

### Model B: Assets-first (assets are truth)

Assets exist independently. They don't need a folder. Workspace folders are one view into assets (filtered by location). Collections are another view (filtered by membership). An asset can exist in zero folders. Vendor uploads create assets in the collection. The coordinator can file them into a workspace folder later via drag-and-drop.

## Evaluation personas

### Persona 1: First-time user (5-minute test)

A user opens the media library for the first time. Within 5 minutes, without training:

| # | Requirement | How to score |
|---|-------------|-------------|
| 1.1 | They understand where their files are | Can they find the workspace? Do they know it's their department's space? |
| 1.2 | They understand how to share something | One action, one dialog. No prerequisite setup. |
| 1.3 | They understand what they received | Inbox/notification is clear. They know what's new. |
| 1.4 | They understand how to control access | Permissions panel answers their questions. |
| 1.5 | They never encounter a concept split | "Is this a folder or a collection?" should never come up. |

### Persona 2: Department coordinator

A coordinator manages access for their department. They can:

| # | Requirement | How to score |
|---|-------------|-------------|
| 2.1 | See every share involving their content | Single view, no hunting. |
| 2.2 | Remove any share with one action | Not buried in menus. |
| 2.3 | Answer "who has access to this?" instantly | Per-asset or per-collection, full trail. |
| 2.4 | Share with a vendor without creating irrevocable access | Every path traceable and revocable. |
| 2.5 | Never accidentally expose unreleased content | Department boundary holds. Sharing is always intentional. |

### Persona 3: VP/director reviewer

A VP or director reviews content. They:

| # | Requirement | How to score |
|---|-------------|-------------|
| 3.1 | Click a link or notification | Zero navigation required to start. |
| 3.2 | Watch, comment, move on | No workflow management. No concepts to learn. |
| 3.3 | Never think about workspaces, collections, or permissions | The tool is invisible. |

## Scoring

For each requirement, score 0-5:
- 5 = perfectly met, zero friction
- 4 = met with minor friction (one extra click, slight confusion)
- 3 = met but user needs to think about it
- 2 = partially met, requires workaround
- 1 = barely met, significant friction
- 0 = not met

Composite = average across all 13 requirements. Round to 1 decimal.

## Scenarios to stress-test

From RESEARCH_BRIEF.md and VFX user feedback:

### S1: VFX turnover to vendor
Sarah packages comps, shares with Framestore team + upload + note. James receives, uploads deliveries back. Sarah sees them.

### S2: Editorial cut progression
Lisa shares locked cuts with increasing audiences. Each version goes to more people. No one sees WIP until Lisa shares it.

### S3: "Why did I lose access?"
A folder is moved. Does access break? Can the coordinator explain what happened?

### S4: Vendor uploads 50 files
James uploads a batch. Where do they appear for Sarah? Can she find them without knowing which collection they're in?

### S5: Director gets a review link
David clicks a link. Watches a cut. Comments. Closes the tab. No account setup, no workspace navigation.

### S6: "Who can see this asset?"
Sarah looks at a VFX comp. The access tab shows every path: department, collection shares, direct shares, releases. Complete picture.

### S7: Coordinator leaves the project
Sarah created 12 collections shared with various people. She leaves. Are those collections orphaned? Can the department recover them?

### S8: Cross-department collaboration
Maria (editorial) temporarily works with VFX. She needs to edit VFX assets but shouldn't manage the VFX workspace.

## Fixed constraints (from RESEARCH_BRIEF.md section 1)

Any model that violates these gets 0 on the corresponding requirement:
1. CAM integration required (all apps must integrate)
2. Additive access model (no deny rules)
3. Department boundary is sacred (no accidental leaks)
4. Sharing must be intentional (every cross-boundary share is a deliberate act)
5. DITs never open the library (mounted drives are their interface)
6. Vendors need scoped bidirectional spaces (upload + download, nothing else)

## What to evaluate

For each model (A and B), score all 13 requirements and 8 scenarios. Then compare:

1. Which model scores higher overall?
2. Where does each model lose points?
3. Are the differences meaningful or marginal?
4. Does Model B's architectural elegance translate to actual UX improvement?
5. Could Model A with a targeted fix (auto-folder on upload-enabled collections) match Model B's scores?

## Reference documents

- `UX_MODEL.md` -- current conceptual model
- `RESEARCH_BRIEF.md` -- full user research, friction scenarios, evaluation criteria
- `PERMISSIONS_MODEL.md` -- access control model
- `PERMISSIONS_BRIEF.md` -- permission level research
- `docs/plans/2026-04-13-assets-first-model.md` -- Model B spec
