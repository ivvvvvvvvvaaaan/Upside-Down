'use client'

import { useState } from 'react'
import { 
  Stack, Text, Card, Button, Badge, Input, Select, 
  Avatar, Tabs, TabsList, Tab, TabsContent, Divider 
} from '@/components/ui'
import { Plus, Settings, Search, TrendingUp, TrendingDown } from 'lucide-react'

/*
 * ===========================================
 * DASHBOARD EXAMPLE
 * ===========================================
 * Demonstrates: stats cards, tabs, tables, filters
 */

// Mock data
const stats = [
  { label: 'Total Users', value: '12,345', change: '+12%', trending: 'up' },
  { label: 'Active Sessions', value: '1,234', change: '+5%', trending: 'up' },
  { label: 'Bounce Rate', value: '23%', change: '-3%', trending: 'down' },
  { label: 'Avg Duration', value: '4m 32s', change: '-8%', trending: 'down' },
]

const users = [
  { id: 1, name: 'Sarah Connor', email: 'sarah@example.com', status: 'active', role: 'Admin' },
  { id: 2, name: 'John Doe', email: 'john@example.com', status: 'active', role: 'User' },
  { id: 3, name: 'Jane Smith', email: 'jane@example.com', status: 'pending', role: 'User' },
  { id: 4, name: 'Bob Wilson', email: 'bob@example.com', status: 'inactive', role: 'Viewer' },
]

export default function DashboardExample() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Stack spacing="lg">
        
        {/* Header */}
        <Stack direction="horizontal" justify="between" align="center">
          <Stack spacing="xs">
            <Text variant="headline-1">Dashboard</Text>
            <Text variant="body-2" color="secondary">
              Welcome back! Here's what's happening today.
            </Text>
          </Stack>
          <Stack direction="horizontal" spacing="sm">
            <Button variant="secondary" leftIcon={<Settings className="w-4 h-4" />}>
              Settings
            </Button>
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Add New
            </Button>
          </Stack>
        </Stack>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} padding="lg">
              <Stack spacing="sm">
                <Text variant="caption" color="secondary">{stat.label}</Text>
                <Stack direction="horizontal" align="center" spacing="sm">
                  <Text variant="headline-2">{stat.value}</Text>
                  <Badge 
                    variant={stat.trending === 'up' ? 'success' : 'error'} 
                    size="sm"
                  >
                    <Stack direction="horizontal" spacing="xs" align="center">
                      {stat.trending === 'up' 
                        ? <TrendingUp className="w-3 h-3" /> 
                        : <TrendingDown className="w-3 h-3" />
                      }
                      {stat.change}
                    </Stack>
                  </Badge>
                </Stack>
              </Stack>
            </Card>
          ))}
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="users">
          <TabsList>
            <Tab value="overview">Overview</Tab>
            <Tab value="users">Users</Tab>
            <Tab value="analytics">Analytics</Tab>
          </TabsList>

          <TabsContent value="overview">
            <Card padding="lg">
              <Stack spacing="md">
                <Text variant="headline-3">Activity Overview</Text>
                <div className="h-48 bg-surface-secondary rounded-lg flex items-center justify-center">
                  <Text variant="body-2" color="tertiary">
                    📊 Chart placeholder — integrate your charting library
                  </Text>
                </div>
              </Stack>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card padding="lg">
              <Stack spacing="md">
                {/* Filters */}
                <Stack direction="horizontal" spacing="md">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="w-48">
                    <Select
                      placeholder="Filter status"
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={[
                        { value: '', label: 'All Status' },
                        { value: 'active', label: 'Active' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'inactive', label: 'Inactive' },
                      ]}
                    />
                  </div>
                </Stack>

                <Divider />

                {/* User List */}
                <Stack spacing="sm">
                  {filteredUsers.map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-surface-secondary hover:bg-surface-tertiary transition-colors"
                    >
                      <Avatar name={user.name} size="md" />
                      <Stack spacing="none" className="flex-1">
                        <Text variant="body-1" weight="medium">{user.name}</Text>
                        <Text variant="caption" color="secondary">{user.email}</Text>
                      </Stack>
                      <Badge 
                        variant={
                          user.status === 'active' ? 'success' : 
                          user.status === 'pending' ? 'warning' : 'default'
                        }
                      >
                        {user.status}
                      </Badge>
                      <Text variant="caption" color="secondary" className="w-16">
                        {user.role}
                      </Text>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))}
                </Stack>
              </Stack>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card padding="lg">
              <Stack spacing="md" align="center" className="py-12">
                <Text variant="headline-3">Analytics Coming Soon</Text>
                <Text variant="body-2" color="secondary">
                  This section is a placeholder for analytics content.
                </Text>
                <Button variant="secondary">Learn More</Button>
              </Stack>
            </Card>
          </TabsContent>
        </Tabs>

      </Stack>
    </div>
  )
}
