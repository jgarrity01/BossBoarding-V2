import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { token, userId, newPassword } = await request.json()

    if (!token || !userId || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Get the user and verify the reset token
    const { data: user, error: userError } = await supabase
      .from('customer_users')
      .select('id, reset_token_hash, reset_token_expiry')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.reset_token_hash) {
      return NextResponse.json({ error: 'No password reset requested' }, { status: 400 })
    }

    // Check if token has expired
    if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    // Verify the token
    const isValidToken = await bcrypt.compare(token, user.reset_token_hash)
    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid reset link' }, { status: 400 })
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update the password and clear the reset token
    const { error: updateError } = await supabase
      .from('customer_users')
      .update({
        password_hash: passwordHash,
        reset_token_hash: null,
        reset_token_expiry: null,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
