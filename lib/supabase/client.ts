import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    // Return a mock client that throws on use - this prevents crashes during SSR
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
        getSession: async () => ({ data: { session: null }, error: { message: 'Supabase not configured' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      }),
    } as unknown as ReturnType<typeof createBrowserClient>
  }
  
  return createBrowserClient(url, key)
}

// Admin client with service role key - bypasses RLS
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    // Return a mock client that returns empty results - prevents crashes when env vars are missing
    const mockQuery = () => ({
      select: () => mockQuery(),
      insert: () => mockQuery(),
      update: () => mockQuery(),
      delete: () => mockQuery(),
      eq: () => mockQuery(),
      in: () => mockQuery(),
      order: () => mockQuery(),
      single: () => mockQuery(),
      maybeSingle: () => mockQuery(),
      then: (resolve: (value: { data: null; error: { message: string } }) => void) => {
        resolve({ data: null, error: { message: 'Supabase admin not configured' } })
      },
      data: null,
      error: { message: 'Supabase admin not configured' },
    })
    
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: { message: 'Supabase admin not configured' } }),
        admin: {
          createUser: async () => ({ data: { user: null }, error: { message: 'Supabase admin not configured' } }),
          deleteUser: async () => ({ data: { user: null }, error: { message: 'Supabase admin not configured' } }),
        },
      },
      from: () => mockQuery(),
    } as unknown as ReturnType<typeof createSupabaseClient>
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
