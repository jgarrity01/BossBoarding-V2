import { createClient, createAdminClient } from './client'
import type { Customer, Machine, Employee, CustomerNote, CustomerUser } from '@/lib/types'

// Customer User functions
export async function getCustomerUsers(): Promise<CustomerUser[]> {
  try {
    // Use admin client to bypass RLS
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('customer_users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error || !data) {
      console.error('Error fetching customer users:', error)
      return []
    }
    
    return data.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      name: row.name,
      email: row.email,
      role: row.role || 'owner',
      isActive: row.is_active,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
    }))
  } catch (e) {
    console.error('[v0] getCustomerUsers error:', e)
    return []
  }
}

export async function getCustomerUsersByCustomerId(customerId: string): Promise<CustomerUser[]> {
  try {
    // Use admin client to bypass RLS
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('customer_users')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    
    if (error || !data) {
      console.error('Error fetching customer users:', error)
      return []
    }
    
    return data.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      name: row.name,
      email: row.email,
      role: row.role || 'owner',
      isActive: row.is_active,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
    }))
  } catch (e) {
    console.error('[v0] getCustomerUsersByCustomerId error:', e)
    return []
  }
}

export async function createCustomerUser(
  customerId: string,
  name: string,
  email: string,
  password: string,
  role: string = 'owner'
): Promise<{ user: CustomerUser | null; error: string | null }> {
  try {
    const response = await fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        customerId,
        name,
        email,
        password,
        role,
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { user: null, error: data.error || 'Failed to create user' }
    }
    
    return { user: data.user, error: null }
  } catch (error) {
    console.error('Error creating customer user:', error)
    return { user: null, error: 'Network error' }
  }
}

export async function authenticateCustomerUser(
  email: string,
  password: string
): Promise<{ user: CustomerUser | null; customer: Customer | null; error: string | null }> {
  try {
    const response = await fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        email,
        password,
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { user: null, customer: null, error: data.error || 'Invalid email or password' }
    }
    
    // Transform customer data if needed
    const customer = data.customer ? await getCustomerById(data.user.customerId) : null
    
    return { user: data.user, customer, error: null }
  } catch (error) {
    console.error('Error authenticating customer user:', error)
    return { user: null, customer: null, error: 'Network error' }
  }
}

export async function updateCustomerUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updatePassword',
        userId,
        newPassword,
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update password' }
    }
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating customer user password:', error)
    return { success: false, error: 'Network error' }
  }
}

export async function deleteCustomerUser(userId: string): Promise<boolean> {
  const supabase = createClient()
  

  
  const { error } = await supabase
    .from('customer_users')
    .delete()
    .eq('id', userId)
  
  if (error) {
    console.error('Error deleting customer user:', error)
    return false
  }
  
  return true
}

// ==================== CUSTOMER TRANSFORM FUNCTIONS ====================

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
    // Task tracking and dates
    onboardingDates: row.onboarding_dates as Customer['onboardingDates'],
    taskStatuses: row.task_statuses as Customer['taskStatuses'],
    taskMetadata: row.task_metadata as Customer['taskMetadata'],
    currentStageId: row.current_stage_id as string | undefined,
    contractSigned: row.contract_signed as boolean | undefined,
    salesRepAssignments: row.sales_rep_assignments as Customer['salesRepAssignments'],
    installationDate: row.installation_date as string | undefined,
    goLiveDate: row.go_live_date as string | undefined,
    // Financial fields
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

