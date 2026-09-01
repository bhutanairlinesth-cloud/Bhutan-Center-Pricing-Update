import { createClient } from '@supabase/supabase-js';

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function friendlyError(message: string): string {
  if (/already.*registered|already been registered|user.*exists/i.test(message)) return 'อีเมลนี้มีบัญชีอยู่แล้ว';
  if (/password/i.test(message) && /short|least|characters/i.test(message)) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
  if (/invalid.*email/i.test(message)) return 'รูปแบบอีเมลไม่ถูกต้อง';
  return message || 'ดำเนินการผู้ใช้งานไม่สำเร็จ';
}

function send(response: any, status: number, body: Record<string, unknown>) {
  response.setHeader('Cache-Control', 'no-store');
  return response.status(status).json(body);
}

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') return send(response, 405, { error: 'Method not allowed' });

  const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  if (!supabaseUrl || !serviceRoleKey) {
    return send(response, 500, { error: 'ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ใน Vercel' });
  }

  const authorization = String(request.headers?.authorization || '');
  const accessToken = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!accessToken) return send(response, 401, { error: 'ไม่พบ Session ผู้ใช้งาน' });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !authData.user) return send(response, 401, { error: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' });

  const callerId = authData.user.id;
  const { data: callerProfile, error: callerError } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', callerId)
    .maybeSingle();
  if (callerError || callerProfile?.role !== 'admin') {
    return send(response, 403, { error: 'เฉพาะ Admin เท่านั้นที่จัดการผู้ใช้งานได้' });
  }

  const body = typeof request.body === 'string'
    ? (() => { try { return JSON.parse(request.body); } catch { return {}; } })()
    : (request.body || {});
  const action = String(body.action || '');

  try {
    if (action === 'create') {
      const name = String(body.name || '').trim();
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');
      const role = body.role === 'admin' ? 'admin' : 'sales';

      if (!name) return send(response, 400, { error: 'กรุณากรอกชื่อผู้ใช้งาน' });
      if (!/^\S+@\S+\.\S+$/.test(email)) return send(response, 400, { error: 'รูปแบบอีเมลไม่ถูกต้อง' });
      if (password.length < 8) return send(response, 400, { error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
      });
      if (error || !data.user) throw new Error(friendlyError(error?.message || 'สร้างบัญชีไม่สำเร็จ'));

      const createdAt = data.user.created_at || new Date().toISOString();
      const { error: profileError } = await admin.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        role,
        created_at: createdAt,
        updated_at: new Date().toISOString(),
      });
      if (profileError) {
        await admin.auth.admin.deleteUser(data.user.id);
        throw new Error(`สร้าง Profile ไม่สำเร็จ: ${profileError.message}`);
      }

      return send(response, 200, { user: { id: data.user.id, name, email, role, created_at: createdAt } });
    }

    if (action === 'delete') {
      const userId = String(body.userId || '');
      if (!userId) return send(response, 400, { error: 'ไม่พบรหัสผู้ใช้งาน' });
      if (userId === callerId) return send(response, 400, { error: 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้' });

      const { data: target } = await admin.from('profiles').select('id, role').eq('id', userId).maybeSingle();
      if (target?.role === 'admin') {
        const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
        if ((count || 0) <= 1) return send(response, 400, { error: 'ต้องมีบัญชี Admin อย่างน้อย 1 บัญชี' });
      }

      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw new Error(friendlyError(error.message));
      await admin.from('profiles').delete().eq('id', userId);
      return send(response, 200, { success: true });
    }

    return send(response, 400, { error: 'คำสั่งไม่ถูกต้อง' });
  } catch (error: any) {
    return send(response, 400, { error: friendlyError(String(error?.message || error)) });
  }
}
