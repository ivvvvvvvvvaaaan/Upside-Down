# Figma to Code Design System Rules

This document provides guidelines for translating Figma designs into code using the Hawkins Design System.

## Quick Reference

| Figma Property | Code Implementation |
|----------------|---------------------|
| Colors | Use semantic tokens: `text-foreground`, `bg-surface-low`, `border-border-dim` |
| Typography | Use typography classes: `text-body-1-regular`, `text-heading-2` |
| Spacing | Use Tailwind spacing: `gap-4`, `p-6`, `m-2` |
| Shadows | Use shadow tokens: `shadow-low`, `shadow-mid`, `shadow-high` |
| Border Radius | Use `rounded` (4px), `rounded-sm` (2px), `rounded-lg` (8px) |
| Icons | Import from `lucide-react` |

---

## 1. Token Definitions

### File Locations

| Token Type | File | Format |
|------------|------|--------|
| CSS Variables | `src/app/globals.css` | RGB space-separated values |
| Tailwind Theme | `tailwind.config.ts` | CSS variable references |
| Color Docs | `COLORS.md` | Markdown reference |
| Typography Docs | `TYPOGRAPHY.md` | Markdown reference |

### Color Token Structure

```css
/* globals.css - Light theme (:root) and Dark theme (.dark) */

/* Border tokens */
--border-dim-rgb: 128 128 128;
--border-dim: rgb(var(--border-dim-rgb) / 0.2);

/* Surface tokens */
--surface-low: 255 255 255;    /* Light */
--surface-low: 35 35 35;       /* Dark */

/* Foreground tokens */
--foreground-rgb: 0 0 0;       /* Light */
--foreground-rgb: 255 255 255; /* Dark */
```

### Using Colors in Components

```tsx
// Semantic tokens (preferred - auto-adapts to theme)
className="text-foreground bg-surface-low border-border-dim"

// System colors for feedback
className="text-foreground-system-error bg-surface-system-error"

// Palette colors (specific cases only)
className="bg-indigo-500 text-white"
```

---

## 2. Component Library

### Location
`src/components/ui/` - 30+ reusable components

### Import Pattern
```tsx
import { Button, Card, Stack, Text, Input } from '@/components/ui'
```

### Component Architecture Patterns

#### Compound Components
```tsx
// Card with sub-components
<Card variant="outlined">
  <Card.Body padding="lg">Content</Card.Body>
  <Card.Footer>
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Save</Button>
  </Card.Footer>
</Card>

// Tabs with context
<Tabs defaultValue="tab1">
  <TabsList>
    <Tab value="tab1">First</Tab>
    <Tab value="tab2">Second</Tab>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
</Tabs>
```

#### Variant Props (CVA Pattern)
```tsx
<Button variant="primary" size="default">Primary</Button>
<Button variant="secondary" compact>Compact Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="icon" size="icon"><Icon /></Button>
```

### Key Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Button` | Actions | `variant`, `size`, `icon`, `dropdown`, `compact` |
| `Card` | Container | `variant` (default, elevated, outlined) |
| `Card.Body` | Content area | `padding` (sm, md, lg) |
| `Card.Footer` | Action buttons | - |
| `Modal` | Overlay dialog | `open`, `onOpenChange`, `size` |
| `Dropdown` | Button + popover | `label`, `icon`, `size`, `align`, `width` |
| `Tabs` | Tab navigation | `defaultValue`, `value`, `onValueChange` |
| `Stack` | Flex layout | `direction`, `spacing`, `align`, `justify` |
| `Text` | Typography | `variant`, `color`, `weight` |
| `Input` | Form input | `label`, `error`, `hint` |
| `Badge` | Status label | `variant`, `size`, `style` |
| `Avatar` | User image | `src`, `alt`, `size`, `fallback` |

---

## 3. Frameworks & Libraries

### Core Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4