// Transform Customer to database row
function toDbCustomer(customer: Partial<Customer>): Record<string, unknown> {
  const dbRow: Record<string, unknown> = {}
  
  if (customer.businessName !== undefined) dbRow.business_name = customer.businessName
  if (customer.ownerName !== undefined) dbRow.owner_name = customer.ownerName
  if (customer.email !== undefined) dbRow.email = customer.email
  if (customer.phone !== undefined) dbRow.phone = customer.phone
  if (customer.status !== undefined) dbRow.status = customer.status
  if (customer.currentStep !== undefined) dbRow.current_step = customer.currentStep
  if (customer.totalSteps !== undefined) dbRow.total_steps = customer.totalSteps
  if (customer.onboardingToken !== undefined) dbRow.onboarding_token = customer.onboardingToken
  if (customer.onboardingStarted !== undefined) dbRow.onboarding_started = customer.onboardingStarted
  if (customer.onboardingCompleted !== undefined) dbRow.onboarding_completed = customer.onboardingCompleted
  if (customer.locationInfo !== undefined) dbRow.location_info = customer.locationInfo
  if (customer.shippingInfo !== undefined) dbRow.shipping_info = customer.shippingInfo
  if (customer.pciCompliance !== undefined) dbRow.pci_compliance = customer.pciCompliance
  if (customer.kioskInfo !== undefined) dbRow.kiosk_info = customer.kioskInfo
  if (customer.merchantAccount !== undefined) dbRow.merchant_account = customer.merchantAccount
  if (customer.billingInfo !== undefined) dbRow.billing_info = customer.billingInfo
  if (customer.storeMedia !== undefined) dbRow.store_media = customer.storeMedia
  if (customer.storeLogo !== undefined) dbRow.store_logo = customer.storeLogo
  if (customer.sections !== undefined) dbRow.sections = customer.sections
  if (customer.dashboardCredentials !== undefined) dbRow.dashboard_credentials = customer.dashboardCredentials
  if (customer.savedOnboardingData !== undefined) dbRow.saved_onboarding_data = customer.savedOnboardingData
  if (customer.paymentLinks !== undefined) dbRow.payment_links = customer.paymentLinks
  if (customer.assignedTo !== undefined) dbRow.assigned_to = customer.assignedTo
  // Task tracking and dates
  if (customer.onboardingDates !== undefined) dbRow.onboarding_dates = customer.onboardingDates
  if (customer.taskStatuses !== undefined) dbRow.task_statuses = customer.taskStatuses
  if (customer.taskMetadata !== undefined) dbRow.task_metadata = customer.taskMetadata
  if (customer.currentStageId !== undefined) dbRow.current_stage_id = customer.currentStageId
  if (customer.contractSigned !== undefined) dbRow.contract_signed = customer.contractSigned
  if (customer.salesRepAssignments !== undefined) dbRow.sales_rep_assignments = customer.salesRepAssignments
  if (customer.installationDate !== undefined) dbRow.installation_date = customer.installationDate
  if (customer.goLiveDate !== undefined) dbRow.go_live_date = customer.goLiveDate
  // Financial fields
  if (customer.nonRecurringRevenue !== undefined) dbRow.non_recurring_revenue = customer.nonRecurringRevenue
  if (customer.monthlyRecurringFee !== undefined) dbRow.monthly_recurring_fee = customer.monthlyRecurringFee
  if (customer.otherFees !== undefined) dbRow.other_fees = customer.otherFees
  if (customer.cogs !== undefined) dbRow.cogs = customer.cogs
  if (customer.commissionRate !== undefined) dbRow.commission_rate = customer.commissionRate
  if (customer.paymentTermMonths !== undefined) dbRow.payment_term_months = customer.paymentTermMonths
  if (customer.paymentStatus !== undefined) dbRow.payment_status = customer.paymentStatus
  if (customer.paidToDateAmount !== undefined) dbRow.paid_to_date_amount = customer.paidToDateAmount
  if (customer.commissionPaidAmount !== undefined) dbRow.commission_paid_amount = customer.commissionPaidAmount
  if (customer.paymentProcessors !== undefined) dbRow.payment_processors = customer.paymentProcessors
  
  return dbRow
}

// ==================== CUSTOMER CRUD FUNCTIONS ====================

// Fetch all customers
export async function getCustomers(): Promise<Customer[]> {
  const supabase = createClient()
  

  
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }
  
  // Fetch machines and employees for each customer
  const customerIds = customers.map(c => c.id)
  
  const [machinesResult, employeesResult, notesResult] = await Promise.all([
    supabase.from('machines').select('*').in('customer_id', customerIds),
    supabase.from('employees').select('*').in('customer_id', customerIds),
    supabase.from('customer_notes').select('*').in('customer_id', customerIds).order('created_at', { ascending: false }),
  ])
  
  const machinesByCustomer = new Map<string, Machine[]>()
  const employeesByCustomer = new Map<string, Employee[]>()
  const notesByCustomer = new Map<string, CustomerNote[]>()
  
  machinesResult.data?.forEach(m => {
    const customerId = m.customer_id as string
    if (!machinesByCustomer.has(customerId)) {
      machinesByCustomer.set(customerId, [])
    }
    machinesByCustomer.get(customerId)!.push({
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
    })
  })
  
  employeesResult.data?.forEach(e => {
    const customerId = e.customer_id as string
    if (!employeesByCustomer.has(customerId)) {
      employeesByCustomer.set(customerId, [])
    }
    employeesByCustomer.get(customerId)!.push({
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      role: e.role,
      privilegeLevel: e.privilege_level,
      pin: e.pin,
      isActive: e.is_active,
    })
  })
  
  notesResult.data?.forEach(n => {
    const customerId = n.customer_id as string
    if (!notesByCustomer.has(customerId)) {
      notesByCustomer.set(customerId, [])
    }
    notesByCustomer.get(customerId)!.push({
      id: n.id,
      content: n.content,
      createdBy: n.created_by_name || 'Unknown',
      createdAt: n.created_at,
    })
  })
  
  return customers.map(c => {
    const customer = transformCustomer(c)
    customer.machines = machinesByCustomer.get(c.id) || []
    customer.employees = employeesByCustomer.get(c.id) || []
    customer.notes = notesByCustomer.get(c.id) || []
    return customer
  })
}

