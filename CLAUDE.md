# Claude AI Assistant Rules

This document contains rules and guidelines for AI assistants (Claude) working on this codebase.

## Design System Rules

### 🎨 ALWAYS Use Hawkins Design System

**CRITICAL RULE:** All styling, components, and UI elements MUST strictly adhere to the Hawkins Design System.

#### What This Means:

1. **NO Hardcoded Values**
   - ❌ Never use arbitrary pixel values: `px-[14px]`, `text-[#414141]`
   - ✅ Always use Hawkins tokens: `px-2`, `text-caption`, `bg-gray-600`

2. **Use Design System Tokens**
   - **Colors**: Use Hawkins color tokens from `globals.css` (see `COLORS.md` for complete reference)
     - **Foreground (Text)**: `text-foreground`, `text-foreground-dim`, `text-foreground-subtle`
       - System colors: `text-foreground-system-error`, `text-foreground-system-link`, `text-foreground-system-success`, `text-foreground-system-warning`
       - Inverse (dark bg): `text-foreground-inverse`, `text-foreground-inverse-dim`
     - **Surface (Backgrounds)**: `bg-surface-flat`, `bg-surface-low`, `bg-surface-mid`, `bg-surface-high`
       - Interactive: `bg-surface-interactive`, `hover:bg-surface-interactive-hover`
       - Selection: `bg-surface-selected`, `bg-surface-selected-subtle`
       - System: `bg-surface-system-error`, `bg-surface-system-success`, `bg-surface-system-warning`
     - **Border**: `border-border`, `border-border-subtle`, `border-border-dim`
       - Interactive: `border-selected`, `hover:border-selected-hover`
       - System: `border-system-error`, `border-system-focus`, `border-system-success`
     - **Semantic Palette**: `gray-600`, `indigo-500`, `blue-500`, `red-500`, `green-500`, `yellow-500`

     **Important**: Use semantic tokens (foreground/surface/border) for theme support. Use palette colors (gray/indigo/etc) for specific cases only.

   - **Typography**: Use Hawkins typography tokens from `globals.css` (see `TYPOGRAPHY.md` for complete reference)
     - **Body Text**: `text-body-0-bold`, `text-body-0-regular`, `text-body-1-bold`, `text-body-1-regular`, `text-body-2-bold`, `text-body-2-regular`
       - Example: `text-body-1-regular` (14px/21px/400) - Default body text
     - **Headings**: `text-heading-0` through `text-heading-8` (18px to 88px, all bold)
       - Example: `text-heading-2` (24px/30px/700) - Section titles
     - **Labels**: `text-label-0-bold`, `text-label-0-regular`, `text-label-1-bold`, `text-label-1-regular`
       - Example: `text-label-0-regular` (10px/15px/400) - Metadata, tags
     - **Links**: `text-body-text-link-*` and `text-label-text-link-*` (automatically underlined)
     - **Monospace**: `text-body-mono-*-{bold|regular}` - Code snippets
     - **Tabular**: `text-body-tabular-*-{bold|regular}` - Aligned numbers in tables
     - **Special**: `text-tag-small` (10px/15px/600) - Compact tags

     **Important**: All tokens follow the pattern `text-{category}-{size}-{weight}` where size 0=small, 1=medium, 2=large

   - **Spacing**: Use Hawkins spacing scale
     - `gap-1` (4px), `gap-2` (8px), `px-1` (4px), `px-2` (8px)
     - `py-0` (0px), `pb-2` (8px), `mb-2` (8px)

   - **Border Radius**: Use standard tokens
     - `rounded` (4px), `rounded-sm` (2px)

3. **Component Patterns**
   - Always use existing UI components from `src/components/ui/`
   - Follow established patterns in existing components
   - Reference Figma designs for exact specifications

4. **Theme Support**
   - All components must work in both light and dark themes
   - Use theme-aware tokens that automatically adjust
   - When needed, use conditional classes: `dark:bg-gray-400`

#### Example - Good vs Bad:

```tsx
// ❌ BAD - Hardcoded values
<div
  className="px-[14px] py-[2px] text-[#414141] bg-[#ffffff]"
  style={{ fontSize: '10px', border: '1px solid #808080' }}
>
  Content
</div>

// ✅ GOOD - Hawkins tokens
<div className="px-2 py-0 text-foreground text-label-0-regular bg-surface-flat border border-border">
  Content
</div>

// ❌ BAD - Direct palette colors without semantic meaning
<div className="text-indigo-500 bg-gray-100">
  Interactive element
</div>

// ✅ GOOD - Semantic tokens with theme support
<div className="text-foreground-system-link bg-surface-interactive hover:bg-surface-interactive-hover">
  Interactive element
</div>

// Asset card title with hover state
<div className="text-body-0-bold text-foreground group-hover:text-foreground-system-link group-hover:underline">
  Asset Title
</div>

// Tag component with theme support
<span className="text-tag-small px-1 py-0 bg-gray-600 dark:bg-gray-400 text-white rounded">
  Shot
</span>

// Error state with system colors
<div className="bg-surface-system-error-subtle border border-system-error p-2 rounded">
  <span className="text-foreground-system-error text-body-1-regular">Error message</span>
</div>
```

#### Reference Files:

- **Typography system**: `TYPOGRAPHY.md` - Complete Hawkins typography tokens (60+ variants)
- **Color system**: `COLORS.md` - Complete Hawkins color tokens (Border/Foreground/Surface)
- **Design system tokens**: `tailwind.config.ts` - Safelist and theme configuration
- **Design system utilities**: `src/app/globals.css` - All typography and color definitions
- **Theme system**: `THEME_SYSTEM.md` - Theme switching and color mode documentation
- **Existing components**: `src/components/ui/` - Component patterns and examples

#### Enforcement:

If you find yourself about to use a hardcoded value, STOP and:
1. **Check documentation**: Review `TYPOGRAPHY.md` and `COLORS.md` for available tokens
2. **Check config**: Look in `tailwind.config.ts` for the appropriate token
3. **Check existing patterns**: Review similar components for established patterns
4. **Consult Figma**: Verify design specs match Hawkins tokens
5. **Use semantic tokens**: Prefer `text-foreground` over `text-gray-900` for theme support
6. **Ask if unclear**: Request clarification if the appropriate token is ambiguous

**Remember:** Consistency with the Hawkins Design System is more important than pixel-perfect accuracy with arbitrary values.

---

## Code Quality Rules

### TypeScript
- All code must be type-safe
- No `any` types without explicit justification
- Use proper interfaces and type exports

### Components
- Prefer server components unless interactivity is needed
- Keep client components minimal and focused
- Use composition over complexity

### File Structure
- Follow Next.js 14 App Router conventions
- Server components: `page.tsx`
- Client components: `view.tsx` or separate files
- Keep related code colocated

---

*Last updated: 2026-01-06*
