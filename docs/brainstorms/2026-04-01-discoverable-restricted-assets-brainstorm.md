# Discoverable Restricted Assets

**Date:** 2026-04-01

## The Problem

Two situations where users know (or suspect) an asset exists but can't access it:

1. **Access not yet granted** — A locked cut has been delivered but hasn't been released to their department. Without visibility, they assume something is broken and submit support tickets.
2. **Sensitive/restricted media** — Assets intentionally restricted. Users should know something exists but can't play or act on it.

**The tension:** Some studios don't want downstream teams to know certain assets exist at all (embargo, security). This is why discoverability must be a setting, not default behavior.

## Model

**Project-level default + department override + per-asset override:**

| Level | Setting | Effect |
|-------|---------|--------|
| Project | "Allow asset discovery" on/off | Global default for all departments |
| Department | Override on/off | Department opts out (e.g. audio during embargo) |
| Asset | "Never discoverable" flag | Coordinator hides specific assets even when department discovery is ON |

The `discover` permission (already exists in codebase, currently unused) is the mechanism: if a user has `discover` but not `open`, they see blurred tiles. No `discover` = completely invisible.

## Where Discoverable Assets Appear

- **Search results** — yes, blurred tiles
- **Collections** (manual and smart) — yes, blurred tiles for assets matched by filter or explicitly added
- **Workspace file tree** — no. The workspace is "your mounted drive," locked files there are confusing

## UX Treatment

- **Blurred thumbnail + lock icon** — enough to know it exists, not enough to see content
- **Metadata visible:** asset name, type, date
- **Click action:** "Request Access" instead of open/play

## Request Flow

- **Request goes to:** anyone with `edit-acl` on the resource (could be department coordinator, collection owner, or project manager)
- **Request appears in:** inbox (and potentially email, but not a concern for prototype)
- **Approval:** one-click approve from inbox
- **Auto-resolve:** when a restricted asset becomes available to a broader group, pending requests from that group are auto-granted

## Key Decisions

- Discoverability is opt-in at project level, not default
- Departments can override project setting to hide their assets
- Individual assets can be flagged "never discoverable" for embargoed content
- Smart collections show blurred tiles for matched restricted assets (consistent with manual collections)
- No workspace file tree visibility for restricted assets
- Request routing uses existing `edit-acl` permission — no new role needed
