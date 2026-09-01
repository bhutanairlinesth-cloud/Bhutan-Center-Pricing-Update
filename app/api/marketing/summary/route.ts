import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';

function maskId(value:string){
  const clean=String(value||'').trim();
  if(!clean) return null;
  if(clean.length<=6) return `${clean.slice(0,2)}••••`;
  return `${clean.slice(0,4)}••••${clean.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireStaff(request);
    const rawDays = Number(new URL(request.url).searchParams.get('days') || 30);
    const periodDays = [7,30,90].includes(rawDays) ? rawDays : 30;
    const now = Date.now();
    const sincePeriod = new Date(now - periodDays*24*60*60*1000).toISOString();
    const since5 = new Date(now - 5*60*1000).toISOString();

    const eventsResult = await supabase
      .from('website_events')
      .select('visitor_id,session_id,event_name,created_at')
      .gte('created_at', sincePeriod);
    const events = eventsResult.error ? [] : (eventsResult.data || []);

    const pageVisitorIds = new Set(events.filter((e:any)=>e.event_name==='page_view').map((e:any)=>e.visitor_id).filter(Boolean));
    const packageVisitorIds = new Set(events.filter((e:any)=>e.event_name==='package_view').map((e:any)=>e.visitor_id).filter(Boolean));
    const lineClickVisitorIds = new Set(events.filter((e:any)=>e.event_name==='line_click').map((e:any)=>e.visitor_id).filter(Boolean));

    const [lineResult, leadResult] = await Promise.all([
      supabase.from('line_contacts').select('line_user_id,status,visitor_id,tracking_id,first_seen_at').eq('status','friend'),
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

    const pixelId=String(process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || '').trim();
    return NextResponse.json({
      periodDays,
      liveSessions: new Set(events.filter((e:any)=>e.created_at >= since5).map((e:any)=>e.session_id).filter(Boolean)).size,
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
