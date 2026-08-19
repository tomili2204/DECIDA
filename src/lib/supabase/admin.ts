import { createClient } from '@supabase/supabase-js'

// Note: This client uses the service role key and should ONLY be used in Server Actions or API routes.
// It bypasses Row Level Security (RLS). NEVER expose this to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
