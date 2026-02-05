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
    // Rules: Washers 1-99, Dryers 101-199. Number 100 is reserved (super admin only).
    if (updates.machines !== undefined) {
      // Always delete existing machines first
      await supabase.from('machines').delete().eq('customer_id', customerId)
      
      if (updates.machines.length > 0) {
        const usedNumbers = new Set<number>()
        
        for (const machine of updates.machines) {
          const type = (machine.machineType || machine.type || '').toLowerCase()
          
          // Use existing number if valid
          let machineNum = machine.machineNumber || 0
          
          if (type === 'washer') {
            if (machineNum < 1 || machineNum > 99) {
              machineNum = 1
              while (usedNumbers.has(machineNum) && machineNum <= 99) machineNum++
            }
          } else if (type === 'dryer') {
            // Dryers must be 101-199 (100 is reserved)
            if (machineNum < 101 || machineNum > 199) {
              machineNum = 101
              while (usedNumbers.has(machineNum) && machineNum <= 199) machineNum++
            }
          } else {
            if (machineNum < 201) {
              machineNum = 201
              while (usedNumbers.has(machineNum)) machineNum++
            }
          }
          
          usedNumbers.add(machineNum)
          
          await supabase.from('machines').insert({
            customer_id: customerId,
            machine_id: String(machineNum),
            type: type || 'other',
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
