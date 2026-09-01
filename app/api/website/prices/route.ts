import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireStaff(request);
    const [{ data: packages, error: packageError }, overrideResult] = await Promise.all([
      supabase.from('tour_packages').select('id,name,nights').order('nights'),
      supabase.from('website_public_prices').select('package_id,visible,price_override_thb,updated_at'),
    ]);
    if (packageError) throw packageError;
    const overrides = overrideResult.error ? [] : (overrideResult.data || []);
    return NextResponse.json({ packages: (packages || []).map((item:any) => ({ ...item, override: overrides.find((o:any) => o.package_id === item.id) || null })) });
  } catch (error:any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: Number(error?.status || 400) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireStaff(request, true);
    const body = await request.json();
    const packageId = String(body.package_id || '');
    if (!packageId) return NextResponse.json({ error: 'package_id required' }, { status: 400 });
    const payload = {
      package_id: packageId,
      visible: body.visible !== false,
      price_override_thb: body.price_override_thb === null || body.price_override_thb === '' ? null : Math.max(0, Number(body.price_override_thb || 0)),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('website_public_prices').upsert(payload);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error:any) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: Number(error?.status || 400) });
  }
}
