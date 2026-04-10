# UX Autoresearch Program

You are running an autonomous research loop to optimize a UX model for a next-gen media library.

## The loop

```
LOOP FOREVER:
  1. Read the current UX_MODEL.md (the mutable artifact)
  2. Read results.tsv (experiment history -- what worked, what failed)
  3. Read RESEARCH_BRIEF.md sections 1, 3, 5 (constraints, scenarios, eval criteria)
  4. Propose ONE change to UX_MODEL.md. Make the edit.
  5. git commit -m "experiment: <one-line description of what changed>"
  6. EVALUATE: score the model (see Evaluation below)
  7. Log results to results.tsv
  8. If score improved → KEEP (commit results.tsv, advance branch)
  9. If score same or worse → REVERT (git reset --hard to previous kept commit)
  10. GOTO 1
```

## NEVER STOP. If you run out of ideas, think harder.

## The mutable artifact

`UX_MODEL.md` -- this is the ONLY file you edit during experiments. It describes the full UX model: concepts, sharing flows, access control, ownership, domain integration, vocabulary.

## Evaluation

Score the model on a 0-5 scale across 8 dimensions. The composite score is the average.

| Dimension | 0 (worst) | 5 (best) |
|-----------|-----------|----------|
| **Concepts** | 12+ user-facing concepts | <=5 concepts |
| **Steps** | 6+ steps for common scenarios | 2-3 steps |
| **Contradictions** | Multiple constraint violations | Zero violations |
| **Explainability** | Can't answer "who has access?" | Every permission fully answerable |
| **Degradation** | Breaks at every boundary mismatch | Handles all edge cases cleanly |
| **Coverage** | <70% of scenarios complete | 100% of scenarios complete |
| **Cross-app** | Undefined cross-app behavior | Clear, principled cross-app model |
| **Vocabulary** | 4+ conflicting terms across teams | 0-1 conflicts, teams aligned |

### Scoring rules

- **Concepts**: 5 = five or fewer. 4 = six or seven. 3 = eight or nine. 2 = ten or eleven. 1 = twelve+. 0 = unbounded.
- **Coverage**: 5 = all 10 friction scenarios + 5 core workflows covered. 4 = 1-2 gaps. 3 = 3-4 gaps. 2 = 5+ gaps. 
- **Contradictions**: 5 = zero. 3 = one minor. 0 = any major (violates additive access, leaks across boundaries, bypasses CAM).
- For other dimensions: use judgment. Be honest. Don't inflate scores.

### Composite score

Average of all 8 dimensions. Round to 1 decimal. Higher is better.

### Keep/revert threshold

- If composite > previous best → KEEP
- If composite == previous best BUT concepts decreased → KEEP (prefer simplicity)
- Otherwise → REVERT

## Constraints (from RESEARCH_BRIEF.md)

These are immutable. Any change that violates them scores 0 on Contradictions:

1. CAM exists and all apps must integrate
2. Media domains (15+ in 3 tiers) exist and are staying
3. Foundations team is building the access component; we must use it
4. Additive access model (no deny rules)
5. Departments don't want leaks; sharing must be intentional
6. Real Content Hub has NO department-based access control; departments are only asset type tags
7. DITs never open the library; directors just want to watch/comment; vendors need scoped bidirectional spaces

## What to try

- Eliminate concepts (merge, collapse, remove)
- Simplify sharing flows (fewer decisions, fewer steps)
- Resolve open questions (take a position, see if it improves the score)
- Align vocabulary across teams
- Integrate domain release into the sharing model
- Model turnovers as a collection pattern
- Add sensitive media handling
- Resolve workspace ownership
- Improve cross-app coherence

## What NOT to do

- Don't add concepts to solve a problem. Subtract or merge first.
- Don't create implementation-level detail. Stay at the UX/conceptual level.
- Don't add speculative features. Only model things that real scenarios require.
- Don't change RESEARCH_BRIEF.md or PROGRAM.md.
