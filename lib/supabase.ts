import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(url, anonKey)

// Server-only client with elevated privileges (API routes only)
export function createServiceClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}
