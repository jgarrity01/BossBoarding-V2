'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser, signIn as signInAuth, signOut as signOutAuth, type AdminUser } from '@/lib/supabase/auth'

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const supabase = createClient()
    
    // Get initial user
    getCurrentUser().then(user => {
      setUser(user)
      setIsLoading(false)
    })
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const adminUser = await getCurrentUser()
        setUser(adminUser)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    const result = await signInAuth(email, password)
    if (result.user) {
      const adminUser = await getCurrentUser()
      setUser(adminUser)
    }
    setIsLoading(false)
    return result
  }
  
  const signOut = async () => {
    setIsLoading(true)
    await signOutAuth()
    setUser(null)
    setIsLoading(false)
  }
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
  }
}
