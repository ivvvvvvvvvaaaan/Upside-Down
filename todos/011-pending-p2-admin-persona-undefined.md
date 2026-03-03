---
status: pending
priority: p2
issue_id: "011"
tags: [code-review, completeness, personas]
dependencies: []
---

# Admin Persona Referenced But Not Defined

## Problem Statement

The Access Control section references "admin-configured" department visibility. An "Admin configuration UI" (P1) and "UX design needed: Admin journey" callout exist. But the User Persona section only defines Art Coordinator and VFX Coordinator -- no Admin persona.

## Findings

- **Completeness reviewer**: Department-level visibility (P0) depends on admin configuration, but who configures it and how? No admin persona, no admin journey in the Journeys section.
- **Consistency reviewer**: Admin config UI (P1) has no journey coverage. P0 department visibility requires admin configuration but the admin UI is only P1 -- functional gap.
- **Stakeholder reviewer**: Journey 5 reads like a system design document, not a user journey -- no persona-specific steps.

## Proposed Solutions

### Option A: Add Admin persona + abbreviated Journey 6
- **Effort**: Small
- **Risk**: Low

### Option B: State admin config is out-of-scope for V0 (use developer-configured approach)
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected file**: `/Users/ibutyliuk/Documents/Obsidian Vault/NextGen 3W →.md`
- User Persona: lines 2-17
- Access Control: lines 226-236
- Journey 5: lines 138-146

## Acceptance Criteria

- [ ] Admin persona defined OR explicitly stated as out-of-scope for V0
- [ ] Journey 5 rewritten with persona-specific steps OR acknowledged as system design (not user journey)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-27 | Created from document review | Completeness + Consistency + Stakeholder agents flagged |

## Resources

- Completeness review: Finding 8.3
- Consistency review: Finding 15
- Stakeholder review: Finding 8.2 (implicit)
