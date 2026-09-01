import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';

export async function GET(request:NextRequest){
  try{
    const {supabase}=await requireStaff(request);
    const rawDays=Number(new URL(request.url).searchParams.get('days')||30);
    const days=[7,30,90].includes(rawDays)?rawDays:30;
    const since=new Date(Date.now()-days*24*60*60*1000).toISOString();
    const [eventsResult,lineResult,lineEventsResult,tagsResult]=await Promise.all([
      supabase.from('website_events').select('visitor_id,session_id,event_name,package_slug,created_at').gte('created_at',since).limit(12000),
      supabase.from('line_contacts').select('line_user_id,status,visitor_id,tracking_id,tags,last_seen_at').eq('status','friend'),
      supabase.from('line_events').select('line_user_id,event_type,created_at').gte('created_at',since).limit(8000),
      supabase.from('website_visitor_tags').select('visitor_id,tag,last_seen_at').gte('last_seen_at',since).limit(12000),
    ]);
    const events=eventsResult.error?[]:(eventsResult.data||[]);
    const lines=lineResult.error?[]:(lineResult.data||[]);
    const lineEvents=lineEventsResult.error?[]:(lineEventsResult.data||[]);
    const persistedTags=tagsResult.error?[]:(tagsResult.data||[]);

    const visitorSessions=new Map<string,Set<string>>();
    const packageViews=new Map<string,number>();
    const packagePeople=new Set<string>();
    const lineClicks=new Set<string>();
    for(const e of events as any[]){
      const visitor=String(e.visitor_id||''); if(!visitor) continue;
      if(!visitorSessions.has(visitor)) visitorSessions.set(visitor,new Set());
      if(e.session_id) visitorSessions.get(visitor)?.add(String(e.session_id));
      if(e.event_name==='package_view'){
        packagePeople.add(visitor); packageViews.set(visitor,(packageViews.get(visitor)||0)+1);
      }
      if(e.event_name==='line_click') lineClicks.add(visitor);
    }
    const webVisitors=new Set(events.filter((e:any)=>e.event_name==='page_view').map((e:any)=>e.visitor_id).filter(Boolean));
    const returning=[...visitorSessions.entries()].filter(([,sessions])=>sessions.size>=2).map(([id])=>id);
    const highIntent=new Set([...packageViews.entries()].filter(([,count])=>count>=2).map(([id])=>id));
    lineClicks.forEach((id)=>highIntent.add(id));
    const lineFriendIds=new Set((lines as any[]).map((x)=>x.line_user_id).filter(Boolean));
    const lineEngagedIds=new Set((lineEvents as any[]).filter((e)=>e.event_type==='message').map((e)=>e.line_user_id).filter(Boolean));
    const knownMatched=(lines as any[]).filter((x)=>String(x.visitor_id||'').trim()).length;

    const tagCounts=new Map<string,{count:number;source:'website'|'line'}>();
    for(const row of persistedTags as any[]){
      const tag=String(row.tag||'').trim(); if(!tag) continue;
      const current=tagCounts.get(tag)||{count:0,source:'website' as const}; current.count++; tagCounts.set(tag,current);
    }
    for(const row of lines as any[]){
      for(const value of Array.isArray(row.tags)?row.tags:[]){
        const tag=String(value||'').trim(); if(!tag) continue;
        const current=tagCounts.get(tag)||{count:0,source:'line' as const}; current.count++; current.source='line'; tagCounts.set(tag,current);
      }
    }
    if(!persistedTags.length){
      tagCounts.set('Website Visitor',{count:webVisitors.size,source:'website'});
      tagCounts.set('Package Interest',{count:packagePeople.size,source:'website'});
      tagCounts.set('LINE Intent',{count:lineClicks.size,source:'website'});
    }

    return NextResponse.json({
      days,
      tagStorageReady:!tagsResult.error,
      sources:{website:true,line:!lineResult.error,crm:true,meta:false},
      audiences:[
        {id:'all_website',name:'ผู้เข้าชมเว็บไซต์',count:webVisitors.size,source:'Website',intent:'Cold',futureMeta:'Website Custom Audience',description:`เข้าเว็บไซต์ใน ${days} วัน`},
        {id:'returning',name:'กลับเข้าเว็บซ้ำ',count:returning.length,source:'Website',intent:'Warm',futureMeta:'Retarget',description:'มีมากกว่า 1 session ในช่วงเวลา'},
        {id:'package_interest',name:'สนใจแพ็กเกจ',count:packagePeople.size,source:'Website',intent:'Warm',futureMeta:'ViewContent Audience',description:'เคยเปิดดูหน้าแพ็กเกจ'},
        {id:'high_intent',name:'High Intent',count:highIntent.size,source:'Website + LINE Click',intent:'Hot',futureMeta:'High Intent Retarget',description:'ดูแพ็กเกจซ้ำ หรือกดไป LINE'},
        {id:'line_friends',name:'LINE Friends',count:lineFriendIds.size,source:'LINE OA',intent:'Known',futureMeta:'Internal CRM Audience',description:'ผู้ใช้ที่เป็นเพื่อน LINE OA'},
        {id:'line_engaged',name:'เคยทัก LINE',count:lineEngagedIds.size,source:'LINE OA',intent:'Hot',futureMeta:'Internal CRM Audience',description:'มี message event ในช่วงเวลา'},
        {id:'matched',name:'Website ↔ LINE ที่จับคู่แล้ว',count:knownMatched,source:'Website + LINE',intent:'Known',futureMeta:'CRM Match Ready',description:'มี visitor_id เชื่อมกับ LINE userId แล้ว'},
      ],
      tags:[...tagCounts.entries()].map(([tag,value])=>({tag,...value})).sort((a,b)=>b.count-a.count).slice(0,40),
      note:'LINE userId ใช้แบ่งกลุ่มภายใน CRM ได้ แต่การ Sync ไป Meta ภายหลังจะใช้ Website Pixel/CAPI หรือข้อมูลติดต่อที่ได้รับอนุญาต ไม่ส่ง LINE userId ไปเป็น Meta identifier โดยตรง',
    });
  }catch(error:any){
    return NextResponse.json({error:String(error?.message||error)},{status:Number(error?.status||400)});
  }
}
