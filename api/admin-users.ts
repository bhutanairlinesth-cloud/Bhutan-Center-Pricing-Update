import { createClient } from '@supabase/supabase-js';

function json(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function friendlyError(message: string): string {
  if (/already.*registered|already been registered|user.*exists/i.test(message)) return 'อีเมลนี้มีบัญชีอยู่แล้ว';
  if (/password/i.test(message) && /short|least|characters/i.test(message)) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
  if (/invalid.*email/i.test(message)) return 'รูปแบบอีเมลไม่ถูกต้อง';
  return message || 'ดำเนินการผู้ใช้งานไม่สำเร็จ';
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
    const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ใน Vercel' }, 500);
    }

    const authorization = request.headers.get('authorization') || '';
    const accessToken = authorization.replace(/^Bearer\s+/i, '').trim();
    if (!accessToken) return json({ error: 'ไม่พบ Session ผู้ใช้งาน' }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !authData.user) return json({ error: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' }, 401);

    const callerId = authData.user.id;
    const { data: callerProfile, error: callerError } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', callerId)
      .maybeSingle();
    if (callerError || callerProfile?.role !== 'admin') {
      return json({ error: 'เฉพาะ Admin เท่านั้นที่จัดการผู้ใช้งานได้' }, 403);
    }

    let body: any = {};
    try { body = await request.json(); } catch { return json({ error: 'ข้อมูลคำขอไม่ถูกต้อง' }, 400); }
    const action = String(body.action || '');

    try {
      if (action === 'create') {
        const name = String(body.name || '').trim();
        const email = normalizeEmail(body.email);
        const password = String(body.password || '');
        const role = body.role === 'admin' ? 'admin' : 'sales';

        if (!name) return json({ error: 'กรุณากรอกชื่อผู้ใช้งาน' }, 400);
        if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, 400);
        if (password.length < 8) return json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, 400);

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

        return json({ user: { id: data.user.id, name, email, role, created_at: createdAt } });
      }

      if (action === 'delete') {
        const userId = String(body.userId || '');
        if (!userId) return json({ error: 'ไม่พบรหัสผู้ใช้งาน' }, 400);
        if (userId === callerId) return json({ error: 'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่ได้' }, 400);

        const { data: target } = await admin.from('profiles').select('id, role').eq('id', userId).maybeSingle();
        if (target?.role === 'admin') {
          const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
          if ((count || 0) <= 1) return json({ error: 'ต้องมีบัญชี Admin อย่างน้อย 1 บัญชี' }, 400);
        }

        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) throw new Error(friendlyError(error.message));
        await admin.from('profiles').delete().eq('id', userId);
        return json({ success: true });
      }

      return json({ error: 'คำสั่งไม่ถูกต้อง' }, 400);
    } catch (error: any) {
      return json({ error: friendlyError(String(error?.message || error)) }, 400);
    }
  },
};
