import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { action, email, password, name, role, userId: inputUserId, newPassword } = await request.json()

    if (action === 'create') {
      // Use admin client for user creation (bypasses Cloudflare blocking)
      const adminSupabase = createAdminClient()
      
      // First check if user already exists in admin_profiles
      const { data: existingProfile } = await adminSupabase
        .from('admin_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()
      
      if (existingProfile) {
        return NextResponse.json({ error: 'This user is already an admin' }, { status: 400 })
      }
      
      let finalUserId: string | undefined
      
      // Try to create user via Admin API
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for admin-created users
        user_metadata: {
          name,
          is_admin: true,
        },
      })
      
      if (authError) {
        // If user already exists in auth, try to find them and add to admin_profiles
        if (authError.message.includes('email_exists') || authError.message.includes('already been registered')) {
          // Get the existing user by email
          const { data: users, error: listError } = await adminSupabase.auth.admin.listUsers()
          
          if (listError) {
            return NextResponse.json({ error: 'Failed to look up existing user' }, { status: 400 })
          }
          
          const existingUser = users.users.find(u => u.email === email)
          if (!existingUser) {
            return NextResponse.json({ error: 'User exists but could not be found' }, { status: 400 })
          }
          
          finalUserId = existingUser.id
        } else {
          console.error('Auth admin createUser error:', authError)
          return NextResponse.json({ error: authError.message }, { status: 400 })
        }
      } else {
        if (!authData.user) {
          return NextResponse.json({ error: 'User creation failed' }, { status: 400 })
        }
        finalUserId = authData.user.id
      }
      
      // Create admin profile
      const { error: profileError } = await adminSupabase.from('admin_profiles').insert({
        id: finalUserId,
        name,
        email,
        role: role || 'admin',
      })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
        return NextResponse.json({ 
          error: 'Profile creation failed: ' + profileError.message 
        }, { status: 400 })
      }
      
      return NextResponse.json({ user: { id: finalUserId, email, name } })
    }
    
    const supabase = await createClient()
    let data, error;
    
    if (action === 'list') {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('List admin users error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      return NextResponse.json({ users: data })
    }
    
    if (action === 'reset-password') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/reset-password`,
      })
      
      if (error) {
        console.error('Password reset error:', error)
        // Handle rate limit error with a helpful message
        if (error.message.includes('rate limit') || error.code === 'over_email_send_rate_limit') {
          return NextResponse.json({ 
            error: 'Email rate limit exceeded. Please wait a few minutes before trying again, or use "Set Password Directly" instead.',
            isRateLimit: true 
          }, { status: 429 })
        }
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    if (action === 'update-last-login') {
      if (!inputUserId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      }
      
      // Use admin client to update last_login timestamp
      const adminSupabase = createAdminClient()
      
      const { error } = await adminSupabase
        .from('admin_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', inputUserId)
      
    if (error) {
      console.error('List admin users error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
      
      return NextResponse.json({ success: true })
    }
    
    if (action === 'update-role') {
      if (!inputUserId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      }
      
      // Use admin client to update admin profile
      const adminSupabase = createAdminClient()
      
      const { error } = await adminSupabase
        .from('admin_profiles')
        .update({ name, email, role })
        .eq('id', inputUserId)
      
      if (error) {
        console.error('Update admin profile error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    if (action === 'set-password') {
      if (!inputUserId || !newPassword) {
        return NextResponse.json({ error: 'User ID and new password are required' }, { status: 400 })
      }
      
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      
      // Use admin client to update password
      const adminSupabase = createAdminClient()
      
      const { error } = await adminSupabase.auth.admin.updateUserById(inputUserId, {
        password: newPassword,
      })
      
      if (error) {
        console.error('Set password error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    // Silently handle aborted requests (client disconnected)
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(null, { status: 499 }) // Client Closed Request
    }
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient()
    
    const { data, error } = await adminSupabase
      .from('admin_profiles')
      .select('*')
      .order('created_at', { ascending: true })
    
      if (error) {
        console.error('List admin users error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    
    return NextResponse.json({ users: data || [] })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(null, { status: 499 })
    }
    console.error('Admin users API GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient()
    
    const { error } = await adminSupabase
      .from('admin_profiles')
      .delete()
      .eq('id', userId)
    
    if (error) {
      console.error('[v0] Delete admin profile error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Admin users API DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
