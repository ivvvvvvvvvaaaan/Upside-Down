# Hawkins Color System

Complete color tokens from Figma design system.
**Source:** https://www.figma.com/design/guNFUaRXVHGePsyJ5fToO6/HP--Toolkit?node-id=93266-139

## Color Categories

The Hawkins color system is organized into three main categories:
1. **Border** - Border colors for UI elements
2. **Foreground** - Text and icon colors
3. **Surface** - Background and container colors

Each category includes variants for states (hover, disabled, selected), system feedback (error, success, warning), and theme support (inverse colors for dark backgrounds).

## Border Colors

### Base Border Colors

| Token | Value | Opacity | Usage |
|-------|-------|---------|-------|
| `border` | `#808080` | 100% | Default border color |
| `border-dim` | `#808080` | 20% | Dimmed border for subtle separation |
| `border-disabled` | `#808080` | 20% | Disabled state borders |
| `border-elevation` | `#000000` | 0% | Transparent border for elevation |
| `border-subtle` | `#808080` | 40% | Subtle border, stronger than dim |

### Interactive Border Colors

| Token | Value | Opacity | Usage |
|-------|-------|---------|-------|
| `border-selected` | `#4061e7` | 100% | Selected state (primary blue) |
| `border-selected-hover` | `#3451c5` | 100% | Selected state on hover (darker blue) |
| `border-selected-disabled` | `#4061e7` | 40% | Selected but disabled |
| `border-unselected` | `#808080` | 40% | Unselected state |
| `border-unselected-hover` | `#808080` | 100% | Unselected on hover |
| `border-unselected-disabled` | `#808080` | 20% | Unselected and disabled |

### Inverse Border Colors (for dark backgrounds)

| Token | Value | Opacity | Usage |
|-------|-------|---------|-------|
| `border-inverse` | `#ffffff` | 100% | White border on dark backgrounds |
| `border-inverse-dim` | `#ffffff` | 20% | Dimmed white border |
| `border-inverse-subtle` | `#ffffff` | 40% | Subtle white border |

### System Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `border-system-error` | `#c11119` | Error state borders |
| `border-system-error-disabled` | `#e50914` (20%) | Error state, disabled |
| `border-system-success` | `#0aa356` | Success state borders |
| `border-system-success-disabled` | `#0aa356` (20%) | Success state, disabled |
| `border-system-warning` | `#c3830e` | Warning state borders |
| `border-system-warning-disabled` | `#c3830e` (20%) | Warning state, disabled |
| `border-system-focus` | `#4061e7` | Focus indicator (blue) |

### Gen AI Border Colors (gradient support)

| Token | Value | Usage |
|-------|-------|-------|
| `border-gen-ai-start` | `#4061e7` | AI gradient start (blue) |
| `border-gen-ai-middle` | `#c94ff5` | AI gradient middle (purple) |
| `border-gen-ai-end` | `#eb3942` | AI gradient end (red) |

## Foreground Colors

### Base Foreground Colors

| Token | Value | Opacity | Usage |
|-------|-------|---------|-------|
| `foreground` | `#000000` | 90% | Default text color |
| `foreground-dim` | `#000000` | 60% | Dimmed text, less emphasis |
| `foreground-subtle` | `#000000` | 70% | Subtle text, secondary info |
| `foreground-disabled` | `#000000` | 40% | Disabled text |
| `foreground-subtle-disabled` | `#000000` | 40% | Subtle text, disabled |

### White Foreground Colors

| Token | Value | Opacity | Usage |
|-------|-------|---------|-------|
| `foreground-white` | `#ffffff` | 100% | White text for dark backgrounds |
| `foreground-white-disabled` | `#ffffff` | 50% | White text, disabled |

### Inverse Foreground Colors (for dark backgrounds)

| Token | Value | Opacity | Usage |
|-------|-------|---------|-------|
| `foreground-inverse` | `#ffffff` | 100% | Primary text on dark backgrounds |
| `foreground-inverse-dim` | `#ffffff` | 50% | Dimmed text on dark backgrounds |
| `foreground-inverse-subtle` | `#ffffff` | 70% | Subtle text on dark backgrounds |
| `foreground-inverse-disabled` | `#ffffff` | 50% | Disabled text on dark backgrounds |

### Product Foreground Colors

| Token | Value | Usage |
|-------|-------|-------|
| `foreground-product-brand` | `#e50914` | Netflix brand red for text |

