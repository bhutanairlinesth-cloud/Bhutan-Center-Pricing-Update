import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/server-supabase';

const DEFAULT_LINE_OA_URL='https://lin.ee/qQQMmYIt';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const visitor = String(url.searchParams.get('visitor') || '').slice(0,120);
  const session = String(url.searchParams.get('session') || '').slice(0,120);
  const packageSlug = String(url.searchParams.get('package') || '').slice(0,120);
  const pagePath = String(url.searchParams.get('page') || '/').slice(0,400);
  const supabase = getServerSupabase();
  if (supabase) {
    try { await supabase.from('website_events').insert({ visitor_id:visitor, session_id:session, event_name:'line_click', page_path:pagePath, package_slug:packageSlug || null, metadata:{} }); } catch {}
  }

  const basicId = String(process.env.LINE_OA_BASIC_ID || '').trim();
  let fallback = String(process.env.LINE_OA_URL || '').trim() || DEFAULT_LINE_OA_URL;
  if(supabase){
    try{
      const { data }=await supabase
        .from('marketing_runtime_settings')
        .select('enabled,config')
        .eq('id','line')
        .maybeSingle();
      const dbUrl=String((data?.config as any)?.line_oa_url || '').trim();
      if(data?.enabled !== false && dbUrl) fallback=dbUrl;
    }catch{}
  }

  const ref = visitor || `BC${Date.now().toString(36)}`;
  let target = fallback || new URL('/contact', request.url).toString();
  if (basicId) {
    const packageName = packageSlug ? `แพ็กเกจ ${packageSlug}` : 'ทริปภูฏาน';
    const message = `สวัสดีค่ะ/ครับ สนใจ${packageName} จากเว็บไซต์ Bhutan Center\nRef: ${ref}`;
    target = `https://line.me/R/oaMessage/${encodeURIComponent(basicId)}/?${encodeURIComponent(message)}`;
  }
  return NextResponse.redirect(target, 302);
}
