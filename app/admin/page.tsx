'use client'

import Link from 'next/link'
import { useAdminStore } from '@/lib/store'
import { useData } from '@/lib/data-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  WashingMachine,
  Building2,
  CircleDashed,
  Loader2
} from 'lucide-react'
import { ONBOARDING_STAGES, getDefaultTaskStatuses, calculateProgress } from '@/lib/onboarding-config'
import { StageProgressBar } from '@/components/onboarding/stage-progress'

export default function AdminDashboard() {
  const { setStatusFilter } = useAdminStore()
  const { customers, isLoading } = useData()

  // Calculate customer status metrics
  const totalCustomers = customers.length
  const completed = customers.filter(c => c.status === 'complete').length
  const inProgress = customers.filter(c => c.status === 'in_progress').length
  const needsReview = customers.filter(c => c.status === 'needs_review').length
  const notStarted = customers.filter(c => c.status === 'not_started').length

  // Calculate task metrics across all customers using new task system
  const totalTaskCount = ONBOARDING_STAGES.reduce((sum, s) => sum + s.tasks.length, 0)
  const totalTasksAcrossCustomers = totalTaskCount * customers.length
  
  let tasksNotStarted = 0
  let tasksInProgress = 0
  let tasksComplete = 0
  
  customers.forEach(customer => {
    const taskStatuses = customer.taskStatuses || getDefaultTaskStatuses()
    ONBOARDING_STAGES.forEach(stage => {
      stage.tasks.forEach(task => {
        const status = taskStatuses[task.id] || 'not_started'
        if (status === 'not_started') tasksNotStarted++
        else if (status === 'in_progress') tasksInProgress++
        else if (status === 'complete') tasksComplete++
      })
    })
  })

  const totalMachines = customers.reduce((acc, c) => acc + (c.machines?.length || 0), 0)
  const totalEmployees = customers.reduce((acc, c) => acc + (c.employees?.length || 0), 0)
  
  const completionRate = totalCustomers > 0 
    ? Math.round((completed / totalCustomers) * 100) 
    : 0

  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Complete</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>
      case 'needs_review':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Needs Review</Badge>
      default:
        return <Badge variant="secondary">Not Started</Badge>
    }
  }

  const handleStatusClick = (status: 'not_started' | 'in_progress' | 'needs_review' | 'complete' | 'all') => {
    setStatusFilter(status)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Onboarding overview and metrics</p>
        </div>
        <Button asChild>
          <Link href="/admin/customers">
            View All Customers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Customer Stats Grid - Clickable */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/customers" onClick={() => handleStatusClick('all')}>
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Active onboardings
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/customers" onClick={() => handleStatusClick('complete')}>
          <Card className="cursor-pointer hover:border-green-500 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completed}</div>
              <p className="text-xs text-muted-foreground">
                {completionRate}% completion rate
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/customers" onClick={() => handleStatusClick('in_progress')}>
          <Card className="cursor-pointer hover:border-blue-500 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgress}</div>
              <p className="text-xs text-muted-foreground">
                Active onboardings
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/customers" onClick={() => handleStatusClick('needs_review')}>
          <Card className="cursor-pointer hover:border-amber-500 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Needs Review
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{needsReview}</div>
              <p className="text-xs text-muted-foreground">
                Pending approval
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Secondary Stats - Clickable */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/customers" onClick={() => handleStatusClick('not_started')}>
          <Card className="cursor-pointer hover:border-gray-400 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Not Started
              </CardTitle>
              <CircleDashed className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notStarted}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting kickoff
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Machines
            </CardTitle>
            <WashingMachine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMachines}</div>
            <p className="text-xs text-muted-foreground">
              Across all locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Registered staff
            </p>
          </CardContent>
        </Card>

        <Link href="/admin/tasks">
          <Card className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Project Tasks
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasksAcrossCustomers}</div>
              <p className="text-xs text-muted-foreground">
                {tasksComplete} complete, {tasksInProgress} in progress
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Pipeline Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Pipeline</CardTitle>
          <CardDescription>Current status distribution (click to filter)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Link href="/admin/customers" onClick={() => handleStatusClick('not_started')} className="flex items-center gap-4 hover:bg-muted/50 rounded p-2 -mx-2 transition-colors cursor-pointer">
              <div className="w-24 text-sm text-muted-foreground">Not Started</div>
              <Progress value={totalCustomers ? (notStarted / totalCustomers) * 100 : 0} className="flex-1" />
              <div className="w-12 text-sm font-medium text-right">{notStarted}</div>
            </Link>
            <Link href="/admin/customers" onClick={() => handleStatusClick('in_progress')} className="flex items-center gap-4 hover:bg-muted/50 rounded p-2 -mx-2 transition-colors cursor-pointer">
              <div className="w-24 text-sm text-muted-foreground">In Progress</div>
              <Progress value={totalCustomers ? (inProgress / totalCustomers) * 100 : 0} className="flex-1" />
              <div className="w-12 text-sm font-medium text-right">{inProgress}</div>
            </Link>
            <Link href="/admin/customers" onClick={() => handleStatusClick('needs_review')} className="flex items-center gap-4 hover:bg-muted/50 rounded p-2 -mx-2 transition-colors cursor-pointer">
              <div className="w-24 text-sm text-muted-foreground">Needs Review</div>
              <Progress value={totalCustomers ? (needsReview / totalCustomers) * 100 : 0} className="flex-1" />
              <div className="w-12 text-sm font-medium text-right">{needsReview}</div>
            </Link>
            <Link href="/admin/customers" onClick={() => handleStatusClick('complete')} className="flex items-center gap-4 hover:bg-muted/50 rounded p-2 -mx-2 transition-colors cursor-pointer">
              <div className="w-24 text-sm text-muted-foreground">Complete</div>
              <Progress value={totalCustomers ? (completed / totalCustomers) * 100 : 0} className="flex-1" />
              <div className="w-12 text-sm font-medium text-right">{completed}</div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Project Task Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Project Task Status</CardTitle>
          <CardDescription>
            {customers.length === 0 
              ? "No customers yet. Add customers to track onboarding tasks."
              : `Status of ${totalTasksAcrossCustomers} onboarding tasks across ${customers.length} customer${customers.length === 1 ? '' : 's'}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <CircleDashed className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-muted-foreground">Not Started</span>
              </div>
              <p className="text-2xl font-bold mt-2">{tasksNotStarted}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-muted-foreground">In Progress</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-blue-600">{tasksInProgress}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-muted-foreground">Complete</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-green-600">{tasksComplete}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest customer updates - click to view details</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/customers">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCustomers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No customers yet. They will appear here once onboarding begins.
              </p>
            ) : (
              recentCustomers.map((customer) => {
                const taskStatuses = customer.taskStatuses || getDefaultTaskStatuses()
                const completedTaskIds = Object.entries(taskStatuses)
                  .filter(([_, status]) => status === 'complete')
                  .map(([taskId]) => taskId)
                const progress = calculateProgress(completedTaskIds)
                
                return (
                  <Link 
                    key={customer.id} 
                    href={`/admin/customers/${customer.id}`}
                    className="flex flex-col gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customer.businessName}</p>
                          <p className="text-sm text-muted-foreground">{customer.ownerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(customer.status)}
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-muted-foreground">
                            {progress}% complete
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(customer.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    {/* Stage Progress Bar */}
                    <div className="hidden sm:block">
                      <StageProgressBar 
                        taskStatuses={taskStatuses} 
                        currentStageId={customer.currentStageId || 'contract_setup'} 
                      />
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
