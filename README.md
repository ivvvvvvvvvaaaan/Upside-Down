# Prototype Factory

Next.js template for building clickable prototypes with the Hawkins Design System. Optimized for designers who want to ship fast.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and start editing `src/app/page.tsx`

## For Designers (Non-Technical)

**👉 Read the [Complete Guide](DEPLOYMENT.md)** for step-by-step setup, deployment, and daily workflow.

The guide covers:
- Setting up GitHub & Vercel (one-time, 15 min)
- Saving your work with one command
- Creating version snapshots for client reviews
- Adding real data persistence (optional)
- Troubleshooting common issues

## Creating Pages

```bash
npm run new:page feature-name
```

Creates `src/app/feature-name/page.tsx` with starter code.

## Components

Built-in components:
```tsx
import { Button, Card, Stack, Text, Input, Badge } from '@/components/ui'
```

Add more via shadcn/ui:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

Browse all: [ui.shadcn.com](https://ui.shadcn.com)

## Daily Workflow

**Save your work:**
```bash
npm run save
```
→ Commits, pushes to GitHub, auto-deploys to Vercel

**Create a version snapshot:**
```bash
npm run publish
```
→ Creates a permanent URL for client reviews or user testing

## Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Complete setup & workflow (start here!)
- **[Theme System](THEME_SYSTEM.md)** - Color tokens and design system
- **[Components](docs/COMPONENTS.md)** - Component API reference
- **[Patterns](docs/PATTERNS.md)** - Copy-paste UI patterns

## Adding Real Data (Optional)

By default, uses mock data. To enable real persistence:

1. Create a [Supabase](https://supabase.com) project
2. Add environment variables (see [Deployment Guide](DEPLOYMENT.md#setting-up-real-data-supabase))
3. Create the database table (SQL provided in guide)

Everything auto-falls back to mocks if Supabase isn't configured.

## File Structure

```
src/
├── app/              # Pages (Next.js App Router)
│   ├── page.tsx      # Homepage
│   └── examples/     # Example prototypes
├── components/ui/    # Component library
└── lib/
    ├── data.ts       # Mock data + real data fetching
    └── supabase/     # Database client (optional)
```

## Commands Reference

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Test production build |
| `npm run save` | Save & deploy to live site |
| `npm run publish` | Create version snapshot |
| `npm run new:page` | Generate new page |

## Resources

- Icons: [lucide.dev/icons](https://lucide.dev/icons)
- UI Components: [ui.shadcn.com](https://ui.shadcn.com)
- Deployment: [vercel.com](https://vercel.com)

---

**New to coding?** Start with the [Deployment Guide](DEPLOYMENT.md) - it assumes zero technical knowledge.
