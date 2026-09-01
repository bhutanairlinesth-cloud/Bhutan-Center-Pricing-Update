import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireStaff(request);
    const now = Date.now();
    const since30 = new Date(now - 30*24*60*60*1000).toISOString();
    const since5 = new Date(now - 5*60*1000).toISOString();

    const eventsResult = await supabase.from('website_events').select('visitor_id,session_id,event_name,created_at').gte('created_at', since30);
    const events = eventsResult.error ? [] : (eventsResult.data || []);
    const uniqueVisitors = new Set(events.filter((e:any)=>e.event_name==='page_view').map((e:any)=>e.visitor_id).filter(Boolean)).size;
    const packageViews = events.filter((e:any)=>e.event_name==='package_view').length;
    const lineClicks = events.filter((e:any)=>e.event_name==='line_click').length;
    const liveSessions = new Set(events.filter((e:any)=>e.created_at >= since5).map((e:any)=>e.session_id).filter(Boolean)).size;

    const [lineResult, leadResult] = await Promise.all([
      supabase.from('line_contacts').select('line_user_id,status', { count:'exact' }).eq('status','friend'),
      supabase.from('website_leads').select('id', { count:'exact', head:true }).gte('created_at', since30),
    ]);

    return NextResponse.json({
      periodDays: 30,
      liveSessions,
      uniqueVisitors,
      pageViews: events.filter((e:any)=>e.event_name==='page_view').length,
      packageViews,
      lineClicks,
      websiteLeads: leadResult.count || 0,
      lineFriends: lineResult.count || 0,
      lineConfigured: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET),
      lineBasicIdConfigured: Boolean(process.env.LINE_OA_BASIC_ID || process.env.LINE_OA_URL),
    });
  } catch (error:any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: Number(error?.status || 400) });
  }
}
