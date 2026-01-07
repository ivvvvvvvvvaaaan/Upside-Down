# Hawkins Typography System

Complete typography tokens from Figma design system.
**Source:** https://www.figma.com/design/guNFUaRXVHGePsyJ5fToO6/HP--Toolkit?node-id=93266-12

## Typography Scale Reference

### Body Text

| Token | Font Size | Line Height | Weight | Usage |
|-------|-----------|-------------|--------|-------|
| `text-body-0-bold` | 13px | 20px | 600 | Small bold body text, asset card titles |
| `text-body-0-regular` | 13px | 20px | 400 | Small regular body text |
| `text-body-1-bold` | 14px | 21px | 600 | Medium bold body text |
| `text-body-1-regular` | 14px | 21px | 400 | Medium regular body text, default body |
| `text-body-2-bold` | 16px | 24px | 600 | Large bold body text |
| `text-body-2-regular` | 16px | 24px | 400 | Large regular body text |

### Headings

| Token | Font Size | Line Height | Weight | Usage |
|-------|-----------|-------------|--------|-------|
| `text-heading-0` | 18px | 23px | 700 | Smallest heading |
| `text-heading-1` | 20px | 25px | 700 | Small heading |
| `text-heading-2` | 24px | 30px | 700 | Medium heading, section titles |
| `text-heading-3` | 28px | 35px | 700 | Large heading |
| `text-heading-4` | 32px | 40px | 700 | Extra large heading |
| `text-heading-5` | 40px | 50px | 700 | Page titles |
| `text-heading-6` | 52px | 65px | 800 | Display heading |
| `text-heading-7` | 68px | 85px | 800 | Large display |
| `text-heading-8` | 88px | 110px | 800 | Hero display |

### Labels

| Token | Font Size | Line Height | Weight | Usage |
|-------|-----------|-------------|--------|-------|
| `text-label-0-bold` | 10px | 15px | 600 | Small bold labels, tags |
| `text-label-0-regular` | 10px | 15px | 400 | Small regular labels, metadata |
| `text-label-1-bold` | 12px | 18px | 600 | Medium bold labels |
| `text-label-1-regular` | 12px | 18px | 400 | Medium regular labels |

### Links

| Token | Font Size | Line Height | Weight | Usage |
|-------|-----------|-------------|--------|-------|
| `text-body-text-link-0-bold` | 13px | 20px | 600 | Small bold links |
| `text-body-text-link-0-regular` | 13px | 20px | 400 | Small regular links |
| `text-body-text-link-1-bold` | 14px | 21px | 600 | Medium bold links |
| `text-body-text-link-1-regular` | 14px | 21px | 400 | Medium regular links |
| `text-body-text-link-2-bold` | 16px | 24px | 600 | Large bold links |
| `text-body-text-link-2-regular` | 16px | 24px | 400 | Large regular links |
| `text-label-text-link-0-bold` | 10px | 15px | 600 | Small bold label links |
| `text-label-text-link-0-regular` | 10px | 15px | 400 | Small regular label links |
| `text-label-text-link-1-bold` | 12px | 18px | 600 | Medium bold label links |
| `text-label-text-link-1-regular` | 12px | 18px | 400 | Medium regular label links |

### Monospace

| Token | Font Size | Line Height | Weight | Usage |
|-------|-----------|-------------|--------|-------|
| `text-body-mono-0-bold` | 13px | 20px | 600 | Small bold monospace |
| `text-body-mono-0-regular` | 13px | 20px | 400 | Small regular monospace, code |
| `text-body-mono-1-bold` | 14px | 21px | 600 | Medium bold monospace |
| `text-body-mono-1-regular` | 14px | 21px | 400 | Medium regular monospace |
| `text-body-mono-2-bold` | 16px | 24px | 600 | Large bold monospace |
| `text-body-mono-2-regular` | 16px | 24px | 400 | Large regular monospace |

### Tabular (Numeric)

| Token | Font Size | Line Height | Weight | Usage |
|-------|-----------|-------------|--------|-------|
| `text-body-tabular-0-bold` | 13px | 20px | 600 | Small bold tabular |
| `text-body-tabular-0-regular` | 13px | 20px | 400 | Small regular tabular numbers |
| `text-body-tabular-1-bold` | 14px | 21px | 600 | Medium bold tabular |
| `text-body-tabular-1-regular` | 14px | 21px | 400 | Medium regular tabular numbers |
| `text-body-tabular-2-bold` | 16px | 24px | 600 | Large bold tabular |
| `text-body-tabular-2-regular` | 16px | 24px | 400 | Large regular tabular numbers |

## Special Tokens

### Component-Specific

| Token | Equivalent | Usage |
|-------|------------|-------|
| `text-tag-small` | label-0-bold | Compact tag text (10px/15px/600) |

## Usage in Code

```tsx
// Body text
<div className="text-body-1-regular">Default body text</div>
<div className="text-body-0-bold">Small bold text</div>

// Headings
<h1 className="text-heading-2">Section Title</h1>
<h2 className="text-heading-1">Subsection</h2>

// Labels
<span className="text-label-0-regular">Metadata</span>
<span className="text-label-0-bold">Tag</span>

// Links (automatically underlined)
<a className="text-body-text-link-1-regular">Link text</a>

// Monospace
<code className="text-body-mono-0-regular">Code snippet</code>

// Tabular numbers (for tables, metrics)
<span className="text-body-tabular-1-regular">1,234.56</span>
```

## Implementation Notes

1. **All tokens defined in** `src/app/globals.css` under `@layer utilities`
2. **Safelisted in** `tailwind.config.ts` to ensure generation
3. **Font families:**
   - Body/Label: SF Pro Text
   - Heading: SF Pro Display (headings 1-8), SF Pro Text (heading-0)
   - Mono: SF Mono
4. **Font weights:**
   - 400: Regular
   - 600: Semibold (Bold variant)
   - 700: Bold (Headings)
   - 800: Heavy (Display headings 6-8)

## Migration from Old Tokens

| Old Token | New Token | Notes |
|-----------|-----------|-------|
| `text-xs` / `text-caption` | `text-body-0-bold` or `text-label-1-regular` | Depends on usage |
| `text-sm` / `text-body-2` | `text-body-1-regular` | Standard body text |
| `text-base` / `text-body-1` | `text-body-2-regular` | Large body text |
| `text-overline` | `text-label-0-regular` | Uppercase labels |
| `text-display-1` | `text-heading-8` | Hero text |
| `text-headline-1` | `text-heading-4` | Page titles |
| `text-headline-2` | `text-heading-2` | Section headings |

---

*Last updated: 2026-01-06*
*Figma source: HP--Toolkit Typography*
