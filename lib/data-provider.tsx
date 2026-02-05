'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Customer } from '@/lib/types'

interface DataContextType {
  isSupabaseConnected: boolean
  isLoading: boolean
  // Customer operations
  customers: Customer[]
  getCustomer: (id: string) => Customer | undefined
  getCustomerByToken: (token: string) => Customer | undefined
  addCustomer: (customer: Partial<Customer>) => Promise<Customer | null>
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  // Note operations
  addNote: (customerId: string, content: string, createdBy: string) => Promise<void>
  updateNote: (customerId: string, noteId: string, content: string) => Promise<void>
  deleteNote: (customerId: string, noteId: string) => Promise<void>
  // Refresh
  refresh: () => Promise<void>
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [supabaseCustomersList, setSupabaseCustomersList] = useState<Customer[]>([])
  const [zustandStore, setZustandStore] = useState<{
    customers: Customer[]
    addCustomer: (customer: Customer) => void
    updateCustomer: (id: string, data: Partial<Customer>) => void
    deleteCustomer: (id: string) => void
    getCustomerByToken: (token: string) => Customer | undefined
    addNote: (customerId: string, content: string, createdBy: string) => void
    updateNote: (customerId: string, noteId: string, content: string) => void
    deleteNote: (customerId: string, noteId: string) => void
  } | null>(null)
  
