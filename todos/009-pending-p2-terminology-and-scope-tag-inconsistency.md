---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, consistency, terminology]
dependencies: []
---

# Terminology and Scope Tag Inconsistencies

## Problem Statement

Send/Share/Release used interchangeably in User Stories despite a resolved design decision. "Existing" scope tag used inconsistently -- some "Existing" features require new FE work + UX design.

## Findings

- **Consistency reviewer**: User Stories say "Sending/Sharing" and "Share" without distinguishing the three formally defined concepts. Bulk action is listed as "Share" but should be "Send."
- **Consistency reviewer**: Send flow scoped as `FE + Existing` but described as "UX refactor." If both backends exist and work is purely UX, `Existing` is misleading.
- **Consistency reviewer**: Watermarking is purely `Existing` with M effort but requires a yet-to-be-designed wireframe. Contradictory.
- **Stakeholder reviewer**: Developers can't tell if "Existing" means "API stays as-is, FE-only change" vs "API needs minor extension" vs "needs investigation."

## Proposed Solutions

### Option A: Update User Stories to use formal terminology + clarify Scope tags
- Update User Stories to use "Send" as the action, "Share" for person/group, "Release" for domain
- Redefine Scope tags: `Existing` = carried forward with minimal changes, `FE (Existing backend)` = new FE on existing API
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected file**: `/Users/ibutyliuk/Documents/Obsidian Vault/NextGen 3W →.md`
- User Stories: lines 7, 17, 57
- Sharing table: lines 203-204
- Scope legend: lines 151-154

## Acceptance Criteria

- [ ] User Stories use formal Send/Share/Release terminology
- [ ] Scope legend clarifies the difference between "Existing" and "FE + Existing backend"
- [ ] Each "Existing" feature has a one-line note: "API stays as-is" or "API needs extension"

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-27 | Created from document review | Consistency + Stakeholder agents flagged |

## Resources

- Consistency review: Findings 5, 12
- Stakeholder review: Finding 1.3
