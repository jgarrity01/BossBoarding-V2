import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Customer } from '@/lib/types'

// Helper to convert camelCase to snake_case
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    result[snakeKey] = value
  }
  return result
}

// Transform database row to Customer type
function transformCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    businessName: row.business_name as string,
    ownerName: row.owner_name as string,
    email: row.email as string,
    phone: row.phone as string || '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    status: row.status as Customer['status'],
    currentStep: row.current_step as number,
    totalSteps: row.total_steps as number,
    onboardingToken: row.onboarding_token as string | undefined,
    onboardingStarted: row.onboarding_started as boolean,
    onboardingCompleted: row.onboarding_completed as boolean,
    locationInfo: row.location_info as Customer['locationInfo'],
    shippingInfo: row.shipping_info as Customer['shippingInfo'],
    pciCompliance: row.pci_compliance as Customer['pciCompliance'],
    kioskInfo: row.kiosk_info as Customer['kioskInfo'],
    merchantAccount: row.merchant_account as Customer['merchantAccount'],
    billingInfo: row.billing_info as Customer['billingInfo'],
    storeMedia: row.store_media as Customer['storeMedia'],
    storeLogo: row.store_logo as Customer['storeLogo'],
    sections: row.sections as Customer['sections'],
    dashboardCredentials: row.dashboard_credentials as Customer['dashboardCredentials'],
    savedOnboardingData: row.saved_onboarding_data as Customer['savedOnboardingData'],
    paymentLinks: row.payment_links as Customer['paymentLinks'],
    assignedTo: row.assigned_to as string | undefined,
    onboardingDates: row.onboarding_dates as Customer['onboardingDates'],
    taskStatuses: row.task_statuses as Customer['taskStatuses'],
    taskMetadata: row.task_metadata as Customer['taskMetadata'],
    currentStageId: row.current_stage_id as string | undefined,
    contractSigned: row.contract_signed as boolean | undefined,
    salesRepAssignments: row.sales_rep_assignments as Customer['salesRepAssignments'],
    installationDate: row.installation_date as string | undefined,
    goLiveDate: row.go_live_date as string | undefined,
    nonRecurringRevenue: row.non_recurring_revenue as number | undefined,
    monthlyRecurringFee: row.monthly_recurring_fee as number | undefined,
    otherFees: row.other_fees as number | undefined,
    cogs: row.cogs as number | undefined,
    commissionRate: row.commission_rate as number | undefined,
    paymentTermMonths: row.payment_term_months as number | undefined,
    paymentStatus: row.payment_status as Customer['paymentStatus'],
    paidToDateAmount: row.paid_to_date_amount as number | undefined,
    commissionPaidAmount: row.commission_paid_amount as number | undefined,
    paymentProcessors: row.payment_processors as Customer['paymentProcessors'],
    machines: [],
    employees: [],
    notes: [],
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    
    // Fetch customer
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (customerError || !customerData) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    // Fetch related data
    const [machinesResult, employeesResult, notesResult] = await Promise.all([
      supabase.from('machines').select('*').eq('customer_id', id),
      supabase.from('employees').select('*').eq('customer_id', id),
      supabase.from('customer_notes').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
    ])
    
    const customer = transformCustomer(customerData)
    
    customer.machines = (machinesResult.data || []).map(m => ({
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
    
    customer.employees = (employeesResult.data || []).map(e => ({
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      role: e.role,
      privilegeLevel: e.privilege_level,
      pin: e.pin,
      isActive: e.is_active,
    }))
    
    customer.notes = (notesResult.data || []).map(n => ({
      id: n.id,
      content: n.content,
      createdBy: n.created_by_name || 'Unknown',
      createdAt: n.created_at,
    }))
    
    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates: Partial<Customer> = await request.json()
    
    const supabase = createAdminClient()
    
    // Handle employees - sync to employees table
    if (updates.employees && updates.employees.length > 0) {
      // Delete existing employees for this customer and re-insert
      await supabase.from('employees').delete().eq('customer_id', id)
      
      for (const emp of updates.employees) {
        await supabase.from('employees').insert({
          customer_id: id,
          name: emp.name,
          email: emp.email || null,
          phone: emp.phone || null,
          role: emp.role || 'staff',
        })
      }
    }
    
    // Handle machines - sync to machines table
    // Washers: 1-99, Dryers: 101-199
    if (updates.machines !== undefined) {
      // Delete existing machines for this customer first (handles both updates and full deletions)
      await supabase.from('machines').delete().eq('customer_id', id)
      
      // Only insert if there are machines to add
      if (updates.machines.length === 0) {
        // All machines deleted - nothing more to do
      } else {
      
      // Separate machines by type and assign proper numbering
      const washers = updates.machines.filter((m: { type?: string }) => 
        (m.type || '').toLowerCase() === 'washer'
      )
      const dryers = updates.machines.filter((m: { type?: string }) => 
        (m.type || '').toLowerCase() === 'dryer'
      )
      const others = updates.machines.filter((m: { type?: string }) => {
        const type = (m.type || '').toLowerCase()
        return type !== 'washer' && type !== 'dryer'
      })
      
      let washerIndex = 1
      let dryerIndex = 101
      let otherIndex = 201
      
      for (const machine of washers) {
        const machineNum = machine.machineNumber || machine.machineId || washerIndex++
        await supabase.from('machines').insert({
          customer_id: id,
          machine_id: String(machineNum),
          type: 'washer',
          manufacturer: machine.make || machine.manufacturer || null,
          model: machine.model || null,
          serial_number: machine.serialNumber || null,
          location_in_store: machine.locationInStore || machine.location || null,
          price: machine.price || null,
          status: machine.status || 'active',
          capacity: machine.capacity || null,
        })
      }
      
      for (const machine of dryers) {
        const machineNum = machine.machineNumber || machine.machineId || dryerIndex++
        await supabase.from('machines').insert({
          customer_id: id,
          machine_id: String(machineNum),
          type: 'dryer',
          manufacturer: machine.make || machine.manufacturer || null,
          model: machine.model || null,
          serial_number: machine.serialNumber || null,
          location_in_store: machine.locationInStore || machine.location || null,
          price: machine.price || null,
          status: machine.status || 'active',
          capacity: machine.capacity || null,
        })
      }
      
      for (const machine of others) {
        const machineNum = machine.machineNumber || machine.machineId || otherIndex++
        await supabase.from('machines').insert({
          customer_id: id,
          machine_id: String(machineNum),
          type: machine.type || 'other',
          manufacturer: machine.make || machine.manufacturer || null,
          model: machine.model || null,
          serial_number: machine.serialNumber || null,
          location_in_store: machine.locationInStore || machine.location || null,
          price: machine.price || null,
          status: machine.status || 'active',
          capacity: machine.capacity || null,
        })
      }
      } // Close the else block for machines.length > 0
    }
    
    // Remove employees and machines from updates (handled separately)
    const { employees, machines, ...customerUpdates } = updates
    
    // Convert to database format
    const dbUpdates: Record<string, unknown> = {}
    
    // Map Customer fields to database columns
    if (customerUpdates.businessName !== undefined) dbUpdates.business_name = customerUpdates.businessName
    if (customerUpdates.ownerName !== undefined) dbUpdates.owner_name = customerUpdates.ownerName
    if (customerUpdates.email !== undefined) dbUpdates.email = customerUpdates.email
    if (customerUpdates.phone !== undefined) dbUpdates.phone = customerUpdates.phone
    if (customerUpdates.status !== undefined) dbUpdates.status = customerUpdates.status
    if (customerUpdates.contractSigned !== undefined) dbUpdates.contract_signed = customerUpdates.contractSigned
    if (customerUpdates.installationDate !== undefined) dbUpdates.installation_date = customerUpdates.installationDate
    if (customerUpdates.goLiveDate !== undefined) dbUpdates.go_live_date = customerUpdates.goLiveDate
    if (customerUpdates.notes !== undefined) dbUpdates.notes = customerUpdates.notes
    if (customerUpdates.onboardingToken !== undefined) dbUpdates.onboarding_token = customerUpdates.onboardingToken
    if (customerUpdates.onboardingStarted !== undefined) dbUpdates.onboarding_started = customerUpdates.onboardingStarted
    if (customerUpdates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = customerUpdates.onboardingCompleted
    if (customerUpdates.currentStep !== undefined) dbUpdates.current_step = customerUpdates.currentStep
    if (customerUpdates.totalSteps !== undefined) dbUpdates.total_steps = customerUpdates.totalSteps
    if (customerUpdates.taskStatuses !== undefined) dbUpdates.task_statuses = customerUpdates.taskStatuses
    if (customerUpdates.taskMetadata !== undefined) dbUpdates.task_metadata = customerUpdates.taskMetadata
    if (customerUpdates.currentStageId !== undefined) dbUpdates.current_stage_id = customerUpdates.currentStageId
    if (customerUpdates.sections !== undefined) dbUpdates.sections = customerUpdates.sections
    
    // Financial fields
    if (customerUpdates.nonRecurringRevenue !== undefined) dbUpdates.non_recurring_revenue = customerUpdates.nonRecurringRevenue
    if (customerUpdates.monthlyRecurringFee !== undefined) dbUpdates.monthly_recurring_fee = customerUpdates.monthlyRecurringFee
    if (customerUpdates.otherFees !== undefined) dbUpdates.other_fees = customerUpdates.otherFees
    if (customerUpdates.cogs !== undefined) dbUpdates.cogs = customerUpdates.cogs
    if (customerUpdates.commissionRate !== undefined) dbUpdates.commission_rate = customerUpdates.commissionRate
    if (customerUpdates.paymentTermMonths !== undefined) dbUpdates.payment_term_months = customerUpdates.paymentTermMonths
    if (customerUpdates.salesRepAssignments !== undefined) dbUpdates.sales_rep_assignments = customerUpdates.salesRepAssignments
    
    // Payment fields
    if (customerUpdates.paymentStatus !== undefined) dbUpdates.payment_status = customerUpdates.paymentStatus
    if (customerUpdates.paidToDateAmount !== undefined) dbUpdates.paid_to_date_amount = customerUpdates.paidToDateAmount
    if (customerUpdates.commissionPaidAmount !== undefined) dbUpdates.commission_paid_amount = customerUpdates.commissionPaidAmount
    if (customerUpdates.paymentProcessors !== undefined) dbUpdates.payment_processors = customerUpdates.paymentProcessors
    if (customerUpdates.paymentLinks !== undefined) dbUpdates.payment_links = customerUpdates.paymentLinks
    
    // Onboarding data fields
    if (customerUpdates.onboardingDates !== undefined) dbUpdates.onboarding_dates = customerUpdates.onboardingDates
    if (customerUpdates.businessInfo !== undefined) dbUpdates.business_info = customerUpdates.businessInfo
    if (customerUpdates.operatingHours !== undefined) dbUpdates.operating_hours = customerUpdates.operatingHours
    if (customerUpdates.customerAmenities !== undefined) dbUpdates.customer_amenities = customerUpdates.customerAmenities
    if (customerUpdates.machineConfig !== undefined) dbUpdates.machine_config = customerUpdates.machineConfig
    if (customerUpdates.storePhotos !== undefined) dbUpdates.store_photos = customerUpdates.storePhotos
    if (customerUpdates.networkInfo !== undefined) dbUpdates.network_info = customerUpdates.networkInfo
    if (customerUpdates.revenueConfig !== undefined) dbUpdates.revenue_config = customerUpdates.revenueConfig
    if (customerUpdates.additionalServices !== undefined) dbUpdates.additional_services = customerUpdates.additionalServices
    
    // Media fields
    if (customerUpdates.storeMedia !== undefined) dbUpdates.store_media = customerUpdates.storeMedia
    if (customerUpdates.storeLogo !== undefined) dbUpdates.store_logo = customerUpdates.storeLogo
    
    // Shipping and compliance fields
    if (customerUpdates.shippingInfo !== undefined) dbUpdates.shipping_info = customerUpdates.shippingInfo
    if (customerUpdates.pciCompliance !== undefined) dbUpdates.pci_compliance = customerUpdates.pciCompliance
    if (customerUpdates.dashboardCredentials !== undefined) dbUpdates.dashboard_credentials = customerUpdates.dashboardCredentials
    
    // Always update updated_at
    dbUpdates.updated_at = new Date().toISOString()
    
    // Only update if there are fields to update
    if (Object.keys(dbUpdates).length > 1) { // > 1 because we always have updated_at
      // First try to update
      const { data: updateData, error: updateError } = await supabase
        .from('customers')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()
      
      // If update failed because row doesn't exist, try to insert
      if (updateError && updateError.code === 'PGRST116') {
        // No rows returned - customer doesn't exist, need to insert
        // Add the id and created_at for insert
        const insertData = {
          id,
          ...dbUpdates,
          created_at: new Date().toISOString(),
        }
        
        const { data: insertResult, error: insertError } = await supabase
          .from('customers')
          .insert(insertData)
          .select()
          .single()
        
        if (insertError) {
          console.error('Error inserting new customer:', insertError)
          return NextResponse.json({ error: insertError.message }, { status: 400 })
        }
        
        return NextResponse.json({ customer: insertResult })
      }
      
      if (updateError) {
        console.error('Error updating customer:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
      
      return NextResponse.json({ customer: updateData })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in customer update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
