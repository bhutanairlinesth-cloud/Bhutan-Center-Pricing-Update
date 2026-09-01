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
    const { data: existingContact } = await supabase.from('line_contacts').select('tags,visitor_id').eq('line_user_id',lineUserId).maybeSingle();
    const baseTags = new Set<string>(Array.isArray(existingContact?.tags) ? existingContact.tags : []);
    if(event.type==='follow') baseTags.add('LINE Friend');
    if(event.type==='message') baseTags.add('LINE Engaged');
    await supabase.from('line_contacts').upsert({
      line_user_id: lineUserId,
      display_name: String(profile?.displayName || ''),
      picture_url: String(profile?.pictureUrl || ''),
      status,
      tags:[...baseTags],
      last_event_type: String(event.type || ''),
      last_seen_at: now,
      updated_at: now,
    }, { onConflict:'line_user_id' });

    let messageText = '';
    if (event.type === 'message' && event.message?.type === 'text') messageText = String(event.message.text || '');
    const refMatch = messageText.match(/Ref:\s*([A-Za-z0-9_-]+)/i);
    const visitorId = refMatch?.[1] || null;
    if (visitorId) {
      const tagResult = await supabase.from('website_visitor_tags').select('tag').eq('visitor_id',visitorId);
      const mergedTags = new Set<string>([...baseTags]);
      if(!tagResult.error) for(const row of tagResult.data||[]) if(row.tag) mergedTags.add(String(row.tag));
      mergedTags.add('Website ↔ LINE Matched');
      await supabase.from('line_contacts').update({ visitor_id: visitorId, tags:[...mergedTags], updated_at: now }).eq('line_user_id', lineUserId);
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
