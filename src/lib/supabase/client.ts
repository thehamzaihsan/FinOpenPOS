import { createBrowserClient } from '@supabase/ssr'

const globalForSupabase = globalThis as unknown as {
  supabaseBrowserClient?: ReturnType<typeof createBrowserClient>
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  
  if (!url || !key) {
    throw new Error(
      '@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client! ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
    )
  }
  
  if (!globalForSupabase.supabaseBrowserClient) {
    globalForSupabase.supabaseBrowserClient = createBrowserClient(url, key)
  }

  return globalForSupabase.supabaseBrowserClient
}
