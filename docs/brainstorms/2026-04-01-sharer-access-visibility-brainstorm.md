# Sharer Access & Sharing Model

**Date:** 2026-04-01

## What We're Building

Clear rules for how sharing works across resource types, and ensuring sharers are visible in access lists.

## Sharing Model

**Folders = workspace participation.** Sharing a folder means granting someone a place to work. They browse, add files, organize. Folder shares only allow write-capable profiles (`editor`, `contributor`, `manager`). If someone just needs to see files, use a collection.

**Collections = content visibility.** Sharing a collection means sending someone specific things to review. Any profile works (`viewer`, `commenter`, etc.). Collections are how content crosses department boundaries.

**Assets = individual file access.** Direct sharing of a single file for review or handoff.

This resolves the department boundary problem naturally: folder shares stay within the department's orbit. Cross-department visibility goes through collections.

**Why both exist:** Folders map to real filesystem paths — when a user mounts the workspace drive, shared folders appear in Finder. Collections have no filesystem equivalent. Folder sharing is infrastructure (mounting a workspace path for a collaborator). Collection sharing is communication (sending content for review).

**UI implication:** Folder sharing belongs in workspace/department admin settings, not the "Share" button. The "Share" action should default to creating a collection. Folder access is managed by coordinators as workspace configuration.

## Sharer Visibility

- When you share something, you get an explicit `manager` grant so you appear in the access list
- Grant type is `manager` (editable), not `owner` (immutable)
- Your own shares don't appear in your inbox

## Key Decisions

- **Folder shares restricted to write-capable profiles** — `createGrant` rejects folder shares with `viewer`/`commenter`
- **Sharer self-grant** — both seed data (`buildGrants`) and runtime (`createGrant`) create explicit `manager` grant for the sharer
- **Inbox filter** — `buildSharesReceivedByMe` excludes grants where `grantedByUserId === userId`
- **Scenario cleanup** — VFX Shots folder share (view-only to editorial) removed; replaced by existing "EP301 VFX Pulls" collection. Editorial Cuts folder share replaced by "Dailies Review Cuts" collection.
