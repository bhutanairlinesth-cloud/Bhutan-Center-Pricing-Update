import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';

type BroadcastMode = 'text' | 'image' | 'card';

function cleanText(value: any, max = 5000) {
  return String(value || '').trim().slice(0, max);
}

function isPublicUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function buildMessages(body: Record<string, any>) {
  const mode = String(body.mode || 'text') as BroadcastMode;

  if (mode === 'image') {
    const imageUrl = cleanText(body.imageUrl, 2000);
    const previewImageUrl = cleanText(body.previewImageUrl || body.imageUrl, 2000);
    const caption = cleanText(body.caption, 1000);
    if (!isPublicUrl(imageUrl) || !isPublicUrl(previewImageUrl)) throw new Error('Image URL ต้องเป็นลิงก์สาธารณะแบบ https://');
    const messages: any[] = [{ type: 'image', originalContentUrl: imageUrl, previewImageUrl }];
    if (caption) messages.push({ type: 'text', text: caption });
    return { mode, messages, summary: caption ? `IMAGE\n${caption}` : `IMAGE\n${imageUrl}` };
  }

  if (mode === 'card') {
    const title = cleanText(body.title, 60);
    const content = cleanText(body.body, 240);
    const buttonLabel = cleanText(body.buttonLabel, 20);
    const buttonUrl = cleanText(body.buttonUrl, 2000);
    const imageUrl = cleanText(body.imageUrl, 2000);
    const altText = cleanText(body.altText || title || 'Bhutan Center card', 120);
    if (!title || !content || !buttonLabel || !isPublicUrl(buttonUrl)) {
      throw new Error('ข้อมูลการ์ดไม่ครบ หรือ CTA URL ไม่ถูกต้อง');
    }
    const hero = isPublicUrl(imageUrl)
      ? {
          type: 'image',
          url: imageUrl,
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover',
        }
      : undefined;

    const bubble: any = {
      type: 'bubble',
      size: 'mega',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: title, weight: 'bold', size: 'lg', wrap: true, color: '#3c2e22' },
          { type: 'text', text: content, size: 'sm', wrap: true, color: '#6f6256' },
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            color: '#b88a3b',
            action: { type: 'uri', label: buttonLabel, uri: buttonUrl },
          },
        ],
        paddingAll: '20px',
        backgroundColor: '#fffaf3',
      },
    };
    if (hero) bubble.hero = hero;

    return {
      mode,
      messages: [{ type: 'flex', altText, contents: bubble }],
      summary: `CARD\n${title}\n${content}`,
    };
  }

  const text = cleanText(body.text, 4500);
  if (!text) throw new Error('กรุณากรอกข้อความ');
  return { mode: 'text' as const, messages: [{ type: 'text', text }], summary: text };
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, profile } = await requireStaff(request, true);
    const token = String(process.env.LINE_CHANNEL_ACCESS_TOKEN || '');
    if (!token) return NextResponse.json({ error:'ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN' }, { status:400 });
    const body = await request.json().catch(()=>({}));
    const { mode, messages, summary } = buildMessages(body);

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
        body:JSON.stringify({ to, messages }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`LINE ${response.status}: ${detail.slice(0,300)}`);
      }
      sent += to.length;
    }

    await supabase.from('marketing_campaigns').insert({
      name: cleanText(body.name || `LINE Broadcast ${new Date().toLocaleDateString('th-TH')}`, 180),
      channel:'line',
      status:'sent',
      message_text: `${mode.toUpperCase()}\n${summary}`.slice(0, 5000),
      audience_count:ids.length,
      sent_count:sent,
      created_by_id: profile.id,
      created_by_name: profile.name || '',
      sent_at:new Date().toISOString(),
    });
    return NextResponse.json({ ok:true, sent, mode });
  } catch (error:any) {
    return NextResponse.json({ error:String(error?.message || error) }, { status:Number(error?.status || 400) });
  }
}
