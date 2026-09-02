import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/server-supabase';

export const dynamic='force-dynamic';

export async function GET(){
  let pixelId=String(process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || '').trim();
  let enabled=Boolean(pixelId);
  let source=pixelId?'environment':'none';
  const supabase=getServerSupabase();
  if(supabase){
    try{
      const { data }=await supabase
        .from('marketing_runtime_settings')
        .select('enabled,config')
        .eq('id','meta')
        .maybeSingle();
      const dbId=String((data?.config as any)?.pixel_id || '').trim();
      if(data){
        enabled=Boolean(data.enabled && dbId);
        pixelId=dbId || pixelId;
        source=dbId?'back_office':source;
      }
    }catch{}
  }
  return NextResponse.json({enabled:Boolean(enabled && pixelId),pixelId:enabled?pixelId:'',source},{
    headers:{'Cache-Control':'no-store, max-age=0'},
  });
}
