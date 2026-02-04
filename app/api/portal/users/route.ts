import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - List portal users for a customer
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('customer_users')
      .select('id, name, email, role, is_active, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching portal users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    return NextResponse.json({ users: data || [] })
  } catch (error) {
    console.error('Portal users GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new portal user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, name, email, password, role = 'staff' } = body
    
    if (!customerId || !name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Check if email already exists for this customer
    const { data: existing } = await supabase
      .from('customer_users')
      .select('id')
      .eq('customer_id', customerId)
      .eq('email', email)
      .single()
    
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Create the user
    const { data, error } = await supabase
      .from('customer_users')
      .insert({
        customer_id: customerId,
        name,
        email,
        password_hash: passwordHash,
        role,
        is_active: true,
      })
      .select('id, name, email, role, is_active, created_at')
      .single()
    
    if (error) {
      console.error('Error creating portal user:', error)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
    
    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Portal users POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update portal user (password reset, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, newPassword, email } = body

    if (action === 'set-password') {
      if (!userId || !newPassword) {
        return NextResponse.json({ error: 'User ID and new password required' }, { status: 400 })
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(newPassword, 10)

      const { error } = await supabase
        .from('customer_users')
        .update({ password_hash: passwordHash })
        .eq('id', userId)

      if (error) {
        console.error('Error setting password:', error)
        return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'send-reset-email') {
      if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 })
      }

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('customer_users')
        .select('id, name, email, customer_id')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Get customer details for the email
      const { data: customer } = await supabase
        .from('customers')
        .select('business_name')
        .eq('id', user.customer_id)
        .single()

      // Generate a reset token (simple implementation - store hash in user record)
      const resetToken = crypto.randomUUID()
      const resetTokenHash = await bcrypt.hash(resetToken, 10)
      const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

      // Store the reset token hash
      const { error: updateError } = await supabase
        .from('customer_users')
        .update({ 
          reset_token_hash: resetTokenHash,
          reset_token_expiry: resetExpiry,
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error storing reset token:', updateError)
        return NextResponse.json({ error: 'Failed to generate reset link' }, { status: 500 })
      }

      // Send email via Resend
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com'
      const resetLink = `${siteUrl}/portal/reset-password?token=${resetToken}&userId=${userId}`

      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Laundry Boss <noreply@thelaundryboss.com>',
          to: user.email,
          subject: 'Reset Your Customer Portal Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>Hello ${user.name},</p>
              <p>We received a request to reset your password for the ${customer?.business_name || 'Customer'} portal.</p>
              <p>Click the button below to reset your password:</p>
              <div style="margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
              <p style="color: #999; font-size: 12px;">The Laundry Boss Team</p>
            </div>
          `,
        })

        return NextResponse.json({ success: true, message: 'Reset email sent' })
      } catch (emailError) {
        console.error('Error sending reset email:', emailError)
        return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Portal users PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a portal user
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('customer_users')
      .delete()
      .eq('id', userId)
    
    if (error) {
      console.error('Error deleting portal user:', error)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Portal users DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
