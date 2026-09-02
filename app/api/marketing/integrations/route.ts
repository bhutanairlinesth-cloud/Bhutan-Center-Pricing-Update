import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';

function cleanText(value:unknown, max=500){
  return String(value ?? '').trim().slice(0,max);
}
function maskId(value:string){
  if(!value) return null;
  if(value.length<=6) return `${value.slice(0,2)}••••`;
  return `${value.slice(0,4)}••••${value.slice(-4)}`;
}

export async function GET(request:NextRequest){
  try{
    const { supabase }=await requireStaff(request);
    const { data, error }=await supabase
      .from('marketing_runtime_settings')
      .select('id,enabled,config,updated_at')
      .in('id',['meta','line']);

    const rows=error ? [] : (data||[]);
    const metaRow=rows.find((x:any)=>x.id==='meta') as any;
    const lineRow=rows.find((x:any)=>x.id==='line') as any;
    const metaConfig=(metaRow?.config||{}) as Record<string,unknown>;
    const lineConfig=(lineRow?.config||{}) as Record<string,unknown>;

    const dbPixelId=cleanText(metaConfig.pixel_id,80);
    const envPixelId=cleanText(process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID,80);
    const pixelId=dbPixelId || envPixelId;
    const dbTestCode=cleanText(metaConfig.test_event_code,120);
    const envTestCode=cleanText(process.env.META_TEST_EVENT_CODE,120);
    const testEventCode=dbTestCode || envTestCode;
    const lineUrl=cleanText(lineConfig.line_oa_url,500) || cleanText(process.env.LINE_OA_URL,500) || 'https://lin.ee/qQQMmYIt';

    return NextResponse.json({
      storageReady:!error,
      storageError:error ? {code:String(error.code||''),message:String(error.message||'')} : null,
      meta:{
        enabled:metaRow ? Boolean(metaRow.enabled) : Boolean(pixelId),
        pixelId,
        pixelIdMasked:maskId(pixelId),
        testEventCode,
        testEventConfigured:Boolean(testEventCode),
        capiConfigured:Boolean(process.env.META_CONVERSIONS_API_TOKEN),
        source:dbPixelId?'back_office':envPixelId?'environment':'none',
        updatedAt:metaRow?.updated_at || null,
      },
      line:{
        enabled:lineRow ? Boolean(lineRow.enabled) : true,
        url:lineUrl,
        source:cleanText(lineConfig.line_oa_url,500)?'back_office':process.env.LINE_OA_URL?'environment':'default',
        updatedAt:lineRow?.updated_at || null,
      },
    });
  }catch(error:any){
    return NextResponse.json({error:String(error?.message||error)},{status:Number(error?.status||400)});
  }
}

export async function POST(request:NextRequest){
  try{
    const { supabase, profile }=await requireStaff(request, true);
    const body=await request.json().catch(()=>({}));
    const section=cleanText(body.section,20);

    if(section==='meta'){
      const pixelId=cleanText(body.pixelId,80).replace(/\s+/g,'');
      const testEventCode=cleanText(body.testEventCode,120);
      const enabled=Boolean(body.enabled && pixelId);
      if(pixelId && !/^\d{5,30}$/.test(pixelId)){
        return NextResponse.json({error:'Pixel ID ต้องเป็นตัวเลขเท่านั้น'},{status:400});
      }
      const { error }=await supabase.from('marketing_runtime_settings').upsert({
        id:'meta',
        enabled,
        config:{pixel_id:pixelId,test_event_code:testEventCode},
        updated_by:String(profile?.id||profile?.email||''),
        updated_at:new Date().toISOString(),
      });
      if(error) throw error;
      return NextResponse.json({ok:true,message:enabled?'เปิด Meta Pixel แล้ว':'บันทึก Meta settings แล้ว (Pixel ยังปิดอยู่)'});
    }

    if(section==='line'){
      const lineUrl=cleanText(body.lineUrl,500);
      if(lineUrl && !/^https:\/\//i.test(lineUrl)){
        return NextResponse.json({error:'LINE OA URL ต้องขึ้นต้นด้วย https://'},{status:400});
      }
      const { error }=await supabase.from('marketing_runtime_settings').upsert({
        id:'line',
        enabled:true,
        config:{line_oa_url:lineUrl || 'https://lin.ee/qQQMmYIt'},
        updated_by:String(profile?.id||profile?.email||''),
        updated_at:new Date().toISOString(),
      });
      if(error) throw error;
      return NextResponse.json({ok:true,message:'บันทึกลิงก์ LINE OA แล้ว'});
    }

    return NextResponse.json({error:'Unsupported settings section'},{status:400});
  }catch(error:any){
    return NextResponse.json({error:String(error?.message||error)},{status:Number(error?.status||400)});
  }
}
