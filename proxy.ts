import { type NextRequest, NextResponse } from 'next/server'

async function proxy(request: NextRequest) {
  // Only run Supabase session middleware if env vars are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const { updateSession } = await import('@/lib/supabase/middleware')
      return await updateSession(request)
    } catch {
      // Supabase middleware failed, continue without it
    }
  }

  return NextResponse.next({ request })
}

export default proxy

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
