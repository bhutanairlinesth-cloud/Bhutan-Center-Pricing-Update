import { NextRequest } from 'next/server';
import { getServerSupabase } from './server-supabase';

export async function requireStaff(request: NextRequest, adminOnly = false) {
  const token = String(request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw Object.assign(new Error('Unauthorized'), { status: 401 });

  // In production we prefer Service Role. If it is not configured yet, use the
  // existing publishable/anon key with the signed-in user's JWT and RLS.
  const supabase = getServerSupabase(token);
  if (!supabase) {
    throw Object.assign(new Error('Server Supabase is not configured'), { status: 500 });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw Object.assign(new Error('Unauthorized'), { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', data.user.id)
    .maybeSingle();
  if (profileError || !profile) {
    throw Object.assign(new Error(`Profile not found${profileError?.code ? ` (${profileError.code})` : ''}`), { status: 403 });
  }
  if (adminOnly && profile.role !== 'admin') throw Object.assign(new Error('Admin only'), { status: 403 });
  if (!['admin','sales'].includes(profile.role)) throw Object.assign(new Error('Forbidden'), { status: 403 });
  return { supabase, user: data.user, profile };
}
