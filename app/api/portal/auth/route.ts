import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { action, email, password, customerId, name, role, userId, newPassword } = await request.json()
    const supabase = await createClient()

    if (action === 'login') {
      // Use admin client to bypass RLS for authentication
      const adminSupabase = createAdminClient()
      
      // Authenticate customer user
      const { data, error } = await adminSupabase
        .from('customer_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.error('Portal login error:', error)
        return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 })
      }
      
      if (!data) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      // Verify password
      const isValid = await bcrypt.compare(password, data.password_hash)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      // Update last login
      await adminSupabase
        .from('customer_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.id)

      // Fetch the associated customer
      const { data: customer } = await adminSupabase
        .from('customers')
        .select('*')
        .eq('id', data.customer_id)
        .maybeSingle()

      return NextResponse.json({
        user: {
          id: data.id,
          customerId: data.customer_id,
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.is_active,
          lastLoginAt: new Date().toISOString(),
          createdAt: data.created_at,
        },
        customer,
      })
    }

    if (action === 'register') {
      // Use admin client to bypass RLS for user creation
      const adminSupabase = createAdminClient()
      
      // Check if user with this email already exists for this customer
      const { data: existingUser, error: checkError } = await adminSupabase
        .from('customer_users')
        .select('id')
        .eq('email', email)
        .eq('customer_id', customerId)
        .maybeSingle()
      
      if (checkError) {
        console.error('Error checking existing user:', checkError)
      }
      
      if (existingUser) {
        return NextResponse.json({ error: 'A user with this email already exists for this customer' }, { status: 400 })
      }
      
      // Create new customer user with hashed password
      const passwordHash = await bcrypt.hash(password, 10)

      const { data, error } = await adminSupabase
        .from('customer_users')
        .insert({
          customer_id: customerId,
          name,
          email,
          password_hash: passwordHash,
          role: role || 'owner',
          is_active: true,
        })
        .select()
        .maybeSingle()

      if (error) {
        console.error('Register customer user error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      
      if (!data) {
        console.error('No data returned after insert')
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      
      return NextResponse.json({
        user: {
          id: data.id,
          customerId: data.customer_id,
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.is_active,
          lastLoginAt: data.last_login_at,
          createdAt: data.created_at,
        },
      })
    }

    if (action === 'updatePassword') {
      // Use admin client to bypass RLS
      const adminSupabase = createAdminClient()
      const passwordHash = await bcrypt.hash(newPassword, 10)

      // Support updating by userId OR by email+customerId (for onboarding)
      let updateQuery = adminSupabase
        .from('customer_users')
        .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      
      if (userId) {
        updateQuery = updateQuery.eq('id', userId)
      } else if (email && customerId) {
        updateQuery = updateQuery.eq('email', email).eq('customer_id', customerId)
      } else {
        return NextResponse.json({ error: 'User ID or email+customerId required' }, { status: 400 })
      }

      const { error } = await updateQuery

      if (error) {
        console.error('Update password error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Portal auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
