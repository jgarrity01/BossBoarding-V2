import { createClient } from './client'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      return { user: null, error: error.message }
    }
    
    return { user: data.user, error: null }
  } catch (e) {
    console.error('[v0] signIn error:', e)
    return { user: null, error: 'Failed to connect to authentication service' }
  }
}

// Sign out
export async function signOut() {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    return { error: error?.message || null }
  } catch (e) {
    console.error('[v0] signOut error:', e)
    return { error: 'Failed to sign out' }
  }
}

// Get current user
export async function getCurrentUser(): Promise<AdminUser | null> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    // Get admin profile
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      return {
        id: user.id,
        email: user.email || '',
        name: profile.name,
        role: profile.role,
        avatar: profile.avatar,
      }
    }
    
    // Return basic user info if no profile exists
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Admin',
      role: 'admin',
    }
  } catch (e) {
    console.error('[v0] getCurrentUser error:', e)
    return null
  }
}

// Create admin user (for initial setup)
export async function createAdminUser(email: string, password: string, name: string) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
          `${typeof window !== 'undefined' ? window.location.origin : ''}/admin`,
        data: {
          name,
          is_admin: true,
        },
      },
    })
    
    if (error) {
      return { user: null, error: error.message }
    }
    
    // Create admin profile
    if (data.user) {
      await supabase.from('admin_profiles').insert({
        id: data.user.id,
        name,
        email,
        role: 'admin',
      })
    }
    
    return { user: data.user, error: null }
  } catch (e) {
    console.error('[v0] createAdminUser error:', e)
    const errorMessage = e instanceof Error ? e.message : String(e)
    if (errorMessage.includes('Load failed') || errorMessage.includes('fetch')) {
      return { user: null, error: 'Failed to connect to authentication service. Please check Supabase configuration.' }
    }
    return { user: null, error: errorMessage || 'Failed to create admin user' }
  }
}

// Update admin profile
export async function updateAdminProfile(id: string, updates: Partial<AdminUser>) {
  try {
    const supabase = createClient()
    
    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar
    
    const { error } = await supabase
      .from('admin_profiles')
      .update(dbUpdates)
      .eq('id', id)
    
    return { error: error?.message || null }
  } catch (e) {
    console.error('[v0] updateAdminProfile error:', e)
    return { error: 'Failed to update profile' }
  }
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return false
    
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    
    return !!profile
  } catch (e) {
    console.error('[v0] isAdmin error:', e)
    return false
  }
}

// Get all admin users
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error || !data) {
      return []
    }
    
    return data.map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatar: profile.avatar,
    }))
  } catch (e) {
    console.error('[v0] getAdminUsers error:', e)
    return []
  }
}

// Update password for current authenticated user
export async function updateCurrentUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) {
      console.error('[v0] Error updating password:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (e) {
    console.error('[v0] updateCurrentUserPassword error:', e)
    return { success: false, error: 'Failed to update password' }
  }
}

// Send password reset email to a user
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/admin/reset-password`,
    })
    
    if (error) {
      console.error('[v0] Error sending reset email:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (e) {
    console.error('[v0] sendPasswordResetEmail error:', e)
    return { success: false, error: 'Failed to send reset email' }
  }
}

// Delete admin user profile
export async function deleteAdminProfile(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('admin_profiles')
      .delete()
      .eq('id', userId)
    
    if (error) {
      console.error('[v0] Error deleting admin profile:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (e) {
    console.error('[v0] deleteAdminProfile error:', e)
    return { success: false, error: 'Failed to delete profile' }
  }
}
