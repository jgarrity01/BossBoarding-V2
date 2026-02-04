import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const customerId = formData.get('customerId') as string
    const type = formData.get('type') as string || 'media'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate a unique filename with customer context
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = customerId 
      ? `customers/${customerId}/${type}/${timestamp}-${safeName}`
      : `uploads/${type}/${timestamp}-${safeName}`

    // Convert file to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    
    console.log('[v0] Uploading file:', filename, 'size:', arrayBuffer.byteLength, 'type:', file.type)
    
    // Upload directly to Supabase Storage REST API (bypassing SDK)
    const uploadUrl = `${supabaseUrl}/storage/v1/object/media/${filename}`
    console.log('[v0] Upload URL:', uploadUrl)
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: arrayBuffer,
    })

    console.log('[v0] Upload response status:', uploadResponse.status)
    const responseText = await uploadResponse.text()
    console.log('[v0] Upload response body:', responseText)

    if (!uploadResponse.ok) {
      console.error('[v0] Supabase storage error:', uploadResponse.status, responseText)
      return NextResponse.json({ error: `Upload failed: ${responseText}` }, { status: uploadResponse.status })
    }

    // Parse response if it's JSON
    let responseData = null
    try {
      responseData = JSON.parse(responseText)
    } catch {
      // Response might not be JSON
    }
    console.log('[v0] Upload response data:', responseData)

    // Construct public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/media/${filename}`
    console.log('[v0] Public URL:', publicUrl)

    return NextResponse.json({
      url: publicUrl,
      pathname: filename,
      contentType: file.type,
      size: file.size,
      name: file.name,
    })
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
