import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('http')
);

// Create browser client for client components with cookie synchronization
export const createBrowserSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) return null;
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Global singleton client for convenience
let browserClientInstance: SupabaseClient | null = null;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? (browserClientInstance || (browserClientInstance = createBrowserSupabase()))
  : null;
