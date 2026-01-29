'use client'

import { useState, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { Button, Input, Avatar, Badge, Tag, Tabs, TabsList, Tab, TabsContent, ToggleButtonGroup } from '@/components/ui'
import { Plus, Settings, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

/*
 * ===========================================
 * DASHBOARD EXAMPLE
 * ===========================================
 * Demonstrates: AG Grid with Hawkins styling, stats cards, tabs
 */

// Mock data
const stats = [
  { label: 'Total Users', value: '12,345', change: '+12%', trending: 'up' },
  { label: 'Active Sessions', value: '1,234', change: '+5%', trending: 'up' },
  { label: 'Bounce Rate', value: '23%', change: '-3%', trending: 'down' },
  { label: 'Avg Duration', value: '4m 32s', change: '-8%', trending: 'down' },
]

type User = {
  id: number
  name: string
  email: string
  status: 'active' | 'pending' | 'inactive'
  role: string
  priority: 'high' | 'medium' | 'low'
  avatar?: string
}

const users: User[] = [
  { id: 1, name: 'Sarah Connor', email: 'sarah@example.com', status: 'active', role: 'Admin', priority: 'high', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, name: 'John Doe', email: 'john@example.com', status: 'active', role: 'User', priority: 'medium', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: 3, name: 'Jane Smith', email: 'jane@example.com', status: 'pending', role: 'User', priority: 'low', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: 4, name: 'Bob Wilson', email: 'bob@example.com', status: 'inactive', role: 'Viewer', priority: 'low', avatar: 'https://i.pravatar.cc/150?img=8' },
  { id: 5, name: 'Alice Johnson', email: 'alice@example.com', status: 'active', role: 'Editor', priority: 'high', avatar: 'https://i.pravatar.cc/150?img=9' },
  { id: 6, name: 'Charlie Brown', email: 'charlie@example.com', status: 'active', role: 'User', priority: 'medium', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: 7, name: 'Diana Prince', email: 'diana@example.com', status: 'pending', role: 'Admin', priority: 'high', avatar: 'https://i.pravatar.cc/150?img=13' },
  { id: 8, name: 'Edward Miller', email: 'edward@example.com', status: 'inactive', role: 'Viewer', priority: 'low', avatar: 'https://i.pravatar.cc/150?img=15' },
]

// Custom cell renderer for user avatar + name
function UserCellRenderer(params: ICellRendererParams<User>) {
  const user = params.data
  if (!user) return null

  return (
    <div className="flex items-center gap-3 h-full">
      <Avatar name={user.name} src={user.avatar} size="sm" />
      <div className="flex flex-col">
        <span className="text-body-1-regular text-foreground">{user.name}</span>
        <span className="text-body-1-regular text-foreground-subtle">{user.email}</span>
      </div>
    </div>
  )
}

// Custom cell renderer for status tag
function StatusCellRenderer(params: ICellRendererParams<User>) {
  const user = params.data
  if (!user) return null

  const type = user.status === 'active' ? 'positive' :
               user.status === 'pending' ? 'notice' : 'neutral'

  return (
    <div className="flex items-center h-full">
      <Tag type={type} size="standard">
        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
      </Tag>
    </div>
  )
}

// Custom cell renderer for priority badge
function PriorityCellRenderer(params: ICellRendererParams<User>) {
  const user = params.data
  if (!user) return null

  const color = user.priority === 'high' ? 'red' :
                user.priority === 'medium' ? 'yellow' : 'gray'

  return (
    <div className="flex items-center h-full">
      <Badge color={color} compact interactive>
        {user.priority.charAt(0).toUpperCase() + user.priority.slice(1)}
      </Badge>
    </div>
  )
}

// Custom cell renderer for role
function RoleCellRenderer(params: ICellRendererParams<User>) {
  const user = params.data
  if (!user) return null

  return (
    <span className="text-body-1-regular text-foreground-dim">{user.role}</span>
  )
}

// Custom cell renderer for actions
function ActionsCellRenderer(params: ICellRendererParams<User>) {
  return (
    <div className="flex items-center h-full">
      <Button variant="tertiary" compact>View</Button>
    </div>
  )
}

export default function DashboardExample() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) ||
                           user.email.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !statusFilter || user.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter])

  const columnDefs = useMemo<ColDef<User>[]>(() => [
    {
      headerName: 'User',
      field: 'name',
      flex: 2,
      minWidth: 250,
      cellRenderer: UserCellRenderer,
    },
    {
      headerName: 'Status',
      field: 'status',
      width: 110,
      cellRenderer: StatusCellRenderer,
    },
    {
      headerName: 'Priority',
      field: 'priority',
      width: 110,
      cellRenderer: PriorityCellRenderer,
    },
    {
      headerName: 'Role',
      field: 'role',
      width: 100,
      cellRenderer: RoleCellRenderer,
    },
    {
      headerName: '',
      field: 'id',
      width: 80,
      sortable: false,
      cellRenderer: ActionsCellRenderer,
    },
  ], [])

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
  }), [])

  const getRowId = useCallback((params: { data: User }) => String(params.data.id), [])

  const gridHeight = Math.min(400, filteredUsers.length * 52 + 48)

  return (
    <div className="min-h-screen bg-surface-flat">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-heading-4 text-foreground mb-1">Dashboard</h1>
              <p className="text-body-1-regular text-foreground-dim">
                Welcome back! Here's what's happening today.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" icon={<Settings className="w-4 h-4" />}>
                Settings
              </Button>
              <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
                Add New
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded border border-border-dim bg-surface-flat p-4">
                <div className="flex flex-col gap-2">
                  <span className="text-label-1-regular text-foreground-subtle">{stat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-heading-2 text-foreground">{stat.value}</span>
                    <Badge
                      color={stat.trending === 'up' ? 'green' : 'red'}
                      compact
                    >
                      <span className="flex items-center gap-0.5">
                        {stat.trending === 'up'
                          ? <TrendingUp className="w-3 h-3" />
                          : <TrendingDown className="w-3 h-3" />
                        }
                        {stat.change}
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>
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
              <div className="rounded border border-border-dim bg-surface-flat p-6">
                <div className="flex flex-col gap-4">
                  <h2 className="text-heading-1 text-foreground">Activity Overview</h2>
                  <div className="h-48 bg-surface-low rounded flex items-center justify-center border border-border-dim">
                    <div className="flex flex-col items-center gap-2">
                      <BarChart3 className="w-8 h-8 text-foreground-subtle" />
                      <span className="text-body-1-regular text-foreground-dim">
                        Chart placeholder — integrate your charting library
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="rounded border border-border-dim bg-surface-flat p-4">
                <div className="flex flex-col gap-4">
                  {/* Filters */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-sm">
                      <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <ToggleButtonGroup
                      options={[
                        { value: '', label: 'All' },
                        { value: 'active', label: 'Active' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'inactive', label: 'Inactive' },
                      ]}
                      value={statusFilter}
                      onChange={setStatusFilter}
                      compact
                    />
                  </div>

                  {/* AG Grid Table */}
                  <div className="ag-theme-hawkins w-full" style={{ height: gridHeight }}>
                    <AgGridReact<User>
                      rowData={filteredUsers}
                      columnDefs={columnDefs}
                      defaultColDef={defaultColDef}
                      getRowId={getRowId}
                      rowHeight={52}
                      headerHeight={40}
                      suppressCellFocus
                      suppressRowClickSelection
                      animateRows
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="rounded border border-border-dim bg-surface-flat p-6">
                <div className="flex flex-col items-center gap-4 py-12">
                  <h2 className="text-heading-1 text-foreground">Analytics Coming Soon</h2>
                  <p className="text-body-1-regular text-foreground-dim">
                    This section is a placeholder for analytics content.
                  </p>
                  <Button variant="secondary">Learn More</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  )
}
