# Cut Version Model

*Mutable artifact for autoresearch.*

## Current model

Each cut version is a separate asset with separate grants. No formal relationship between versions. EP301 has 5 entries in the UI, 5 sets of shares.

## Sharing

Each version is shared independently. LC1 shared with VFX. LC2 shared with VFX + Studio Creative. No link between them.

## Versioning

No versioning concept. Each cut is standalone.

## Revocation

Revoke per-version. Revoking LC3 doesn't affect LC1 or LC2.

## Scenario results

- S1 (progressive widening): Works but tedious -- share each version manually
- S2 (David sees FC after LC2): Works if someone shares FC with David
- S3 (vendor gets one version): Works -- share that version only
- S4 (revoke future, keep past): Works -- each version is independent
- S5 (parallel cuts): Works -- separate assets
- S6 (EMF derivative): Works -- separate asset
- S7 (re-lock): Works -- new separate asset
- S8 (different levels per stage): Works -- each version has its own grants

## Problems

- 5 separate entries in the UI for one cut
- No way to see the version history as a progression
- Sharing each version manually is tedious and error-prone
- No "share the cut" action -- only "share this specific version"
- Coordinator must remember who was shared on which version
