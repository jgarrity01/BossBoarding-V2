import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }
    
    const supabase = createAdminClient()
    
    // Fetch customer by onboarding token
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('onboarding_token', token)
      .single()
    
    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    // Fetch related machines and employees from their respective tables (source of truth)
    const [machinesResult, employeesResult] = await Promise.all([
      supabase.from('machines').select('*').eq('customer_id', customer.id),
      supabase.from('employees').select('*').eq('customer_id', customer.id),
    ])
    
    // Transform to frontend format
    const machines = (machinesResult.data || []).map(m => ({
      id: m.id,
      machineNumber: parseInt(m.machine_id, 10) || 0,
      type: m.type as 'washer' | 'dryer',
      make: m.manufacturer || '',
      model: m.model || '',
      serialNumber: m.serial_number || '',
      coinsAccepted: 'quarter' as const,
      pricing: { cold: 5.00, warm: 5.50, hot: 6.00, standard: 0.25 },
      capacity: m.capacity,
      price: m.price,
      status: m.status,
      locationInStore: m.location_in_store,
      notes: m.notes,
    }))
    
    const employees = (employeesResult.data || []).map(e => ({
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      role: e.role,
      privilegeLevel: e.privilege_level,
      pin: e.pin,
      isActive: e.is_active,
    }))
    
    // Transform customer data
    const transformedCustomer = {
      id: customer.id,
      businessName: customer.business_name,
      ownerName: customer.owner_name,
      email: customer.email,
      phone: customer.phone || '',
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
      status: customer.status,
      currentStep: customer.current_step,
      totalSteps: customer.total_steps,
      onboardingToken: customer.onboarding_token,
      onboardingStarted: customer.onboarding_started,
      onboardingCompleted: customer.onboarding_completed,
      locationInfo: customer.location_info,
      shippingInfo: customer.shipping_info,
      pciCompliance: customer.pci_compliance,
      kioskInfo: customer.kiosk_info,
      merchantAccount: customer.merchant_account,
      billingInfo: customer.billing_info,
      storeMedia: customer.store_media,
      storeLogo: customer.store_logo,
      sections: customer.sections,
      dashboardCredentials: customer.dashboard_credentials,
      savedOnboardingData: customer.saved_onboarding_data,
      paymentLinks: customer.payment_links,
      assignedTo: customer.assigned_to,
      onboardingDates: customer.onboarding_dates,
      taskStatuses: customer.task_statuses,
      taskMetadata: customer.task_metadata,
      currentStageId: customer.current_stage_id,
      contractSigned: customer.contract_signed,
      salesRepAssignments: customer.sales_rep_assignments,
      installationDate: customer.installation_date,
      goLiveDate: customer.go_live_date,
      machines,
      employees,
      notes: [],
    }
    
    return NextResponse.json({ customer: transformedCustomer })
  } catch (error) {
    console.error('Error loading onboarding data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
