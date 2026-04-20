# Codex AI Assistant Rules

This document contains rules and guidelines for AI assistants (Codex) working on this codebase.

## Design System Rules

### 🎨 ALWAYS Use Hawkins Design System

**CRITICAL RULE:** All styling, components, and UI elements MUST strictly adhere to the Hawkins Design System.

#### What This Means:

1. **NO Hardcoded Values**
   - ❌ Never use arbitrary pixel values: `px-[14px]`, `text-[#414141]`
   - ✅ Always use Hawkins tokens: `px-2`, `text-caption`, `bg-gray-600`

2. **Use Design System Tokens**
   - **Colors**: See `COLORS.md` for complete reference
     - Foreground: `text-foreground`, `text-foreground-dim`, `text-foreground-subtle`
     - Surface: `bg-surface-flat`, `bg-surface-low`, `bg-surface-mid`, `bg-surface-high`
     - Border: `border-border-dim`, `border-border-subtle`
     - Use semantic tokens for theme support, palette colors (`gray-600`, `indigo-500`) for specific cases only

   - **Typography**: See `TYPOGRAPHY.md` for complete reference
     - Pattern: `text-{category}-{size}-{weight}` (size: 0=small, 1=medium, 2=large)
     - Common: `text-body-1-regular`, `text-heading-2`, `text-label-0-regular`

   - **Spacing**: `gap-1` (4px), `gap-2` (8px), `px-1`, `px-2`, etc.
   - **Border Radius**: `rounded` (4px), `rounded-sm` (2px)

3. **Component Patterns**
   - Always use existing UI components from `src/components/ui/`
   - Follow established patterns in existing components
   - Reference Figma designs for exact specifications

4. **Theme Support**
   - All components must work in both light and dark themes
   - Use theme-aware tokens that automatically adjust
   - When needed, use conditional classes: `dark:bg-gray-400`

5. **CSS Variable Pattern for Custom CSS (AG Grid, etc.)**

   When writing custom CSS that needs Hawkins tokens (e.g., AG Grid themes), use **complete variables** that include opacity:

   ```css
   /* ✅ CORRECT - Use complete variables */
   --ag-border-color: var(--border-dim);
   border-color: var(--border-dim);

   /* ❌ WRONG - Don't construct opacity manually */
   --ag-border-color: rgb(var(--border-dim-rgb) / 0.2);
   ```

   **Available complete border variables** (defined in `globals.css`):
   - `--border-dim` - 20% opacity, standard borders
   - `--border-subtle` - 40% opacity, subtle borders
   - `--border-elevation` - 4% opacity, elevation shadows
   - `--border-inverse-dim` - 20% opacity, for dark backgrounds
   - `--border-inverse-subtle` - 40% opacity, for dark backgrounds

   **Why this matters:**
   - Single source of truth for opacity values
   - Consistency between Tailwind classes and custom CSS
   - Easier to maintain and update
   - No confusion about what opacity to use

#### Example - Good vs Bad:

```tsx
// ❌ BAD - Hardcoded values
<div className="px-[14px] text-[#414141]" style={{ fontSize: '10px' }}>

// ✅ GOOD - Hawkins tokens
<div className="px-2 text-foreground text-label-0-regular">

// ❌ BAD - Palette colors for semantic use
<div className="text-indigo-500 bg-gray-100">

// ✅ GOOD - Semantic tokens (theme-aware)
<div className="text-foreground-system-link bg-surface-interactive">
```

#### Reference Files:

- **Typography system**: `TYPOGRAPHY.md` - Complete Hawkins typography tokens (60+ variants)
- **Color system**: `COLORS.md` - Complete Hawkins color tokens (Border/Foreground/Surface)
- **Design system tokens**: `tailwind.config.ts` - Safelist and theme configuration
- **Design system utilities**: `src/app/globals.css` - All typography and color definitions
- **Theme system**: `THEME_SYSTEM.md` - Theme switching and color mode documentation
- **Existing components**: `src/components/ui/` - Component patterns and examples

#### Enforcement:

If you're about to use a hardcoded value, STOP and:
1. Check `COLORS.md`, `TYPOGRAPHY.md`, or existing components for the right token
2. Prefer semantic tokens (`text-foreground`) over palette colors (`text-gray-900`)
3. Ask if unclear - consistency matters more than pixel-perfect accuracy

---

## Development Workflow

### Running the Project
- **NEVER run `npm run dev`, `npm run build`, or `npm start`** - The user runs the project locally in the background
- Use `npx tsc --noEmit` for type checking only
- The user will see changes via hot reload

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

*Last updated: 2026-01-12*
