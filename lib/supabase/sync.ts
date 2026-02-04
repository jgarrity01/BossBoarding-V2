import type { Customer } from '@/lib/types'

// Debounce map to prevent too many syncs
const syncTimeouts = new Map<string, NodeJS.Timeout>()

// Helper function to update customer via API (works on client-side)
async function updateCustomerViaApi(customerId: string, data: Partial<Customer>) {
  const response = await fetch(`/api/customers/${customerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update customer')
  }
  
  return response.json()
}

// Sync customer to Supabase immediately (no debounce)
// Uses API route to handle server-side operations
export function syncCustomerToSupabase(customerId: string, data: Partial<Customer>, debounceMs = 0) {
  // Clear any existing timeout for this customer
  const existingTimeout = syncTimeouts.get(customerId)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }
  
  // If no debounce, sync immediately
  if (debounceMs === 0) {
    (async () => {
      try {
        await updateCustomerViaApi(customerId, data)
      } catch (error) {
        console.error('Error syncing customer to Supabase:', error)
      }
    })()
    return
  }
  
  // Set a new timeout for debounced sync
  const timeout = setTimeout(async () => {
    try {
      await updateCustomerViaApi(customerId, data)
      syncTimeouts.delete(customerId)
    } catch (error) {
      console.error('Error syncing customer to Supabase:', error)
    }
  }, debounceMs)
  
  syncTimeouts.set(customerId, timeout)
}

// Immediate sync (no debounce) for critical updates
export async function syncCustomerImmediately(customerId: string, data: Partial<Customer>) {
  // Clear any pending debounced sync
  const existingTimeout = syncTimeouts.get(customerId)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
    syncTimeouts.delete(customerId)
  }
  
  try {
    await updateCustomerViaApi(customerId, data)
    return { success: true }
  } catch (error) {
    console.error('Error syncing customer to Supabase:', error)
    return { success: false, error }
  }
}
