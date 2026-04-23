import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: SupabaseClient | undefined;
};

/**
 * Cliente service-role: bypassa RLS. Use SOMENTE no servidor.
 * Tenant scoping é responsabilidade do BaseRepo (filtra por org_id em toda query).
 */
export const supabaseAdmin =
  globalForSupabase.supabaseAdmin ??
  createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

if (env.NODE_ENV !== "production") globalForSupabase.supabaseAdmin = supabaseAdmin;
