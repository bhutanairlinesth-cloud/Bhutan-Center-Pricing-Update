import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/$/, '');
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'bhutan-center-pricing-auth',
    },
  },
);

function friendlyAuthError(message?: string): string {
  if (!message) return 'เข้าสู่ระบบไม่สำเร็จ';
  if (/invalid login credentials/i.test(message)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (/email not confirmed/i.test(message)) return 'บัญชียังไม่ได้ยืนยันอีเมล';
  if (/failed to fetch/i.test(message)) return 'เชื่อมต่อ Supabase ไม่สำเร็จ กรุณาตรวจ Project URL';
  return message;
}

export const supabaseAuth = {
  async signInWithPassword(email: string, password: string): Promise<Session> {
    if (!isSupabaseConfigured) {
      throw new Error('ยังไม่ได้ตั้งค่า Supabase ใน Vercel');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyAuthError(error.message));
    if (!data.session) throw new Error('Supabase ไม่ได้ส่ง Session กลับมา');
    return data.session;
  },
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  },
  async getUser(): Promise<SupabaseUser | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  },
  async signOut(): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  },
};

export async function fetchProfile(userId: string): Promise<any> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`อ่าน Profile ไม่สำเร็จ: ${error.message}`);
  if (!data) throw new Error('เข้าสู่ระบบสำเร็จ แต่ยังไม่มี Profile ในตาราง profiles');
  return data;
}
