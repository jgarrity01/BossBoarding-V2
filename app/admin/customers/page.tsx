'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdminStore, useUserStore } from '@/lib/store'
import { 
  createCustomer as createSupabaseCustomer, 
  getCustomers as getSupabaseCustomers,
  deleteCustomer as deleteSupabaseCustomer,
  createCustomerUser,
} from '@/lib/supabase/customers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search,
  Filter,
  Building2,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Download,
  Plus,
  Copy,
  Check,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { OnboardingStatus, Customer } from '@/lib/types'
import { generateOnboardingToken, ONBOARDING_SECTIONS } from '@/lib/types'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Loading from './loading'

export default function CustomersPage() {
  const { customers, statusFilter, searchQuery, setStatusFilter, setSearchQuery, deleteCustomer, addCustomer, setCustomers } = useAdminStore()
  const { currentAdminUser } = useUserStore()
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const searchParams = useSearchParams()
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
  
  // Load customers from Supabase on mount
  useEffect(() => {
    async function loadCustomers() {
      setIsLoadingCustomers(true)
      try {
        const supabaseCustomers = await getSupabaseCustomers()
        // Always set customers from Supabase (even if empty)
        setCustomers(supabaseCustomers)
      } catch (error) {
        console.error('[v0] Error loading customers:', error)
      } finally {
        setIsLoadingCustomers(false)
      }
    }
    loadCustomers()
  }, [setCustomers])
  
  // New customer dialog state
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [newCustomerId, setNewCustomerId] = useState<string | null>(null)
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  
  const resetNewCustomerDialog = () => {
    setNewCustomerData({ businessName: '', ownerName: '', email: '', phone: '', password: '' })
    setGeneratedLink(null)
    setCopiedLink(false)
    setNewCustomerId(null)
    setCreateError(null)
  }
  
  const handleCreateCustomer = async () => {
    setIsCreatingCustomer(true)
    setCreateError(null)
    
    const token = generateOnboardingToken()
    const now = new Date().toISOString()
    
    const newCustomerPayload: Partial<Customer> = {
      businessName: newCustomerData.businessName,
      ownerName: newCustomerData.ownerName,
      email: newCustomerData.email,
      phone: newCustomerData.phone,
      status: 'not_started',
      onboardingToken: token,
      onboardingStarted: false,
      onboardingCompleted: false,
      currentStep: 0,
      totalSteps: 11,
      sections: ONBOARDING_SECTIONS.map(s => ({ ...s, status: 'not_started' as const })),
    }
    
    try {
      // Create customer in Supabase
      const supabaseCustomer = await createSupabaseCustomer(newCustomerPayload)
      
      if (!supabaseCustomer) {
        setCreateError('Failed to create customer in database')
        setIsCreatingCustomer(false)
        return
      }
      
      // Create customer portal user in Supabase
      if (newCustomerData.password) {
        const userResult = await createCustomerUser(
          supabaseCustomer.id,
          newCustomerData.ownerName,
          newCustomerData.email,
          newCustomerData.password,
          'owner'
        )
        
        if (userResult.error) {
          console.error('[v0] Error creating customer user:', userResult.error)
          // Continue anyway - customer was created, just user wasn't
        } else {
          console.log('[v0] Portal user created successfully:', userResult.user?.id)
        }
      } else {
        console.log('[v0] No password provided, skipping portal user creation')
      }
      
      // Calculate default dates: installation 40 days, go-live 42 days from now
      const defaultInstallDate = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString()
      const defaultGoLiveDate = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString()
      
      // Build full customer object for local state
      const newCustomer: Customer = {
        id: supabaseCustomer.id,
        businessName: newCustomerData.businessName,
        ownerName: newCustomerData.ownerName,
        email: newCustomerData.email,
        phone: newCustomerData.phone,
        createdAt: supabaseCustomer.createdAt || now,
        updatedAt: supabaseCustomer.updatedAt || now,
        status: 'not_started',
        onboardingToken: token,
        onboardingStarted: false,
        onboardingCompleted: false,
        currentStep: 0,
        totalSteps: 11,
        sections: ONBOARDING_SECTIONS.map(s => ({ ...s, status: 'not_started' as const })),
        taskStatuses: {},
        taskMetadata: {},
        currentStageId: 'stage-1',
        employees: [],
        machines: [],
        contractSigned: false,
        notes: [],
        salesRepAssignments: [],
        nonRecurringRevenue: 0,
        monthlyRecurringFee: 0,
        otherFees: 0,
        cogs: 0,
        commissionRate: 10,
        paymentTermMonths: 48,
        paymentStatus: 'unpaid',
        paidToDateAmount: 0,
        commissionPaidAmount: 0,
        paymentProcessors: [],
        paymentLinks: [],
        installationDate: supabaseCustomer.installationDate || defaultInstallDate,
        goLiveDate: supabaseCustomer.goLiveDate || defaultGoLiveDate,
        onboardingDates: {
          startDate: now,
          estimatedCompletionDate: supabaseCustomer.installationDate || defaultInstallDate,
          useAdminOverride: false,
        },
      }
      
      addCustomer(newCustomer)
      
      // Generate the onboarding link
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const onboardingLink = `${baseUrl}/onboarding/${token}`
      setGeneratedLink(onboardingLink)
      setNewCustomerId(supabaseCustomer.id)
    } catch (error) {
      console.error('Error creating customer:', error)
      setCreateError('An unexpected error occurred')
    } finally {
      setIsCreatingCustomer(false)
    }
  }
  
  const copyLinkToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleSearch = (value: string) => {
    setLocalSearch(value)
    setSearchQuery(value)
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      customer.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: OnboardingStatus) => {
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

  const exportToCSV = () => {
    const headers = ['Business Name', 'Owner', 'Email', 'Phone', 'Status', 'Progress', 'Sections Complete', 'Created', 'Updated', 'Contract Signed', 'Installation Date', 'Go Live Date']
    const rows = filteredCustomers.map(c => {
      const sectionsComplete = c.sections.filter(s => s.status === 'complete').length
      return [
        c.businessName,
        c.ownerName,
        c.email,
        c.phone,
        c.status.replace('_', ' '),
        `${c.currentStep}/${c.totalSteps}`,
        `${sectionsComplete}/${c.sections.length}`,
        new Date(c.createdAt).toLocaleDateString(),
        new Date(c.updatedAt).toLocaleDateString(),
        c.contractSigned ? 'Yes' : 'No',
        c.installationDate ? new Date(c.installationDate).toLocaleDateString() : '',
        c.goLiveDate ? new Date(c.goLiveDate).toLocaleDateString() : ''
      ]
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `johnboarding-customers-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">Manage and view all customer onboardings</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setIsNewCustomerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Customer
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={localSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select 
                value={statusFilter} 
                onValueChange={(value: OnboardingStatus | 'all') => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="needs_review">Needs Review</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No customers found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Customers will appear here once they begin onboarding.'}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead className="hidden md:table-cell">Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Progress</TableHead>
                      <TableHead>Onboarding Link</TableHead>
                      <TableHead className="hidden lg:table-cell">Updated</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{customer.businessName}</p>
                              <p className="text-sm text-muted-foreground">{customer.ownerName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>
                            <p className="text-sm">{customer.email}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(customer.status)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary"
                                style={{ width: `${(customer.currentStep / customer.totalSteps) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {customer.currentStep}/{customer.totalSteps}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.onboardingToken ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={customer.onboardingCompleted ? "default" : customer.onboardingStarted ? "secondary" : "outline"}
                                  className={customer.onboardingCompleted ? "bg-green-600 text-xs" : "text-xs"}
                                >
                                  {customer.onboardingCompleted ? "Completed" : customer.onboardingStarted ? "In Progress" : "Not Started"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                  /onboarding/{customer.onboardingToken}
                                </code>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const link = `${window.location.origin}/onboarding/${customer.onboardingToken}`;
                                    navigator.clipboard.writeText(link);
                                    setCopiedCustomerId(customer.id);
                                    setTimeout(() => setCopiedCustomerId(null), 2000);
                                  }}
                                  title="Copy full link"
                                >
                                  {copiedCustomerId === customer.id ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => window.open(`/onboarding/${customer.onboardingToken}`, '_blank')}
                                  title="Open onboarding link"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No link</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {new Date(customer.updatedAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/customers/${customer.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/customers/${customer.id}/edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={async () => {
                                  // Delete from Supabase first
                                  await deleteSupabaseCustomer(customer.id)
                                  // Then delete from local state
                                  deleteCustomer(customer.id)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
  </CardContent>
  </Card>

        {/* New Customer Dialog */}
        <Dialog open={isNewCustomerOpen} onOpenChange={(open) => {
          if (!open) {
            setIsNewCustomerOpen(false)
            resetNewCustomerDialog()
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{generatedLink ? 'Customer Created!' : 'Create New Customer'}</DialogTitle>
              <DialogDescription>
                {generatedLink 
                  ? 'Share this unique onboarding link with your customer.'
                  : 'Enter basic customer information to generate their unique onboarding link.'}
              </DialogDescription>
            </DialogHeader>
            
            {!generatedLink ? (
              <>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      placeholder="Enter business name"
                      value={newCustomerData.businessName}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, businessName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name *</Label>
                    <Input
                      id="ownerName"
                      placeholder="Enter owner name"
                      value={newCustomerData.ownerName}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, ownerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Portal Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Set customer portal password"
                      value={newCustomerData.password}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, password: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional. Set a password for the customer to access their portal dashboard.
                    </p>
                  </div>
                  {createError && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      {createError}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsNewCustomerOpen(false)
                    resetNewCustomerDialog()
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCustomer}
                    disabled={isCreatingCustomer || !newCustomerData.businessName || !newCustomerData.ownerName || !newCustomerData.email || !newCustomerData.phone}
                  >
                    {isCreatingCustomer ? 'Creating...' : 'Create Customer'}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">Customer created successfully!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>{newCustomerData.businessName}</strong> has been added to your customers list.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Unique Onboarding Link</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-lg border font-mono text-sm break-all">
                        {generatedLink}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share this link with your customer. Their information will be pre-filled in the onboarding form.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={copyLinkToClipboard} variant="outline" className="flex-1 bg-transparent">
                      {copiedLink ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    <Button onClick={() => window.open(generatedLink, '_blank')} variant="outline" className="flex-1">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Link
                    </Button>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsNewCustomerOpen(false)
                    resetNewCustomerDialog()
                  }}>
                    Close
                  </Button>
                  {newCustomerId && (
                    <Button asChild>
                      <Link href={`/admin/customers/${newCustomerId}`}>
                        View Customer Details
                      </Link>
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
  </div>
  </Suspense>
  )
  }
