---
status: pending
priority: p2
issue_id: "028"
tags: [code-review, design-system, implementation]
dependencies: []
---

# Design System: Gen AI Tokens Not Implemented

## Problem Statement

COLORS.md documents Gen AI color tokens (border-gen-ai-start, surface-gen-ai-start, etc.) but these tokens do NOT exist in globals.css or tailwind.config.ts. Any AI-specific gradient styling would require implementing these tokens first. Also, the existing Alert component uses non-Hawkins tokens (bg-primary, text-primary).

## Findings

- **UX agent**: Gen AI tokens are documented but not defined in CSS variables or Tailwind config. Using them would produce invisible/broken styles.
- **UX agent**: Alert component uses legacy tokens not in Hawkins system. If banner is built on Alert, it inherits non-compliance.
- Numeric surface tokens (surface-0 through surface-6) and semantic tokens (surface-flat/low/mid/high) are parallel systems — plan should specify which to use.

## Proposed Solutions

### Option A: Implement Gen AI tokens before use
- Implement Gen AI tokens in globals.css and tailwind.config.ts before using them. Add to safelist.
- **Effort**: Small
- **Risk**: Low

### Option B: Skip Gen AI tokens entirely
- Skip Gen AI tokens entirely — use existing neutral tokens for AI indicators. Simpler and guaranteed to work.
- **Effort**: Small
- **Risk**: Low

### Option C: Fix Alert component tokens
- Fix Alert component's non-Hawkins tokens as part of this work if using Alert for the banner.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: globals.css, tailwind.config.ts, COLORS.md, Alert component
- Gen AI tokens documented: border-gen-ai-start, surface-gen-ai-start, etc.
- Alert component uses bg-primary, text-primary (non-Hawkins legacy tokens)
- Parallel surface token systems: numeric (surface-0 through surface-6) vs semantic (surface-flat/low/mid/high)

## Acceptance Criteria

- [ ] Any Gen AI tokens used in code are properly defined in globals.css and tailwind.config.ts
- [ ] No broken or invisible styles from referencing undefined tokens
- [ ] Alert component uses Hawkins-compliant tokens if used for AI banner
- [ ] Surface token system choice (numeric vs semantic) is explicitly decided and consistent

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | UX agent confirmed Gen AI tokens are documented but not implemented |

## Resources

- UX review: Token implementation gap analysis
- COLORS.md: Gen AI token documentation
- globals.css and tailwind.config.ts: Current token definitions
