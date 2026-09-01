import { createClient } from '@supabase/supabase-js';

function supabaseConfig() {
  const url = String(
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim().replace(/\/$/, '');
  const serviceRole = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const anonKey = String(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  return { url, serviceRole, anonKey };
}

/**
 * Server Supabase client.
 * - Prefer Service Role when configured (existing production behaviour).
 * - Fall back to the existing anon/publishable key for safe RLS-backed routes.
 * - When accessToken is supplied in fallback mode, database requests are made as
 *   the signed-in user so staff-only RLS policies can apply.
 */
export function getServerSupabase(accessToken?: string) {
  const { url, serviceRole, anonKey } = supabaseConfig();
  const key = serviceRole || anonKey;
  if (!url || !key) return null;

  const globalHeaders = !serviceRole && accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    ...(globalHeaders ? { global: { headers: globalHeaders } } : {}),
  });
}

export function hasServiceRole() {
  return Boolean(String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim());
}

export function hasServerSupabase() {
  const { url, serviceRole, anonKey } = supabaseConfig();
  return Boolean(url && (serviceRole || anonKey));
}

export function serverSupabaseMode(): 'service_role' | 'rls_fallback' | 'missing' {
  const { url, serviceRole, anonKey } = supabaseConfig();
  if (!url) return 'missing';
  if (serviceRole) return 'service_role';
  if (anonKey) return 'rls_fallback';
  return 'missing';
}
