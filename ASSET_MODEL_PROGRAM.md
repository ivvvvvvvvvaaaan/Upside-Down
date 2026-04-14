# Asset Model Autoresearch Program

*April 14, 2026. Comparative evaluation of two asset storage models.*

You are running a structured evaluation comparing two models for how assets relate to workspace folders. This is NOT an optimization loop. It is a head-to-head comparison with a clear winner at the end.

## The loop

```
1. Read ASSET_MODEL_BRIEF.md (evaluation criteria, personas, scenarios)
2. Read UX_MODEL.md (current conceptual model)
3. Read docs/plans/2026-04-13-assets-first-model.md (Model B spec)
4. Read RESEARCH_BRIEF.md sections 1, 3, 5 (constraints, scenarios, friction)

5. Score Model A (current: folders are truth + auto-folder fix) against all 13 requirements
6. Score Model B (assets-first: assets exist independently) against all 13 requirements
7. For each scenario S1-S8, walk through both models step by step
8. Log scores and reasoning

9. Identify where the models diverge meaningfully
10. Propose a recommendation: A, B, or a hybrid
11. If hybrid, specify exactly what to take from each

12. Write results to ASSET_MODEL_RESULTS.md
```

## Scoring rules

Score each of the 13 requirements (1.1-1.5, 2.1-2.5, 3.1-3.3) on 0-5 scale for each model.

Be adversarial. Don't give 5 unless the model genuinely has zero friction. The most common failure mode is assuming the user understands something the model doesn't explain.

Specific scoring guidance:

**Requirement 1.5 (no concept split):**
- Model A: Does "folder-bound collection" vs "curated collection" create a split?
- Model B: Does "asset without a folder" confuse users who think in files?
- Score based on what a user ENCOUNTERS, not what the system models internally.

**Requirement 2.4 (vendor access revocable):**
- Model A: If the vendor uploads into an auto-created workspace folder, can the coordinator revoke access to the uploaded files? Or are they now in the workspace permanently?
- Model B: If the vendor uploads to a collection, can the coordinator remove the collection without losing the assets?

**Requirement 3.3 (invisible tool):**
- Both models should score similarly here. If one model leaks complexity to the reviewer, it loses.

## What to watch for

1. **Phantom complexity**: Model B has fewer concepts internally but does it create confusion at the surface? ("Where did my file go? It's not in any folder.")

2. **Auto-folder side effects**: Model A's fix (auto-create folder) may create clutter in the workspace. Is a folder the coordinator didn't create confusing?

3. **Mental model match**: Production professionals think in files and folders. Does Model B's "assets without folders" violate their expectations?

4. **Vendor simplicity**: For James at Framestore, do the models differ at all? He sees a collection either way.

5. **Coordinator overhead**: Which model creates more work for the coordinator in the 80% case? In the edge case?

## Output format

Write ASSET_MODEL_RESULTS.md with:
1. Score table (Model A vs Model B, all 13 requirements)
2. Scenario walkthroughs (S1-S8, both models)
3. Where they diverge
4. Recommendation with reasoning
5. If hybrid: exactly what to take from each model