### Key Dependencies
```json
{
  "@radix-ui/react-popover": "Popover primitives",
  "@radix-ui/react-slot": "Component composition",
  "class-variance-authority": "Variant management",
  "lucide-react": "Icon library",
  "tailwind-merge": "Class merging",
  "clsx": "Conditional classes"
}
```

### Utility Function
```tsx
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
className={cn('base-class', condition && 'conditional-class', className)}
```

---

## 4. Asset Management

### Static Assets
```
public/
├── Icons/           # Custom SVG icons
├── assets/          # Brand assets, logos
└── images/          # General images
```

### Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/path/to/image.png"
  alt="Description"
  width={200}
  height={200}
  className="rounded"
/>
```

### Remote Image Domains (next.config.js)
- `picsum.photos`
- `images.unsplash.com`
- `*.supabase.co`
- `via.placeholder.com`

---

## 5. Icon System

### Library: Lucide React

```tsx
import { ArrowUpDown, LayoutGrid, X, Plus, Check } from 'lucide-react'

// Standard sizing
<ArrowUpDown className="w-4 h-4" />
<LayoutGrid className="w-5 h-5" />

// In Button
<Button icon={<Plus className="w-4 h-4" />}>Add Item</Button>

// Icon-only button
<Button variant="icon" size="icon">
  <X className="w-4 h-4" />
</Button>
```

### Common Icons

| Icon | Usage |
|------|-------|
| `ChevronDown` | Dropdowns, accordions |
| `ChevronRight` | Navigation, links |
| `X` | Close, remove |
| `Plus` | Add, create |
| `Check` | Success, selected |
| `ArrowUpDown` | Sort |
| `LayoutGrid` | Grid view |
| `LayoutList` | List view |
| `MoreVertical` | Menu, options |
| `Search` | Search input |

---

## 6. Styling Approach

### Tailwind CSS with Hawkins Tokens

#### DO: Use Semantic Tokens
```tsx
// Colors
className="text-foreground"           // Primary text
className="text-foreground-dim"       // Secondary text
className="text-foreground-subtle"    // Tertiary text
className="bg-surface-low"            // Background
className="bg-surface-highlight"      // Hover state
className="border-border-dim"         // Subtle border

// Typography
className="text-body-1-regular"       // 14px/21px regular
className="text-heading-2"            // 24px/30px bold
className="text-label-1-bold"         // 12px/18px semibold
```

#### DON'T: Use Hardcoded Values
```tsx
// BAD
className="text-[#414141] text-[14px] px-[12px]"

// GOOD
className="text-foreground text-body-1-regular px-3"
```

### Typography Scale

| Token | Size | Weight | Use Case |
|-------|------|--------|----------|
| `text-body-0-regular` | 13px | 400 | Small body text |
| `text-body-1-regular` | 14px | 400 | Default body |
| `text-body-1-bold` | 14px | 600 | Emphasis |
| `text-body-2-regular` | 16px | 400 | Large body |
| `text-heading-2` | 24px | 700 | Section titles |
| `text-heading-4` | 32px | 700 | Page titles |
| `text-label-0-regular` | 10px | 400 | Metadata, tags |
| `text-label-1-bold` | 12px | 600 | Form labels |

### Spacing Scale

| Class | Value |
|-------|-------|
| `gap-1`, `p-1`, `m-1` | 4px |
| `gap-2`, `p-2`, `m-2` | 8px |
| `gap-3`, `p-3`, `m-3` | 12px |
| `gap-4`, `p-4`, `m-4` | 16px |
| `gap-6`, `p-6`, `m-6` | 24px |
| `gap-8`, `p-8`, `m-8` | 32px |

### Responsive Design

```tsx
// Mobile-first breakpoints
className="w-full md:w-1/2 lg:w-1/3"
className="hidden md:flex"
className="flex md:hidden"
className="p-4 md:p-6 lg:p-8"
```

---

## 7. Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css         # Design tokens (CSS variables)
│   ├── layout.tsx          # Root layout
│   └── [feature]/          # Feature routes
│       ├── page.tsx        # Server component (data fetching)
│       └── view.tsx        # Client component (interactivity)
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── index.ts        # Barrel exports
│   │   └── [component].tsx
│   └── layouts/            # Layout components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and data
│   ├── utils.ts            # cn() helper
│   ├── data.ts             # Types and mock data
│   └── supabase/           # Database clients
```