// Get customer by email
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  // Use admin client to bypass RLS
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  
  if (error || !data) {
    return null
  }
  
  // Fetch related data
  const [machinesResult, employeesResult, notesResult] = await Promise.all([
    supabase.from('machines').select('*').eq('customer_id', data.id),
    supabase.from('employees').select('*').eq('customer_id', data.id),
    supabase.from('customer_notes').select('*').eq('customer_id', data.id).order('created_at', { ascending: false }),
  ])
  
  const customer = transformCustomer(data)
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
  
  return customer
}

// Get customer by ID
export async function getCustomerById(id: string): Promise<Customer | null> {
  // Use admin client to bypass RLS
  const supabase = createAdminClient()
  

  
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !customer) {
    return null
  }
  
  const [machinesResult, employeesResult, notesResult] = await Promise.all([
    supabase.from('machines').select('*').eq('customer_id', id),
    supabase.from('employees').select('*').eq('customer_id', id),
    supabase.from('customer_notes').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
  ])
  
  const result = transformCustomer(customer)
  result.machines = machinesResult.data?.map(m => ({
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
  })) || []
  
  result.employees = employeesResult.data?.map(e => ({
    id: e.id,
    name: e.name,
    email: e.email,
    phone: e.phone,
    role: e.role,
    privilegeLevel: e.privilege_level,
    pin: e.pin,
    isActive: e.is_active,
  })) || []
  
  result.notes = notesResult.data?.map(n => ({
    id: n.id,
    content: n.content,
    createdBy: n.created_by_name || 'Unknown',
    createdAt: n.created_at,
  })) || []
  
  return result
}

// Get customer by onboarding token
export async function getCustomerByToken(token: string): Promise<Customer | null> {
  const supabase = createClient()
  

  
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('onboarding_token', token)
    .single()
  
  if (error || !customer) {
    return null
  }
  
  const [machinesResult, employeesResult] = await Promise.all([
    supabase.from('machines').select('*').eq('customer_id', customer.id),
    supabase.from('employees').select('*').eq('customer_id', customer.id),
  ])
  
  const result = transformCustomer(customer)
  result.machines = machinesResult.data?.map(m => ({
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
  })) || []
  
  result.employees = employeesResult.data?.map(e => ({
    id: e.id,
    name: e.name,
    email: e.email,
    phone: e.phone,
    role: e.role,
    privilegeLevel: e.privilege_level,
    pin: e.pin,
    isActive: e.is_active,
  })) || []
  
  return result
}

// Create new customer
export async function createCustomer(customer: Partial<Customer>): Promise<Customer | null> {
  const supabase = createClient()
  
  // Set default installation date (40 days from now) and go-live date (42 days from now)
  // if not already provided
  const now = new Date()
  const defaultInstallDate = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000)
  const defaultGoLiveDate = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000)
  
  const customerWithDefaults = {
    ...customer,
    installationDate: customer.installationDate || defaultInstallDate.toISOString(),
    goLiveDate: customer.goLiveDate || defaultGoLiveDate.toISOString(),
  }
  
  const dbData = toDbCustomer(customerWithDefaults)
  
  const { data, error } = await supabase
    .from('customers')
    .insert(dbData)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating customer:', error)
    return null
  }
  
  return transformCustomer(data)
}

