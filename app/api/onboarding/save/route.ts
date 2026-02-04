import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Customer } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { customerId, updates } = await request.json()
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }
    
    const supabase = createAdminClient()
    
    // Handle employees - sync to employees table
    if (updates.employees && updates.employees.length > 0) {
      await supabase.from('employees').delete().eq('customer_id', customerId)
      
      for (const emp of updates.employees) {
        await supabase.from('employees').insert({
          customer_id: customerId,
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
    // Washers: 1-99, Dryers: 101-199
    if (updates.machines && updates.machines.length > 0) {
      await supabase.from('machines').delete().eq('customer_id', customerId)
      
      // Separate machines by type and assign proper numbering
      const washers = updates.machines.filter((m: { machineType?: string; type?: string }) => 
        (m.machineType || m.type || '').toLowerCase() === 'washer'
      )
      const dryers = updates.machines.filter((m: { machineType?: string; type?: string }) => 
        (m.machineType || m.type || '').toLowerCase() === 'dryer'
      )
      const others = updates.machines.filter((m: { machineType?: string; type?: string }) => {
        const type = (m.machineType || m.type || '').toLowerCase()
        return type !== 'washer' && type !== 'dryer'
      })
      
      let washerIndex = 1
      let dryerIndex = 101
      let otherIndex = 201
      
      for (const machine of washers) {
        const machineNum = machine.machineNumber ? String(machine.machineNumber) : String(washerIndex++)
        await supabase.from('machines').insert({
          customer_id: customerId,
          machine_id: machineNum,
          type: 'washer',
          manufacturer: machine.make || machine.manufacturer || null,
          model: machine.model || null,
          serial_number: machine.serialNumber || null,
          location_in_store: machine.locationInStore || null,
          price: machine.baseVendPrice || machine.price || null,
          status: machine.isActive !== false ? 'active' : 'inactive',
          capacity: machine.capacity || null,
        })
      }
      
      for (const machine of dryers) {
        const machineNum = machine.machineNumber ? String(machine.machineNumber) : String(dryerIndex++)
        await supabase.from('machines').insert({
          customer_id: customerId,
          machine_id: machineNum,
          type: 'dryer',
          manufacturer: machine.make || machine.manufacturer || null,
          model: machine.model || null,
          serial_number: machine.serialNumber || null,
          location_in_store: machine.locationInStore || null,
          price: machine.baseVendPrice || machine.price || null,
          status: machine.isActive !== false ? 'active' : 'inactive',
          capacity: machine.capacity || null,
        })
      }
      
      for (const machine of others) {
        const machineNum = machine.machineNumber ? String(machine.machineNumber) : String(otherIndex++)
        await supabase.from('machines').insert({
          customer_id: customerId,
          machine_id: machineNum,
          type: machine.machineType || machine.type || 'other',
          manufacturer: machine.make || machine.manufacturer || null,
          model: machine.model || null,
          serial_number: machine.serialNumber || null,
          location_in_store: machine.locationInStore || null,
          price: machine.baseVendPrice || machine.price || null,
          status: machine.isActive !== false ? 'active' : 'inactive',
          capacity: machine.capacity || null,
        })
      }
    }
    
    // Build the database update object
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    
    // Map Customer fields to database columns
    if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName
    if (updates.ownerName !== undefined) dbUpdates.owner_name = updates.ownerName
    if (updates.email !== undefined) dbUpdates.email = updates.email
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.locationInfo !== undefined) dbUpdates.location_info = updates.locationInfo
    if (updates.shippingInfo !== undefined) dbUpdates.shipping_info = updates.shippingInfo
    if (updates.kioskConfiguration !== undefined) dbUpdates.kiosk_info = updates.kioskConfiguration
    if (updates.pciCompliance !== undefined) dbUpdates.pci_compliance = updates.pciCompliance
    if (updates.storeMedia !== undefined) dbUpdates.store_media = updates.storeMedia
    if (updates.storeLogo !== undefined) dbUpdates.store_logo = updates.storeLogo
    if (updates.savedOnboardingData !== undefined) dbUpdates.saved_onboarding_data = updates.savedOnboardingData
    if (updates.dashboardCredentials !== undefined) dbUpdates.dashboard_credentials = updates.dashboardCredentials
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted
    if (updates.currentStep !== undefined) dbUpdates.current_step = updates.currentStep
    
    // Update the customers table
    const { data, error } = await supabase
      .from('customers')
      .update(dbUpdates)
      .eq('id', customerId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating customer:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, customer: data })
  } catch (error) {
    console.error('Onboarding save error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save' },
      { status: 500 }
    )
  }
}
