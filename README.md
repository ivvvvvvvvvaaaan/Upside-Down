# 🚀 Prototype Factory

Rapidly build clickable prototypes with pre-built components that match our design system. 

**Zero engineering setup required** — just clone, install, and start prototyping.

---

## Quick Start

```bash
# 1. Clone the template
git clone https://github.com/yourusername/prototype-factory.git my-prototype
cd my-prototype

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000
```

> Replace `yourusername` with your actual GitHub username after publishing.

That's it! Start editing `src/app/page.tsx` or create a new page.

---

## Create a New Prototype

```bash
npm run new:page my-feature-name
```

This creates `src/app/my-feature-name/page.tsx` with boilerplate ready to customize.

---

## Project Structure

```
├── .cursor/
│   └── rules              # AI instructions for Cursor
├── docs/
│   ├── COMPONENTS.md      # Component API reference
│   └── PATTERNS.md        # Copy-paste UI patterns
├── src/
│   ├── app/               # Pages (Next.js App Router)
│   │   ├── page.tsx       # Homepage
│   │   └── examples/      # Example prototypes
│   ├── components/
│   │   └── ui/            # UI component library
│   └── lib/
│       └── utils.ts       # Utility functions
└── tailwind.config.ts     # Design tokens
```

---

## Using Components

Import from `@/components/ui`:

```tsx
import { Button, Card, Stack, Text, Input, Badge } from '@/components/ui'
```

Available components:
- **Layout:** `Stack`, `Card`, `Divider`
- **Typography:** `Text`
- **Actions:** `Button`, `IconButton`
- **Forms:** `Input`, `Select`
- **Data:** `Avatar`, `Badge`
- **Feedback:** `Modal`, `Alert`
- **Navigation:** `Tabs`, `TabsList`, `Tab`, `TabsContent`

See `docs/COMPONENTS.md` for full API reference.

---

## Theme Toggle

Click the moon/sun icon in the top-right corner to toggle dark mode. All components automatically adapt.

---

## Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Deploy — every push creates a preview URL

---

## Using with Cursor AI

This template is optimized for AI-assisted prototyping. The `.cursor/rules` file teaches the AI to:

- ✅ Use the local component library correctly
- ✅ Follow design system patterns
- ✅ Support light/dark themes
- ✅ Create well-structured pages

### Example Prompts

```
"Create a settings page with user profile form"
"Add a notification dropdown to the header"  
"Build a data table with sorting and filtering"
"Create a modal flow for onboarding"
```

---

## Resources

- **Components:** `docs/COMPONENTS.md`
- **Patterns:** `docs/PATTERNS.md`  
- **Examples:** `src/app/examples/`
- **Icons:** [lucide.dev/icons](https://lucide.dev/icons)

---

## Tips

1. **Start with examples** — copy from `examples/` and modify
2. **Use mock data** — define test data at the top of your page
3. **Check both themes** — always verify light and dark mode
4. **Keep it scrappy** — this is prototyping, speed > perfection

---

Built for rapid prototyping. Not for production.
