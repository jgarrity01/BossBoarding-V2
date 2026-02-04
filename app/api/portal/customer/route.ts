import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Transform database row to Customer type
function transformCustomer(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    businessName: row.business_name as string,
    ownerName: row.owner_name as string,
    email: row.email as string,
    phone: row.phone as string,
    address: row.address as string | undefined,
    city: row.city as string | undefined,
    state: row.state as string | undefined,
    zipCode: row.zip_code as string | undefined,
    status: row.status as string,
    currentStep: row.current_step as number,
    totalSteps: row.total_steps as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    locationName: row.location_name as string | undefined,
    onboardingCompleted: row.onboarding_completed as boolean | undefined,
    onboardingStarted: row.onboarding_started as boolean | undefined,
    onboardingToken: row.onboarding_token as string | undefined,
    taskStatuses: row.task_statuses as Record<string, string> | undefined,
    taskMetadata: row.task_metadata as Record<string, unknown> | undefined,
    currentStageId: row.current_stage_id as string | undefined,
    contractSigned: row.contract_signed as boolean | undefined,
    installationDate: row.installation_date as string | undefined,
    goLiveDate: row.go_live_date as string | undefined,
    // Financial fields
    nonRecurringRevenue: row.non_recurring_revenue as number | undefined,
    monthlyRecurringFee: row.monthly_recurring_fee as number | undefined,
    otherFees: row.other_fees as number | undefined,
    commissionRate: row.commission_rate as number | undefined,
    paymentTermMonths: row.payment_term_months as number | undefined,
    paymentStatus: row.payment_status as string | undefined,
    paidToDateAmount: row.paid_to_date_amount as number | undefined,
    commissionPaidAmount: row.commission_paid_amount as number | undefined,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('id')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }
    
    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient()
    
    const { data: customer, error } = await adminSupabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle()
    
    if (error) {
      console.error('[v0] Error fetching customer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    // Fetch related data
    const [machinesResult, employeesResult, notesResult] = await Promise.all([
      adminSupabase.from('machines').select('*').eq('customer_id', customerId),
      adminSupabase.from('employees').select('*').eq('customer_id', customerId),
      adminSupabase.from('customer_notes').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
    ])
    
    const result = transformCustomer(customer)
    
    // Add machines
    result.machines = (machinesResult.data || []).map(m => ({
      id: m.id,
      machineNumber: parseInt(m.machine_id, 10) || 0,
      type: m.type,
      make: m.manufacturer || '',
      model: m.model || '',
      serialNumber: m.serial_number || '',
      capacity: m.capacity,
      price: m.price,
      status: m.status,
      locationInStore: m.location_in_store,
      notes: m.notes,
    }))
    
    // Add employees
    result.employees = (employeesResult.data || []).map(e => ({
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      role: e.role,
      privilegeLevel: e.privilege_level || 'employee',
      pin: e.pin,
      isActive: e.is_active,
    }))
    
    // Add additional customer fields
    result.shippingInfo = customer.shipping_info
    result.pciCompliance = customer.pci_compliance
    result.storeLogo = customer.store_logo
    result.storeMedia = customer.store_media
    result.paymentLinks = customer.payment_links
    result.paymentProcessors = customer.payment_processors
    result.dashboardCredentials = customer.dashboard_credentials
    
    // Add notes
    result.notes = (notesResult.data || []).map(n => ({
      id: n.id,
      content: n.content,
      createdBy: n.created_by_name || 'Unknown',
      createdAt: n.created_at,
    }))
    
    console.log('[v0] Customer fetched successfully:', { id: result.id, installationDate: result.installationDate })
    
    return NextResponse.json({ customer: result })
  } catch (error) {
    console.error('[v0] Portal customer API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
