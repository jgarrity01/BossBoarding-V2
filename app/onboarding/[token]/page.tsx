'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useOnboardingStore, useAdminStore } from '@/lib/store'
import { getCustomerByToken as getSupabaseCustomerByToken } from '@/lib/supabase/customers'
import { StepIndicator } from '@/components/onboarding/step-indicator'
import { GeneralInfoStep } from '@/components/onboarding/steps/general-info'
import { LocationInfoStep } from '@/components/onboarding/steps/location-info'
import { StorePhotosStep } from '@/components/onboarding/steps/store-photos'
import { MachineInventoryStep } from '@/components/onboarding/steps/machine-inventory'
import { EmployeeSetupStep } from '@/components/onboarding/steps/employee-setup'
import { ShippingDetailsStep } from '@/components/onboarding/steps/shipping-details'
import { KioskConfigStep } from '@/components/onboarding/steps/kiosk-config'
import { MerchantAccountStep } from '@/components/onboarding/steps/merchant-account'
import { PCIComplianceStep } from '@/components/onboarding/steps/pci-compliance'
import { ReviewSubmitStep } from '@/components/onboarding/steps/review-submit'
import { PaymentStep } from '@/components/onboarding/steps/payment-step'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Building2, Save, CheckCircle2 } from 'lucide-react'
import type { Customer } from '@/lib/types'

