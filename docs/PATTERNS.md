# UI Patterns

> Copy-paste these patterns and customize. All use components from `@/components/ui`.

---

## Page Layouts

### Basic Page
```tsx
'use client'

import { Stack, Text, Card, Button } from '@/components/ui'

export default function PageName() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Stack spacing="lg">
        {/* Header */}
        <Stack direction="horizontal" justify="between" align="center">
          <Stack spacing="xs">
            <Text variant="headline-1">Page Title</Text>
            <Text variant="body-2" color="secondary">Page description</Text>
          </Stack>
          <Button variant="primary">Primary Action</Button>
        </Stack>
        
        {/* Content */}
        <Card padding="lg">
          {/* Your content */}
        </Card>
      </Stack>
    </div>
  )
}
```

### Two Column Layout
```tsx
<div className="flex gap-6">
  {/* Sidebar */}
  <div className="w-64 shrink-0">
    <Card padding="md">
      <Stack spacing="sm">
        <Text variant="headline-4">Sidebar</Text>
        {/* Sidebar content */}
      </Stack>
    </Card>
  </div>
  
  {/* Main content */}
  <div className="flex-1">
    <Card padding="lg">
      {/* Main content */}
    </Card>
  </div>
</div>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} padding="md">
      {/* Card content */}
    </Card>
  ))}
</div>
```

---

## States

### Empty State
```tsx
import { FolderOpen } from 'lucide-react'

<Card padding="lg">
  <Stack spacing="md" align="center" className="py-12">
    <FolderOpen className="w-12 h-12 text-content-tertiary" />
    <Text variant="headline-3">No items yet</Text>
    <Text variant="body-2" color="secondary">
      Get started by creating your first item
    </Text>
    <Button variant="primary">Create Item</Button>
  </Stack>
</Card>
```

### Loading State
```tsx
<Card padding="lg">
  <Stack spacing="md" align="center" className="py-12">
    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    <Text variant="body-2" color="secondary">Loading...</Text>
  </Stack>
</Card>
```

### Error State
```tsx
import { Alert, Button, Stack } from '@/components/ui'

<Alert variant="error" title="Something went wrong">
  <Stack spacing="sm">
    <Text variant="body-2">We couldn't load the data. Please try again.</Text>
    <Button variant="secondary" size="sm" onClick={retry}>Retry</Button>
  </Stack>
</Alert>
```

---

## Forms

### Simple Form
```tsx
'use client'
import { useState } from 'react'
import { Stack, Text, Input, Button, Card } from '@/components/ui'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <Card padding="lg" className="max-w-md mx-auto">
      <Stack spacing="lg">
        <Text variant="headline-2">Sign In</Text>
        
        <Stack spacing="md">
          <Input 
            label="Email" 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input 
            label="Password" 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Stack>
        
        <Button variant="primary" fullWidth>
          Sign In
        </Button>
      </Stack>
    </Card>
  )
}
```

### Form with Validation
```tsx
const [errors, setErrors] = useState<Record<string, string>>({})

const validate = () => {
  const newErrors: Record<string, string> = {}
  if (!email) newErrors.email = 'Email is required'
  else if (!email.includes('@')) newErrors.email = 'Invalid email'
  if (!password) newErrors.password = 'Password is required'
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

// In form:
<Input 
  label="Email" 
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
/>
```

---

## Lists

### Simple List
```tsx
<Stack spacing="sm">
  {users.map(user => (
    <Card key={user.id} padding="md">
      <Stack direction="horizontal" spacing="md" align="center">
        <Avatar name={user.name} />
        <Stack spacing="none" className="flex-1">
          <Text variant="body-1" weight="medium">{user.name}</Text>
          <Text variant="caption" color="secondary">{user.email}</Text>
        </Stack>
      </Stack>
    </Card>
  ))}
</Stack>
```

### List with Actions
```tsx
import { Edit, Trash2 } from 'lucide-react'

<Stack spacing="sm">
  {items.map(item => (
    <div 
      key={item.id}
      className="flex items-center gap-4 p-3 rounded-lg bg-surface-secondary hover:bg-surface-tertiary transition-colors"
    >
      <Text variant="body-1" className="flex-1">{item.name}</Text>
      <Stack direction="horizontal" spacing="xs">
        <IconButton icon={<Edit className="w-4 h-4" />} label="Edit" />
        <IconButton icon={<Trash2 className="w-4 h-4" />} label="Delete" />
      </Stack>
    </div>
  ))}
</Stack>
```

---

## Modals

### Confirmation Modal
```tsx
'use client'
import { useState } from 'react'
import { Modal, Stack, Text, Button } from '@/components/ui'

function ConfirmDelete({ item, onConfirm }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
      
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Confirm Delete" size="sm">
        <Stack spacing="lg">
          <Text variant="body-1">
            Are you sure you want to delete "{item.name}"? This action cannot be undone.
          </Text>
          <Stack direction="horizontal" spacing="sm" justify="end">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { onConfirm(); setOpen(false); }}>
              Delete
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </>
  )
}
```

### Form Modal
```tsx
<Modal isOpen={open} onClose={() => setOpen(false)} title="Add Item" size="md">
  <Stack spacing="lg">
    <Stack spacing="md">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
    </Stack>
    <Stack direction="horizontal" spacing="sm" justify="end">
      <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={handleSubmit}>Save</Button>
    </Stack>
  </Stack>
</Modal>
```

---

## Navigation

### Header
```tsx
import { Settings, User } from 'lucide-react'

<div className="border-b border-border bg-surface-primary">
  <div className="max-w-6xl mx-auto px-6 py-4">
    <Stack direction="horizontal" justify="between" align="center">
      <Text variant="headline-3" weight="bold">App Name</Text>
      <Stack direction="horizontal" spacing="sm">
        <Button variant="ghost" leftIcon={<Settings className="w-4 h-4" />}>Settings</Button>
        <Avatar name="Current User" size="sm" />
      </Stack>
    </Stack>
  </div>
</div>
```

### Sidebar Navigation
```tsx
import { Home, Users, Settings, BarChart } from 'lucide-react'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart },
  { id: 'settings', label: 'Settings', icon: Settings },
]

<Stack spacing="xs" className="w-64 p-4">
  {navItems.map(item => {
    const Icon = item.icon
    const isActive = activeItem === item.id
    return (
      <button
        key={item.id}
        onClick={() => setActiveItem(item.id)}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
          isActive 
            ? 'bg-primary-500 text-white' 
            : 'text-content-secondary hover:bg-surface-secondary'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </button>
    )
  })}
</Stack>
```

---

## Data Simulation

### Mock Data Hook
```tsx
import { useState, useEffect } from 'react'

function useSimulatedData<T>(mockData: T, delay = 800) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockData)
      setLoading(false)
    }, delay)
    return () => clearTimeout(timer)
  }, [])

  return { data, loading }
}

// Usage
const { data: users, loading } = useSimulatedData([
  { id: 1, name: 'Sarah' },
  { id: 2, name: 'John' },
])

if (loading) return <LoadingState />
return <UserList users={users} />
```
