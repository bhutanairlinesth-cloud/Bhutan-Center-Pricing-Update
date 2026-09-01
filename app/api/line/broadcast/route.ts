import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { supabase, profile } = await requireStaff(request, true);
    const token = String(process.env.LINE_CHANNEL_ACCESS_TOKEN || '');
    if (!token) return NextResponse.json({ error:'ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN' }, { status:400 });
    const body = await request.json().catch(()=>({}));
    const text = String(body.text || '').trim();
    if (!text) return NextResponse.json({ error:'กรุณากรอกข้อความ' }, { status:400 });
    if (text.length > 4500) return NextResponse.json({ error:'ข้อความยาวเกินไป' }, { status:400 });

    const { data: contacts, error } = await supabase.from('line_contacts').select('line_user_id').eq('status','friend').not('line_user_id','is',null);
    if (error) throw error;
    const ids = (contacts || []).map((c:any)=>c.line_user_id).filter(Boolean);
    if (!ids.length) return NextResponse.json({ error:'ยังไม่มี LINE Contact ที่ส่งได้' }, { status:400 });

    let sent = 0;
    for (let i=0;i<ids.length;i+=500) {
      const to = ids.slice(i,i+500);
      const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
        method:'POST',
        headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
        body:JSON.stringify({ to, messages:[{ type:'text', text }] }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`LINE ${response.status}: ${detail.slice(0,300)}`);
      }
      sent += to.length;
    }
    await supabase.from('marketing_campaigns').insert({
      name: String(body.name || `LINE Broadcast ${new Date().toLocaleDateString('th-TH')}`),
      channel:'line', status:'sent', message_text:text, audience_count:ids.length, sent_count:sent,
      created_by_id: profile.id, created_by_name: profile.name || '', sent_at:new Date().toISOString(),
    });
    return NextResponse.json({ ok:true, sent });
  } catch (error:any) {
    return NextResponse.json({ error:String(error?.message || error) }, { status:Number(error?.status || 400) });
  }
}