export default function TokenOnboardingPage() {
  const params = useParams()
  const token = params.token as string
  const router = useRouter()
  const { getCustomerByToken, updateCustomer } = useAdminStore()
  const { currentStep, highestStepReached, setStep, initializeFromCustomer, customerId, onboardingToken } = useOnboardingStore()
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { formData } = useOnboardingStore()
  
  // Save progress function - saves to Supabase database
  const saveProgress = useCallback(async (showSuccess = true) => {
    if (!customerId || !customer) return
    
    setIsSaving(true)
    try {
      // Build the update object with all form data to save to Supabase
      const updateData: Partial<Customer> = {
        // Basic info
        businessName: formData.businessName || customer.businessName,
        ownerName: formData.ownerName || customer.ownerName,
        email: formData.email || customer.email,
        phone: formData.phone || customer.phone,
        
        // Location info
        locationInfo: {
          commonName: formData.locationName || customer.locationInfo?.commonName || '',
          phoneNumber: formData.locationPhone || customer.locationInfo?.phoneNumber || '',
          address: formData.locationAddress || customer.locationInfo?.address || '',
          city: formData.locationCity || customer.locationInfo?.city || '',
          state: formData.locationState || customer.locationInfo?.state || '',
          zipCode: formData.locationZip || customer.locationInfo?.zipCode || '',
        },
        
        // Shipping info
        shippingInfo: {
          sameAsLocation: formData.shippingSameAsLocation ?? customer.shippingInfo?.sameAsLocation ?? true,
          address: formData.shippingAddress || customer.shippingInfo?.address || '',
          city: formData.shippingCity || customer.shippingInfo?.city || '',
          state: formData.shippingState || customer.shippingInfo?.state || '',
          zipCode: formData.shippingZip || customer.shippingInfo?.zipCode || '',
          notes: formData.shippingNotes || customer.shippingInfo?.notes || '',
        },
        
        // Kiosk config
        kioskConfiguration: {
          headerEnabled: formData.kioskHeaderEnabled ?? customer.kioskConfiguration?.headerEnabled ?? true,
          headerText: formData.kioskHeaderText || customer.kioskConfiguration?.headerText || '',
          logoUrl: formData.kioskLogoUrl || customer.kioskConfiguration?.logoUrl || '',
          loyaltyEnabled: formData.kioskLoyaltyEnabled ?? customer.kioskConfiguration?.loyaltyEnabled ?? false,
          loyaltyProgram: formData.kioskLoyaltyProgram || customer.kioskConfiguration?.loyaltyProgram || '',
          promotionsEnabled: formData.kioskPromotionsEnabled ?? customer.kioskConfiguration?.promotionsEnabled ?? false,
          receiptFooter: formData.kioskReceiptFooter || customer.kioskConfiguration?.receiptFooter || '',
        },
        
        // PCI compliance (use correct field names from pci-compliance.tsx)
        pciCompliance: formData.pciConsent ? {
          consentGiven: true,
          hasConsented: true,
          consentDate: new Date().toISOString(),
          representativeName: formData.pciRepresentativeName || '',
          representativeTitle: formData.pciTitle || '',
          companyName: formData.pciCompanyName || formData.businessName || customer.businessName,
        } : customer.pciCompliance,
        
        // Machines and employees (if present in form data)
        machines: formData.machines || customer.machines || [],
        employees: formData.employees || customer.employees || [],
        
        // Media (store photos and videos)
        storeMedia: formData.storeMedia || customer.storeMedia || [],
        
        // Store logo
        storeLogo: formData.storeLogo || customer.storeLogo,
        
        // Saved onboarding progress data
        savedOnboardingData: {
          currentStep,
          formData: { 
            ...formData as unknown as Record<string, unknown>,
            highestStepReached,
          },
          savedAt: new Date().toISOString(),
        },
        
        // Credentials if password is set
        ...(formData.password && formData.password === formData.confirmPassword ? {
          dashboardCredentials: {
            username: formData.email,
            password: formData.password,
            passwordSet: true,
          }
        } : {}),
      }
      
      // Save to Supabase database via API (uses admin client server-side)
      const response = await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, updates: updateData }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save')
      }
      
      // Also update local store for immediate UI updates
      updateCustomer(customerId, updateData)
      
      if (showSuccess) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error saving onboarding progress:', error)
    } finally {
      setIsSaving(false)
    }
  }, [customerId, customer, currentStep, highestStepReached, formData, updateCustomer])

  useEffect(() => {
    async function loadCustomer() {
      // ALWAYS fetch from Supabase first - database is the source of truth
      // This ensures admin changes (deletes, updates) are always respected
      let foundCustomer = await getSupabaseCustomerByToken(token)
      
      // Only fall back to local store if Supabase fetch fails (e.g., network error)
      if (!foundCustomer) {
        foundCustomer = getCustomerByToken(token)
      }
      
      if (!foundCustomer) {
        setError('Invalid or expired onboarding link. Please contact your administrator.')
        setIsLoading(false)
        return
      }
      
      // Update local store with fresh data from database
      if (foundCustomer.id) {
        updateCustomer(foundCustomer.id, foundCustomer)
      }

      // Check if already completed
      if (foundCustomer.onboardingCompleted) {
        setError('This onboarding has already been completed. Please contact your administrator if you need to make changes.')
        setIsLoading(false)
        return
      }

      setCustomer(foundCustomer)
      
      // Initialize form data from customer record if this is a new session or different customer
      if (onboardingToken !== token || customerId !== foundCustomer.id) {
        // Check if there's saved progress to restore
        const savedData = foundCustomer.savedOnboardingData
        const savedFormData = savedData?.formData as Record<string, unknown> | undefined
        
        // Calculate highest step reached (either from saved data or current step)
        const savedHighestStep = (savedFormData?.highestStepReached as number) ?? savedData?.currentStep ?? 0
        
        // IMPORTANT: Database records (foundCustomer.machines/employees) are the ONLY source of truth
        // NEVER use savedFormData for machines/employees - always use database records
        // This ensures admin deletions/updates are always respected (even when deleting ALL machines)
        // Also ensure all machines have required fields with defaults to prevent client-side errors
        const rawMachinesSource = foundCustomer.machines || []
        const machinesSource = rawMachinesSource.map(m => ({
          ...m,
          type: m.type || 'washer' as const,
          coinsAccepted: m.coinsAccepted || 'quarter' as const,
          pricing: m.pricing || { cold: 5.00, warm: 5.50, hot: 6.00, standard: 0.25 },
        }))
        const employeesSource = foundCustomer.employees || []
        
        initializeFromCustomer(foundCustomer.id, token, {
          businessName: (savedFormData?.businessName as string) || foundCustomer.businessName,
          ownerName: (savedFormData?.ownerName as string) || foundCustomer.ownerName,
          email: (savedFormData?.email as string) || foundCustomer.email,
          phone: (savedFormData?.phone as string) || foundCustomer.phone,
          password: (savedFormData?.password as string) || '',
          confirmPassword: (savedFormData?.confirmPassword as string) || '',
          // Pre-fill location info if available (from saved data or customer record)
          locationName: (savedFormData?.locationName as string) || foundCustomer.locationInfo?.commonName || '',
          locationPhone: (savedFormData?.locationPhone as string) || foundCustomer.locationInfo?.phoneNumber || '',
          locationAddress: (savedFormData?.locationAddress as string) || foundCustomer.locationInfo?.address || '',
          locationCity: (savedFormData?.locationCity as string) || foundCustomer.locationInfo?.city || '',
          locationState: (savedFormData?.locationState as string) || foundCustomer.locationInfo?.state || '',
          locationZip: (savedFormData?.locationZip as string) || foundCustomer.locationInfo?.zipCode || '',
          // Restore other saved form data (exclude machines/employees to prevent duplication)
          ...Object.fromEntries(
            Object.entries(savedFormData || {}).filter(([key]) => !['machines', 'employees'].includes(key))
          ),
          // Use single source for machines and employees (NOT merged)
          machines: machinesSource,
          employees: employeesSource,
        }, savedData?.currentStep, savedHighestStep)
        
        // Mark as started if not already
        if (!foundCustomer.onboardingStarted) {
          updateCustomer(foundCustomer.id, { 
            onboardingStarted: true,
            status: 'in_progress',
          })
        }
      }
      
      setIsLoading(false)
    }
    
    loadCustomer()
  }, [token, getCustomerByToken, initializeFromCustomer, updateCustomer, customerId, onboardingToken])

  // Re-fetch customer when it might have changed
  useEffect(() => {
    if (customerId) {
      const updatedCustomer = getCustomerByToken(token)
      if (updatedCustomer) {
        setCustomer(updatedCustomer)
      }
    }
  }, [customerId, token, getCustomerByToken])
  
  // Auto-save to Supabase whenever step changes (user clicks Continue)
  const previousStepRef = useRef<number | null>(null)
  useEffect(() => {
    // Only auto-save if we have a customer loaded and step actually changed (user clicked Continue)
    if (customerId && customer && !isLoading && previousStepRef.current !== null && currentStep !== previousStepRef.current) {
      // Save progress silently (without showing success toast) on step change
      saveProgress(false)
    }
    previousStepRef.current = currentStep
  }, [currentStep, customerId, customer, isLoading, saveProgress])

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <GeneralInfoStep />
      case 1:
        return <LocationInfoStep />
      case 2:
        return <StorePhotosStep />
      case 3:
        return <MachineInventoryStep />
      case 4:
        return <EmployeeSetupStep />
      case 5:
        return <ShippingDetailsStep />
      case 6:
        return <KioskConfigStep />
      case 7:
        return <MerchantAccountStep />
      case 8:
        return <PCIComplianceStep />
      case 9:
        return <PaymentStep customer={customer} />
      case 10:
        return <ReviewSubmitStep />
      default:
        return <GeneralInfoStep />
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your onboarding...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Onboarding Link Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => router.push('/')}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Welcome, {customer?.businessName}!
              </h1>
              <p className="text-muted-foreground">
                Complete your Laundry Boss system setup below.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator currentStep={currentStep} highestStepReached={highestStepReached} onStepClick={setStep} />
      </div>

      {/* Current Step Content */}
      <div className="mb-8">
        {renderStep()}
      </div>

      {/* Save Progress Section */}
      <div className="flex items-center justify-start gap-4 mb-8">
        <Button 
          variant="outline" 
          onClick={saveProgress}
          disabled={isSaving}
          className="gap-2 bg-transparent"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Progress'}
            </>
          )}
        </Button>
        {customer?.savedOnboardingData?.savedAt && (
          <span className="text-xs text-muted-foreground">
            Last saved: {new Date(customer.savedOnboardingData.savedAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* Help Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Need assistance? Contact our Onboarding Manager at{' '}
          <a href="mailto:onboarding@thelaundryboss.com" className="text-lb-blue hover:text-lb-cyan transition-colors">
            onboarding@thelaundryboss.com
          </a>
        </p>
      </div>
    </div>
  )
}
