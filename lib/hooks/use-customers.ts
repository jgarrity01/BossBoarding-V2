'use client'

import useSWR from 'swr'
import { 
  getCustomers, 
  getCustomerById, 
  getCustomerByToken,
  createCustomer as createCustomerDb,
  updateCustomer as updateCustomerDb,
  deleteCustomer as deleteCustomerDb,
  addNote as addNoteDb,
  updateNote as updateNoteDb,
  deleteNote as deleteNoteDb,
  syncMachines,
  syncEmployees,
} from '@/lib/supabase/customers'
import type { Customer, CustomerNote } from '@/lib/types'

// Hook to fetch all customers
export function useCustomers() {
  const { data, error, isLoading, mutate } = useSWR('customers', getCustomers, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const addCustomer = async (customer: Partial<Customer>) => {
    const newCustomer = await createCustomerDb(customer)
    if (newCustomer) {
      mutate()
    }
    return newCustomer
  }

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const updated = await updateCustomerDb(id, updates)
    if (updated) {
      // Also sync machines and employees if provided
      if (updates.machines) {
        await syncMachines(id, updates.machines)
      }
      if (updates.employees) {
        await syncEmployees(id, updates.employees)
      }
      mutate()
    }
    return updated
  }

  const removeCustomer = async (id: string) => {
    const success = await deleteCustomerDb(id)
    if (success) {
      mutate()
    }
    return success
  }

  return {
    customers: data || [],
    isLoading,
    error,
    addCustomer,
    updateCustomer,
    removeCustomer,
    refresh: mutate,
  }
}

// Hook to fetch single customer by ID
export function useCustomer(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `customer-${id}` : null,
    () => id ? getCustomerById(id) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  const updateCustomer = async (updates: Partial<Customer>) => {
    if (!id) return null
    const updated = await updateCustomerDb(id, updates)
    if (updated) {
      if (updates.machines) {
        await syncMachines(id, updates.machines)
      }
      if (updates.employees) {
        await syncEmployees(id, updates.employees)
      }
      mutate()
    }
    return updated
  }

  const addNote = async (content: string, createdBy: string) => {
    if (!id) return null
    const note = await addNoteDb(id, content, createdBy)
    if (note) {
      mutate()
    }
    return note
  }

  const updateNote = async (noteId: string, content: string) => {
    const success = await updateNoteDb(noteId, content)
    if (success) {
      mutate()
    }
    return success
  }

  const removeNote = async (noteId: string) => {
    const success = await deleteNoteDb(noteId)
    if (success) {
      mutate()
    }
    return success
  }

  return {
    customer: data,
    isLoading,
    error,
    updateCustomer,
    addNote,
    updateNote,
    removeNote,
    refresh: mutate,
  }
}

// Hook to fetch customer by onboarding token
export function useCustomerByToken(token: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? `customer-token-${token}` : null,
    () => token ? getCustomerByToken(token) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  const updateCustomer = async (updates: Partial<Customer>) => {
    if (!data?.id) return null
    const updated = await updateCustomerDb(data.id, updates)
    if (updated) {
      if (updates.machines) {
        await syncMachines(data.id, updates.machines)
      }
      if (updates.employees) {
        await syncEmployees(data.id, updates.employees)
      }
      mutate()
    }
    return updated
  }

  return {
    customer: data,
    isLoading,
    error,
    updateCustomer,
    refresh: mutate,
  }
}
