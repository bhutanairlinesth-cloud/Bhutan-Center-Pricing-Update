import { readMarketingSecret } from './marketing-secrets';

export type MetaServerConfig={
  enabled:boolean;
  pixelId:string;
  testEventCode:string;
  accessToken:string;
  capiConfigured:boolean;
};

function clean(value:unknown,max=500){ return String(value??'').trim().slice(0,max); }

export async function getMetaServerConfig(supabase:any):Promise<MetaServerConfig>{
  let pixelId=clean(process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID,80);
  let enabled=Boolean(pixelId);
  let testEventCode=clean(process.env.META_TEST_EVENT_CODE,120);
  let accessToken=clean(process.env.META_CONVERSIONS_API_TOKEN,4096);

  try{
    const [runtime,secret]=await Promise.all([
      supabase.from('marketing_runtime_settings').select('enabled,config').eq('id','meta').maybeSingle(),
      readMarketingSecret(supabase,'meta_capi_token').catch(()=>({value:'',updatedAt:null,storageReady:false})),
    ]);
    const row=runtime?.data as any;
    const dbPixel=clean(row?.config?.pixel_id,80);
    const dbTest=clean(row?.config?.test_event_code,120);
    if(row){
      if(dbPixel) pixelId=dbPixel;
      if(dbTest) testEventCode=dbTest;
      enabled=Boolean(row.enabled && (dbPixel || pixelId));
    }
    if(secret?.value) accessToken=clean(secret.value,4096);
  }catch{}

  return {enabled,pixelId,testEventCode,accessToken,capiConfigured:Boolean(accessToken)};
}

const EVENT_MAP:Record<string,string>={
  page_view:'PageView',
  package_view:'ViewContent',
  line_click:'LineAddFriendClick',
  lead_submit:'Lead',
  contact_click:'Contact',
};

function firstForwardedIp(value:string){
  return String(value||'').split(',')[0]?.trim().slice(0,100) || '';
}

export async function sendMetaCapiEvent({
  supabase,
  request,
  sourceEvent,
  eventId,
  eventSourceUrl,
  packageSlug='',
  customData={},
  userData={},
  testEventCodeOverride,
  force=false,
}:{
  supabase:any;
  request:Request | {headers:Headers};
  sourceEvent:string;
  eventId?:string;
  eventSourceUrl:string;
  packageSlug?:string;
  customData?:Record<string,unknown>;
  userData?:Record<string,string>;
  testEventCodeOverride?:string|null;
  force?:boolean;
}){
  const eventName=EVENT_MAP[sourceEvent] || sourceEvent;
  const cfg=await getMetaServerConfig(supabase);
  if((!cfg.enabled && !force) || !cfg.pixelId || !cfg.accessToken){
    return {ok:false,skipped:true,reason:'meta_capi_not_configured'} as const;
  }

  const headers=request.headers;
  const userAgent=clean(headers.get('user-agent'),500);
  const clientIp=firstForwardedIp(headers.get('x-forwarded-for') || headers.get('x-real-ip') || '');
  const metaUserData:Record<string,string>={};
  if(userAgent) metaUserData.client_user_agent=userAgent;
  if(clientIp) metaUserData.client_ip_address=clientIp;
  const fbp=clean(userData.fbp,250);
  const fbc=clean(userData.fbc,250);
  if(fbp) metaUserData.fbp=fbp;
  if(fbc) metaUserData.fbc=fbc;

  const event:any={
    event_name:eventName,
    event_time:Math.floor(Date.now()/1000),
    action_source:'website',
    event_source_url:clean(eventSourceUrl,1000),
    event_id:clean(eventId,160) || `bc_${sourceEvent}_${Date.now()}_${Math.random().toString(36).slice(2,10)}`,
    user_data:metaUserData,
  };
  const mergedCustom={...customData};
  if(packageSlug){
    Object.assign(mergedCustom,{content_name:packageSlug,content_category:'Bhutan Tour Package',content_ids:[packageSlug],content_type:'product'});
  }
  if(Object.keys(mergedCustom).length) event.custom_data=mergedCustom;

  const payload:any={data:[event]};
  const testCode=testEventCodeOverride===undefined ? null : clean(testEventCodeOverride,120);
  if(testCode) payload.test_event_code=testCode;

  const graphVersion=clean(process.env.META_GRAPH_API_VERSION || 'v24.0',20);
  const endpoint=`https://graph.facebook.com/${encodeURIComponent(graphVersion)}/${encodeURIComponent(cfg.pixelId)}/events?access_token=${encodeURIComponent(cfg.accessToken)}`;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),4500);
  try{
    const response=await fetch(endpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      signal:controller.signal,
      cache:'no-store',
    });
    const json:any=await response.json().catch(()=>({}));
    if(!response.ok){
      return {ok:false,skipped:false,status:response.status,error:clean(json?.error?.message || json?.error?.error_user_msg || `Meta HTTP ${response.status}`,800),code:json?.error?.code,subcode:json?.error?.error_subcode,fbtraceId:json?.error?.fbtrace_id || null};
    }
    return {ok:true,skipped:false,status:response.status,eventsReceived:Number(json?.events_received||0),messages:Array.isArray(json?.messages)?json.messages:[],fbtraceId:json?.fbtrace_id||null,eventName,eventId:event.event_id};
  }catch(error:any){
    return {ok:false,skipped:false,status:0,error:error?.name==='AbortError'?'Meta request timeout':clean(error?.message||error,800)};
  }finally{
    clearTimeout(timeout);
  }
}
