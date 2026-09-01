import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/server-supabase';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const visitor = String(url.searchParams.get('visitor') || '').slice(0,120);
  const session = String(url.searchParams.get('session') || '').slice(0,120);
  const packageSlug = String(url.searchParams.get('package') || '').slice(0,120);
  const pagePath = String(url.searchParams.get('page') || '/').slice(0,400);
  const supabase = getServerSupabase();
  if (supabase && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await supabase.from('website_events').insert({ visitor_id:visitor, session_id:session, event_name:'line_click', page_path:pagePath, package_slug:packageSlug || null, metadata:{} });
      if(visitor){
        const now=new Date().toISOString();
        await supabase.from('website_visitor_tags').upsert({visitor_id:visitor,tag:'LINE Intent',source:'website',last_seen_at:now},{onConflict:'visitor_id,tag'});
        if(packageSlug) await supabase.from('website_visitor_tags').upsert({visitor_id:visitor,tag:`Package:${packageSlug}`,source:'website',last_seen_at:now},{onConflict:'visitor_id,tag'});
      }
    } catch {}
  }

  const basicId = String(process.env.LINE_OA_BASIC_ID || '').trim();
  const fallback = String(process.env.LINE_OA_URL || '').trim();
  const ref = visitor || `BC${Date.now().toString(36)}`;
  let target = fallback || new URL('/contact', request.url).toString();
  if (basicId) {
    const packageName = packageSlug ? `แพ็กเกจ ${packageSlug}` : 'ทริปภูฏาน';
    const message = `สวัสดีค่ะ/ครับ สนใจ${packageName} จากเว็บไซต์ Bhutan Center\nRef: ${ref}`;
    target = `https://line.me/R/oaMessage/${encodeURIComponent(basicId)}/?${encodeURIComponent(message)}`;
  }
  return NextResponse.redirect(target, 302);
}