### System Foreground Colors

| Token | Value | Usage |
|-------|-------|-------|
| `foreground-system-error` | `#c11119` | Error messages, destructive text |
| `foreground-system-success` | `#107140` | Success messages, confirmations |
| `foreground-system-warning` | `#845d16` | Warning messages, cautions |
| `foreground-system-link` | `#3451c5` | Link text (blue) |
| `foreground-system-link-disabled` | `#4061e7` (40%) | Link text, disabled |

## Surface Colors

### Base Surface Colors

| Token | Value | Usage |
|-------|-------|-------|
| `surface-flat` | `#ffffff` | Flat surface, base background |
| `surface-low` | `#ffffff` | Low elevation surface |
| `surface-mid` | `#ffffff` | Mid elevation surface |
| `surface-high` | `#ffffff` | High elevation surface |
| `surface-static` | `#ffffff` | Static surface (doesn't change) |
| `surface-static-subtle` | `#000000` (2%) | Subtle static surface tint |

### Interactive Surface Colors

| Token | Value | Opacity | Usage |
|-------|-------|---------|-------|
| `surface-interactive` | `#ffffff` | 100% | Interactive element background |
| `surface-interactive-hover` | `#000000` | 4% | Interactive element on hover |
| `surface-interactive-disabled` | `#e5e5e5` | 100% | Interactive element, disabled |
| `surface-interactive-transparent` | `#000000` | 0% | Transparent interactive surface |
| `surface-highlight` | `#000000` | 2% | Subtle highlight |
| `surface-overlay` | `#000000` | 70% | Modal overlay, scrim |

### Selection Surface Colors

| Token | Value | Opacity | Usage |
|-------|-------|---------|-------|
| `surface-selected` | `#4061e7` | 100% | Selected state (primary blue) |
| `surface-selected-hover` | `#3451c5` | 100% | Selected on hover (darker blue) |
| `surface-selected-disabled` | `#4061e7` | 40% | Selected but disabled |
| `surface-selected-subtle` | `#4061e7` | 20% | Subtle selected state |
| `surface-selected-subtle-hover` | `#4061e7` | 40% | Subtle selected on hover |
| `surface-selected-subtle-disabled` | `#e5e5e5` | 100% | Subtle selected, disabled |
| `surface-unselected` | `#000000` | 0% | Unselected state (transparent) |
| `surface-unselected-hover` | `#000000` | 4% | Unselected on hover |
| `surface-unselected-disabled` | `#000000` | 0% | Unselected and disabled |

### Product Surface Colors

| Token | Value | Usage |
|-------|-------|-------|
| `surface-product-brand` | `#e50914` | Netflix brand red surface |

### System Surface Colors

| Token | Value | Opacity | Usage |
|-------|-------|---------|-------|
| `surface-system-error` | `#c11119` | 100% | Error state background |
| `surface-system-error-subtle` | `#e50914` | 10% | Subtle error background |
| `surface-system-success` | `#0aa356` | 100% | Success state background |
| `surface-system-success-subtle` | `#0aa356` | 10% | Subtle success background |
| `surface-system-warning` | `#c3830e` | 100% | Warning state background |
| `surface-system-warning-subtle` | `#c3830e` | 10% | Subtle warning background |
| `surface-system-neutral` | `#808080` | 100% | Neutral state background |

### Gen AI Surface Colors (gradient support)

| Token | Value | Opacity | Usage |
|-------|-------|---------|-------|
| `surface-gen-ai-start` | `#4061e7` | 10% | AI gradient start (blue) |
| `surface-gen-ai-middle` | `#b038dc` | 10% | AI gradient middle (purple) |
| `surface-gen-ai-end` | `#e50914` | 10% | AI gradient end (red) |

## Usage in Code

### Using Semantic Tokens

```tsx
// Foreground colors
<div className="text-foreground">Default text</div>
<div className="text-foreground-dim">Dimmed text</div>
<div className="text-foreground-subtle">Subtle text</div>

// System colors
<div className="text-foreground-system-error">Error message</div>
<div className="text-foreground-system-link">Link text</div>

// Surface colors
<div className="bg-surface-flat">Flat background</div>
<div className="bg-surface-interactive hover:bg-surface-interactive-hover">
  Interactive element
</div>

// Border colors
<div className="border border-border">Default border</div>
<div className="border border-selected">Selected border</div>
<div className="border border-system-error">Error border</div>
```

### Interactive States Example

```tsx
// Button with all states
<button className="
  bg-surface-interactive
  hover:bg-surface-interactive-hover
  disabled:bg-surface-interactive-disabled
  border border-border
  hover:border-border-selected
  text-foreground
  hover:text-foreground-system-link
">
  Interactive Button
</button>

// Selected state with hover (theme-adaptive)
<div className="
  bg-surface-selected
  hover:bg-surface-selected-hover
  ring-2 ring-border-selected
">
  Selected Item
</div>
```

### Selection States

| Token | Light | Dark |
|-------|-------|------|
| `bg-surface-selected` | indigo-100 | indigo-800 |
| `bg-surface-selected-hover` | indigo-50 | indigo-900 |
| `ring-border-selected` | indigo-500 | indigo-500 |

```tsx
<div className={cn(
  !isSelected && 'bg-surface-flat hover:bg-surface-2',
  isSelected && 'bg-surface-selected hover:bg-surface-selected-hover',
  isPrimary && 'ring-2 ring-border-selected',
)}>
```

### System Feedback Colors

```tsx
// Error state
<div className="bg-surface-system-error-subtle border border-system-error">
  <span className="text-foreground-system-error">Error message</span>
</div>

// Success state
<div className="bg-surface-system-success-subtle border border-system-success">
  <span className="text-foreground-system-success">Success message</span>
</div>

// Warning state
<div className="bg-surface-system-warning-subtle border border-system-warning">
  <span className="text-foreground-system-warning">Warning message</span>
</div>
```

### Dark Background Support (Inverse Colors)

```tsx
// Text on dark background
<div className="bg-black">
  <span className="text-foreground-inverse">Primary text</span>
  <span className="text-foreground-inverse-dim">Secondary text</span>
  <div className="border border-inverse">Content box</div>
</div>
```

## Implementation Notes

1. **All color tokens** are defined in `src/app/globals.css` as CSS custom properties
2. **Referenced in** `tailwind.config.ts` for Tailwind utility generation
3. **Opacity values** are encoded in hex (e.g., `#80808033` = 20% opacity)
4. **Theme support** is built-in - tokens automatically adjust for light/dark mode
5. **Semantic naming** ensures consistent usage across components

## Color Naming Convention

Tokens follow the pattern: `{category}-{variant}-{state}`

- **Category**: `border`, `foreground`, `surface`
- **Variant**: `subtle`, `dim`, `system-{type}`, `product-brand`, `inverse`
- **State**: `hover`, `disabled`, `selected`, `unselected`

Examples:
- `border-selected-hover` = Border color for selected state on hover
- `surface-system-error-subtle` = Subtle error background
- `foreground-inverse-dim` = Dimmed text on dark backgrounds

## Color Values Reference

### Primary Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#4061e7` | Selected states, focus, links |
| Primary Blue Hover | `#3451c5` | Selected states on hover |
| Netflix Red | `#e50914` | Brand color, errors (bright) |
| Error Red | `#c11119` | Error messages (darker) |
| Success Green | `#0aa356` | Success states, confirmations |
| Success Dark | `#107140` | Success text (darker) |
| Warning Orange | `#c3830e` | Warning states |
| Warning Dark | `#845d16` | Warning text (darker) |
| Neutral Gray | `#808080` | Borders, neutral states |
| Disabled Gray | `#e5e5e5` | Disabled backgrounds |

### Gen AI Gradient Palette

| Color | Hex | Usage |
|-------|-----|-------|
| AI Blue | `#4061e7` | Gradient start |
| AI Purple | `#c94ff5` | Gradient middle |
| AI Red | `#eb3942` | Gradient end |

## Opacity Scale

Hawkins uses a consistent opacity scale:

- **100%** - Default, full opacity
- **90%** - Primary foreground text
- **70%** - Subtle foreground, overlay backgrounds
- **60%** - Dimmed foreground
- **50%** - Inverse dimmed/disabled
- **40%** - Disabled states, subtle borders
- **20%** - Dim borders, subtle backgrounds
- **10%** - Very subtle backgrounds (system colors)
- **4%** - Hover highlights
- **2%** - Static subtle tints
- **0%** - Transparent

---

*Last updated: 2026-01-06*
*Figma source: HP--Toolkit Colors*
