import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';
import { serverSupabaseMode } from '@/lib/server-supabase';
import { getMetaServerConfig } from '@/lib/meta-capi';

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

    const trackingMode = serverSupabaseMode();

    const eventsResult = await supabase
      .from('website_events')
      .select('visitor_id,session_id,event_name,created_at,page_path,package_slug,source,campaign,user_agent,metadata')
      .gte('created_at', sincePeriod)
      .order('created_at',{ascending:false})
      .limit(12000);
    const events = eventsResult.error ? [] : (eventsResult.data || []);
    const trackingStorageReady = !eventsResult.error;
    const trackingError = eventsResult.error ? { code:String(eventsResult.error.code||''), message:String(eventsResult.error.message||'') } : null;

    const pageVisitorIds = new Set(events.filter((e:any)=>e.event_name==='page_view').map((e:any)=>e.visitor_id).filter(Boolean));
    const packageVisitorIds = new Set(events.filter((e:any)=>e.event_name==='package_view').map((e:any)=>e.visitor_id).filter(Boolean));
    const lineClickVisitorIds = new Set(events.filter((e:any)=>e.event_name==='line_click').map((e:any)=>e.visitor_id).filter(Boolean));
    const googleAdsVisitorIds = new Set(events.filter((e:any)=>{
      if(e.event_name!=='page_view') return false;
      const meta=(e.metadata||{}) as Record<string,unknown>;
      const source=String(e.source||'').toLowerCase();
      const medium=String(meta.medium||'').toLowerCase();
      return Boolean(meta.gclid || meta.gbraid || meta.wbraid || meta.dclid || (source.includes('google') && ['cpc','ppc','paid','paidsearch','paid_search'].includes(medium)));
    }).map((e:any)=>e.visitor_id).filter(Boolean));

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

    let pixelId=String(process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || '').trim();
    let metaEnabled=Boolean(pixelId);
    let metaTestEventCode=String(process.env.META_TEST_EVENT_CODE || '').trim();
    let lineRuntimeUrl='';
    try{
      const runtime=await supabase
        .from('marketing_runtime_settings')
        .select('id,enabled,config')
        .in('id',['meta','line']);
      if(!runtime.error){
        const metaRow=(runtime.data||[]).find((x:any)=>x.id==='meta') as any;
        const lineRow=(runtime.data||[]).find((x:any)=>x.id==='line') as any;
        const dbPixel=String(metaRow?.config?.pixel_id || '').trim();
        const dbTest=String(metaRow?.config?.test_event_code || '').trim();
        if(metaRow){
          metaEnabled=Boolean(metaRow.enabled && (dbPixel || pixelId));
          if(dbPixel) pixelId=dbPixel;
          if(dbTest) metaTestEventCode=dbTest;
        }
        lineRuntimeUrl=String(lineRow?.config?.line_oa_url || '').trim();
      }
    }catch{}
    const metaServer=await getMetaServerConfig(supabase);
    const googleTagId=String(process.env.NEXT_PUBLIC_GOOGLE_TAG_ID || '').trim();
    const ga4Id=String(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '').trim();
    const googleAdsId=String(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '').trim();
    const googleAdsLineLabel=String(process.env.NEXT_PUBLIC_GOOGLE_ADS_LINE_CONVERSION_LABEL || '').trim();
    const googleAdsLeadLabel=String(process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL || '').trim();
    return NextResponse.json({
      periodDays,
      trackingConfigured: trackingMode !== 'missing',
      trackingStorageReady,
      trackingMode,
      trackingError,
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
      googleAdsVisitors: googleAdsVisitorIds.size,
      googleTagConfigured: Boolean(googleTagId || ga4Id || googleAdsId),
      ga4Configured: Boolean(ga4Id || googleTagId.startsWith('G-')),
      googleAdsConfigured: Boolean(googleAdsId || googleTagId.startsWith('AW-')),
      googleAdsLineConversionConfigured: Boolean(googleAdsLineLabel && (googleAdsId || googleTagId.startsWith('AW-') || googleAdsLineLabel.includes('/'))),
      googleAdsLeadConversionConfigured: Boolean(googleAdsLeadLabel && (googleAdsId || googleTagId.startsWith('AW-') || googleAdsLeadLabel.includes('/'))),
      googleTagIdMasked: maskId(googleTagId),
      ga4IdMasked: maskId(ga4Id),
      googleAdsIdMasked: maskId(googleAdsId),
      lineConfigured: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET),
      lineBasicIdConfigured: Boolean(process.env.LINE_OA_BASIC_ID || process.env.LINE_OA_URL || lineRuntimeUrl || 'https://lin.ee/qQQMmYIt'),
      metaPixelConfigured: Boolean(metaEnabled && pixelId),
      metaCapiConfigured: Boolean(metaServer.capiConfigured),
      metaTestEventConfigured: Boolean(metaTestEventCode),
      metaPixelIdMasked: maskId(pixelId),
    });
  } catch (error:any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: Number(error?.status || 400) });
  }
}
