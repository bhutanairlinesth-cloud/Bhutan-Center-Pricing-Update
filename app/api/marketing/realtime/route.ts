import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';

const LIVE_WINDOW_SECONDS = 18;
const HEARTBEAT_SECONDS = 6;
const ADMIN_POLL_SECONDS = 2;

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

export async function GET(request:NextRequest){
  try{
    const { supabase } = await requireStaff(request);
    const now=Date.now();
    // Query a tiny live-only window instead of rescanning the 30-day marketing dataset.
    const since=new Date(now-(LIVE_WINDOW_SECONDS+8)*1000).toISOString();
    const result=await supabase
      .from('website_events')
      .select('visitor_id,session_id,event_name,created_at,page_path,package_slug,source,campaign,user_agent,metadata')
      .gte('created_at',since)
      .in('event_name',['heartbeat','page_view','package_view'])
      .order('created_at',{ascending:false})
      .limit(1500);

    if(result.error){
      return NextResponse.json({
        liveSessions:0, liveVisitors:[], liveWindowSeconds:LIVE_WINDOW_SECONDS,
        heartbeatSeconds:HEARTBEAT_SECONDS, pollSeconds:ADMIN_POLL_SECONDS,
        storageReady:false, error:{code:String(result.error.code||''),message:String(result.error.message||'')},
      });
    }

    const latestBySession=new Map<string,any>();
    for(const event of result.data||[]){
      const sessionId=String((event as any).session_id||'');
      if(!sessionId || latestBySession.has(sessionId)) continue;
      latestBySession.set(sessionId,event);
    }

    const liveVisitors:any[]=[];
    for(const [sessionId,event] of latestBySession){
      const created=Date.parse(String(event.created_at||''));
      if(!Number.isFinite(created)) continue;
      const ageSeconds=Math.max(0,Math.round((now-created)/1000));
      // An explicit close wins immediately. If the close beacon is lost, the short
      // live window is the safety net and removes the session automatically.
      if(String(event.event_name||'')==='heartbeat' && String((event.metadata as any)?.presence||'')==='offline') continue;
      if(ageSeconds>LIVE_WINDOW_SECONDS) continue;
      liveVisitors.push({
        sessionId:maskId(sessionId),
        visitorId:maskId(String(event.visitor_id||'')),
        pagePath:String(event.page_path||'/'),
        packageSlug:String(event.package_slug||''),
        source:sourceLabel(event.source),
        campaign:String(event.campaign||''),
        device:deviceFromUa(String(event.user_agent||'')),
        lastSeenAt:String(event.created_at||''),
        lastSeenSeconds:ageSeconds,
        eventName:String(event.event_name||''),
      });
    }
    liveVisitors.sort((a,b)=>a.lastSeenSeconds-b.lastSeenSeconds);

    return NextResponse.json({
      liveSessions:liveVisitors.length,
      liveVisitors:liveVisitors.slice(0,60),
      liveWindowSeconds:LIVE_WINDOW_SECONDS,
      heartbeatSeconds:HEARTBEAT_SECONDS,
      pollSeconds:ADMIN_POLL_SECONDS,
      storageReady:true,
    },{headers:{'Cache-Control':'no-store, max-age=0'}});
  }catch(error:any){
    return NextResponse.json({error:String(error?.message||error)},{status:Number(error?.status||400)});
  }
}