// Update customer
export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
  // Use admin client to bypass RLS for employees/machines inserts
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
        privilege_level: emp.privilegeLevel || 'standard',
        pin: emp.pin || null,
        is_active: emp.isActive !== false,
      })
    }
  }
  
  // Handle machines - sync to machines table
  if (updates.machines && updates.machines.length > 0) {
    // Delete existing machines for this customer and re-insert
    await supabase.from('machines').delete().eq('customer_id', id)
    
    for (const machine of updates.machines) {
      await supabase.from('machines').insert({
        customer_id: id,
        machine_id: String(machine.machineNumber),
        type: machine.type,
        manufacturer: machine.make || null,
        model: machine.model || null,
        serial_number: machine.serialNumber || null,
        capacity: machine.capacity || null,
        price: machine.price || null,
        status: machine.status || 'active',
        location_in_store: machine.locationInStore || null,
        notes: machine.notes || null,
      })
    }
  }
  
  // Remove employees and machines from updates - they're in separate tables
  const { employees, machines, ...customerUpdates } = updates
  const dbData = toDbCustomer(customerUpdates)
  
  const { data, error } = await supabase
    .from('customers')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating customer:', error)
    return null
  }
  
  return transformCustomer(data)
}

// Delete customer
export async function deleteCustomer(id: string): Promise<boolean> {
  const supabase = createClient()
  

  
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting customer:', error)
    return false
  }
  
  return true
}

// ==================== MACHINE FUNCTIONS ====================

// Add machine to customer
export async function addMachine(customerId: string, machine: Omit<Machine, 'id'>): Promise<Machine | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('machines')
    .insert({
      customer_id: customerId,
      machine_id: String(machine.machineNumber),
      type: machine.type,
      manufacturer: machine.make || null,
      model: machine.model || null,
      serial_number: machine.serialNumber || null,
      capacity: machine.capacity || null,
      price: machine.price || null,
      status: machine.status || 'active',
      location_in_store: machine.locationInStore || null,
      notes: machine.notes || null,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding machine:', error)
    return null
  }
  
  return {
    id: data.id,
    machineNumber: parseInt(data.machine_id, 10) || 0,
    type: data.type,
    make: data.manufacturer || '',
    model: data.model || '',
    serialNumber: data.serial_number || '',
    capacity: data.capacity,
    price: data.price,
    status: data.status,
    locationInStore: data.location_in_store,
    notes: data.notes,
  }
}

// Update machine
export async function updateMachine(id: string, updates: Partial<Machine>): Promise<boolean> {
  const supabase = createClient()
  
  const dbUpdates: Record<string, unknown> = {}
  if (updates.machineNumber !== undefined) dbUpdates.machine_id = String(updates.machineNumber)
  if (updates.type !== undefined) dbUpdates.type = updates.type
  if (updates.make !== undefined) dbUpdates.manufacturer = updates.make
  if (updates.model !== undefined) dbUpdates.model = updates.model
  if (updates.serialNumber !== undefined) dbUpdates.serial_number = updates.serialNumber
  if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity
  if (updates.price !== undefined) dbUpdates.price = updates.price
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.locationInStore !== undefined) dbUpdates.location_in_store = updates.locationInStore
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes
  
  const { error } = await supabase
    .from('machines')
    .update(dbUpdates)
    .eq('id', id)
  
  if (error) {
    console.error('Error updating machine:', error)
    return false
  }
  
  return true
}

// Delete machine
export async function deleteMachine(id: string): Promise<boolean> {
  const supabase = createClient()
  

  
  const { error } = await supabase
    .from('machines')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting machine:', error)
    return false
  }
  
  return true
}

// Sync machines for a customer (replace all)
export async function syncMachines(customerId: string, machines: Machine[]): Promise<boolean> {
  const supabase = createClient()
  

  
  // Delete existing machines
  await supabase.from('machines').delete().eq('customer_id', customerId)
  
  // Insert new machines
  if (machines.length > 0) {
    const { error } = await supabase.from('machines').insert(
      machines.map(m => ({
        customer_id: customerId,
        machine_id: String(m.machineNumber),
        type: m.type,
        manufacturer: m.make || null,
        model: m.model || null,
        serial_number: m.serialNumber || null,
        capacity: m.capacity || null,
        price: m.price || null,
        status: m.status || 'active',
        location_in_store: m.locationInStore || null,
        notes: m.notes || null,
      }))
    )
    
    if (error) {
      console.error('Error syncing machines:', error)
      return false
    }
  }
  
  return true
}

// ==================== EMPLOYEE FUNCTIONS ====================

// Add employee to customer
export async function addEmployee(customerId: string, employee: Omit<Employee, 'id'>): Promise<Employee | null> {
  const supabase = createClient()
  

  
  const { data, error } = await supabase
    .from('employees')
    .insert({
      customer_id: customerId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      privilege_level: employee.privilegeLevel || 'standard',
      pin: employee.pin,
      is_active: employee.isActive !== false,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding employee:', error)
    return null
  }
  
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    privilegeLevel: data.privilege_level,
    pin: data.pin,
    isActive: data.is_active,
  }
}

