'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdminStore } from '@/lib/store'
import type { Customer, Machine, Employee, CustomerNote } from '@/lib/types'
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
  const [supabaseCustomersList, setSupabaseCustomersList] = useState<Customer[]>([])
  
  // Get Zustand store functions as fallback
  const zustandStore = useAdminStore()
  
  // Check Supabase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const supabase = createClient()
        
        // Check if we have an authenticated user (for admin access)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        // "Auth session missing!" is expected for non-logged-in users - not an error
        const isSessionMissing = authError?.message === 'Auth session missing!'
        
        if (authError && !isSessionMissing) {
          // Only log actual errors, not expected "no session" states
          console.log('[v0] Auth error, using localStorage fallback:', authError.message)
          setIsSupabaseConnected(false)
          setIsLoading(false)
          return
        }
        
        // Supabase is connected (even if no user is logged in)
        setIsSupabaseConnected(true)
        
        if (user) {
          // User is authenticated - Supabase is connected and we can access data
          setIsSupabaseConnected(true)
          // Load customers from Supabase with error handling
          try {
            const customers = await supabaseCustomers.getCustomers()
            setSupabaseCustomersList(customers)
          } catch (fetchErr) {
            console.log('[v0] Error fetching customers:', fetchErr)
            // Still mark as connected, but with empty list
            setSupabaseCustomersList([])
          }
        } else {
          // No auth user - Supabase is connected but user needs to log in
          // For public pages (like onboarding), this is fine
          setIsSupabaseConnected(true)
          setSupabaseCustomersList([])
        }
      } catch (err) {
        console.log('[v0] Supabase connection error, using localStorage fallback:', err)
        setIsSupabaseConnected(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkConnection()
  }, [])
  
  // Refresh data from source
  const refresh = useCallback(async () => {
    if (isSupabaseConnected) {
      const customers = await supabaseCustomers.getCustomers()
      setSupabaseCustomersList(customers)
    }
  }, [isSupabaseConnected])
  
  // Get customers list
  const customers = isSupabaseConnected ? supabaseCustomersList : zustandStore.customers
  
  // Get single customer by ID
  const getCustomer = useCallback((id: string) => {
    if (isSupabaseConnected) {
      return supabaseCustomersList.find(c => c.id === id)
    }
    return zustandStore.customers.find(c => c.id === id)
  }, [isSupabaseConnected, supabaseCustomersList, zustandStore.customers])
  
  // Get customer by onboarding token
  const getCustomerByToken = useCallback((token: string) => {
    if (isSupabaseConnected) {
      return supabaseCustomersList.find(c => c.onboardingToken === token)
    }
    return zustandStore.getCustomerByToken(token)
  }, [isSupabaseConnected, supabaseCustomersList, zustandStore])
  
  // Add customer
  const addCustomer = useCallback(async (customer: Partial<Customer>): Promise<Customer | null> => {
    if (isSupabaseConnected) {
      const newCustomer = await supabaseCustomers.createCustomer(customer)
      if (newCustomer) {
        setSupabaseCustomersList(prev => [newCustomer, ...prev])
      }
      return newCustomer
    }
    zustandStore.addCustomer(customer as Customer)
    return zustandStore.customers[0] // Returns the newly added customer
  }, [isSupabaseConnected, zustandStore])
  
  // Update customer
  // NOTE: supabaseCustomers.updateCustomer already handles machines and employees internally.
  // Do NOT also call syncMachines/syncEmployees - that causes double-writes and duplication.
  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    if (isSupabaseConnected) {
      await supabaseCustomers.updateCustomer(id, updates)
      // Refresh the list to get fresh data
      const customers = await supabaseCustomers.getCustomers()
      setSupabaseCustomersList(customers)
    } else {
      zustandStore.updateCustomer(id, updates)
    }
  }, [isSupabaseConnected, zustandStore])
  
  // Delete customer
  const deleteCustomer = useCallback(async (id: string) => {
    if (isSupabaseConnected) {
      await supabaseCustomers.deleteCustomer(id)
      setSupabaseCustomersList(prev => prev.filter(c => c.id !== id))
    } else {
      zustandStore.deleteCustomer(id)
    }
  }, [isSupabaseConnected, zustandStore])
  
  // Add note
  const addNote = useCallback(async (customerId: string, content: string, createdBy: string) => {
    if (isSupabaseConnected) {
      await supabaseCustomers.addNote(customerId, content, createdBy)
      await refresh()
    } else {
      zustandStore.addNote(customerId, content, createdBy)
    }
  }, [isSupabaseConnected, zustandStore, refresh])
  
  // Update note
  const updateNote = useCallback(async (customerId: string, noteId: string, content: string) => {
    if (isSupabaseConnected) {
      await supabaseCustomers.updateNote(noteId, content)
      await refresh()
    } else {
      zustandStore.updateNote(customerId, noteId, content)
    }
  }, [isSupabaseConnected, zustandStore, refresh])
  
  // Delete note
  const deleteNote = useCallback(async (customerId: string, noteId: string) => {
    if (isSupabaseConnected) {
      await supabaseCustomers.deleteNote(noteId)
      await refresh()
    } else {
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
