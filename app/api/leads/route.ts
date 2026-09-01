import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/server-supabase';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(()=>({}));
  const name = String(body.name || '').trim();
  const contact = String(body.contact || '').trim();
  if (!name || !contact) return NextResponse.json({ ok:false, message:'กรุณากรอกชื่อและช่องทางติดต่อ' }, { status:400 });
  const supabase = getServerSupabase();
  if (!supabase || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ ok:true, stored:false, message:'ยังไม่ได้เปิด Website CRM migration' });
  const adults = Math.max(0, Number(body.adults || 0));
  const children = Math.max(0, Number(body.children || 0));
  const row = {
    name, contact,
    travel_date: body.travel_date || null,
    adults: adults || null,
    children,
    pax: Number(body.pax || 0) || adults + children || null,
    package_slug: String(body.package_slug || '') || null,
    hotel_level: String(body.hotel_level || '') || null,
    cabin_class: String(body.cabin_class || '') || null,
    note: String(body.note || '') || null,
    source:'bhutancenter.org', status:'new',
  };
  const { error } = await supabase.from('website_leads').insert(row);
  if (error) return NextResponse.json({ ok:false, message:error.message }, { status:500 });
  return NextResponse.json({ ok:true, stored:true });
}
