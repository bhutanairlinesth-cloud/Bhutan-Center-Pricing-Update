const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const SESSION_KEY = 'bhutan_supabase_session';

type Session = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: { id: string; email?: string };
};

function readSession(): Session | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
function saveSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

async function request(path: string, init: RequestInit = {}, authenticated = true) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const session = readSession();
  const headers = new Headers(init.headers);
  headers.set('apikey', supabaseAnonKey!);
  headers.set('Content-Type', 'application/json');
  if (authenticated && session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);

  const response = await fetch(`${supabaseUrl}${path}`, { ...init, headers });
  if (!response.ok) {
    let message = `Supabase request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message || body.error_description || body.error || body.hint || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const supabaseAuth = {
  async signInWithPassword(email: string, password: string): Promise<Session> {
    const data = await request('/auth/v1/token?grant_type=password', {
      method: 'POST', body: JSON.stringify({ email, password })
    }, false);
    const session: Session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      user: data.user,
    };
    saveSession(session);
    return session;
  },
  async getSession(): Promise<Session | null> {
    return readSession();
  },
  async signOut(): Promise<void> {
    const session = readSession();
    if (session?.access_token) {
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
  if (!rows[0]) throw new Error('ไม่พบ Profile ของผู้ใช้งาน กรุณาเพิ่มข้อมูลในตาราง profiles');
  return rows[0];
}
