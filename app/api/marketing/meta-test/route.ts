import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';
import { getMetaServerConfig, sendMetaCapiEvent } from '@/lib/meta-capi';

function clean(value:unknown,max=500){ return String(value??'').trim().slice(0,max); }

async function writeLastTest(supabase:any, profile:any, result:{ok:boolean;message:string;eventsReceived?:number}){
  try{
    const existing=await supabase.from('marketing_runtime_settings').select('enabled,config').eq('id','meta').maybeSingle();
    const oldConfig=(existing.data?.config || {}) as Record<string,unknown>;
    await supabase.from('marketing_runtime_settings').upsert({
      id:'meta',
      enabled:existing.data?.enabled !== false,
      config:{
        ...oldConfig,
        last_test_at:new Date().toISOString(),
        last_test_ok:result.ok,
        last_test_message:clean(result.message,500),
        last_test_events_received:Number(result.eventsReceived||0),
      },
      updated_by:String(profile?.id||profile?.email||''),
      updated_at:new Date().toISOString(),
    });
  }catch{}
}

export async function POST(request:NextRequest){
  try{
    const {supabase,profile}=await requireStaff(request,true);
    const cfg=await getMetaServerConfig(supabase);
    if(!cfg.pixelId) return NextResponse.json({error:'ยังไม่มี Pixel ID'},{status:400});
    if(!cfg.accessToken) return NextResponse.json({error:'ยังไม่มี Conversions API Access Token กรุณาวาง Token และบันทึกก่อน'},{status:400});
    if(!cfg.testEventCode) return NextResponse.json({error:'ยังไม่มี Test Event Code กรุณาคัดลอกจาก Meta Events Manager → Test Events'},{status:400});

    const result:any=await sendMetaCapiEvent({
      supabase,
      request,
      sourceEvent:'page_view',
      eventId:`bc_test_${Date.now()}_${Math.random().toString(36).slice(2,10)}`,
      eventSourceUrl:new URL('/',request.url).toString(),
      customData:{test_source:'Bhutan Center Back Office'},
      testEventCodeOverride:cfg.testEventCode,
      force:true,
    });

    if(!result.ok){
      const message=clean(result.error || result.reason || 'Meta ไม่รับ Test Event',500);
      await writeLastTest(supabase,profile,{ok:false,message});
      return NextResponse.json({
        ok:false,
        error:message,
        status:result.status||0,
        code:result.code||null,
        subcode:result.subcode||null,
        fbtraceId:result.fbtraceId||null,
      },{status:400});
    }

    const eventsReceived=Number(result.eventsReceived||0);
    const message=eventsReceived>0 ? `Meta รับ Test Event แล้ว ${eventsReceived} event` : 'Meta ตอบกลับสำเร็จ แต่ events_received เป็น 0';
    await writeLastTest(supabase,profile,{ok:eventsReceived>0,message,eventsReceived});
    return NextResponse.json({
      ok:eventsReceived>0,
      message,
      eventsReceived,
      eventName:result.eventName,
      eventId:result.eventId,
      fbtraceId:result.fbtraceId||null,
      messages:result.messages||[],
    },{status:eventsReceived>0?200:400});
  }catch(error:any){
    return NextResponse.json({error:String(error?.message||error)},{status:Number(error?.status||400)});
  }
}