---

## 8. Figma to Code Mapping

### Figma Layers → React Components

| Figma Element | React Component |
|---------------|-----------------|
| Frame with content | `<Card>` or `<div>` |
| Auto Layout | `<Stack>` or flex classes |
| Text layer | `<Text>` or semantic HTML |
| Button | `<Button>` |
| Input field | `<Input>` |
| Dropdown/Select | `<Dropdown>` or `<Select>` |
| Modal/Dialog | `<Modal>` |
| Tabs | `<Tabs>` |
| Avatar | `<Avatar>` |
| Badge/Tag | `<Badge>` or `<Tag>` |
| Icon | Lucide React component |

### Figma Styles → Tailwind Classes

| Figma Style | Tailwind |
|-------------|----------|
| Fill: surface/low | `bg-surface-low` |
| Stroke: border/dim | `border border-border-dim` |
| Text: foreground | `text-foreground` |
| Effect: shadow/mid | `shadow-mid` |
| Corner radius: 4 | `rounded` |
| Padding: 24 | `p-6` |
| Gap: 16 | `gap-4` |

### Figma Auto Layout → Flex/Stack

| Figma Setting | Tailwind/Component |
|---------------|-------------------|
| Direction: Horizontal | `<Stack direction="row">` or `flex flex-row` |
| Direction: Vertical | `<Stack direction="col">` or `flex flex-col` |
| Gap: 8 | `gap-2` |
| Padding: 16 | `p-4` |
| Alignment: Center | `items-center justify-center` |
| Space between | `justify-between` |

---

## 9. Common Patterns

### Card with Actions
```tsx
<Card variant="outlined">
  <Card.Body>
    <Text variant="heading-3">Title</Text>
    <Text color="dim">Description text here</Text>
  </Card.Body>
  <Card.Footer>
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </Card.Footer>
</Card>
```

### Form Layout
```tsx
<Stack spacing="md">
  <Input label="Name" placeholder="Enter name" />
  <Input label="Email" type="email" error="Invalid email" />
  <Stack direction="row" justify="end" spacing="sm">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Submit</Button>
  </Stack>
</Stack>
```

### Dropdown Menu
```tsx
<Dropdown label="Options" icon={<Settings />} align="end">
  <Card.Body padding="sm">
    <Stack spacing="xs">
      <Button variant="tertiary" className="w-full justify-start">Edit</Button>
      <Button variant="tertiary" className="w-full justify-start">Duplicate</Button>
      <Button variant="tertiary" className="w-full justify-start text-destructive">Delete</Button>
    </Stack>
  </Card.Body>
</Dropdown>
```

### Modal Dialog
```tsx
const [open, setOpen] = useState(false)

<Button onClick={() => setOpen(true)}>Open Modal</Button>

<Modal open={open} onOpenChange={setOpen} size="md">
  <Card.Body>
    <Text variant="heading-3">Confirm Action</Text>
    <Text color="dim">Are you sure you want to proceed?</Text>
  </Card.Body>
  <Card.Footer>
    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </Card.Footer>
</Modal>
```

---

## 10. Checklist for Figma Implementation

- [ ] Identify the correct component from the UI library
- [ ] Use semantic color tokens (not hex values)
- [ ] Use typography tokens (not arbitrary font sizes)
- [ ] Use spacing scale (gap-2, p-4, not custom values)
- [ ] Use shadow tokens if elevation is needed
- [ ] Add proper icons from lucide-react
- [ ] Handle dark mode with theme-aware tokens
- [ ] Add responsive classes for mobile/tablet/desktop
- [ ] Use `Card.Body` and `Card.Footer` for panel content
- [ ] Mark client components with `'use client'` if interactive
