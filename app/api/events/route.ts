import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/server-supabase';

const ALLOWED = new Set(['page_view','package_view','line_click','lead_submit','contact_click']);

export async function POST(request: NextRequest) {
  const supabase = getServerSupabase();
  if (!supabase || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ ok: true, stored: false });
  const body = await request.json().catch(() => ({}));
  const eventName = String(body.event_name || '');
  if (!ALLOWED.has(eventName)) return NextResponse.json({ ok: false }, { status: 400 });
  const row = {
    visitor_id: String(body.visitor_id || '').slice(0, 120),
    session_id: String(body.session_id || '').slice(0, 120),
    event_name: eventName,
    page_path: String(body.page_path || '').slice(0, 400),
    package_slug: String(body.package_slug || '').slice(0, 120) || null,
    source: String(body.source || '').slice(0, 160) || null,
    campaign: String(body.campaign || '').slice(0, 160) || null,
    metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata : {},
    user_agent: String(request.headers.get('user-agent') || '').slice(0, 500),
  };
  const { error } = await supabase.from('website_events').insert(row);
  if (error) return NextResponse.json({ ok: true, stored: false, error: error.code });
  return NextResponse.json({ ok: true, stored: true });
}
