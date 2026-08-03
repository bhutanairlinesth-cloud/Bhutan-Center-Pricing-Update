const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const supabasePublicKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublicKey);
const SESSION_KEY = 'bhutan_supabase_session_v3';

type Session = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  user: { id: string; email?: string };
};

function readSession(): Session | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
function saveSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

async function parseError(response: Response) {
  let message = `Supabase request failed (${response.status})`;
  try {
    const body = await response.json();
    message = body.message || body.error_description || body.error || body.hint || message;
  } catch { /* ignore */ }
  return new Error(message);
}

async function refreshSession(session: Session): Promise<Session | null> {
  if (!session.refresh_token || !isSupabaseConfigured) return session;
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: supabasePublicKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) {
    saveSession(null);
    return null;
  }
  const data = await response.json();
  const next: Session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || session.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600),
    expires_in: data.expires_in,
    user: data.user || session.user,
  };
  saveSession(next);
  return next;
}

async function validSession(): Promise<Session | null> {
  const session = readSession();
  if (!session) return null;
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at <= now + 60) return refreshSession(session);
  return session;
}

async function request(path: string, init: RequestInit = {}, authenticated = true) {
  if (!isSupabaseConfigured) {
    throw new Error('ยังไม่ได้ตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY ใน Vercel');
  }
  const session = authenticated ? await validSession() : readSession();
  const headers = new Headers(init.headers);
  headers.set('apikey', supabasePublicKey!);
  headers.set('Content-Type', 'application/json');
  if (authenticated) {
    if (!session?.access_token) throw new Error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${supabaseUrl}${path}`, { ...init, headers });
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const supabaseAuth = {
  async signInWithPassword(email: string, password: string): Promise<Session> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: supabasePublicKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw await parseError(response);
    const data = await response.json();
    const session: Session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600),
      expires_in: data.expires_in,
      user: data.user,
    };
    saveSession(session);
    return session;
  },
  async getSession(): Promise<Session | null> {
    return validSession();
  },
  async signOut(): Promise<void> {
    const session = readSession();
    if (session?.access_token && isSupabaseConfigured) {
      try { await request('/auth/v1/logout', { method: 'POST' }); } catch { /* clear locally anyway */ }
    }
    saveSession(null);
  },
};

export async function selectRows(table: string, query = ''): Promise<any[]> {
  return request(`/rest/v1/${table}?${query}`, { method: 'GET' });
}

export async function upsertRows(table: string, rows: any | any[]): Promise<any> {
  return request(`/rest/v1/${table}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(rows),
  });
}

export async function deleteRows(table: string, query: string): Promise<void> {
  await request(`/rest/v1/${table}?${query}`, {
    method: 'DELETE', headers: { Prefer: 'return=minimal' }
  });
}

export async function fetchProfile(userId: string): Promise<any> {
  const rows = await selectRows('profiles', `id=eq.${encodeURIComponent(userId)}&select=*`);
  if (!rows[0]) {
    throw new Error('บัญชีเข้าสู่ระบบได้แล้ว แต่ยังไม่มี Profile กรุณารันไฟล์ supabase/production_setup.sql ใน SQL Editor หนึ่งครั้ง');
  }
  return rows[0];
}
