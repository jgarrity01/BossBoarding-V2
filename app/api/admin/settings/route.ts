import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
    
    if (error) {
      console.error('Get settings error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Convert array of {key, value} to object
    const settings: Record<string, unknown> = {}
    for (const row of data || []) {
      settings[row.key] = row.value
    }
    
    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(null, { status: 499 })
    }
    console.error('Settings API GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json()
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }
    
    const adminSupabase = createAdminClient()
    
    // Upsert the setting
    const { error } = await adminSupabase
      .from('app_settings')
      .upsert({ 
        key, 
        value,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'key' 
      })
    
    if (error) {
      console.error('Save setting error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(null, { status: 499 })
    }
    console.error('Settings API POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Bulk save multiple settings at once
export async function PUT(request: Request) {
  try {
    const { settings } = await request.json()
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 })
    }
    
    const adminSupabase = createAdminClient()
    
    // Convert settings object to array of upsert rows
    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString()
    }))
    
    const { error } = await adminSupabase
      .from('app_settings')
      .upsert(rows, { onConflict: 'key' })
    
    if (error) {
      console.error('Bulk save settings error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(null, { status: 499 })
    }
    console.error('Settings API PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