// Update employee
export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<boolean> {
  const supabase = createClient()
  

  
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  if (updates.role !== undefined) dbUpdates.role = updates.role
  if (updates.privilegeLevel !== undefined) dbUpdates.privilege_level = updates.privilegeLevel
  if (updates.pin !== undefined) dbUpdates.pin = updates.pin
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
  
  const { error } = await supabase
    .from('employees')
    .update(dbUpdates)
    .eq('id', id)
  
  if (error) {
    console.error('Error updating employee:', error)
    return false
  }
  
  return true
}

// Delete employee
export async function deleteEmployee(id: string): Promise<boolean> {
  const supabase = createClient()
  

  
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting employee:', error)
    return false
  }
  
  return true
}

// Sync employees for a customer (replace all)
export async function syncEmployees(customerId: string, employees: Employee[]): Promise<boolean> {
  const supabase = createClient()
  

  
  // Delete existing employees
  await supabase.from('employees').delete().eq('customer_id', customerId)
  
  // Insert new employees
  if (employees.length > 0) {
    const { error } = await supabase.from('employees').insert(
      employees.map(e => ({
        customer_id: customerId,
        name: e.name,
        email: e.email,
        phone: e.phone,
        role: e.role,
        privilege_level: e.privilegeLevel || 'standard',
        pin: e.pin,
        is_active: e.isActive !== false,
      }))
    )
    
    if (error) {
      console.error('Error syncing employees:', error)
      return false
    }
  }
  
  return true
}

// ==================== NOTE FUNCTIONS ====================

// Add note to customer
export async function addNote(customerId: string, content: string, createdByName: string): Promise<CustomerNote | null> {
  const supabase = createClient()
  

  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('customer_notes')
    .insert({
      customer_id: customerId,
      content,
      created_by: user?.id,
      created_by_name: createdByName,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding note:', error)
    return null
  }
  
  return {
    id: data.id,
    content: data.content,
    createdBy: data.created_by_name || 'Unknown',
    createdAt: data.created_at,
  }
}

// Update note
export async function updateNote(id: string, content: string): Promise<boolean> {
  const supabase = createClient()
  

  
  const { error } = await supabase
    .from('customer_notes')
    .update({ content })
    .eq('id', id)
  
  if (error) {
    console.error('Error updating note:', error)
    return false
  }
  
  return true
}

// Delete note
export async function deleteNote(id: string): Promise<boolean> {
  const supabase = createClient()
  

  
  const { error } = await supabase
    .from('customer_notes')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting note:', error)
    return false
  }
  
  return true
}

// ==================== ADMIN TASKS ====================

export interface AdminTask {
  id: string
  customerId?: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  assignedTo?: string
  createdBy?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// Get all tasks
export async function getTasks(): Promise<AdminTask[]> {
  const supabase = createClient()
  

  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
  
  return data.map(t => ({
    id: t.id,
    customerId: t.customer_id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date,
    assignedTo: t.assigned_to,
    createdBy: t.created_by,
    completedAt: t.completed_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }))
}

// Get tasks for a specific customer
export async function getTasksByCustomerId(customerId: string): Promise<AdminTask[]> {
  const supabase = createClient()
  

  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching customer tasks:', error)
    return []
  }
  
  return data.map(t => ({
    id: t.id,
    customerId: t.customer_id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date,
    assignedTo: t.assigned_to,
    createdBy: t.created_by,
    completedAt: t.completed_at,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }))
}

// Create task
export async function createTask(task: Omit<AdminTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminTask | null> {
  const supabase = createClient()
  

  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      customer_id: task.customerId,
      title: task.title,
      description: task.description,
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      due_date: task.dueDate,
      assigned_to: task.assignedTo,
      created_by: task.createdBy,
      completed_at: task.completedAt,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating task:', error)
    return null
  }
  
  return {
    id: data.id,
    customerId: data.customer_id,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    dueDate: data.due_date,
    assignedTo: data.assigned_to,
    createdBy: data.created_by,
    completedAt: data.completed_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// Update task
export async function updateTask(id: string, updates: Partial<AdminTask>): Promise<boolean> {
  const supabase = createClient()
  

  
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.customerId !== undefined) dbUpdates.customer_id = updates.customerId
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
  if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo
  if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt
  
  const { error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', id)
  
  if (error) {
    console.error('Error updating task:', error)
    return false
  }
  
  return true
}

// Delete task
export async function deleteTask(id: string): Promise<boolean> {
  const supabase = createClient()
  

  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting task:', error)
    return false
  }
  
  return true
}
