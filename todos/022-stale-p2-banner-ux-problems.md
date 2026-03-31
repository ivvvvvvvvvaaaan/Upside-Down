---
status: pending
priority: p2
issue_id: "022"
tags: [code-review, ux, simplicity]
dependencies: []
---

# Banner UX Problems

## Problem Statement

The "sticky dismissible banner" has multiple UX issues: navigation persistence is undefined (does it persist across pages?), auto-dismiss on navigation is hostile (user may have been interrupted), localStorage timestamps are over-engineered for a prototype, and cross-tab race conditions exist.

## Findings

- **UX agent**: If banner state is layout-level, it shows on irrelevant pages. If page-level, it reappears every navigation (dismiss feels broken). Auto-dismiss on navigation = "you snooze you lose" pattern.
- **Code simplicity agent**: Session-scoped state (useState) is sufficient for a prototype. localStorage persistence can be added later if needed.
- **Architecture agent**: Multiple tabs could create timestamp race conditions with no BroadcastChannel or storage event listener.

## Proposed Solutions

### Option A: Session-scoped useState
- Use useState for session-scoped dismissal. One line of code. Ship it. Add localStorage later if testing shows need.
- **Effort**: Small
- **Risk**: Low

### Option B: Nav sidebar badge count
- Use nav sidebar badge count instead of banner (NavLink already supports badge prop). Non-intrusive, persists appropriately.
- **Effort**: Small
- **Risk**: Low

### Option C: Toast notification pattern
- Use toast notification pattern — auto-dismissing after N seconds.
- **Effort**: Small
- **Risk**: Low

## Recommended Action

(To be filled during triage)

## Technical Details

- **Affected files**: Banner component, layout component, navigation sidebar
- localStorage timestamp-based persistence is over-engineered for prototype stage
- No BroadcastChannel or storage event listener for cross-tab synchronization

## Acceptance Criteria

- [ ] Banner dismissal behavior is consistent and predictable across navigations
- [ ] No cross-tab race conditions in banner state management
- [ ] Banner does not show on irrelevant pages
- [ ] Implementation complexity matches prototype stage requirements

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-04 | Created from code review of Seamless File-to-Asset Workflow plan | UX, Code simplicity, and Architecture agents identified multiple issues |

## Resources

- UX review: Banner persistence and dismissal analysis
- Code simplicity review: Over-engineering assessment
- Architecture review: Cross-tab race condition analysis
