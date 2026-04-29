import { createClient, SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/**
 * Browser-side Supabase client (uses public anon key).
 * Lazily instantiated so missing env vars don't crash module load.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  browserClient = createClient(url, key, {
    auth: { persistSession: false },
    global: {
      // Bypass the browser HTTP cache so Supabase REST responses are never
      // served as 304 Not Modified (stale/empty data on repeated mounts).
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
  return browserClient;
}

/**
 * Server-side Supabase client (per-request). Uses anon key by default;
 * if a service role key is configured, prefers that for write operations.
 */
export function getServerSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