  // Dynamically import dependencies to avoid SSR issues
  useEffect(() => {
    const init = async () => {
      try {
        // Import store
        const { useAdminStore } = await import('@/lib/store')
        const store = useAdminStore.getState()
        setZustandStore({
          customers: store.customers,
          addCustomer: store.addCustomer,
          updateCustomer: store.updateCustomer,
          deleteCustomer: store.deleteCustomer,
          getCustomerByToken: store.getCustomerByToken,
          addNote: (customerId, content, createdBy) => {
            store.addCustomerNote(customerId, {
              id: crypto.randomUUID(),
              content,
              createdAt: new Date().toISOString(),
              createdBy,
              isEdited: false,
            })
          },
          updateNote: (customerId, noteId, content) => {
            store.updateCustomerNote(customerId, noteId, content, 'System')
          },
          deleteNote: store.deleteCustomerNote,
        })
        
        // Try to connect to Supabase
        try {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          const isSessionMissing = authError?.message === 'Auth session missing!'
          
          if (authError && !isSessionMissing) {
            setIsSupabaseConnected(false)
            setIsLoading(false)
            return
          }
          
          setIsSupabaseConnected(true)
          
          if (user) {
            try {
              const supabaseCustomers = await import('@/lib/supabase/customers')
              const customers = await supabaseCustomers.getCustomers()
              setSupabaseCustomersList(customers)
            } catch {
              setSupabaseCustomersList([])
            }
          } else {
            setSupabaseCustomersList([])
          }
        } catch {
          setIsSupabaseConnected(false)
        }
      } catch (err) {
        console.error('[DataProvider] Init error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    init()
  }, [])
  
  // Refresh data from source
  const refresh = useCallback(async () => {
    if (isSupabaseConnected) {
      try {
        const supabaseCustomers = await import('@/lib/supabase/customers')
        const customers = await supabaseCustomers.getCustomers()
        setSupabaseCustomersList(customers)
      } catch {
        // Ignore errors
      }
    }
  }, [isSupabaseConnected])
  
  // Get customers list
  const customers = isSupabaseConnected ? supabaseCustomersList : (zustandStore?.customers ?? [])
  
  // Get single customer by ID
  const getCustomer = useCallback((id: string) => {
    if (isSupabaseConnected) {
      return supabaseCustomersList.find(c => c.id === id)
    }
    return zustandStore?.customers.find(c => c.id === id)
  }, [isSupabaseConnected, supabaseCustomersList, zustandStore])
  
  // Get customer by onboarding token
  const getCustomerByToken = useCallback((token: string) => {
    if (isSupabaseConnected) {
      return supabaseCustomersList.find(c => c.onboardingToken === token)
    }
    return zustandStore?.getCustomerByToken(token)
  }, [isSupabaseConnected, supabaseCustomersList, zustandStore])
  
  // Add customer
  const addCustomer = useCallback(async (customer: Partial<Customer>): Promise<Customer | null> => {
    if (isSupabaseConnected) {
      try {
        const supabaseCustomers = await import('@/lib/supabase/customers')
        const newCustomer = await supabaseCustomers.createCustomer(customer)
        if (newCustomer) {
          setSupabaseCustomersList(prev => [newCustomer, ...prev])
        }
        return newCustomer
      } catch {
        return null
      }
    }
    if (zustandStore) {
      zustandStore.addCustomer(customer as Customer)
      return zustandStore.customers[0]
    }
    return null
  }, [isSupabaseConnected, zustandStore])
  
  // Update customer
  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    if (isSupabaseConnected) {
      try {
        const supabaseCustomers = await import('@/lib/supabase/customers')
        await supabaseCustomers.updateCustomer(id, updates)
        if (updates.machines) {
          await supabaseCustomers.syncMachines(id, updates.machines)
        }
        if (updates.employees) {
          await supabaseCustomers.syncEmployees(id, updates.employees)
        }
        const customers = await supabaseCustomers.getCustomers()
        setSupabaseCustomersList(customers)
      } catch {
        // Ignore errors
      }
    } else if (zustandStore) {
      zustandStore.updateCustomer(id, updates)
    }
  }, [isSupabaseConnected, zustandStore])
  
  // Delete customer
  const deleteCustomer = useCallback(async (id: string) => {
    if (isSupabaseConnected) {
      try {
        const supabaseCustomers = await import('@/lib/supabase/customers')
        await supabaseCustomers.deleteCustomer(id)
        setSupabaseCustomersList(prev => prev.filter(c => c.id !== id))
      } catch {
        // Ignore errors
      }
    } else if (zustandStore) {
      zustandStore.deleteCustomer(id)
    }
  }, [isSupabaseConnected, zustandStore])
  
  // Add note
  const addNote = useCallback(async (customerId: string, content: string, createdBy: string) => {
    if (isSupabaseConnected) {
      try {
        const supabaseCustomers = await import('@/lib/supabase/customers')
        await supabaseCustomers.addNote(customerId, content, createdBy)
        await refresh()
      } catch {
        // Ignore errors
      }
    } else if (zustandStore) {
      zustandStore.addNote(customerId, content, createdBy)
    }
  }, [isSupabaseConnected, zustandStore, refresh])
  
  // Update note
  const updateNote = useCallback(async (customerId: string, noteId: string, content: string) => {
    if (isSupabaseConnected) {
      try {
        const supabaseCustomers = await import('@/lib/supabase/customers')
        await supabaseCustomers.updateNote(noteId, content)
        await refresh()
      } catch {
        // Ignore errors
      }
    } else if (zustandStore) {
      zustandStore.updateNote(customerId, noteId, content)
    }
  }, [isSupabaseConnected, zustandStore, refresh])
  
  // Delete note
  const deleteNote = useCallback(async (customerId: string, noteId: string) => {
    if (isSupabaseConnected) {
      try {
        const supabaseCustomers = await import('@/lib/supabase/customers')
        await supabaseCustomers.deleteNote(noteId)
        await refresh()
      } catch {
        // Ignore errors
      }
    } else if (zustandStore) {
      zustandStore.deleteNote(customerId, noteId)
    }
  }, [isSupabaseConnected, zustandStore, refresh])
  
  return (
    <DataContext.Provider value={{
      isSupabaseConnected,
      isLoading,
      customers,
      getCustomer,
      getCustomerByToken,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addNote,
      updateNote,
      deleteNote,
      refresh,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
