import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';

function maskId(value:string){
  const clean=String(value||'').trim();
  if(!clean) return null;
  if(clean.length<=6) return `${clean.slice(0,2)}••••`;
  return `${clean.slice(0,4)}••••${clean.slice(-4)}`;
}
function deviceFromUa(ua:string){
  return /android|iphone|ipad|mobile/i.test(ua||'') ? 'Mobile' : 'Desktop';
}
function sourceLabel(value:string|null){
  const source=String(value||'').trim();
  if(!source) return 'Direct';
  if(source.startsWith('http')){
    try { return new URL(source).hostname.replace(/^www\./,''); } catch { return source.slice(0,40); }
  }
  return source.slice(0,40);
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireStaff(request);
    const rawDays = Number(new URL(request.url).searchParams.get('days') || 30);
    const periodDays = [7,30,90].includes(rawDays) ? rawDays : 30;
    const now = Date.now();
    const sincePeriod = new Date(now - periodDays*24*60*60*1000).toISOString();
    const sinceLive = new Date(now - 90*1000).toISOString();

    const eventsResult = await supabase
      .from('website_events')
      .select('visitor_id,session_id,event_name,created_at,page_path,package_slug,source,campaign,user_agent,metadata')
      .gte('created_at', sincePeriod)
      .order('created_at',{ascending:false})
      .limit(12000);
    const events = eventsResult.error ? [] : (eventsResult.data || []);

    const pageVisitorIds = new Set(events.filter((e:any)=>e.event_name==='page_view').map((e:any)=>e.visitor_id).filter(Boolean));
    const packageVisitorIds = new Set(events.filter((e:any)=>e.event_name==='package_view').map((e:any)=>e.visitor_id).filter(Boolean));
    const lineClickVisitorIds = new Set(events.filter((e:any)=>e.event_name==='line_click').map((e:any)=>e.visitor_id).filter(Boolean));

    const [lineResult, leadResult] = await Promise.all([
      supabase.from('line_contacts').select('line_user_id,status,visitor_id,tracking_id,first_seen_at,tags,last_seen_at').eq('status','friend'),
      supabase.from('website_leads').select('id', { count:'exact', head:true }).gte('created_at', sincePeriod),
    ]);
    const lineRows = lineResult.error ? [] : (lineResult.data || []);
    const periodLineRows = lineRows.filter((row:any)=>{
      const time=Date.parse(String(row.first_seen_at||''));
      return Number.isFinite(time) && time >= Date.parse(sincePeriod);
    });
    const allLineFriendVisitorIds = new Set(lineRows.map((row:any)=>row.visitor_id).filter(Boolean));
    const periodLineFriendVisitorIds = new Set(periodLineRows.map((row:any)=>row.visitor_id).filter(Boolean));

    const visitorsNoLineClick = [...pageVisitorIds].filter((id)=>!lineClickVisitorIds.has(id)).length;
    const packageVisitorsNoLineClick = [...packageVisitorIds].filter((id)=>!lineClickVisitorIds.has(id)).length;
    const lineClickVisitorsNoFriend = [...lineClickVisitorIds].filter((id)=>!allLineFriendVisitorIds.has(id)).length;
    const lineFriendsWithoutTracking = lineRows.filter((row:any)=>!String(row.tracking_id||'').trim()).length;

    const liveMap=new Map<string,any>();
    for(const event of events){
      const created=Date.parse(String((event as any).created_at||''));
      if(!Number.isFinite(created) || created<Date.parse(sinceLive)) continue;
      const sessionId=String((event as any).session_id||'');
      if(!sessionId || liveMap.has(sessionId)) continue;
      const visitorId=String((event as any).visitor_id||'');
      liveMap.set(sessionId,{
        sessionId:maskId(sessionId),
        visitorId:maskId(visitorId),
        pagePath:String((event as any).page_path||'/'),
        packageSlug:String((event as any).package_slug||''),
        source:sourceLabel((event as any).source),
        campaign:String((event as any).campaign||''),
        device:deviceFromUa(String((event as any).user_agent||'')),
        lastSeenAt:String((event as any).created_at||''),
        lastSeenSeconds:Math.max(0,Math.round((now-created)/1000)),
        eventName:String((event as any).event_name||''),
      });
    }
    const liveVisitors=[...liveMap.values()].slice(0,40);

    const pixelId=String(process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || '').trim();
    return NextResponse.json({
      periodDays,
      liveSessions: liveVisitors.length,
      liveVisitors,
      liveWindowSeconds:90,
      uniqueVisitors: pageVisitorIds.size,
      pageViews: events.filter((e:any)=>e.event_name==='page_view').length,
      packageViews: events.filter((e:any)=>e.event_name==='package_view').length,
      packageViewVisitors: packageVisitorIds.size,
      lineClicks: events.filter((e:any)=>e.event_name==='line_click').length,
      lineClickVisitors: lineClickVisitorIds.size,
      websiteLeads: leadResult.count || 0,
      lineFriends: periodLineRows.length,
      lineFriendVisitors: periodLineFriendVisitorIds.size,
      lineFriendsWithoutTracking,
      visitorsNoLineClick,
      packageVisitorsNoLineClick,
      lineClickVisitorsNoFriend,
      lineConfigured: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET),
      lineBasicIdConfigured: Boolean(process.env.LINE_OA_BASIC_ID || process.env.LINE_OA_URL),
      metaPixelConfigured: Boolean(pixelId),
      metaCapiConfigured: Boolean(process.env.META_CONVERSIONS_API_TOKEN),
      metaTestEventConfigured: Boolean(process.env.META_TEST_EVENT_CODE),
      metaPixelIdMasked: maskId(pixelId),
    });
  } catch (error:any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: Number(error?.status || 400) });
  }
}
