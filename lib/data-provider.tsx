'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdminStore } from '@/lib/store'
import type { Customer } from '@/lib/types'
import * as supabaseCustomers from '@/lib/supabase/customers'

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
  const [isMounted, setIsMounted] = useState(false)
  const [supabaseCustomersList, setSupabaseCustomersList] = useState<Customer[]>([])
  const initRef = useRef(false)
  
  // Get store functions directly - these are safe to call even before hydration
  const storeCustomers = useAdminStore((state) => state.customers)
  const storeAddCustomer = useAdminStore((state) => state.addCustomer)
  const storeUpdateCustomer = useAdminStore((state) => state.updateCustomer)
  const storeDeleteCustomer = useAdminStore((state) => state.deleteCustomer)
  const storeGetCustomerByToken = useAdminStore((state) => state.getCustomerByToken)
  const storeAddNote = useAdminStore((state) => state.addCustomerNote)
  const storeUpdateNote = useAdminStore((state) => state.updateCustomerNote)
  const storeDeleteNote = useAdminStore((state) => state.deleteCustomerNote)
  
  // Handle hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize on mount
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    
    const init = async () => {
      try {
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
        const customers = await supabaseCustomers.getCustomers()
        setSupabaseCustomersList(customers)
      } catch {
        // Ignore errors
      }
    }
  }, [isSupabaseConnected])
  
  // Get customers list
  const customers = isSupabaseConnected ? supabaseCustomersList : storeCustomers
  
  // Get single customer by ID
  const getCustomer = useCallback((id: string) => {
    if (isSupabaseConnected) {
      return supabaseCustomersList.find(c => c.id === id)
    }
    return storeCustomers.find(c => c.id === id)
  }, [isSupabaseConnected, supabaseCustomersList, storeCustomers])
  
  // Get customer by onboarding token
  const getCustomerByToken = useCallback((token: string) => {
    if (isSupabaseConnected) {
      return supabaseCustomersList.find(c => c.onboardingToken === token)
    }
    return storeGetCustomerByToken(token)
  }, [isSupabaseConnected, supabaseCustomersList, storeGetCustomerByToken])
  
  // Add customer
  const addCustomer = useCallback(async (customer: Partial<Customer>): Promise<Customer | null> => {
    if (isSupabaseConnected) {
      try {
        const newCustomer = await supabaseCustomers.createCustomer(customer)
        if (newCustomer) {
          setSupabaseCustomersList(prev => [newCustomer, ...prev])
        }
        return newCustomer
      } catch {
        return null
      }
    }
    storeAddCustomer(customer as Customer)
    return storeCustomers[0]
  }, [isSupabaseConnected, storeAddCustomer, storeCustomers])
  
  // Update customer
  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    if (isSupabaseConnected) {
      try {
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
    } else {
      storeUpdateCustomer(id, updates)
    }
  }, [isSupabaseConnected, storeUpdateCustomer])
  
  // Delete customer
  const deleteCustomer = useCallback(async (id: string) => {
    if (isSupabaseConnected) {
      try {
        await supabaseCustomers.deleteCustomer(id)
        setSupabaseCustomersList(prev => prev.filter(c => c.id !== id))
      } catch {
        // Ignore errors
      }
    } else {
      storeDeleteCustomer(id)
    }
  }, [isSupabaseConnected, storeDeleteCustomer])
  
  // Add note
  const addNote = useCallback(async (customerId: string, content: string, createdBy: string) => {
    if (isSupabaseConnected) {
      try {
        await supabaseCustomers.addNote(customerId, content, createdBy)
        await refresh()
      } catch {
        // Ignore errors
      }
    } else {
      storeAddNote(customerId, {
        id: crypto.randomUUID(),
        content,
        createdAt: new Date().toISOString(),
        createdBy,
        isEdited: false,
      })
    }
  }, [isSupabaseConnected, storeAddNote, refresh])
  
  // Update note
  const updateNote = useCallback(async (customerId: string, noteId: string, content: string) => {
    if (isSupabaseConnected) {
      try {
        await supabaseCustomers.updateNote(noteId, content)
        await refresh()
      } catch {
        // Ignore errors
      }
    } else {
      storeUpdateNote(customerId, noteId, content, 'System')
    }
  }, [isSupabaseConnected, storeUpdateNote, refresh])
  
  // Delete note
  const deleteNote = useCallback(async (customerId: string, noteId: string) => {
    if (isSupabaseConnected) {
      try {
        await supabaseCustomers.deleteNote(noteId)
        await refresh()
      } catch {
        // Ignore errors
      }
    } else {
      storeDeleteNote(customerId, noteId)
    }
  }, [isSupabaseConnected, storeDeleteNote, refresh])
  
  // Don't render children until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <DataContext.Provider value={{
        isSupabaseConnected: false,
        isLoading: true,
        customers: [],
        getCustomer: () => undefined,
        getCustomerByToken: () => undefined,
        addCustomer: async () => null,
        updateCustomer: async () => {},
        deleteCustomer: async () => {},
        addNote: async () => {},
        updateNote: async () => {},
        deleteNote: async () => {},
        refresh: async () => {},
      }}>
        {children}
      </DataContext.Provider>
    )
  }
  
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
