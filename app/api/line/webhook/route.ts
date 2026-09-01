import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getServerSupabase } from '@/lib/server-supabase';

function validSignature(raw: string, signature: string) {
  const secret = String(process.env.LINE_CHANNEL_SECRET || '');
  if (!secret || !signature) return false;
  const digest = crypto.createHmac('sha256', secret).update(raw).digest('base64');
  try { return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature)); } catch { return false; }
}

async function lineProfile(userId: string) {
  const token = String(process.env.LINE_CHANNEL_ACCESS_TOKEN || '');
  if (!token) return null;
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${encodeURIComponent(userId)}`, { headers: { Authorization: `Bearer ${token}` }, cache:'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get('x-line-signature') || '';
  if (!validSignature(raw, signature)) return NextResponse.json({ error:'invalid signature' }, { status:401 });
  const supabase = getServerSupabase();
  if (!supabase || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error:'server not configured' }, { status:500 });
  const payload = JSON.parse(raw || '{}');
  const events = Array.isArray(payload.events) ? payload.events : [];

  for (const event of events) {
    const lineUserId = String(event?.source?.userId || '');
    if (!lineUserId) continue;
    const profile = await lineProfile(lineUserId);
    const now = new Date().toISOString();
    const status = event.type === 'unfollow' ? 'blocked' : 'friend';
    await supabase.from('line_contacts').upsert({
      line_user_id: lineUserId,
      display_name: String(profile?.displayName || ''),
      picture_url: String(profile?.pictureUrl || ''),
      status,
      last_event_type: String(event.type || ''),
      last_seen_at: now,
      updated_at: now,
    }, { onConflict:'line_user_id' });

    let messageText = '';
    if (event.type === 'message' && event.message?.type === 'text') messageText = String(event.message.text || '');
    const refMatch = messageText.match(/Ref:\s*([A-Za-z0-9_-]+)/i);
    const visitorId = refMatch?.[1] || null;
    if (visitorId) {
      await supabase.from('line_contacts').update({ visitor_id: visitorId, updated_at: now }).eq('line_user_id', lineUserId);
    }
    await supabase.from('line_events').insert({
      line_user_id: lineUserId,
      event_type: String(event.type || ''),
      message_type: String(event.message?.type || ''),
      message_text: messageText || null,
      visitor_id: visitorId,
      raw_event: event,
    });
  }
  return NextResponse.json({ ok:true });
}
