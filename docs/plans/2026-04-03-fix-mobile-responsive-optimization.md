---
title: "fix: Mobile Navigation & Responsive Optimization"
type: fix
status: active
date: 2026-04-03
---

# Mobile Navigation & Responsive Optimization

## Context

Mobile nav is inconsistent across views — some have back buttons, some don't, panel toggles are missing in places, and the mobile menu page (`/nextgen/menu`) just dumps the desktop NavSidebar + PrimaryNavRail into a full-screen view without mobile adaptation.

The goal is a consistent mobile pattern across all content pages:

```
┌─────────────────────────────┐
│ Breadcrumbs                 │  ← existing ProjectBreadcrumb
├─────────────────────────────┤
│ [←]          [⚙] [avatar]  │  ← new consistent mobile toolbar
├─────────────────────────────┤
│                             │
│         Content             │
│                             │
└─────────────────────────────┘
```

`←` always navigates one level up. Tapping back from a content page eventually lands on a mobile-adapted nav view showing the NavSidebar items (bigger text, mobile-friendly), with the PrimaryNavRail's app-level items as a horizontal selector mock at the top.

---

## Part 1: Consistent mobile toolbar in all views

### New component: `MobileToolbar`

**File:** `src/components/ui/mobile-toolbar.tsx`

A shared toolbar shown only on mobile (`md:hidden`), rendered inside each view below the breadcrumb bar.

```tsx
interface MobileToolbarProps {
  /** Where ← navigates to. If omitted, uses router.back() */
  backHref?: string
  /** Extra action buttons on the right (e.g., panel toggle) */
  actions?: React.ReactNode
}
```

Renders:
```
[←]                    [actions]
```

- `←` is always present. Uses `<Link href={backHref}>` if provided, `router.back()` otherwise.
- `actions` slot for per-view extras (panel toggle, search, sort). If omitted, just shows the back button.
- Only renders on mobile via `md:hidden`.
- Settings and avatar are NOT here — they stay in the `ProjectBreadcrumb` bar above (already visible on mobile).

### Update each view to use `MobileToolbar`

Remove the current ad-hoc `md:hidden` back button patterns and replace with `<MobileToolbar>`:

| View file | Current mobile nav | `backHref` |
|---|---|---|
| `collections/[id]/view.tsx:193-200` | `md:hidden` ArrowLeft → menuHref | `/nextgen/collections` |
| `smart-collections/[id]/view.tsx:327-363` | `md:hidden` ArrowLeft + full toolbar row | parent collection or `/nextgen` |
| `assets/[id]/view.tsx:273-289` | ArrowLeft (all breakpoints) | `router.back()` |
| `_components/collection-browser-view.tsx:262-269,382-410` | `md:hidden` ArrowLeft → menuHref | `/nextgen` |
| `shared/shared-view.tsx` | No mobile back | `/nextgen` |
| `inbox/inbox-view.tsx` | No mobile back | `/nextgen` |
| `media-library/view.tsx` | Via collection-browser-view | `/nextgen` |

For views that also need panel toggle on mobile, pass it as `actions`:
```tsx
<MobileToolbar backHref="/nextgen/collections" actions={
  <Button variant="icon" onClick={() => setSidePanelOpen(!sidePanelOpen)}>
    <PanelRight className="w-4 h-4" />
  </Button>
} />
```

---

## Part 2: Mobile-adapted nav page

### Rework `/nextgen/menu/page.tsx`

Currently this page just renders `<PrimaryNavRail />` + `<NavSidebar />` side by side. Rework it to be a proper mobile nav experience:

**Layout:**
```
┌─────────────────────────────┐
│ [N logo]  Library  [mock]   │  ← PrimaryNavRail items as horizontal row
├─────────────────────────────┤
│                             │
│  Search                     │
│  Inbox                 (3)  │
│  Cuts                       │
│  Shared                (2)  │
│                             │
│  WORKSPACE                  │
│  Art & Design           >   │
│  Camera                 >   │
│  ...                        │
│                             │
│  COLLECTIONS                │
│  Character              >   │
│  Scene                  >   │
│  ...                        │
│                             │
└─────────────────────────────┘
```

**Changes:**
- Replace `<PrimaryNavRail />` with a horizontal bar (`MobileNavHeader`) showing the Netflix logo + a `Library` label (currently active app)
- Render `<NavSidebar />` below, passing a `mobile` prop (or new variant) so it can render with larger touch targets and text
- NavSidebar items use `text-body-1-regular` (instead of `text-body-0-regular`), larger tap areas (`py-3` instead of `py-1.5`), and more spacing
- Keep the auto-redirect to desktop behavior when breakpoint changes

### NavSidebar mobile variant

**File:** `src/components/ui/nav-sidebar.tsx`

Add a `mobile?: boolean` prop. When true:
- Section headers: `text-label-1-bold` (larger)
- Nav links: `text-body-1-regular`, `py-3` padding (bigger touch targets)
- Badges: slightly larger
- Remove resize handle dependency
- Full width, no fixed pixel width

---

## Part 3: Fix avatar overlaying panels

`PersonaPicker` wrapper has `z-50` (`persona-picker.tsx:41`). Mobile `ResponsivePanel` overlay uses `z-40`. Avatar sits on top of panel.

**Fix:** Remove `z-50` from outer wrapper, keep it only on the dropdown menu (line 103).

---

## Files touched

| File | Changes |
|---|---|
| `src/components/ui/mobile-toolbar.tsx` | **New** — shared mobile toolbar |
| `src/components/ui/index.ts` | Export MobileToolbar |
| `src/app/nextgen/menu/page.tsx` | Rework to mobile-adapted nav |
| `src/components/ui/nav-sidebar.tsx` | Add `mobile` prop variant |
| `src/components/ui/persona-picker.tsx` | Fix z-index on wrapper |
| `src/app/nextgen/collections/[id]/view.tsx` | MobileToolbar |
| `src/app/nextgen/smart-collections/[id]/view.tsx` | MobileToolbar |
| `src/app/nextgen/assets/[id]/view.tsx` | MobileToolbar |
| `src/app/nextgen/shared/shared-view.tsx` | MobileToolbar |
| `src/app/nextgen/inbox/inbox-view.tsx` | MobileToolbar |
| `src/app/nextgen/_components/collection-browser-view.tsx` | MobileToolbar |

## Implementation order

1. `MobileToolbar` component + export
2. Persona picker z-index fix
3. Replace ad-hoc mobile back buttons with MobileToolbar in each view
4. NavSidebar mobile variant
5. Rework menu page

## Verification

- [ ] 375px viewport: every view shows [←] toolbar, back navigates up one level
- [ ] Menu page: shows mobile-adapted nav items with larger touch targets
- [ ] Opening side panel on mobile: avatar doesn't overlay panel content
- [ ] `npx tsc --noEmit` passes
