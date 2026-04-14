# Asset Model Evaluation Results

*April 14, 2026. Head-to-head comparison of Model A (folders are truth) vs Model B (assets are truth).*

## Score Table

| Requirement | Model A | Model B | Delta |
|-------------|---------|---------|-------|
| 1.1 Where are my files? | 4 | 3 | A+1 |
| 1.2 How to share? | 4 | 4 | Tie |
| 1.3 What did I receive? | 4 | 4 | Tie |
| 1.4 How to control access? | 4 | 4 | Tie |
| 1.5 No concept split? | 3 | 4 | B+1 |
| 2.1 See all shares? | 4 | 4 | Tie |
| 2.2 Remove a share? | 4 | 5 | B+1 |
| 2.3 Who has access? | 4 | 4 | Tie |
| 2.4 Vendor without irrevocable access? | 3 | 5 | B+2 |
| 2.5 No accidental exposure? | 3 | 4 | B+1 |
| 3.1 Click and arrive? | 5 | 5 | Tie |
| 3.2 Watch, comment, move on? | 5 | 5 | Tie |
| 3.3 Tool is invisible? | 5 | 5 | Tie |
| **Average** | **4.0** | **4.3** | **B+0.3** |

## Where They Diverge Meaningfully

Only three divergences matter. Everything else is cosmetic.

### 1. Vendor upload landing zone (the big one)

Model A puts vendor uploads in the workspace immediately via an auto-created folder. Every department member sees them before the coordinator reviews them.

Model B keeps vendor uploads in the collection until the coordinator explicitly files them into the workspace.

**Winner: Model B.** The coordinator gating aligns with the research brief's emphasis on intentional access. In a security-conscious production environment, unreviewed vendor content should not auto-appear in the workspace.

### 2. Concept split (folder vs collection)

Model A's auto-folder means the same content is visible in two places (workspace folder and collection) with no clear indication they're the same thing. The user asks "is this folder the collection?"

Model B separates cleanly: folders organize your workspace, collections organize your shares. An asset can be in both and the UI shows this explicitly.

**Winner: Model B**, but with a cost: "unfiled assets" (vendor uploads not yet in a folder) is a new concept for folder-oriented users.

### 3. Implementation complexity

Model A's fix is small: auto-create a folder when upload is enabled. Existing folder-binding mechanism handles the rest.

Model B requires assets that exist without workspace files. Touches the core data model.

**Winner: Model A** on implementation cost.

## Scenario Walkthroughs

### S1: VFX turnover to vendor

**Model A:** Sarah creates collection, system auto-creates workspace folder, shares with Framestore. James uploads 3 comps. Comps appear in workspace folder AND collection. Entire VFX team sees them immediately. **4 steps, no gating.**

**Model B:** Sarah creates collection, shares with Framestore. James uploads 3 comps. Comps appear in collection only. Sarah reviews, drags approved ones into workspace folder. **5 steps, with gating.** The extra step is valuable: coordinators want to review vendor deliveries before the team sees them.

### S3: "Why did I lose access?" (folder is moved)

**Model A:** If auto-created folder is moved, the folder-bound collection follows (bound by ID not path). But the user may be confused seeing auto-folders in unexpected locations.

**Model B:** Immune. Moving workspace folders has zero effect on collections or access. Assets exist independently.

### S4: Vendor uploads 50 files

**Model A:** 50 files land in `VFX/Incoming/Framestore`. Workspace tree shows them all immediately. Potential clutter.

**Model B:** 50 files land in the collection. Sarah gets "50 new assets in Framestore EP301." She reviews and batch-files approved ones. No workspace clutter until she decides.

### S7: Coordinator leaves

**Model A:** Auto-created workspace folders persist. New coordinator inherits folders they didn't create.

**Model B:** Collections transfer cleanly. No orphaned folders.

### S2, S5, S6, S8: No meaningful difference between models.

## Recommendation: Hybrid

Take Model B's core insight (assets exist independently, coordinator files them into workspace when ready) but avoid pure Model B's orphaned-asset problem.

### From Model B:
- Assets can exist without a workspace folder
- Vendor uploads stay in the collection until coordinator acts
- Collections and folders are separate concepts (no auto-folder conflation)

### From Model A:
- Workspace files auto-become assets (already in both models)
- Keep folder-binding as a coordinator choice (not system-forced)
- No "Unfiled" view needed; assets always have at least one home (collection or folder)

### The rule:
- Workspace file = asset + folder membership (automatic)
- Vendor upload = asset + collection membership (automatic)
- Filing vendor upload into workspace = asset gains folder membership (coordinator action)
- Removing asset from all collections and folders = prompt to delete or file

### Implementation scope:
1. Assets can be created directly into collections (bypass workspace file derivation)
2. Upload to collection creates persistent assets (no temp state)
3. "File into workspace" action on collection assets (drag and drop)
4. No auto-folder creation
5. Asset with no folder and no collection = prompt, not silent orphan
