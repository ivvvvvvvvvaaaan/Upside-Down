# Asset Model Autoresearch Program

*April 14, 2026. Autonomous research loop on the asset/workspace model.*

You are running an autonomous research loop to find the best asset storage and organization model for a next-gen media library. The mutable artifact is `UX_MODEL.md`.

## Setup

1. Create branch `autoresearch/asset-model` from current main.
2. Read in-scope files for full context:
   - `UX_MODEL.md` -- the mutable artifact. This is the ONLY file you edit during experiments.
   - `ASSET_MODEL_BRIEF.md` -- evaluation criteria, personas, scenarios, constraints.
   - `RESEARCH_BRIEF.md` sections 1, 3, 5 -- fixed constraints, user scenarios, friction points.
   - `PERMISSIONS_MODEL.md` -- access control model.
   - `docs/plans/2026-04-13-assets-first-model.md` -- one candidate solution (assets exist independently).
3. Initialize `asset-model-results.tsv` with header row.
4. Score the current `UX_MODEL.md` as the baseline. This is experiment 0.
5. Confirm setup, then begin the loop.

## The mutable artifact

`UX_MODEL.md` -- this describes the full UX model: how assets relate to workspaces, folders, collections, sharing, and access control. You modify this document one change at a time.

## Evaluation

After each change to `UX_MODEL.md`, score the model against 13 requirements on a 0-5 scale.

### Persona 1: First-time user (5-minute test)

| # | Requirement |
|---|-------------|
| 1.1 | They understand where their files are (workspace/department) |
| 1.2 | They understand how to share something (one action, one dialog) |
| 1.3 | They understand what they received (inbox/notification) |
| 1.4 | They understand how to control access (permissions panel) |
| 1.5 | They never encounter a concept split ("is this a folder or a collection?") |

### Persona 2: Department coordinator

| # | Requirement |
|---|-------------|
| 2.1 | See every share involving their content (single view) |
| 2.2 | Remove any share with one action |
| 2.3 | Answer "who has access to this?" instantly |
| 2.4 | Share with a vendor without creating irrevocable access |
| 2.5 | Never accidentally expose unreleased content |

### Persona 3: VP/director reviewer

| # | Requirement |
|---|-------------|
| 3.1 | Click a link or notification (zero navigation) |
| 3.2 | Watch, comment, move on (no workflow management) |
| 3.3 | Never think about workspaces, collections, or permissions |

### Scoring rules

- 5 = perfectly met, zero friction
- 4 = met with minor friction (one extra click, slight confusion)
- 3 = met but user needs to think about it
- 2 = partially met, requires workaround
- 1 = barely met, significant friction
- 0 = not met

**Composite** = average across all 13 requirements. Round to 1 decimal.

Be adversarial. Don't give 5 unless there is genuinely zero friction. The most common failure mode is assuming the user understands something the model doesn't explain.

### Scenario stress test

After scoring, walk through these 8 scenarios mentally to verify. If a scenario reveals a problem the scores didn't catch, adjust scores.

- S1: VFX turnover to vendor (Sarah -> Framestore -> Sarah)
- S2: Editorial cut progression (Lisa shares with increasing audiences)
- S3: "Why did I lose access?" (folder is moved)
- S4: Vendor uploads 50 files (batch upload, where do they appear?)
- S5: Director gets a review link (David clicks, watches, comments)
- S6: "Who can see this asset?" (full access trail)
- S7: Coordinator leaves the project (orphaned collections)
- S8: Cross-department collaboration (Maria temporarily in VFX)

## Fixed constraints

Any change that violates these gets 0 on the corresponding requirement:
1. CAM integration required
2. Additive access model (no deny rules)
3. Department boundary sacred (no accidental leaks)
4. Sharing must be intentional
5. DITs never open the library (mounted drives are their interface)
6. Vendors need scoped bidirectional spaces

## Logging results

Log to `asset-model-results.tsv` (tab-separated). 5 columns:

```
commit	composite	delta	status	description
```

1. git commit hash (short, 7 chars)
2. composite score (e.g. 3.8)
3. delta from previous best (e.g. +0.3 or -0.1)
4. status: `keep` or `revert`
5. short description of what changed

## The experiment loop

LOOP FOREVER:

1. Read the current `UX_MODEL.md` and `asset-model-results.tsv`
2. Propose ONE change to `UX_MODEL.md`. Make the edit.
3. `git add UX_MODEL.md && git commit -m "experiment: <description>"`
4. EVALUATE: score all 13 requirements, run scenario stress test
5. Log results to `asset-model-results.tsv`
6. If composite > previous best: KEEP (`git add asset-model-results.tsv && git commit --amend --no-edit`)
7. If composite <= previous best: REVERT (`git reset --hard <previous kept commit>`)
8. GOTO 1

## What to try

- Make vendor uploads persist without workspace folders
- Merge folder and collection concepts
- Add asset independence (assets without folders)
- Simplify the workspace/collection boundary
- Remove folder-bound collections
- Add coordinator gating for vendor uploads
- Resolve the "is this a folder or a collection?" confusion
- Simplify permission model for the sharing flow
- Reduce concept count

## What NOT to do

- Don't add concepts to solve a problem. Subtract or merge first.
- Don't create implementation-level detail. Stay at the UX/conceptual level.
- Don't add speculative features. Only model things that real scenarios require.
- Don't change any file except `UX_MODEL.md` during experiments.

## NEVER STOP

Once the loop begins, do NOT pause to ask the human. Run experiments until manually stopped. If you run out of ideas, re-read RESEARCH_BRIEF.md friction scenarios, re-read the meeting notes in section 4, try combining previous changes, try more radical simplifications.
