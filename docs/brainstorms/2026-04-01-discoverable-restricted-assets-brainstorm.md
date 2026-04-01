# Discoverable Restricted Assets

**Date:** 2026-04-01  
**Status:** Early exploration — not fully fleshed out

## The Problem

Users encounter two situations where they know (or suspect) an asset exists but can't access it:

1. **Access not yet granted** — A locked cut has been delivered (visible on production schedule) but hasn't been released to their department. Without visibility, they assume something is broken and submit support tickets.

2. **Sensitive/restricted media** — Assets intentionally restricted. Users should know something exists (grayed-out tile + metadata) but can't play or act on it. This pattern partially exists in the current system.

## The Tension

**Some studios don't want downstream teams to know certain assets exist at all.** A rough cut that's being reworked, an embargoed trailer, unreleased music — these shouldn't even show as blurred tiles. Making discoverability universal would violate this.

This is why it must be a **setting**, not a default behavior.

## Proposed Model

**Project-level default + department override:**
- Project setting: "Allow asset discovery" (on/off)
- Each department can override: "Hide our assets from discovery" (e.g. audio department opts out during embargo)
- When discovery is ON: restricted assets show as blurred thumbnail + lock icon + asset name/type
- When discovery is OFF (project or department level): restricted assets are completely invisible

## UX Treatment

- **Blurred thumbnail + lock icon** — enough to know it exists, not enough to see content
- **Metadata visible:** asset name, type, date
- **Click action:** "Request Access" instead of open/play
- **Request goes to:** department coordinator, with a review UI element on the collection

## What's Still Unclear

### Where do discoverable assets appear?
- In search results? (probably yes — main discovery path)
- In collections that reference them? (yes — collection shows blurred tiles for assets you can't access)
- In the workspace file tree? (maybe not — the workspace is "your" mounted drive, showing locked files there is confusing)

### Request flow details
- Does the request go to the department coordinator specifically, or whoever has `edit-acl` on the resource?
- Is there a queue/inbox for access requests, or just a notification?
- Can the coordinator set "auto-approve for this role group" rules?
- What happens when the asset becomes available (e.g. cut is approved)? Does the request auto-resolve, or does the user need to request again?

### Granularity questions
- Can a coordinator mark specific assets as "never discoverable" even when the department has discovery ON? (e.g. one embargoed asset in an otherwise open department)
- What about smart collections — if a smart collection filter matches a restricted asset, does the blurred tile appear?

### The "partially in place" pattern
- What exactly exists today? Need to understand what's already built before designing the full feature.
- Is the current grayed-out treatment in the prototype or in the production system?

## For the Prototype

To demonstrate this concept we'd need:
1. A project-level toggle in Access Control settings
2. A department override toggle
3. A `discover` permission level (already exists in our permission list but unused)
4. Blurred tile treatment in grid/list views
5. "Request Access" action that creates a notification for the department coordinator

This is a significant feature. Recommend parking implementation until the meeting clarifies the open questions above, and building a static mockup to validate the UX treatment.
