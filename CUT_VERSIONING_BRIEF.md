# Cut Versioning: Research Brief

*April 10, 2026*

*Status: First pass resolved in CUT_VERSION_MODEL.md. May be revisited.*

## The problem

The prototype shows each cut version as a separate entity: EP301 Locked Cut 1, Locked Cut 2, Locked Cut 3, Final Cut, EMF. Five entries in the cuts view, five separate sets of grants, five separate share actions. But they're one cut evolving through stages.

Users don't think "I need to share Locked Cut 3." They think "I need to share the EP301 cut." The version is a property of the cut, not a separate asset.

## Current data model

```
cut-ep301-lc-1  → LC1, shared with Studio VFX + David
cut-ep301-lc-2  → LC2, shared with Studio Creative + Studio VFX + David
cut-ep301-lc-3  → LC3, shared with Studio Post + Studio Creative + Studio VFX + Rachel
cut-ep301-fc    → FC, shared with all Studio domains + Alex
cut-ep301-emf   → EMF (no separate grants in seed data)
```

Each is a standalone asset with its own grants. No formal relationship between them.

## What should change

A cut version progression (LC1 → LC2 → LC3 → FC → EMF) should be ONE entity with versions. The user sees the latest version by default and can switch to previous ones.

## Fixed constraints

1. Cuts are composite assets (assembled from source files across departments)
2. Sharing a cut grants playback access, not constituent access
3. The access model is additive with explicit grants
4. Release to domains is a formal publication step
5. The permission ceiling applies (you can't share at a level higher than what you have)

## Scenarios to stress-test

### S1: Progressive audience widening
Lisa shares LC1 with VFX only. LC2 adds Studio Creative. LC3 adds Studio Post. FC goes to all Studio domains. The audience widens with each version. Does the version model handle this without losing the per-version release history?

### S2: David reviews LC2, then sees FC
David was given Comment on LC2. A month later, FC is released. David should see FC (he has access to the cut). Can he go back and see his comments on LC2? Can he see LC1 (before he was added)?

### S3: Vendor gets one specific version
Sarah shares LC3 with Framestore for timing reference. Framestore should see LC3 and nothing else -- not LC1-2 (earlier, potentially different creative direction) and not FC (not their business). Does the model support scoping to a single version?

### S4: Revoking access mid-progression
Lisa shared LC1 with VFX. VFX finishes their work. Lisa wants to revoke VFX's access to the cut going forward. But VFX should still be able to reference LC1-3 (they did work against those). Can you revoke future access without removing historical access?

### S5: Two cuts from the same episode
EP301 has a director's cut and a studio cut being developed in parallel. These are different version streams of the same episode. How does the model distinguish them?

### S6: EMF as a derivative
The EMF (Electronic Master File) is generated from the Final Cut but is a different deliverable format. Is it a version of the same cut, or a derivative entity?

### S7: Re-lock after final
The director requests changes after the Final Cut was approved. A new Locked Cut 4 is created. The version stream is now LC1 → LC2 → LC3 → FC → LC4 → FC2. Does the model handle non-linear progression?

### S8: Different permission levels per stage
LC1-3 are shared at View (reference only). FC is shared at Comment (review). EMF is shared at View (delivery). Different stages warrant different permission levels. How does this work if the cut is one entity?

## Three candidate models

### Model A: Access to latest = access to all previous
- Share once, recipient sees all versions
- Simple but can't scope to a single version (S3 fails)
- Can't revoke future without removing past (S4 fails)

### Model B: Per-version grants, inherited forward
- Access at version N gives access to N and all future versions
- Matches the widening pattern (S1 works)
- But S3 still fails (vendor sees all future versions too)
- And S4 is complex (revoke the "inherited forward" but keep historical)

### Model C: Cut is one entity, all versions come with it
- Share the cut, not the version. Versions are just the history.
- Simplest mental model. "I shared the cut with David."
- S3 handled by snapshot: share a snapshot of version 3 specifically
- S4: revoke = revoke the cut. Historical versions go too. Accept this.
- S8: permission level is on the cut, not the version. Accept this.

### Model D: Version group with per-version visibility
- Versions are grouped but each has its own visibility flag
- When you share, you choose "from version N onwards" or "version N only"
- Most flexible but most complex
- Risk: coordinators need to think about version scoping every time they share

## Evaluation criteria

1. **Mental model**: Can a coordinator reason about it without training?
2. **Scenario coverage**: How many of S1-S8 work cleanly?
3. **Share simplicity**: How many decisions per share action?
4. **Revocation clarity**: When I revoke, what exactly goes away?
5. **Compatibility**: Does it work with the existing grant/collection/release model?
6. **Implementation cost**: How much of the prototype needs to change?
7. **Edge case safety**: Does a complex scenario produce a confusing result?

## What the loop should produce

A single recommended model with:
- Clear rules for sharing, versioning, and revoking
- Positions on each scenario (S1-S8)
- Changes needed to the data model
- Changes needed to the UI
