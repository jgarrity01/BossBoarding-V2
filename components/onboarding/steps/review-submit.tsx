'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore, useAdminStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle2, 
  Building2, 
  MapPin, 
  WashingMachine, 
  Users, 
  Truck, 
  Monitor, 
  Shield,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Customer } from '@/lib/types'
import { getDefaultTaskStatuses, ONBOARDING_STAGES } from '@/lib/onboarding-config'

export function ReviewSubmitStep() {
  const router = useRouter()
  const { formData, prevStep, resetForm, isSubmitting, setSubmitting, customerId } = useOnboardingStore()
  const { addCustomer, updateCustomer } = useAdminStore()
  const [submitted, setSubmitted] = useState(false)

  // Reset isSubmitting on mount in case it was stuck from a previous session
  useEffect(() => {
    setSubmitting(false)
  }, [setSubmitting])

  const handleSubmit = async () => {
    setSubmitting(true)
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Calculate installation date as 40 days from onboarding completion
    const installationDate = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString()
    
    const customerData = {
      businessName: formData.businessName,
      ownerName: formData.ownerName,
      email: formData.email,
      phone: formData.phone,
      status: 'needs_review' as const,
      currentStep: 11,
      totalSteps: 11,
      onboardingCompleted: true,
      installationDate, // Auto-set to 40 days after onboarding completion (can be overwritten in admin)
      storeMedia: formData.storeMedia || [],
      sections: [
        { id: 'general', name: 'General Info', status: 'complete' as const, completedAt: new Date().toISOString() },
        { id: 'location', name: 'Location', status: 'complete' as const, completedAt: new Date().toISOString() },
        { id: 'photos', name: 'Store Photos', status: 'complete' as const, completedAt: new Date().toISOString() },
        { id: 'machines', name: 'Machines', status: 'complete' as const, completedAt: new Date().toISOString() },
        { id: 'employees', name: 'Employees', status: 'complete' as const, completedAt: new Date().toISOString() },
        { id: 'shipping', name: 'Shipping', status: 'complete' as const, completedAt: new Date().toISOString() },
        { id: 'kiosk', name: 'Kiosk', status: 'complete' as const, completedAt: new Date().toISOString() },
        { id: 'merchant', name: 'Merchant', status: 'complete' as const, completedAt: new Date().toISOString() },
        { id: 'pci', name: 'PCI', status: 'complete' as const, completedAt: new Date().toISOString() },
        { id: 'payment', name: 'Payment', status: 'complete' as const, completedAt: new Date().toISOString() },
        { id: 'review', name: 'Review', status: 'needs_review' as const },
      ],
      locationInfo: {
        commonName: formData.locationName,
        phoneNumber: formData.locationPhone,
        address: formData.locationAddress,
        city: formData.locationCity,
        state: formData.locationState,
        zipCode: formData.locationZip,
        isStaffed: formData.isStaffed,
        hoursOfOperation: formData.hoursOfOperation,
        holidaysClosed: formData.holidaysClosed.split(',').map(h => h.trim()).filter(Boolean),
        customerServiceContact: formData.customerServiceContact,
        alertsContact: formData.alertsContact,
      },
      shippingInfo: {
        sameAsLocation: formData.shippingSameAsLocation,
        address: formData.shippingSameAsLocation ? formData.locationAddress : formData.shippingAddress,
        city: formData.shippingSameAsLocation ? formData.locationCity : formData.shippingCity,
        state: formData.shippingSameAsLocation ? formData.locationState : formData.shippingState,
        zipCode: formData.shippingSameAsLocation ? formData.locationZip : formData.shippingZip,
        notes: formData.shippingNotes,
        shipmentMethod: formData.shipmentMethod,
      },
      pciCompliance: {
        representativeName: formData.pciRepresentativeName,
        companyName: formData.pciCompanyName,
        title: formData.pciTitle,
        consentDate: new Date().toISOString(),
        hasConsented: formData.pciConsent,
      },
      kioskInfo: {
        hasKiosk: formData.kiosks && formData.kiosks.length > 0,
        kiosks: formData.kiosks || [],
      },
      employees: formData.employees,
      machines: formData.machines,
      contractSigned: true,
      contractSignedDate: new Date().toISOString(),
    }
    
    // If we have a customerId, update the existing customer; otherwise create new
    let actualCustomerId = customerId
    if (customerId) {
      updateCustomer(customerId, customerData)
    } else {
      // Create new customer (legacy flow - should not happen with admin-only creation)
      actualCustomerId = crypto.randomUUID()
      const newCustomer: Customer = {
        id: actualCustomerId,
        ...customerData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        onboardingToken: '',
        onboardingStarted: true,
        onboardingCompleted: true,
        notes: [],
        taskStatuses: getDefaultTaskStatuses(),
        taskMetadata: {},
        currentStageId: 'contract_setup',
        salesRepAssignments: [],
        nonRecurringRevenue: 0,
        monthlyRecurringFee: 0,
        otherFees: 0,
        commissionRate: 10,
        paymentTermMonths: 48,
        paymentStatus: 'unpaid',
        paidToDateAmount: 0,
        commissionPaidAmount: 0,
        paymentProcessors: [],
        paymentLinks: [],
        onboardingDates: {
          startDate: new Date().toISOString(),
          estimatedCompletionDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          useAdminOverride: false,
        },
      }
      addCustomer(newCustomer)
    }
    
    // Create or update customer portal user if password was provided
    if (formData.password && actualCustomerId) {
      try {
        // First try to register (create new user)
        const registerResponse = await fetch('/api/portal/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            customerId: actualCustomerId,
            name: formData.ownerName,
            email: formData.email,
            password: formData.password,
            role: 'owner',
          }),
        })
        
        if (!registerResponse.ok) {
          const result = await registerResponse.json().catch(() => ({ error: 'Unknown error' }))
          
          // If user already exists, update their password instead
          if (result.error?.includes('already exists')) {
            const updateResponse = await fetch('/api/portal/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'updatePassword',
                customerId: actualCustomerId,
                email: formData.email,
                newPassword: formData.password,
              }),
            })
            
            if (!updateResponse.ok) {
              const updateResult = await updateResponse.json().catch(() => ({ error: 'Unknown error' }))
              console.error('[v0] Failed to update portal user password:', updateResult)
            }
          } else {
            console.error('[v0] Failed to create portal user:', result)
          }
        }
      } catch (error) {
        console.error('[v0] Error creating/updating portal user:', error)
        // Don't block submission if portal user creation fails
      }
    }
    
    // Send welcome emails to customer and admin notification
    try {
      const emailPayload = {
        type: 'onboarding_submitted',
        customer: {
          customerName: formData.ownerName,
          businessName: formData.businessName,
          email: formData.email,
          phone: formData.phone,
          locationName: formData.locationName,
          machineCount: formData.machines.length,
          employeeCount: formData.employees.length,
        },
      }
      
      // Use relative URL for client-side fetch
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      })
      
      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[v0] Email API error:', result)
      }
    } catch (error) {
      console.error('[v0] Failed to send welcome emails:', error)
      // Don't block submission if email fails
    }
    
    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card className="border-border">
        <CardContent className="py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Onboarding Submitted Successfully!
            </h2>
            <p className="text-muted-foreground mb-8">
              Thank you for completing your Laundry Boss onboarding. Our team will review your 
              submission and contact you within 24-48 hours to discuss next steps.
            </p>
            <div className="space-y-4">
              <Button size="lg" onClick={() => {
                resetForm()
                router.push('/')
              }}>
                Return to Home
              </Button>
              <div className="text-sm text-muted-foreground">
                <p>Questions? Contact our Onboarding Manager:</p>
                <a href="mailto:onboarding@thelaundryboss.com" className="font-medium text-lb-blue hover:text-lb-cyan transition-colors">
                  onboarding@thelaundryboss.com
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Review & Submit</CardTitle>
            <CardDescription>Review your information before submitting</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Please Review Carefully</AlertTitle>
            <AlertDescription>
              Verify all information is correct before submitting. Inaccurate information can 
              result in installation issues, delays, and additional fees.
            </AlertDescription>
          </Alert>

          {/* General Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">General Information</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-muted-foreground">Business Name:</span>{' '}
                <span className="font-medium">{formData.businessName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Owner:</span>{' '}
                <span className="font-medium">{formData.ownerName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{' '}
                <span className="font-medium">{formData.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>{' '}
                <span className="font-medium">{formData.phone}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Location Information</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-muted-foreground">Location Name:</span>{' '}
                <span className="font-medium">{formData.locationName || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>{' '}
                <span className="font-medium">{formData.locationPhone || 'Not provided'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Address:</span>{' '}
                <span className="font-medium">
                  {formData.locationAddress}, {formData.locationCity}, {formData.locationState} {formData.locationZip}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Staffed:</span>{' '}
                <Badge variant={formData.isStaffed ? 'default' : 'secondary'}>
                  {formData.isStaffed ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Machine Inventory */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <WashingMachine className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Machine Inventory</h3>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Washers:</span>{' '}
                <span className="font-medium">{formData.machines.filter(m => m.type === 'washer').length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Dryers:</span>{' '}
                <span className="font-medium">{formData.machines.filter(m => m.type === 'dryer').length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total:</span>{' '}
                <span className="font-medium">{formData.machines.length}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Employees */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Employees</h3>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Total Employees:</span>{' '}
              <span className="font-medium">{formData.employees.length}</span>
            </div>
          </div>

          <Separator />

          {/* Shipping */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Shipping Details</h3>
            </div>
            <div className="text-sm space-y-1">
              {formData.shippingSameAsLocation ? (
                <div>
                  <span className="text-muted-foreground">Address:</span>{' '}
                  <span className="font-medium">
                    Same as laundromat address ({formData.locationAddress}, {formData.locationCity}, {formData.locationState} {formData.locationZip})
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-muted-foreground">Address:</span>{' '}
                  <span className="font-medium">
                    {formData.shippingAddress}, {formData.shippingCity}, {formData.shippingState} {formData.shippingZip}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Kiosk */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Kiosk Configuration</h3>
            </div>
            <div className="text-sm">
              {formData.kiosks && formData.kiosks.length > 0 ? (
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Total Kiosks:</span>{' '}
                    <span className="font-medium">{formData.kiosks.reduce((sum, k) => sum + k.quantity, 0)}</span>
                  </div>
                  {formData.kiosks.map((kiosk, index) => (
                    <div key={kiosk.id} className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize">
                        {kiosk.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-muted-foreground">x{kiosk.quantity}</span>
                      {kiosk.adaCompliant && (
                        <Badge variant="secondary" className="text-xs">ADA</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">No kiosks configured</span>
              )}
            </div>
          </div>

          <Separator />

          {/* PCI Compliance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">PCI Compliance</h3>
            </div>
            <div className="text-sm">
              <div>
                <span className="text-muted-foreground">Consent:</span>{' '}
                <Badge variant={formData.pciConsent ? 'default' : 'destructive'}>
                  {formData.pciConsent ? 'Granted' : 'Not Granted'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Representative:</span>{' '}
                <span className="font-medium">{formData.pciRepresentativeName}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Onboarding'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
