"use client"

import { useState, useMemo, useEffect } from "react"
import { useAdminStore } from "@/lib/store"
import { getCustomers as getSupabaseCustomers } from "@/lib/supabase/customers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart3,
  Users,
  DollarSign,
  Shield,
  CreditCard,
  FileSpreadsheet,
  Download,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  Percent,
} from "lucide-react"
import type { Customer } from "@/lib/types"

// Helper to calculate onboarding progress
function calculateOnboardingProgress(customer: Customer): number {
  const sections = customer.sections || []
  if (sections.length === 0) return 0
  const completed = sections.filter(s => s.status === 'complete').length
  return Math.round((completed / sections.length) * 100)
}

// Helper to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// Helper to format date
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ReportsPage() {
  const { customers, setCustomers } = useAdminStore()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("onboarding")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
  const [expandedOnboarding, setExpandedOnboarding] = useState<string | null>(null)
  
  // Custom Report Builder state
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'businessName', 'ownerName', 'email', 'status'
  ])
  
  // Available fields for custom reports
  const availableFields = [
    { id: 'businessName', label: 'Business Name', category: 'Basic Info' },
    { id: 'ownerName', label: 'Owner Name', category: 'Basic Info' },
    { id: 'email', label: 'Email', category: 'Basic Info' },
    { id: 'phone', label: 'Phone', category: 'Basic Info' },
    { id: 'status', label: 'Onboarding Status', category: 'Basic Info' },
    { id: 'createdAt', label: 'Created Date', category: 'Dates' },
    { id: 'installationDate', label: 'Installation Date', category: 'Dates' },
    { id: 'goLiveDate', label: 'Go Live Date', category: 'Dates' },
    { id: 'contractSignedDate', label: 'Contract Signed Date', category: 'Dates' },
    { id: 'dealAmount', label: 'Deal Amount', category: 'Financial' },
    { id: 'cogs', label: 'COGS', category: 'Financial' },
    { id: 'netDealAmount', label: 'Net Deal Amount', category: 'Financial' },
    { id: 'commissionRate', label: 'Commission Rate', category: 'Financial' },
    { id: 'totalCommission', label: 'Total Commission', category: 'Financial' },
    { id: 'paidToDateAmount', label: 'Paid to Date', category: 'Financial' },
    { id: 'commissionPaidAmount', label: 'Commission Paid', category: 'Financial' },
    { id: 'paymentStatus', label: 'Payment Status', category: 'Financial' },
    { id: 'nonRecurringRevenue', label: 'Non-Recurring Revenue', category: 'Revenue Breakdown' },
    { id: 'monthlyRecurringFee', label: 'Monthly Recurring Fee', category: 'Revenue Breakdown' },
    { id: 'otherFees', label: 'Other Fees', category: 'Revenue Breakdown' },
    { id: 'contractSigned', label: 'Contract Signed', category: 'Compliance' },
    { id: 'pciCompliance', label: 'PCI Compliance', category: 'Compliance' },
    { id: 'salesReps', label: 'Sales Reps', category: 'Sales' },
    { id: 'onboardingProgress', label: 'Onboarding Progress', category: 'Status' },
  ]
  
  // Group fields by category
  const fieldsByCategory = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = []
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, typeof availableFields>)

  // Load customers from Supabase on mount
  useEffect(() => {
    async function loadCustomers() {
      setIsLoading(true)
      try {
        const supabaseCustomers = await getSupabaseCustomers()
        setCustomers(supabaseCustomers)
      } catch (error) {
        console.error('Error loading customers for reports:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadCustomers()
  }, [setCustomers])
  
  const storeCustomers = customers || []

  // Onboarding Report Data
  const onboardingReport = useMemo(() => {
    const inProgress = storeCustomers.filter(c => c.status === 'in_progress' || c.status === 'not_started')
    const needsReview = storeCustomers.filter(c => c.status === 'needs_review')
    const completed = storeCustomers.filter(c => c.status === 'complete' || c.onboardingCompleted)
    
    return {
      total: storeCustomers.length,
      inProgress: inProgress.length,
      needsReview: needsReview.length,
      completed: completed.length,
      customers: storeCustomers.map(c => ({
        ...c,
        progress: calculateOnboardingProgress(c),
      })).filter(c => !c.onboardingCompleted && c.status !== 'complete'),
    }
  }, [storeCustomers])

  // Sales Commission Report Data
  const salesCommissionReport = useMemo(() => {
    // Aggregate by sales rep
    const repData: Record<string, {
      name: string
      totalRevenue: number
      totalCogs: number
      netRevenue: number
      commissionDue: number
      commissionPaid: number
      deals: Array<{
        customer: string
        dealAmount: number
        cogs: number
        commissionPercent: number
        commissionAmount: number
      }>
    }> = {}
    
    storeCustomers.forEach(customer => {
      if (!customer.salesRepAssignments || customer.salesRepAssignments.length === 0) return
      
      const dealAmount = customer.dealAmount || 0
      const cogs = customer.cogs || 0
      const netDeal = dealAmount - cogs
      const totalCommission = netDeal * (customer.commissionRate || 10) / 100
      
      customer.salesRepAssignments.forEach(assignment => {
        if (!repData[assignment.salesRepId]) {
          repData[assignment.salesRepId] = {
            name: assignment.salesRepName,
            totalRevenue: 0,
            totalCogs: 0,
            netRevenue: 0,
            commissionDue: 0,
            commissionPaid: 0,
            deals: [],
          }
        }
        
        const repCommission = totalCommission * (assignment.commissionPercent / 100)
        const repShare = assignment.commissionPercent / 100
        
        repData[assignment.salesRepId].totalRevenue += dealAmount * repShare
        repData[assignment.salesRepId].totalCogs += cogs * repShare
        repData[assignment.salesRepId].netRevenue += netDeal * repShare
        repData[assignment.salesRepId].commissionDue += repCommission
        repData[assignment.salesRepId].commissionPaid += (customer.commissionPaidAmount || 0) * repShare
        repData[assignment.salesRepId].deals.push({
          customer: customer.businessName,
          dealAmount,
          cogs,
          commissionPercent: assignment.commissionPercent,
          commissionAmount: repCommission,
        })
      })
    })
    
    return Object.values(repData)
  }, [storeCustomers])

  // Customer Portal Users Report
  const portalUsersReport = useMemo(() => {
    const filtered = selectedCustomer === 'all' 
      ? storeCustomers 
      : storeCustomers.filter(c => c.id === selectedCustomer)
    
    return filtered.map(customer => ({
      customerId: customer.id,
      businessName: customer.businessName,
      ownerName: customer.ownerName,
      email: customer.email,
      phone: customer.phone,
      hasCredentials: !!customer.dashboardCredentials?.passwordSet,
      // In a real app, you'd fetch portal users from the database
      users: customer.dashboardCredentials ? [
        {
          name: customer.ownerName,
          email: customer.email,
          role: 'owner',
          lastLogin: 'N/A',
        }
      ] : [],
    }))
  }, [storeCustomers, selectedCustomer])

  // PCI Compliance Report
  const pciReport = useMemo(() => {
    return storeCustomers.map(customer => ({
      businessName: customer.businessName,
      ownerName: customer.ownerName,
      hasPCI: !!customer.pciCompliance?.hasConsented,
      representativeName: customer.pciCompliance?.representativeName || 'N/A',
      companyName: customer.pciCompliance?.companyName || 'N/A',
      title: customer.pciCompliance?.title || 'N/A',
      consentDate: customer.pciCompliance?.consentDate,
    }))
  }, [storeCustomers])

  // Payments Report
  const paymentsReport = useMemo(() => {
    const filtered = selectedCustomer === 'all' 
      ? storeCustomers 
      : storeCustomers.filter(c => c.id === selectedCustomer)
    
    return {
      due: filtered.filter(c => {
        const totalDue = c.dealAmount || 0
        const paid = c.paidToDateAmount || 0
        return totalDue > paid
      }).map(c => ({
        ...c,
        amountDue: (c.dealAmount || 0) - (c.paidToDateAmount || 0),
      })),
      notPaid: filtered.filter(c => c.paymentStatus === 'unpaid' && (c.dealAmount || 0) > 0),
    }
  }, [storeCustomers, selectedCustomer])

  // Custom Report Data
  const customReportData = useMemo(() => {
    return storeCustomers.map(customer => {
      const row: Record<string, unknown> = {}
      
      selectedFields.forEach(fieldId => {
        switch (fieldId) {
          case 'businessName':
            row[fieldId] = customer.businessName
            break
          case 'ownerName':
            row[fieldId] = customer.ownerName
            break
          case 'email':
            row[fieldId] = customer.email
            break
          case 'phone':
            row[fieldId] = customer.phone
            break
          case 'status':
            row[fieldId] = customer.status
            break
          case 'createdAt':
            row[fieldId] = formatDate(customer.createdAt)
            break
          case 'installationDate':
            row[fieldId] = formatDate(customer.installationDate)
            break
          case 'goLiveDate':
            row[fieldId] = formatDate(customer.goLiveDate)
            break
          case 'contractSignedDate':
            row[fieldId] = formatDate(customer.contractSignedDate)
            break
          case 'dealAmount':
            row[fieldId] = formatCurrency(customer.dealAmount || 0)
            break
          case 'cogs':
            row[fieldId] = formatCurrency(customer.cogs || 0)
            break
          case 'netDealAmount':
            row[fieldId] = formatCurrency((customer.dealAmount || 0) - (customer.cogs || 0))
            break
          case 'commissionRate':
            row[fieldId] = `${customer.commissionRate || 10}%`
            break
          case 'totalCommission':
            const netDeal = (customer.dealAmount || 0) - (customer.cogs || 0)
            row[fieldId] = formatCurrency(netDeal * (customer.commissionRate || 10) / 100)
            break
          case 'paidToDateAmount':
            row[fieldId] = formatCurrency(customer.paidToDateAmount || 0)
            break
          case 'commissionPaidAmount':
            row[fieldId] = formatCurrency(customer.commissionPaidAmount || 0)
            break
          case 'paymentStatus':
            row[fieldId] = customer.paymentStatus
            break
          case 'nonRecurringRevenue':
            row[fieldId] = formatCurrency(customer.nonRecurringRevenue || 0)
            break
          case 'monthlyRecurringFee':
            row[fieldId] = formatCurrency(customer.monthlyRecurringFee || 0)
            break
          case 'otherFees':
            row[fieldId] = formatCurrency(customer.otherFees || 0)
            break
          case 'contractSigned':
            row[fieldId] = customer.contractSigned ? 'Yes' : 'No'
            break
          case 'pciCompliance':
            row[fieldId] = customer.pciCompliance?.hasConsented ? 'Signed' : 'Not Signed'
            break
          case 'salesReps':
            row[fieldId] = customer.salesRepAssignments?.map(a => `${a.salesRepName} (${a.commissionPercent}%)`).join(', ') || 'None'
            break
          case 'onboardingProgress':
            row[fieldId] = `${calculateOnboardingProgress(customer)}%`
            break
          default:
            row[fieldId] = ''
        }
      })
      
      return row
    })
  }, [storeCustomers, selectedFields])

  // Export to CSV
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const value = String(row[h] || '')
        // Escape quotes and wrap in quotes if contains comma
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and view business reports ({storeCustomers.length} customers)
          </p>
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2 h-auto p-1">
          <TabsTrigger value="onboarding" className="flex items-center gap-2 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Onboarding</span>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-2 py-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Commissions</span>
          </TabsTrigger>
          <TabsTrigger value="portal-users" className="flex items-center gap-2 py-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Portal Users</span>
          </TabsTrigger>
          <TabsTrigger value="pci" className="flex items-center gap-2 py-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">PCI</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 py-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2 py-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Custom</span>
          </TabsTrigger>
        </TabsList>

        {/* Onboarding Report */}
        <TabsContent value="onboarding" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{onboardingReport.total}</p>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{onboardingReport.inProgress}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{onboardingReport.needsReview}</p>
                    <p className="text-sm text-muted-foreground">Needs Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{onboardingReport.completed}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Onboarding Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Onboardings</CardTitle>
                <CardDescription>Customers currently in the onboarding process</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(
                  onboardingReport.customers.map(c => ({
                    'Business Name': c.businessName,
                    'Owner': c.ownerName,
                    'Status': c.status,
                    'Progress': `${c.progress}%`,
                    'Created': formatDate(c.createdAt),
                    'Install Date': formatDate(c.installationDate),
                  })),
                  'onboarding-report'
                )}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {onboardingReport.customers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No active onboardings</p>
                ) : (
                  onboardingReport.customers.map(customer => (
                    <div 
                      key={customer.id} 
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedOnboarding(
                          expandedOnboarding === customer.id ? null : customer.id
                        )}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium text-left">{customer.businessName}</p>
                            <p className="text-sm text-muted-foreground">{customer.ownerName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-muted-foreground">Progress</span>
                              <span className="text-sm font-medium">{customer.progress}%</span>
                            </div>
                            <Progress value={customer.progress} className="h-2" />
                          </div>
                          <Badge variant={
                            customer.status === 'needs_review' ? 'destructive' :
                            customer.status === 'in_progress' ? 'default' : 'secondary'
                          }>
                            {customer.status.replace('_', ' ')}
                          </Badge>
                          <ChevronRight className={`h-5 w-5 transition-transform ${
                            expandedOnboarding === customer.id ? 'rotate-90' : ''
                          }`} />
                        </div>
                      </button>
                      
                      {expandedOnboarding === customer.id && (
                        <div className="border-t bg-muted/30 p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm">{customer.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Phone</p>
                              <p className="text-sm">{customer.phone}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Created</p>
                              <p className="text-sm">{formatDate(customer.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Target Install</p>
                              <p className="text-sm">{formatDate(customer.installationDate)}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Section Progress</p>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                              {customer.sections?.map(section => (
                                <div 
                                  key={section.id}
                                  className={`text-xs p-2 rounded text-center ${
                                    section.status === 'complete' 
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : section.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                >
                                  {section.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Commission Report */}
        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sales Commission Report</CardTitle>
                <CardDescription>Revenue, COGS, and commission breakdown by sales rep</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(
                  salesCommissionReport.map(rep => ({
                    'Sales Rep': rep.name,
                    'Total Revenue': formatCurrency(rep.totalRevenue),
                    'COGS': formatCurrency(rep.totalCogs),
                    'Net Revenue': formatCurrency(rep.netRevenue),
                    'Commission Due': formatCurrency(rep.commissionDue),
                    'Commission Paid': formatCurrency(rep.commissionPaid),
                    'Balance Owed': formatCurrency(rep.commissionDue - rep.commissionPaid),
                    'Deals': rep.deals.length,
                  })),
                  'commission-report'
                )}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sales Rep</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">COGS</TableHead>
                    <TableHead className="text-right">Net Revenue</TableHead>
                    <TableHead className="text-right">Commission Due</TableHead>
                    <TableHead className="text-right">Commission Paid</TableHead>
                    <TableHead className="text-right">Balance Owed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesCommissionReport.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No commission data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesCommissionReport.map(rep => (
                      <TableRow key={rep.name}>
                        <TableCell className="font-medium">{rep.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(rep.totalRevenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(rep.totalCogs)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(rep.netRevenue)}</TableCell>
                        <TableCell className="text-right text-green-600 dark:text-green-400">
                          {formatCurrency(rep.commissionDue)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(rep.commissionPaid)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(rep.commissionDue - rep.commissionPaid)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Commission Splits Detail */}
              {salesCommissionReport.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Deal Breakdown</h4>
                  {salesCommissionReport.map(rep => (
                    <div key={rep.name} className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3">{rep.name}</h5>
                      <div className="space-y-2">
                        {rep.deals.map((deal, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                            <span>{deal.customer}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">
                                {deal.commissionPercent}% split
                              </span>
                              <span className="font-medium">
                                {formatCurrency(deal.commissionAmount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Portal Users Report */}
        <TabsContent value="portal-users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Portal Users</CardTitle>
                <CardDescription>Users with access to the customer portal</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {storeCustomers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.businessName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(
                    portalUsersReport.flatMap(c => 
                      c.users.map(u => ({
                        'Business': c.businessName,
                        'User Name': u.name,
                        'Email': u.email,
                        'Role': u.role,
                        'Last Login': u.lastLogin,
                      }))
                    ),
                    'portal-users-report'
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Portal Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portalUsersReport.map(customer => (
                    <TableRow key={customer.customerId}>
                      <TableCell className="font-medium">{customer.businessName}</TableCell>
                      <TableCell>{customer.ownerName}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>
                        <Badge variant={customer.hasCredentials ? 'default' : 'secondary'}>
                          {customer.hasCredentials ? 'Active' : 'Not Set Up'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PCI Compliance Report */}
        <TabsContent value="pci" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>PCI Compliance Report</CardTitle>
                <CardDescription>Electronic PCI form signatures by customer</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportToCSV(
                  pciReport.map(c => ({
                    'Business': c.businessName,
                    'Owner': c.ownerName,
                    'PCI Signed': c.hasPCI ? 'Yes' : 'No',
                    'Representative': c.representativeName,
                    'Company': c.companyName,
                    'Title': c.title,
                    'Consent Date': formatDate(c.consentDate),
                  })),
                  'pci-compliance-report'
                )}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Representative</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Consent Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pciReport.map((customer, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{customer.businessName}</TableCell>
                      <TableCell>{customer.representativeName}</TableCell>
                      <TableCell>{customer.title}</TableCell>
                      <TableCell>{formatDate(customer.consentDate)}</TableCell>
                      <TableCell>
                        <Badge variant={customer.hasPCI ? 'default' : 'destructive'}>
                          {customer.hasPCI ? 'Signed' : 'Not Signed'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Report */}
        <TabsContent value="payments" className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {storeCustomers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.businessName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Payments Due */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Payments Due</CardTitle>
                  <CardDescription>Outstanding balance by customer</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(
                    paymentsReport.due.map(c => ({
                      'Business': c.businessName,
                      'Deal Amount': formatCurrency(c.dealAmount || 0),
                      'Paid to Date': formatCurrency(c.paidToDateAmount || 0),
                      'Amount Due': formatCurrency(c.amountDue),
                    })),
                    'payments-due-report'
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentsReport.due.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No payments due</p>
                  ) : (
                    paymentsReport.due.map(customer => (
                      <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{customer.businessName}</p>
                          <p className="text-sm text-muted-foreground">
                            Paid: {formatCurrency(customer.paidToDateAmount || 0)} / {formatCurrency(customer.dealAmount || 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600 dark:text-orange-400">
                            {formatCurrency(customer.amountDue)}
                          </p>
                          <p className="text-xs text-muted-foreground">Due</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payments Not Paid */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Not Paid Yet</CardTitle>
                  <CardDescription>Customers with no payments received</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(
                    paymentsReport.notPaid.map(c => ({
                      'Business': c.businessName,
                      'Owner': c.ownerName,
                      'Deal Amount': formatCurrency(c.dealAmount || 0),
                      'Status': c.paymentStatus,
                    })),
                    'not-paid-report'
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentsReport.notPaid.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">All customers have made payments</p>
                  ) : (
                    paymentsReport.notPaid.map(customer => (
                      <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{customer.businessName}</p>
                          <p className="text-sm text-muted-foreground">{customer.ownerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(customer.dealAmount || 0)}</p>
                          <Badge variant="destructive" className="text-xs">Unpaid</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Custom Report Builder */}
        <TabsContent value="custom" className="space-y-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Field Selector */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Select Fields</CardTitle>
                <CardDescription>Choose fields to include in your report</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {Object.entries(fieldsByCategory).map(([category, fields]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                        <div className="space-y-2">
                          {fields.map(field => (
                            <div key={field.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={field.id}
                                checked={selectedFields.includes(field.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedFields([...selectedFields, field.id])
                                  } else {
                                    setSelectedFields(selectedFields.filter(f => f !== field.id))
                                  }
                                }}
                              />
                              <label
                                htmlFor={field.id}
                                className="text-sm cursor-pointer"
                              >
                                {field.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Report Preview */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Custom Report</CardTitle>
                  <CardDescription>
                    {selectedFields.length} fields selected | {customReportData.length} records
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => exportToCSV(customReportData, 'custom-report')}
                  disabled={selectedFields.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {selectedFields.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select fields from the left to build your custom report</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {selectedFields.map(fieldId => {
                            const field = availableFields.find(f => f.id === fieldId)
                            return (
                              <TableHead key={fieldId} className="whitespace-nowrap">
                                {field?.label || fieldId}
                              </TableHead>
                            )
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customReportData.map((row, idx) => (
                          <TableRow key={idx}>
                            {selectedFields.map(fieldId => (
                              <TableCell key={fieldId} className="whitespace-nowrap">
                                {String(row[fieldId] || '')}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
