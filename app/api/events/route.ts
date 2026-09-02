import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, serverSupabaseMode } from '@/lib/server-supabase';
import { sendMetaCapiEvent } from '@/lib/meta-capi';

const ALLOWED = new Set(['page_view','package_view','line_click','lead_submit','contact_click','heartbeat']);
const META_EVENTS = new Set(['page_view','package_view','line_click','lead_submit','contact_click']);

function tagsForEvent(eventName:string, packageSlug:string){
  const tags:string[]=[];
  if(eventName==='page_view') tags.push('Website Visitor');
  if(eventName==='package_view') {
    tags.push('Package Interest');
    if(packageSlug) tags.push(`Package:${packageSlug}`);
  }
  if(eventName==='line_click') tags.push('LINE Intent');
  if(eventName==='lead_submit') tags.push('Website Lead');
  return tags;
}

export async function POST(request: NextRequest) {
  const mode = serverSupabaseMode();
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: true, stored: false, reason:'supabase_not_configured', mode });
  }

  const body = await request.json().catch(() => ({}));
  const eventName = String(body.event_name || '');
  if (!ALLOWED.has(eventName)) return NextResponse.json({ ok: false }, { status: 400 });
  const visitorId=String(body.visitor_id || '').slice(0,120);
  const packageSlug=String(body.package_slug || '').slice(0,120);
  if(!visitorId) return NextResponse.json({ok:false, stored:false, reason:'missing_visitor_id'}, {status:400});

  const metadata = typeof body.metadata === 'object' && body.metadata ? body.metadata as Record<string,unknown> : {};
  const row = {
    visitor_id: visitorId,
    session_id: String(body.session_id || '').slice(0, 120),
    event_name: eventName,
    page_path: String(body.page_path || '').slice(0, 400),
    package_slug: packageSlug || null,
    source: String(body.source || '').slice(0, 160) || null,
    campaign: String(body.campaign || '').slice(0, 160) || null,
    metadata,
    user_agent: String(request.headers.get('user-agent') || '').slice(0, 500),
  };

  const { error } = await supabase.from('website_events').insert(row);
  if (error) {
    const reason = error.code === '42P01'
      ? 'website_events_table_missing'
      : error.code === '42501'
        ? 'website_events_rls_not_ready'
        : 'website_events_insert_failed';
    return NextResponse.json({ ok: true, stored: false, reason, code:error.code, mode });
  }

  // Tag persistence needs Service Role in the current design. If the server is
  // running in anon/RLS fallback mode, realtime still works and tags simply wait
  // for the normal server credential to be connected later.
  if(visitorId && mode==='service_role'){
    const now=new Date().toISOString();
    for(const tag of tagsForEvent(eventName,packageSlug)){
      await supabase.from('website_visitor_tags').upsert({
        visitor_id:visitorId, tag, source:'website', last_seen_at:now,
      },{onConflict:'visitor_id,tag'});
    }
  }

  let meta:any={skipped:true,reason:'not_a_meta_event'};
  if(mode==='service_role' && META_EVENTS.has(eventName)){
    const pagePath=String(row.page_path || '/');
    const eventSourceUrl=new URL(pagePath.startsWith('/')?pagePath:`/${pagePath}`,request.url).toString();
    meta=await sendMetaCapiEvent({
      supabase,
      request,
      sourceEvent:eventName,
      eventId:String(metadata.meta_event_id||'').slice(0,160),
      eventSourceUrl,
      packageSlug,
      userData:{
        fbp:String(metadata.fbp||''),
        fbc:String(metadata.fbc||''),
      },
      customData:{
        source:String(row.source||''),
        campaign:String(row.campaign||''),
      },
    });
  }

  return NextResponse.json({ ok: true, stored: true, mode, meta:{ok:Boolean(meta?.ok),skipped:Boolean(meta?.skipped),reason:meta?.reason||null} });
}
