import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config";

/**
 * Service-role Supabase client. SERVER ONLY — bypasses RLS.
 * Never expose this (or the service-role key) to the browser.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  if (!config.supabase.url || !config.supabase.secretKey) {
    throw new Error(
      "Supabase admin client needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (legacy SUPABASE_SERVICE_ROLE_KEY also accepted).",
    );
  }
  _client = createClient(config.supabase.url, config.supabase.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
