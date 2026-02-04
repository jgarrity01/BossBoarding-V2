import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    
    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient()
    
    let query = adminSupabase
      .from('customer_users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (customerId) {
      query = query.eq('customer_id', customerId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('[v0] List customer users error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Map to frontend format
    const users = (data || []).map(row => ({
      id: row.id,
      customerId: row.customer_id,
      name: row.name,
      email: row.email,
      role: row.role,
      isActive: row.is_active,
      lastLogin: row.last_login_at, // Map to lastLogin for frontend
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      passwordSet: !!row.password_hash,
    }))
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('[v0] Customer users API GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, name, email, password, role = 'owner' } = body
    
    if (!customerId || !name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const adminSupabase = createAdminClient()
    
    // Check if user already exists
    const { data: existing } = await adminSupabase
      .from('customer_users')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Create user
    const { data, error } = await adminSupabase
      .from('customer_users')
      .insert({
        customer_id: customerId,
        name,
        email,
        password_hash: passwordHash,
        role,
        is_active: true,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating customer user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      user: {
        id: data.id,
        customerId: data.customer_id,
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.is_active,
        createdAt: data.created_at,
        passwordSet: true,
      }
    })
  } catch (error) {
    console.error('Error in customer users API POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const adminSupabase = createAdminClient()
    
    const { error } = await adminSupabase
      .from('customer_users')
      .delete()
      .eq('id', userId)
    
    if (error) {
      console.error('Delete customer user error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Customer users API DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
