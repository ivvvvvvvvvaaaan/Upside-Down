# UI Components Reference

> All components are in `src/components/ui/`. Import from `@/components/ui`.

```tsx
import { Button, Card, Stack, Text } from '@/components/ui'
```

---

## Layout

### Stack
Flexbox container with consistent spacing. Use instead of raw divs.

```tsx
<Stack 
  direction="horizontal" | "vertical"  // default: vertical
  spacing="none" | "xs" | "sm" | "md" | "lg" | "xl"
  align="start" | "center" | "end" | "stretch" | "baseline"
  justify="start" | "center" | "end" | "between" | "around"
  wrap={boolean}
>
  {children}
</Stack>
```

### Card
Container with background and optional elevation.

```tsx
<Card 
  variant="default" | "elevated" | "outlined"
  padding="none" | "sm" | "md" | "lg"
>
  {children}
</Card>
```

### Divider
Visual separator line.

```tsx
<Divider orientation="horizontal" | "vertical" />
```

---

## Typography

### Text
All text rendering. Use instead of raw HTML tags.

```tsx
<Text
  variant="display-1" | "display-2" | "headline-1" | "headline-2" | 
          "headline-3" | "headline-4" | "body-1" | "body-2" | 
          "caption" | "overline"
  color="primary" | "secondary" | "tertiary" | "error" | "success"
  weight="normal" | "medium" | "semibold" | "bold"
  as="p" | "span" | "h1" | "h2" | "h3" | "h4" | "label"  // optional override
>
  {content}
</Text>
```

**Size guide:**
- `display-1/2`: Hero text (48-56px)
- `headline-1`: Page titles (32px)
- `headline-2`: Section titles (24px)
- `headline-3`: Card titles (20px)
- `headline-4`: Subsections (18px)
- `body-1`: Primary text (16px)
- `body-2`: Secondary text (14px)
- `caption`: Small text (12px)

---

## Actions

### Button
Primary interaction element.

```tsx
<Button
  variant="primary" | "secondary" | "tertiary" | "destructive" | "icon"
  size="default" | "compact" | "icon"
  compact={boolean}  // Alternative to size="compact"
  icon={<Icon />}
  dropdown={boolean}
  disabled={boolean}
  onClick={handler}
>
  {label}
</Button>
```

**Variant guide:**
- `primary`: Main action (1 per view)
- `secondary`: Supporting actions, outlined
- `tertiary`: Low emphasis, transparent
- `destructive`: Dangerous actions (delete, remove)
- `icon`: Icon-only buttons (use with size="icon")

**Icon-only buttons:**
```tsx
import { Edit } from 'lucide-react'

<Button variant="icon" size="icon">
  <Edit className="w-4 h-4" />
</Button>
```

---

## Form Components

### Input
Text input with label and validation.

```tsx
<Input
  label="Email"
  placeholder="you@example.com"
  type="text" | "email" | "password" | "number"
  value={value}
  onChange={handler}
  error="Error message"
  helperText="Helper text"
  icon={<SearchIcon />}  // Optional icon
  iconPosition="left" | "right"  // Default: "left"
  disabled={boolean}
/>
```

**With icon example:**
```tsx
import { Search } from 'lucide-react'

<Input 
  placeholder="Search..." 
  icon={<Search className="w-4 h-4" />} 
  iconPosition="left"
/>
```

### Select
Dropdown selection.

```tsx
<Select
  label="Status"
  placeholder="Select..."
  value={value}
  onChange={(value) => setValue(value)}
  options={[
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
  ]}
  error="Error message"
/>
```

---

## Data Display

### Avatar
User representation with image or initials.

```tsx
<Avatar
  src="/path/to/image.jpg"  // Optional
  name="Sarah Connor"       // Used for initials fallback
  size="xs" | "sm" | "md" | "lg" | "xl"
/>
```

### Badge
Status indicator with colored dot and border.

```tsx
<Badge
  color="gray" | "green" | "red" | "yellow" | "indigo" | "purple"  // Direct colors
        | "new" | "in progress" | "complete" | "unknown" | "failure"  // Status values
  compact={boolean}  // Compact spacing for dense layouts
>
  {label}
</Badge>
```

**Examples:**
```tsx
// Direct colors
<Badge color="green">Active</Badge>
<Badge color="red">Error</Badge>
<Badge color="yellow">Pending</Badge>

// Status values (map to colors)
<Badge color="complete">Done</Badge>
<Badge color="failure">Failed</Badge>
<Badge color="in progress">Working</Badge>

// Compact variant
<Badge color="gray" compact>New</Badge>
```

---

## Feedback

### Modal
Overlay dialog.

```tsx
const [isOpen, setIsOpen] = useState(false)

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="sm" | "md" | "lg" | "xl"
>
  {/* Modal content */}
  <Stack spacing="md">
    <Text>Modal body content</Text>
    <Stack direction="horizontal" spacing="sm" justify="end">
      <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </Stack>
  </Stack>
</Modal>
```

### Alert
Inline notification message.

```tsx
<Alert
  variant="info" | "success" | "warning" | "error"
  title="Optional title"
  dismissible={boolean}
  onDismiss={handler}
>
  {message}
</Alert>
```

---

## Navigation

### Tabs
Tabbed content organization.

```tsx
<Tabs defaultValue="tab1" onValueChange={(value) => console.log(value)}>
  <TabsList>
    <Tab value="tab1">First Tab</Tab>
    <Tab value="tab2">Second Tab</Tab>
    <Tab value="tab3">Third Tab</Tab>
  </TabsList>
  <TabsContent value="tab1">First content</TabsContent>
  <TabsContent value="tab2">Second content</TabsContent>
  <TabsContent value="tab3">Third content</TabsContent>
</Tabs>
```

---

## Icons

Import from `lucide-react`:

```tsx
import { 
  Plus, Minus, X, Check,
  Search, Settings, Edit, Trash2,
  ChevronDown, ChevronRight, ChevronLeft,
  User, Users, Home, Mail,
  AlertCircle, Info, CheckCircle,
  // ... hundreds more
} from 'lucide-react'

// Usage - always set size with className
<Plus className="w-4 h-4" />
<Settings className="w-5 h-5" />
```

Browse all icons: https://lucide.dev/icons

---

## Tailwind Utilities

For custom layouts, use Tailwind directly:

```tsx
// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Flex layout
<div className="flex items-center justify-between gap-4">

// Spacing
<div className="p-4 m-2 space-y-4">

// Colors (theme-aware)
<div className="bg-surface-primary text-content-primary">
<div className="bg-surface-secondary text-content-secondary">
<div className="border border-border">
```
