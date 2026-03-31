---
status: pending
priority: p3
issue_id: "054"
tags: [code-review, quality, typescript]
dependencies: []
---

# AssetDetailPanel Null Type Hack

## Problem Statement

`AssetDetailPanel` declares its prop type as `asset: Asset` (non-nullable), but every caller passes `primaryAsset!` (non-null assertion on a nullable value). When the asset is actually null, the component renders a fake empty `ResponsivePanel` as a fallback. This is a TypeScript lie at every call site — the bang operator silences the compiler while the component quietly handles the null case anyway.

## Findings

- The component signature says it requires a non-null `Asset`, but the implementation already handles the null case by rendering an empty panel.
- All call sites use the `!` assertion to satisfy the type checker, masking the nullable reality.
- If the null guard inside the component were ever removed (trusting the type), it would crash at runtime.

## Proposed Solutions

### Option A: Accept nullable prop (Recommended)
- Change the prop type to `asset: Asset | null`.
- Handle the null case explicitly inside the component body (already partially done).
- Remove all `!` non-null assertions at call sites.
- **Effort**: Small (type change + remove bang operators)
- **Risk**: Low — aligns types with actual runtime behavior

### Option B: Lift the null check to call sites
- Keep the prop as `asset: Asset`.
- Conditionally render `AssetDetailPanel` only when asset is non-null at each call site.
- **Effort**: Medium (changes at every call site)
- **Risk**: Low — but duplicates the "what to show when null" logic across views

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**:
  - `src/components/ui/asset-detail-panel.tsx` line 71 — prop type declaration
  - `src/app/nextgen/collections/[id]/view.tsx` — call site with `primaryAsset!`
  - `src/app/nextgen/smart-collections/[id]/view.tsx` — call site with `primaryAsset!`

## Acceptance Criteria

- [ ] `AssetDetailPanel` prop type accepts `Asset | null`
- [ ] No non-null assertions (`!`) on asset values passed to `AssetDetailPanel`
- [ ] Null case is handled cleanly inside the component
- [ ] `npx tsc --noEmit` passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-30 | Created from code review | TypeScript bang assertions hide a real nullability gap |

## Resources

- TypeScript strict null checks documentation
