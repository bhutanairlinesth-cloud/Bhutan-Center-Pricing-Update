import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, CheckCircle2, Copy, Globe2, MousePointerClick,
  Megaphone, Radio, RefreshCw, Save, Send, Server, Settings2, Target, UserCheck, UsersRound, Wifi,
} from 'lucide-react';
import { CustomerTracking, QuotationRecord, TourPackage, User } from '../types';
import { isSupabaseConfigured, supabaseAuth } from '../lib/supabase';
import { PageHeader, SectionCard, Toggle } from '../shared/ui';

interface LiveVisitor {
  sessionId:string|null;
  visitorId:string|null;
  pagePath:string;
  packageSlug:string;
  source:string;
  campaign:string;
  device:'Mobile'|'Desktop'|string;
  lastSeenAt:string;
  lastSeenSeconds:number;
  eventName:string;
}
interface RealtimeSnapshot {
  liveSessions:number;
  liveVisitors:LiveVisitor[];
  liveWindowSeconds:number;
  heartbeatSeconds:number;
  pollSeconds:number;
  storageReady?:boolean;
  error?:{code:string;message:string}|null;
}
interface Summary {
  periodDays:number;
  trackingConfigured:boolean;
  trackingStorageReady:boolean;
  trackingMode:'service_role'|'rls_fallback'|'missing'|string;
  trackingError?:{code:string;message:string}|null;
  liveSessions:number;
  liveVisitors:LiveVisitor[];
  liveWindowSeconds:number;
  uniqueVisitors:number;
  pageViews:number;
  packageViews:number;
  packageViewVisitors:number;
  lineClicks:number;
  lineClickVisitors:number;
  websiteLeads:number;
  lineFriends:number;
  lineFriendVisitors:number;
  lineFriendsWithoutTracking:number;
  visitorsNoLineClick:number;
  packageVisitorsNoLineClick:number;
  lineClickVisitorsNoFriend:number;
  lineConfigured:boolean;
  lineBasicIdConfigured:boolean;
  metaPixelConfigured:boolean;
  metaCapiConfigured:boolean;
  metaTestEventConfigured:boolean;
  metaPixelIdMasked:string|null;
  googleAdsVisitors:number;
  googleTagConfigured:boolean;
  ga4Configured:boolean;
  googleAdsConfigured:boolean;
  googleAdsLineConversionConfigured:boolean;
  googleAdsLeadConversionConfigured:boolean;
  googleTagIdMasked:string|null;
  ga4IdMasked:string|null;
  googleAdsIdMasked:string|null;
}
interface PriceRow { id:string; name:string; nights:number; override:null|{visible:boolean;price_override_thb:number|null}; }
interface AudiencePreset { id:string; name:string; count:number; source:string; intent:string; futureMeta:string; description:string; }
interface AudienceData { days:number; tagStorageReady:boolean; sources:{website:boolean;line:boolean;crm:boolean;meta:boolean}; audiences:AudiencePreset[]; tags:{tag:string;count:number;source:'website'|'line'}[]; note:string; }

interface MetaAudienceRecipe {
  id:string;
  name:string;
  priority:'เริ่มก่อน'|'แนะนำ'|'High Intent'|'Phase 2';
  source:string;
  retention:string;
  rule:string;
  use:string;
  exclude?:string;
  note?:string;
}

const LOCAL_NOTICE = 'โหมด Local · แสดงข้อมูลตัวอย่าง (ยังไม่ได้เชื่อม Supabase)';
const LOCAL_SAVE_NOTICE = 'โหมด Local · ไม่ได้บันทึก/ส่งจริง';

const TAG_RULES = [
  { tag: 'Website Visitor', condition: 'เข้าเว็บอย่างน้อย 1 ครั้ง' },
  { tag: 'Package Interest', condition: 'ดูหน้าแพ็กเกจ' },
  { tag: 'LINE Intent', condition: 'กด CTA ไป LINE' },
  { tag: 'LINE Friend', condition: 'เพิ่มเพื่อน OA' },
  { tag: 'LINE Engaged', condition: 'เคยส่งข้อความ' },
  { tag: 'Website ↔ LINE Matched', condition: 'จับคู่ Visitor กับ LINE ได้แล้ว' },
];

const META_PLAYBOOK_STEPS = [
  { title: 'เปิด Meta Ads Manager', desc: 'ไปที่ All tools → Audiences' },
  { title: 'Create Audience', desc: 'เลือก Custom Audience → Website' },
  { title: 'เลือก Bhutan Center Dataset', desc: 'เลือก Pixel/Dataset แล้วเลือก Rule ตามสูตร' },
  { title: 'ตั้ง Retention + ชื่อ', desc: 'Copy ชื่อ Audience จากหลังบ้านได้เลย' },
  { title: 'Create Audience', desc: 'รอ Meta Populate แล้วนำไป Include / Exclude ที่ Ad Set' },
];

const META_CAMPAIGN_RECIPES = [
  { id: '01', name: 'Warm Retarget', rule: 'Include: Website Visitors 30D', note: 'Exclude: LINE Intent 14D เพื่อแยกคน Intent สูงไปอีกชุด', hot: false },
  { id: '02', name: 'Package Retarget', rule: 'Include: Package Viewers 30D', note: 'ใช้ Creative แพ็กเกจ / รีวิว / High Season / ราคาเริ่มต้น', hot: false },
  { id: '03', name: 'High Intent', rule: 'Include: LINE Intent 14D', note: 'CTA ตรงไป LINE OA · ปรึกษาทริป · เช็กวันเดินทาง', hot: true },
  { id: '04', name: 'Acquisition Exclusion', rule: 'Exclude: Leads / Confirmed-Paid', note: 'ลดการยิงโฆษณาหาลูกค้าใหม่ใส่คนที่เข้ากระบวนการแล้ว', hot: false },
];

const META_AUDIENCE_RECIPES:MetaAudienceRecipe[]=[
  {id:'all_visitors_30',name:'BC | Website Visitors | 30D',priority:'เริ่มก่อน',source:'Website',retention:'30 วัน',rule:'Include: All website visitors',use:'Retarget คนที่เคยเข้าเว็บด้วย Content, Package, High Season',exclude:'แยก High Intent ออกไปยิงชุดเฉพาะได้'},
  {id:'package_viewers_30',name:'BC | Package Viewers | 30D',priority:'เริ่มก่อน',source:'Website Event',retention:'30 วัน',rule:'Include Event: ViewContent',use:'ยิงแพ็กเกจ, รีวิว, จุดเด่นทริป, ราคาเริ่มต้น',exclude:'แนะนำ Exclude: BC | LINE Intent | 14D'},
  {id:'line_intent_14',name:'BC | LINE Intent | 14D',priority:'High Intent',source:'Website Event',retention:'14 วัน',rule:'Include Event: LineAddFriendClick',use:'กลุ่ม Intent สูง — CTA ให้ทัก LINE, ปรึกษาทริป, เช็กวันเดินทาง',note:'Event นี้มาจากการกดปุ่ม LINE บน BhutanCenter.org ไม่ใช่ LINE userId'},
  {id:'lead_30',name:'BC | Website Leads | 30D',priority:'แนะนำ',source:'Website Event',retention:'30 วัน',rule:'Include Event: Lead',use:'Follow-up คนที่ส่งฟอร์มแล้ว แต่ยังไม่ปิดการขาย',exclude:'ตอนสร้าง Acquisition Campaign สามารถใช้กลุ่มนี้เป็น Exclusion'},
  {id:'visa_interest_30',name:'BC | Visa Interest | 30D',priority:'แนะนำ',source:'Website URL',retention:'30 วัน',rule:'Include people who visited URL containing: /visa',use:'ยิง Content เรื่อง Visa, SDF, ขั้นตอนเดินทาง แล้วพากลับเข้า Package/LINE'},
  {id:'customer_exclusion',name:'BC | Confirmed-Paid | Exclusion',priority:'Phase 2',source:'CRM / Customer List',retention:'ตามข้อมูลลูกค้า',rule:'Customer List จากข้อมูลติดต่อที่ได้รับอนุญาต หรือ Purchase event เมื่อเชื่อม Payment',use:'Exclude ลูกค้าที่ซื้อแล้วออกจากแคมเปญหาลูกค้าใหม่',note:'ไม่ใช้ LINE userId ส่งเข้า Meta โดยตรง — Phase ต่อไปค่อย Sync จาก CRM อย่างปลอดภัย'},
];

interface IntegrationSettings { storageReady:boolean; storageError?:{code:string;message:string}|null; meta:{enabled:boolean;pixelId:string;pixelIdMasked:string|null;testEventCode:string;testEventConfigured:boolean;capiConfigured:boolean;accessTokenMasked:string|null;secretStorageReady:boolean;tokenSource:string;source:string;updatedAt:string|null;lastTestAt:string|null;lastTestOk:boolean|null;lastTestMessage:string|null;lastTestEventsReceived:number}; line:{enabled:boolean;url:string;source:string;updatedAt:string|null}; }

type MarketingTab = 'overview' | 'realtime' | 'audience' | 'funnel' | 'meta' | 'google' | 'website' | 'line' | 'seo' | 'integrations';

const subtitleByTab: Record<MarketingTab, string> = {
  overview: 'เห็นตั้งแต่คนเข้าเว็บจนถึงการปิดการขาย · Website, LINE และ Customer Tracking ใน Funnel เดียวกัน',
  realtime: 'ผู้เข้าชมที่กำลังอยู่บนเว็บตอนนี้ · heartbeat ทุก 6 วินาที · อัปเดตทุก 2 วินาที',
  audience: 'แบ่งกลุ่มคนจาก Website + LINE · First-party Audience ก่อนเชื่อม Ads',
  funnel: 'รู้ว่าใครหลุดตรงไหนแล้วตามกลับมา · LINE + Customer Tracking เป็นจุดเปลี่ยน',
  meta: 'Facebook Pixel & Conversions API · Browser + Server events',
  google: 'Google Tag, GA4 และ Ads · Remarketing-ready',
  website: 'ราคาแสดงบนเว็บไซต์ · แยกจากสูตรขายจริง',
  line: 'ช่องทางหลักสำหรับปิดการขาย · Broadcast จากหลังบ้าน',
  seo: 'Legacy URL, Sitemap, Robots · ย้ายจาก Wix แบบลดความเสี่ยง Ranking',
  integrations: 'ตั้งค่า Meta Pixel, LINE OA และ Google Tag',
};

const MARKETING_TAB_PATHS: Record<MarketingTab, string> = {
  overview: '/admin/marketing',
  realtime: '/admin/marketing/realtime',
  audience: '/admin/marketing/audience',
  funnel: '/admin/marketing/funnel',
  meta: '/admin/marketing/meta',
  google: '/admin/marketing/google',
  website: '/admin/marketing/website',
  line: '/admin/marketing/line',
  seo: '/admin/marketing/seo',
  integrations: '/admin/marketing/integrations',
};
type IntegrationPanel = 'settings' | 'meta' | 'google';
function integrationPanelFromPath(pathname:string): IntegrationPanel {
  const path=pathname.replace(/\/+$/,'');
  if(path.startsWith('/admin/marketing/meta')) return 'meta';
  if(path.startsWith('/admin/marketing/google')) return 'google';
  return 'settings';
}
function marketingTabFromPath(pathname:string): MarketingTab {
  const path=pathname.replace(/\/+$/,'');
  if(path.startsWith('/admin/marketing/realtime')) return 'realtime';
  if(path.startsWith('/admin/marketing/audience')) return 'audience';
  if(path.startsWith('/admin/marketing/funnel')) return 'funnel';
  if(path.startsWith('/admin/marketing/integrations')) return 'integrations';
  if(path.startsWith('/admin/marketing/meta')) return 'integrations';
  if(path.startsWith('/admin/marketing/google')) return 'integrations';
  if(path.startsWith('/admin/marketing/website')) return 'website';
  if(path.startsWith('/admin/marketing/line')) return 'line';
  if(path.startsWith('/admin/marketing/seo')) return 'seo';
  return 'overview';
}

async function authHeaders(){
  const session = await supabaseAuth.getSession();
  return { 'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token || ''}` };
}

function demoPricesFromPackages(packages: TourPackage[]): PriceRow[] {
  return packages.map((p) => ({ id: p.id, name: p.name, nights: p.nights, override: null }));
}

function applyDemoMarketingState(
  packages: TourPackage[],
  setters: {
    setSummary: (v: Summary) => void;
    setRealtime: (v: RealtimeSnapshot) => void;
    setAudience: (v: AudienceData) => void;
    setIntegrations: (v: IntegrationSettings) => void;
    setPrices: (v: PriceRow[]) => void;
    setMetaPixelId: (v: string) => void;
    setMetaTestEventCode: (v: string) => void;
    setMetaEnabled: (v: boolean) => void;
    setLineOaUrl: (v: string) => void;
    setNotice: (v: string) => void;
  },
) {
  // ponytail: demo data only when Supabase env is missing; real data comes from /api/marketing/* on Next/Vercel
  setters.setSummary(DEMO_SUMMARY);
  setters.setRealtime(DEMO_REALTIME);
  setters.setAudience(DEMO_AUDIENCE);
  setters.setIntegrations(DEMO_INTEGRATIONS);
  setters.setPrices(demoPricesFromPackages(packages));
  setters.setMetaPixelId(DEMO_INTEGRATIONS.meta.pixelId);
  setters.setMetaTestEventCode(DEMO_INTEGRATIONS.meta.testEventCode);
  setters.setMetaEnabled(DEMO_INTEGRATIONS.meta.enabled);
  setters.setLineOaUrl(DEMO_INTEGRATIONS.line.url);
  setters.setNotice(LOCAL_NOTICE);
}

const titleByTab:Record<MarketingTab,string> = {
  overview:'ภาพรวมการตลาด', realtime:'ผู้เข้าชมเรียลไทม์', audience:'Audience & Tags', funnel:'Funnel & Retargeting', meta:'Facebook Pixel', google:'Google Analytics & Ads', website:'เว็บไซต์', line:'LINE OA', seo:'SEO', integrations:'การเชื่อมต่อ',
};

export function GrowthWorkspace({ currentUser, packages, trackings, quotations, onBack, onLogout }:{ currentUser:User; packages:TourPackage[]; trackings:CustomerTracking[]; quotations:QuotationRecord[]; onBack:()=>void; onLogout:()=>void; }){
  const initialPath=typeof window!=='undefined'?window.location.pathname:'/admin/marketing';
  const [tab,setTab]=useState<MarketingTab>(()=>marketingTabFromPath(initialPath));
  const [integrationPanel,setIntegrationPanel]=useState<IntegrationPanel>(()=>integrationPanelFromPath(initialPath));
  const [summary,setSummary]=useState<Summary|null>(null);
  const [realtime,setRealtime]=useState<RealtimeSnapshot|null>(null);
  const [audience,setAudience]=useState<AudienceData|null>(null);
  const [prices,setPrices]=useState<PriceRow[]>([]);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');
  const [notice,setNotice]=useState('');
  const [periodDays,setPeriodDays]=useState<7|30|90>(30);
  const [integrations,setIntegrations]=useState<IntegrationSettings|null>(null);
  const [metaPixelId,setMetaPixelId]=useState('');
  const [metaTestEventCode,setMetaTestEventCode]=useState('');
  const [metaEnabled,setMetaEnabled]=useState(false);
  const [metaAccessToken,setMetaAccessToken]=useState('');
  const [metaTesting,setMetaTesting]=useState(false);
  const [metaTestResult,setMetaTestResult]=useState<{ok:boolean;message:string;eventsReceived?:number;fbtraceId?:string|null;diagnostics?:{graphVersion?:string;datasetId?:string;testEventCodeUsed?:string;clientIpDetected?:boolean;clientIpMasked?:string;userAgentDetected?:boolean;eventSourceUrl?:string;partnerAgent?:string}}|null>(null);
  const [lineOaUrl,setLineOaUrl]=useState('https://lin.ee/qQQMmYIt');
  const [lineMode,setLineMode]=useState<'text'|'image'|'card'>('text');
  const [broadcastName,setBroadcastName]=useState('LINE Broadcast');
  const [imageUrl,setImageUrl]=useState('');
  const [imagePreviewUrl,setImagePreviewUrl]=useState('');
  const [imageCaption,setImageCaption]=useState('');
  const [cardTitle,setCardTitle]=useState('เที่ยวภูฏานกับ Bhutan Center');
  const [cardBody,setCardBody]=useState('วางแผนทริปส่วนตัวได้ ทั้งตั๋วบิน วีซ่า โรงแรม และโปรแกรมเดินทาง');
  const [cardImageUrl,setCardImageUrl]=useState('');
  const [cardButtonLabel,setCardButtonLabel]=useState('คุยใน LINE');
  const [cardButtonUrl,setCardButtonUrl]=useState('https://lin.ee/qQQMmYIt');
  const [cardAltText,setCardAltText]=useState('Bhutan Center LINE card');

  async function copyAudienceText(text:string,label='ข้อมูล'){
    try{
      await navigator.clipboard.writeText(text);
      setNotice(`คัดลอก ${label} แล้ว`);
    }catch{
      setNotice(`คัดลอกไม่สำเร็จ · ${text}`);
    }
  }

  useEffect(()=>{
    function handlePopState(){
      if(!window.location.pathname.startsWith('/admin/marketing'))return;
      setTab(marketingTabFromPath(window.location.pathname));
      setIntegrationPanel(integrationPanelFromPath(window.location.pathname));
    }
    window.addEventListener('popstate',handlePopState);
    return()=>window.removeEventListener('popstate',handlePopState);
  },[]);

  function localOnlyGuard(): boolean {
    if (!isSupabaseConfigured) {
      setNotice(LOCAL_SAVE_NOTICE);
      return true;
    }
    return false;
  }

  async function refreshRealtime(){
    if (!isSupabaseConfigured) {
      setRealtime(DEMO_REALTIME);
      return;
    }
    try {
      const headers=await authHeaders();
      const res=await fetch('/api/marketing/realtime',{headers,cache:'no-store'});
      if(!res.ok) return;
      const data=await res.json() as RealtimeSnapshot;
      setRealtime(data);
    } catch {}
  }

  async function refresh(){
    setLoading(true); setNotice('');
    try {
      if (!isSupabaseConfigured) {
        applyDemoMarketingState(packages, {
          setSummary, setRealtime, setAudience, setIntegrations, setPrices,
          setMetaPixelId, setMetaTestEventCode, setMetaEnabled, setLineOaUrl, setNotice,
        });
        return;
      }
      const headers=await authHeaders();
      const [a,b,c,d]=await Promise.all([
        fetch(`/api/marketing/summary?days=${periodDays}`,{headers}),
        fetch('/api/website/prices',{headers}),
        fetch(`/api/marketing/audiences?days=${periodDays}`,{headers}),
        fetch('/api/marketing/integrations',{headers}),
      ]);
      if(a.ok){
        setSummary(await a.json());
      }else{
        const j=await a.json().catch(()=>({}));
        setNotice(`Realtime API ยังไม่พร้อม: ${j.error||`HTTP ${a.status}`}`);
      }
      if(b.ok){const j=await b.json();setPrices(j.packages||[]);}
      if(c.ok)setAudience(await c.json());
      if(d.ok){
        const j=await d.json() as IntegrationSettings;
        setIntegrations(j);
        setMetaPixelId(j.meta?.pixelId||'');
        setMetaTestEventCode(j.meta?.testEventCode||'');
        setMetaEnabled(Boolean(j.meta?.enabled));
        setLineOaUrl(j.line?.url||'https://lin.ee/qQQMmYIt');
      }
    } finally { setLoading(false); }
  }
  useEffect(()=>{ refresh(); },[periodDays]);
  useEffect(()=>{
    if(tab!=='realtime' && tab!=='overview') return;
    refreshRealtime();
    const intervalMs=tab==='realtime'?2_000:5_000;
    const timer=window.setInterval(()=>{ refreshRealtime(); },intervalMs);
    return()=>window.clearInterval(timer);
  },[tab]);
  useEffect(()=>{
    if(tab!=='realtime') return;
    const timer=window.setInterval(()=>{ refresh(); },30_000);
    return()=>window.clearInterval(timer);
  },[tab,periodDays]);

  const sales=useMemo(()=>{
    const cutoff=Date.now()-(periodDays*24*60*60*1000);
    const periodRows=trackings.filter((x)=>{
      const time=Date.parse(x.createdAt || x.updatedAt || '');
      return !Number.isFinite(time) || time>=cutoff;
    });
    const quoteSent=periodRows.filter((x)=>Boolean(x.quotationSentAt) || ['quote_sent','won','completed'].includes(x.status)).length;
    const confirmed=periodRows.filter((x)=>Boolean(x.bookingConfirmedAt) || ['won','completed'].includes(x.status)).length;
    const paid=periodRows.filter((x)=>Boolean(x.firstPaymentReceivedAt || x.fullPaymentReceivedAt) || x.status==='completed').length;
    return {
      leads:periodRows.length,
      quoteSent,
      confirmed,
      paid,
      trackingNoQuote:Math.max(0,periodRows.length-quoteSent),
      quoteNoConfirm:Math.max(0,quoteSent-confirmed),
      confirmedNoPaid:Math.max(0,confirmed-paid),
      quotes:quotations.length,
    };
  },[trackings,quotations,periodDays]);

  const broadcastReady = useMemo(() => {
    if (lineMode === 'text') return Boolean(message.trim());
    if (lineMode === 'image') return /^https?:\/\//i.test(imageUrl.trim());
    return Boolean(cardTitle.trim() && cardBody.trim() && cardButtonLabel.trim() && /^https?:\/\//i.test(cardButtonUrl.trim()));
  }, [lineMode, message, imageUrl, cardTitle, cardBody, cardButtonLabel, cardButtonUrl]);

  useEffect(() => {
    if (!cardButtonUrl.trim()) setCardButtonUrl(lineOaUrl || 'https://lin.ee/qQQMmYIt');
  }, [lineOaUrl]);

  async function savePrice(row:PriceRow, price:string, visible:boolean){
    if (localOnlyGuard()) return;
    const headers=await authHeaders();
    const res=await fetch('/api/website/prices',{method:'POST',headers,body:JSON.stringify({package_id:row.id,price_override_thb:price===''?null:Number(price),visible})});
    const json=await res.json().catch(()=>({}));
    if(!res.ok){setNotice(json.error||'บันทึกไม่สำเร็จ');return;}
    setNotice('บันทึกราคาเว็บไซต์แล้ว'); refresh();
  }

  async function saveMetaSettings(){
    if (localOnlyGuard()) return false;
    const headers=await authHeaders();
    const res=await fetch('/api/marketing/integrations',{method:'POST',headers,body:JSON.stringify({section:'meta',pixelId:metaPixelId,testEventCode:metaTestEventCode,enabled:metaEnabled,accessToken:metaAccessToken})});
    const json=await res.json().catch(()=>({}));
    if(!res.ok){setNotice(json.error||'บันทึก Meta Pixel ไม่สำเร็จ');return false;}
    setMetaAccessToken('');
    setNotice(json.message||'บันทึก Meta Pixel แล้ว');
    await refresh();
    return true;
  }

  async function sendMetaTestEvent(){
    if (localOnlyGuard()) return;
    setMetaTesting(true); setMetaTestResult(null);
    try{
      const saved=await saveMetaSettings();
      if(!saved) return;
      const headers=await authHeaders();
      const res=await fetch('/api/marketing/meta-test',{method:'POST',headers,body:JSON.stringify({})});
      const json=await res.json().catch(()=>({}));
      const result={ok:Boolean(res.ok&&json.ok),message:String(json.message||json.error||'Meta Test Event ไม่สำเร็จ'),eventsReceived:Number(json.eventsReceived||0),fbtraceId:json.fbtraceId||null,diagnostics:json.diagnostics||undefined};
      setMetaTestResult(result);
      setNotice(result.ok?result.message:`Test Event ไม่ผ่าน: ${result.message}`);
      await refresh();
    }finally{ setMetaTesting(false); }
  }

  async function saveLineSettings(){
    if (localOnlyGuard()) return;
    const headers=await authHeaders();
    const res=await fetch('/api/marketing/integrations',{method:'POST',headers,body:JSON.stringify({section:'line',lineUrl:lineOaUrl})});
    const json=await res.json().catch(()=>({}));
    if(!res.ok){setNotice(json.error||'บันทึกลิงก์ LINE ไม่สำเร็จ');return;}
    setNotice(json.message||'บันทึกลิงก์ LINE OA แล้ว');
    await refresh();
  }

  async function broadcast(){
    if (localOnlyGuard()) return;
    const payload:Record<string, any> = { mode: lineMode, name: broadcastName.trim() || 'LINE Broadcast' };
    if(lineMode==='text'){
      if(!message.trim()) return;
      payload.text = message.trim();
    }
    if(lineMode==='image'){
      if(!/^https?:\/\//i.test(imageUrl.trim())){ setNotice('กรุณาใส่ลิงก์รูปภาพแบบ https://'); return; }
      payload.imageUrl = imageUrl.trim();
      payload.previewImageUrl = (imagePreviewUrl.trim() || imageUrl.trim());
      payload.caption = imageCaption.trim();
    }
    if(lineMode==='card'){
      if(!cardTitle.trim() || !cardBody.trim() || !cardButtonLabel.trim() || !/^https?:\/\//i.test(cardButtonUrl.trim())){
        setNotice('กรุณากรอกข้อมูลการ์ดให้ครบ และ CTA URL ต้องเป็น https://');
        return;
      }
      payload.title = cardTitle.trim();
      payload.body = cardBody.trim();
      payload.buttonLabel = cardButtonLabel.trim();
      payload.buttonUrl = cardButtonUrl.trim();
      payload.imageUrl = cardImageUrl.trim();
      payload.altText = cardAltText.trim();
    }
    if(!window.confirm('ยืนยันส่ง Broadcast นี้ไปยัง LINE Contact ที่เป็นเพื่อนทั้งหมด?')) return;
    const headers=await authHeaders();
    const res=await fetch('/api/line/broadcast',{method:'POST',headers,body:JSON.stringify(payload)});
    const json=await res.json().catch(()=>({}));
    setNotice(res.ok?`ส่งสำเร็จ ${json.sent||0} คน`:(json.error||'ส่งไม่สำเร็จ'));
    if(res.ok){ setMessage(''); setImageUrl(''); setImagePreviewUrl(''); setImageCaption(''); }
  }

  return <div className="growth-shell unified-module-view">
    <div className="module-list-page bo-list-page">
      <PageHeader
        title={titleByTab[tab]}
        subtitle={subtitleByTab[tab]}
        actions={(
          <>
            {(tab==='overview'||tab==='funnel'||tab==='audience') && <div className="marketing-period-switch" aria-label="ช่วงเวลารายงาน">
              {([7,30,90] as const).map((days)=><button key={days} type="button" className={periodDays===days?'active':''} onClick={()=>setPeriodDays(days)}>{days}D</button>)}
            </div>}
            <button type="button" className="workspace-refresh-button" onClick={refresh}><RefreshCw className={loading?'spin':''}/><span>รีเฟรช</span></button>
          </>
        )}
      />
      {notice && <div className="growth-notice">{notice}</div>}

        {tab==='overview' && <>
          <SectionCard title="สถิติหลัก">
            <ul className="bo-stat-list">
              <li className="bo-stat-row"><div><small>ONLINE NOW</small></div><strong>{realtime?.liveSessions ?? summary?.liveSessions ?? 0}</strong><span>กำลังอยู่บนเว็บไซต์ตอนนี้</span></li>
              <li className="bo-stat-row"><div><small>VISITORS · {periodDays}D</small></div><strong>{summary?.uniqueVisitors ?? 0}</strong><span>ผู้เข้าชมไม่ซ้ำ</span></li>
              <li className="bo-stat-row"><div><small>PACKAGE INTEREST</small></div><strong>{summary?.packageViewVisitors ?? 0}</strong><span>คนที่เปิดดูแพ็กเกจ</span></li>
              <li className="bo-stat-row"><div><small>LINE INTENT</small></div><strong>{summary?.lineClickVisitors ?? 0}</strong><span>คนที่กดไป LINE OA</span></li>
            </ul>
          </SectionCard>
          <SectionCard title={`Funnel · Website → LINE → Sale (${periodDays}D)`}>
            <FunnelStageTable stages={[
              { label: 'Visitors', value: summary?.uniqueVisitors ?? 0, base: summary?.uniqueVisitors ?? 0 },
              { label: 'Package', value: summary?.packageViewVisitors ?? 0, base: summary?.uniqueVisitors ?? 0 },
              { label: 'LINE Click', value: summary?.lineClickVisitors ?? 0, base: summary?.packageViewVisitors ?? 0 },
              { label: 'LINE Friend', value: summary?.lineFriends ?? 0, base: summary?.lineClickVisitors ?? 0 },
              { label: 'Tracking', value: sales.leads, base: Math.max(summary?.lineFriends ?? 0, sales.leads) },
              { label: 'Quotation', value: sales.quoteSent, base: sales.leads },
              { label: 'Confirmed', value: sales.confirmed, base: sales.quoteSent },
            ]} />
          </SectionCard>
          <SectionCard title="สถานะการเชื่อมต่อ">
            <div className="bo-status-list">
              <div className="bo-status-row ready"><span className="bo-status-icon"><Target /></span><div><strong>Funnel & Retargeting</strong><span>ดูจุดตกหล่นและกลุ่มเป้าหมายที่ตามต่อได้</span></div><span className="bo-status-pill">พร้อม</span></div>
              <div className={`bo-status-row ${summary?.metaPixelConfigured ? 'ready' : ''}`}><span className="bo-status-icon"><Target /></span><div><strong>Facebook Pixel</strong><span>{summary?.metaPixelConfigured ? 'เชื่อม Browser Pixel แล้ว' : 'รอ Pixel ID'}</span></div><span className="bo-status-pill">{summary?.metaPixelConfigured ? 'พร้อม' : 'รอเชื่อม'}</span></div>
              <div className={`bo-status-row ${summary?.googleTagConfigured ? 'ready' : ''}`}><span className="bo-status-icon"><Activity /></span><div><strong>Analytics & Ads</strong><span>{summary?.googleTagConfigured ? 'Google Tag พร้อมทำงาน' : 'รอ Google Tag / GA4 / Ads ID'}</span></div><span className="bo-status-pill">{summary?.googleTagConfigured ? 'พร้อม' : 'รอเชื่อม'}</span></div>
              <div className="bo-status-row ready"><span className="bo-status-icon"><UserCheck /></span><div><strong>{summary?.lineFriends ?? 0} LINE Friends</strong><span>พร้อมต่อยอด Tag / Broadcast / CRM</span></div><span className="bo-status-pill">พร้อม</span></div>
            </div>
          </SectionCard>
        </>}

        {tab==='realtime' && <>
          <SectionCard title="สรุป Realtime">
            {summary && (!summary.trackingConfigured || !summary.trackingStorageReady) ? (
              <MetaStatusRow icon={Wifi} label="Realtime Tracking" ready={false} detail={!summary.trackingConfigured ? 'ยังไม่พบค่า Supabase สำหรับ Server API' : summary.trackingError?.code === '42P01' ? 'ยังไม่มีตาราง website_events — รัน SQL V13.5.1' : summary.trackingError?.code === '42501' ? 'RLS ยังไม่อนุญาตให้อ่าน Realtime' : `Database: ${summary.trackingError?.code || 'not ready'}`} />
            ) : summary?.trackingStorageReady ? (
              <MetaStatusRow icon={CheckCircle2} label="Tracking" ready detail={`${summary.trackingMode === 'service_role' ? 'Service Role' : 'RLS fallback'} · หน้า /admin ไม่นับเป็นผู้เข้าชม`} />
            ) : null}
            <ul className="bo-stat-list">
              <li className="bo-stat-row"><div><small>ONLINE NOW</small></div><strong>{realtime?.liveSessions ?? summary?.liveSessions ?? 0}</strong><span>คนกำลังอยู่บนเว็บไซต์ · อัปเดต 0–2 วินาที</span></li>
              <li className="bo-stat-row"><div><small>HEARTBEAT</small></div><strong>{realtime?.heartbeatSeconds ?? 6}s</strong><span>Online / Offline signal แยกจาก Analytics</span></li>
              <li className="bo-stat-row"><div><small>POLL</small></div><strong>{realtime?.pollSeconds ?? 2}s</strong><span>Auto refresh active sessions</span></li>
            </ul>
          </SectionCard>
          <SectionCard title={`ผู้เข้าชมที่กำลังอยู่บนเว็บ · LIVE ${realtime?.pollSeconds ?? 2}s`}>
            {((realtime?.liveVisitors || summary?.liveVisitors || []).length) > 0 ? (
              <div className="module-table-wrap bo-table-wrap"><table className="module-table bo-table"><thead><tr><th>ผู้เข้าชม</th><th>หน้าที่กำลังดู</th><th>ที่มา</th><th>อุปกรณ์</th><th>ล่าสุด</th></tr></thead><tbody>
                {(realtime?.liveVisitors || summary?.liveVisitors || []).map((visitor, index) => <LiveVisitorTableRow key={`${visitor.sessionId}-${index}`} visitor={visitor} />)}
              </tbody></table></div>
            ) : <div className="realtime-empty"><Radio /><strong>ตอนนี้ยังไม่มี Active Session</strong><span>เมื่อมีคนเปิดหน้าเว็บไซต์ ระบบจะแสดงที่นี่ภายในไม่กี่วินาที</span></div>}
          </SectionCard>
        </>}

        {tab==='audience' && <>
          <SectionCard title="แหล่งข้อมูล Audience">
            <div className="bo-status-list">
              <div className="bo-status-row ready"><span className="bo-status-icon"><Globe2 /></span><div><strong>Website</strong><span>PageView · Package · Returning · LINE Click</span></div><span className="bo-status-pill">พร้อม</span></div>
              <div className={`bo-status-row ${audience?.sources.line ? 'ready' : ''}`}><span className="bo-status-icon"><Megaphone /></span><div><strong>LINE OA</strong><span>Friend · Message · Tags · Website Match</span></div><span className="bo-status-pill">{audience?.sources.line ? 'พร้อม' : 'รอข้อมูล'}</span></div>
              <div className="bo-status-row ready"><span className="bo-status-icon"><UsersRound /></span><div><strong>Customer Tracking</strong><span>Quotation · Confirmed · Paid · Exclusion</span></div><span className="bo-status-pill">พร้อม</span></div>
              <div className={`bo-status-row ${integrations?.meta?.enabled ? 'ready' : ''}`}><span className="bo-status-icon"><Target /></span><div><strong>Meta / Facebook</strong><span>{integrations?.meta?.enabled ? 'Pixel/CAPI เชื่อมแล้ว' : 'ยังไม่ Sync Audience ออก'}</span></div><span className="bo-status-pill">{integrations?.meta?.enabled ? 'พร้อม' : 'รอเชื่อม'}</span></div>
            </div>
          </SectionCard>

          <SectionCard title={`Audience Library · ${periodDays} DAYS`}>
            <div className="module-table-wrap bo-table-wrap"><table className="module-table bo-table"><thead><tr><th>กลุ่ม</th><th>ที่มา</th><th>Intent</th><th>จำนวน</th><th>คำอธิบาย</th></tr></thead><tbody>
              {(audience?.audiences || []).map((item) => <AudiencePresetTableRow key={item.id} item={item} />)}
              <AudiencePresetTableRow item={{ id: 'tracking_no_quote', name: 'Tracking · ยังไม่ Quote', count: sales.trackingNoQuote, source: 'CRM', intent: 'Hot', futureMeta: 'Sales Follow-up', description: 'มีข้อมูลลูกค้าแล้ว แต่ยังไม่ส่งใบเสนอราคา' }} />
              <AudiencePresetTableRow item={{ id: 'quote_no_confirm', name: 'Quote · ยังไม่ Confirm', count: sales.quoteNoConfirm, source: 'CRM', intent: 'Hot', futureMeta: 'Retarget / Reminder', description: 'ส่งใบเสนอราคาแล้ว แต่ยังไม่ยืนยัน' }} />
              <AudiencePresetTableRow item={{ id: 'paid_exclusion', name: 'Confirmed / Paid', count: sales.paid, source: 'CRM', intent: 'Exclude', futureMeta: 'Exclude from acquisition', description: 'ใช้เป็นกลุ่มตัดออกจากโฆษณาหาลูกค้าใหม่' }} />
            </tbody></table></div>
            <p className="bo-muted" style={{ marginTop: 12 }}>{audience?.note || 'LINE userId ใช้แบ่งกลุ่มใน CRM ได้ · Meta/Google Retargeting ใช้ Website tag และข้อมูลติดต่อที่ได้รับอนุญาต'}</p>
          </SectionCard>

          <SectionCard title="Retargeting Tags" actions={<span className={`bo-status-pill ${audience?.tagStorageReady ? 'ready' : ''}`}>{audience?.tagStorageReady ? 'TAG STORAGE READY' : 'รัน SQL V13.5'}</span>}>
            <div className="module-table-wrap bo-table-wrap"><table className="module-table bo-table"><thead><tr><th>Tag</th><th>ที่มา</th><th>จำนวน</th></tr></thead><tbody>
              {(audience?.tags || []).length ? (audience?.tags || []).map((item) => (
                <tr key={item.tag}><td><strong>{item.tag}</strong></td><td>{item.source}</td><td><strong>{item.count}</strong></td></tr>
              )) : <tr><td colSpan={3} className="bo-muted">Tag จะเริ่มเพิ่มเมื่อมีคนเข้าเว็บ ดูแพ็กเกจ กด LINE หรือมี LINE Interaction</td></tr>}
            </tbody></table></div>
            <div className="module-table-wrap bo-table-wrap" style={{ marginTop: 12 }}><table className="module-table bo-table"><thead><tr><th>Tag</th><th>เงื่อนไข</th></tr></thead><tbody>
              {TAG_RULES.map((rule) => <tr key={rule.tag}><td><strong>{rule.tag}</strong></td><td>{rule.condition}</td></tr>)}
            </tbody></table></div>
          </SectionCard>

          <details className="bo-details-collapse">
            <summary>วิธีสร้าง Audience ใน Meta</summary>
            <SectionCard title="Audience ที่แนะนำให้สร้างใน Meta" actions={<span className={`bo-status-pill ${integrations?.meta?.enabled && integrations?.meta?.capiConfigured ? 'ready' : ''}`}>{integrations?.meta?.enabled && integrations?.meta?.capiConfigured ? 'Pixel + CAPI พร้อม' : 'ยังเชื่อมไม่ครบ'}</span>}>
              <ol style={{ margin: '0 0 16px', paddingLeft: 20, color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
                {META_PLAYBOOK_STEPS.map((step, i) => <li key={step.title} style={{ marginBottom: 6 }}><strong style={{ color: 'var(--ink)' }}>{i + 1}. {step.title}</strong> — {step.desc}</li>)}
              </ol>
              <div className="module-table-wrap bo-table-wrap"><table className="module-table bo-table"><thead><tr><th>ชื่อ Audience</th><th>Priority</th><th>Source</th><th>Retention</th><th>Rule</th><th /></tr></thead><tbody>
                {META_AUDIENCE_RECIPES.map((recipe) => (
                  <MetaAudienceRecipeTableRow key={recipe.id} recipe={recipe} onCopy={copyAudienceText} />
                ))}
              </tbody></table></div>
              <p className="bo-muted" style={{ margin: '16px 0 8px', fontWeight: 500 }}>Campaign Recipes</p>
              <div className="module-table-wrap bo-table-wrap"><table className="module-table bo-table"><thead><tr><th>#</th><th>ชื่อ</th><th>Rule</th><th>หมายเหตุ</th></tr></thead><tbody>
                {META_CAMPAIGN_RECIPES.map((c) => (
                  <tr key={c.id}><td><strong>{c.id}</strong></td><td><strong>{c.name}</strong>{c.hot && <small style={{ display: 'block', color: 'var(--muted)' }}>High Intent</small>}</td><td>{c.rule}</td><td><span style={{ color: 'var(--muted)', fontSize: 12 }}>{c.note}</span></td></tr>
                ))}
              </tbody></table></div>
              <p className="bo-muted" style={{ marginTop: 12 }}>LINE Friend / LINE Engaged ใช้ Segmentation ใน CRM ได้ แต่ไม่ส่ง LINE userId เข้า Meta — ใช้ Website Event เช่น LineAddFriendClick แทน</p>
            </SectionCard>
          </details>
        </>}

        {tab==='funnel' && <>
          <SectionCard title="Bhutan Tour Funnel">
            <FunnelStageTable stages={[
              { label: 'Visitors', value: summary?.uniqueVisitors ?? 0, base: summary?.uniqueVisitors ?? 0, sub: 'เข้าเว็บไซต์' },
              { label: 'Package View', value: summary?.packageViewVisitors ?? 0, base: summary?.uniqueVisitors ?? 0, sub: 'เริ่มสนใจทริป' },
              { label: 'LINE Click', value: summary?.lineClickVisitors ?? 0, base: summary?.packageViewVisitors ?? 0, sub: 'Intent สูง' },
              { label: 'LINE Friend', value: summary?.lineFriends ?? 0, base: summary?.lineClickVisitors ?? 0, sub: 'รู้จัก LINE user' },
              { label: 'Customer Tracking', value: sales.leads, base: Math.max(summary?.lineFriends ?? 0, sales.leads), sub: 'ทีมเริ่มติดตาม' },
              { label: 'Quotation', value: sales.quoteSent, base: sales.leads, sub: 'ส่งข้อเสนอแล้ว' },
              { label: 'Confirmed', value: sales.confirmed, base: sales.quoteSent, sub: 'ลูกค้ายืนยัน' },
              { label: 'Paid', value: sales.paid, base: sales.confirmed, sub: 'มีการรับชำระ' },
            ]} />
          </SectionCard>

          <SectionCard title="กลุ่มที่ควรตามกลับมา">
            <div className="module-table-wrap bo-table-wrap"><table className="module-table bo-table"><thead><tr><th>กลุ่ม</th><th>จำนวน</th><th>คำอธิบาย</th><th>แนะนำ</th></tr></thead><tbody>
              <RetargetingTableRow label="Website Visitors" value={summary?.visitorsNoLineClick ?? 0} desc="เข้าเว็บแล้ว แต่ยังไม่กด LINE" action="ยิง Content / Package Reminder" />
              <RetargetingTableRow label="Package Interest" value={summary?.packageVisitorsNoLineClick ?? 0} desc="เปิดดูแพ็กเกจ แต่ยังไม่เข้า LINE" action="ยิงแพ็กเกจ / High Season" />
              <RetargetingTableRow label="LINE Intent" value={summary?.lineClickVisitorsNoFriend ?? 0} desc="กด LINE แล้ว แต่ยังจับคู่ Friend ไม่ได้" action="Retarget Meta / Google Ads" />
              <RetargetingTableRow label="LINE Friend · No CRM" value={summary?.lineFriendsWithoutTracking ?? 0} desc="เป็นเพื่อนแล้ว แต่ยังไม่มี Customer Tracking" action="LINE Broadcast / Follow-up" />
              <RetargetingTableRow label="Tracking · No Quote" value={sales.trackingNoQuote} desc="ทีมมีข้อมูลแล้ว แต่ยังไม่ส่งใบเสนอราคา" action="Sales Follow-up" />
              <RetargetingTableRow label="Quote · No Confirm" value={sales.quoteNoConfirm} desc="ส่งใบเสนอราคาแล้ว แต่ยังไม่ยืนยัน" action="Reminder / Offer / Deadline" />
            </tbody></table></div>
          </SectionCard>
        </>}

        {tab==='integrations' && currentUser.role==='admin' && <>
          <div className="sales-report-tabs">
            <button type="button" className={integrationPanel==='settings'?'active':''} onClick={()=>{ setIntegrationPanel('settings'); window.history.pushState({},'',MARKETING_TAB_PATHS.integrations); }}>ตั้งค่า</button>
            <button type="button" className={integrationPanel==='meta'?'active':''} onClick={()=>{ setIntegrationPanel('meta'); window.history.pushState({},'','/admin/marketing/meta'); }}>Facebook Pixel</button>
            <button type="button" className={integrationPanel==='google'?'active':''} onClick={()=>{ setIntegrationPanel('google'); window.history.pushState({},'','/admin/marketing/google'); }}>Google Analytics</button>
          </div>

          {integrationPanel==='settings' && <>
          <SectionCard title="Facebook Pixel & CAPI" actions={<span className={`bo-status-pill ${integrations?.storageReady && integrations?.meta?.secretStorageReady ? 'ready' : ''}`}>{integrations?.storageReady && integrations?.meta?.secretStorageReady ? 'DATABASE READY' : 'RUN SQL V13.9'}</span>}>
            <div className="bo-settings-list">
              <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>Facebook Pixel ID</strong></div><div className="bo-settings-row-control"><input value={metaPixelId} onChange={(e) => setMetaPixelId(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="เช่น 1574103264254056" /></div></div>
              <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>Conversions API Access Token</strong></div><div className="bo-settings-row-control"><input type="password" value={metaAccessToken} onChange={(e) => setMetaAccessToken(e.target.value)} autoComplete="new-password" placeholder={integrations?.meta?.capiConfigured ? `บันทึกแล้ว ${integrations?.meta?.accessTokenMasked || ''}` : 'วาง Token ที่ขึ้นต้นด้วย EAA…'} /></div></div>
              <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>Test Event Code</strong></div><div className="bo-settings-row-control"><input value={metaTestEventCode} onChange={(e) => setMetaTestEventCode(e.target.value)} placeholder="เช่น TEST12345" /></div></div>
              <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>เปิดใช้งาน Browser Pixel + CAPI</strong></div><div className="bo-settings-row-control"><Toggle checked={metaEnabled} onChange={setMetaEnabled} label="Enabled" ariaLabel="เปิดใช้งาน Browser Pixel + CAPI" /></div></div>
            </div>
            <div className="marketing-config-actions marketing-config-actions--meta"><div className="marketing-config-buttons"><button type="button" className="secondary" onClick={sendMetaTestEvent} disabled={metaTesting || !metaPixelId || !metaTestEventCode}><Send />{metaTesting ? 'กำลังส่ง…' : 'ส่ง Test Event'}</button><button type="button" onClick={() => void saveMetaSettings()}><Save />บันทึก Meta / CAPI</button></div></div>
          </SectionCard>

          <SectionCard title="ลิงก์เพิ่มเพื่อน LINE OA">
            <div className="bo-settings-list"><div className="bo-settings-row"><div className="bo-settings-row-label"><strong>LINE OA Add Friend URL</strong><span>ปลายทางหลักของปุ่ม LINE บนเว็บไซต์</span></div><div className="bo-settings-row-control"><input value={lineOaUrl} onChange={(e) => setLineOaUrl(e.target.value)} placeholder="https://lin.ee/qQQMmYIt" /></div></div></div>
            <div className="marketing-config-actions"><button type="button" onClick={saveLineSettings}><Save />บันทึกลิงก์ LINE</button></div>
          </SectionCard>

          <SectionCard title="Google Tag / GA4 / Ads">
            <div className="bo-status-list">
              <MetaStatusRow icon={Activity} label="Google Tag" ready={Boolean(summary?.googleTagConfigured)} detail={summary?.googleTagConfigured ? `พร้อม · ${summary?.googleTagIdMasked || 'configured'}` : 'รอ NEXT_PUBLIC_GOOGLE_TAG_ID'} />
              <MetaStatusRow icon={Globe2} label="GA4" ready={Boolean(summary?.ga4Configured)} detail={summary?.ga4Configured ? `พร้อม · ${summary?.ga4IdMasked || 'G-...'}` : 'รอ NEXT_PUBLIC_GA4_MEASUREMENT_ID'} />
              <MetaStatusRow icon={Target} label="Google Ads" ready={Boolean(summary?.googleAdsConfigured)} detail={summary?.googleAdsConfigured ? `พร้อม · ${summary?.googleAdsIdMasked || 'AW-...'}` : 'รอ NEXT_PUBLIC_GOOGLE_ADS_ID'} />
            </div>
            <div className="meta-env-list"><code>NEXT_PUBLIC_GOOGLE_TAG_ID</code><code>NEXT_PUBLIC_GA4_MEASUREMENT_ID</code><code>NEXT_PUBLIC_GOOGLE_ADS_ID</code></div>
          </SectionCard>
          </>}

          {integrationPanel==='meta' && <>
          <SectionCard title="สถานะ Meta">
            <div className="bo-status-list">
              <MetaStatusRow icon={MousePointerClick} label="Browser Pixel" ready={Boolean(summary?.metaPixelConfigured)} detail={summary?.metaPixelConfigured ? `เชื่อมแล้ว · ${summary?.metaPixelIdMasked || 'Pixel ID'}` : 'กรอก Pixel ID เพื่อเปิดใช้งาน'} />
              <MetaStatusRow icon={Server} label="Conversions API" ready={Boolean(integrations?.meta?.capiConfigured || summary?.metaCapiConfigured)} detail={(integrations?.meta?.capiConfigured || summary?.metaCapiConfigured) ? `Token พร้อม · ${integrations?.meta?.accessTokenMasked || 'Server secret'}` : 'วาง CAPI Access Token แล้วบันทึก'} />
              <MetaStatusRow icon={Activity} label="Test Events" ready={Boolean(metaTestResult?.ok ?? integrations?.meta?.lastTestOk)} detail={metaTestResult?.message || integrations?.meta?.lastTestMessage || (integrations?.meta?.lastTestOk ? `ผ่านแล้ว · ${integrations?.meta?.lastTestEventsReceived || 1} event` : (integrations?.meta?.testEventConfigured ? 'Code พร้อม · กดส่ง Test Event' : 'วาง Code จาก Meta Events Manager'))} />
              <MetaStatusRow icon={Target} label="Retargeting Logic" ready detail="First-party Funnel พร้อมใช้งานในหลังบ้าน" />
            </div>
          </SectionCard>

          <SectionCard title="Event Mapping · Browser + Server">
            <div className="module-table-wrap bo-table-wrap"><table className="module-table bo-table"><thead><tr><th>Website</th><th>Meta Event</th><th>Trigger</th><th>สถานะ</th></tr></thead><tbody>
              <MetaEventTableRow source="page_view" meta="PageView" trigger="เปิดหน้าเว็บไซต์" state="ready" />
              <MetaEventTableRow source="package_view" meta="ViewContent" trigger="ดูหน้าแพ็กเกจ" state="ready" />
              <MetaEventTableRow source="line_click" meta="LineAddFriendClick" trigger="กด CTA ไป LINE OA" state="ready" />
              <MetaEventTableRow source="lead_submit" meta="Lead" trigger="ส่งแบบฟอร์มให้ติดต่อกลับ" state="ready" />
              <MetaEventTableRow source="quotation_sent" meta="QuoteSent" trigger="Customer Tracking ส่ง Quotation" state="reserved" />
              <MetaEventTableRow source="payment_received" meta="Purchase" trigger="รับชำระเงินจริง" state="reserved" />
            </tbody></table></div>
          </SectionCard>
          </>}

          {integrationPanel==='google' && <>
          <SectionCard title="สถานะ Google">
            <div className="bo-status-list">
              <MetaStatusRow icon={Activity} label="Google Tag" ready={Boolean(summary?.googleTagConfigured)} detail={summary?.googleTagConfigured ? `พร้อมแล้ว · ${summary?.googleTagIdMasked || summary?.ga4IdMasked || summary?.googleAdsIdMasked || 'Tag configured'}` : 'รอ NEXT_PUBLIC_GOOGLE_TAG_ID'} />
              <MetaStatusRow icon={Globe2} label="Google Analytics 4" ready={Boolean(summary?.ga4Configured)} detail={summary?.ga4Configured ? `GA4 พร้อม · ${summary?.ga4IdMasked || 'G-...'}` : 'รอ NEXT_PUBLIC_GA4_MEASUREMENT_ID'} />
              <MetaStatusRow icon={Target} label="Google Ads" ready={Boolean(summary?.googleAdsConfigured)} detail={summary?.googleAdsConfigured ? `Ads tag พร้อม · ${summary?.googleAdsIdMasked || 'AW-...'}` : 'รอ NEXT_PUBLIC_GOOGLE_ADS_ID'} />
              <MetaStatusRow icon={MousePointerClick} label="Ads Traffic" ready detail={`${summary?.googleAdsVisitors ?? 0} visitor(s) มี Google Ads attribution ในช่วงนี้`} />
            </div>
          </SectionCard>

          <SectionCard title="Event Mapping · GA4 + Ads">
            <div className="module-table-wrap bo-table-wrap"><table className="module-table bo-table"><thead><tr><th>Website</th><th>Google Event</th><th>Trigger</th><th>สถานะ</th></tr></thead><tbody>
              <MetaEventTableRow source="page_view" meta="page_view" trigger="เปิดหน้าเว็บไซต์ · Website Remarketing" state="ready" />
              <MetaEventTableRow source="package_view" meta="view_item" trigger="ดูแพ็กเกจ · เก็บความสนใจ" state="ready" />
              <MetaEventTableRow source="line_click" meta="line_click / Ads conversion" trigger="กด CTA ไป LINE OA" state={summary?.googleAdsLineConversionConfigured ? 'ready' : 'reserved'} />
              <MetaEventTableRow source="lead_submit" meta="generate_lead / Ads conversion" trigger="ส่งแบบฟอร์มให้ติดต่อกลับ" state={summary?.googleAdsLeadConversionConfigured ? 'ready' : 'reserved'} />
              <MetaEventTableRow source="quotation_sent" meta="Offline Conversion" trigger="Customer Tracking ส่ง Quotation" state="reserved" />
              <MetaEventTableRow source="payment_received" meta="Purchase / Offline Conversion" trigger="รับชำระเงินจริง" state="reserved" />
            </tbody></table></div>
          </SectionCard>

          <SectionCard title="Google Ads Remarketing">
            <div className="module-table-wrap bo-table-wrap"><table className="module-table bo-table"><thead><tr><th>กลุ่ม</th><th>จำนวน</th><th>คำอธิบาย</th><th>แนะนำ</th></tr></thead><tbody>
              <RetargetingTableRow label="All Website Visitors" value={summary?.uniqueVisitors ?? 0} desc="คนที่เคยเข้า Bhutan Center" action="Google Ads Website Audience" />
              <RetargetingTableRow label="Package Viewers" value={summary?.packageViewVisitors ?? 0} desc="คนที่เคยเปิดดูแพ็กเกจ" action="Remarketing Package / High Season" />
              <RetargetingTableRow label="LINE Intent" value={summary?.lineClickVisitors ?? 0} desc="คนที่กด LINE จากเว็บไซต์" action="High-intent Remarketing" />
            </tbody></table></div>
          </SectionCard>
          </>}
        </>}

        {tab==='website' && <>
          <SectionCard title="ราคาแสดงบนเว็บไซต์" actions={<a className="growth-open-site" href="/" target="_blank" rel="noreferrer"><Globe2 />เปิดเว็บไซต์ Public</a>}>
            <div className="module-table-wrap bo-table-wrap"><table className="module-table bo-table"><thead><tr><th>โปรแกรม</th><th>ระยะเวลา</th><th>ราคา Override</th><th>แสดง</th><th /></tr></thead><tbody>
              {prices.map((row) => <WebsitePriceTableRow key={row.id} row={row} onSave={savePrice} />)}
            </tbody></table></div>
          </SectionCard>
        </>}

        {tab==='line' && <>
          <SectionCard title="สถานะ LINE">
            <div className="bo-status-list">
              <div className={`bo-status-row ${summary?.lineConfigured ? 'ready' : ''}`}><span className="bo-status-icon">{summary?.lineConfigured ? <CheckCircle2 /> : <Settings2 />}</span><div><strong>Messaging API</strong><span>{summary?.lineConfigured ? 'พร้อมใช้งาน' : 'รอตั้งค่า Channel Token / Secret'}</span></div><span className="bo-status-pill">{summary?.lineConfigured ? 'พร้อม' : 'รอเชื่อม'}</span></div>
              <div className={`bo-status-row ${summary?.lineBasicIdConfigured ? 'ready' : ''}`}><span className="bo-status-icon">{summary?.lineBasicIdConfigured ? <CheckCircle2 /> : <Globe2 />}</span><div><strong>LINE OA Link</strong><span>{summary?.lineBasicIdConfigured ? 'ปุ่มหน้าเว็บพร้อมส่งเข้า LINE' : 'รอตั้งค่า LINE OA URL'}</span></div><span className="bo-status-pill">{summary?.lineBasicIdConfigured ? 'พร้อม' : 'รอเชื่อม'}</span></div>
            </div>
          </SectionCard>
          <SectionCard
            title={`Broadcast · ${summary?.lineFriends ?? 0} เพื่อน`}
            actions={
              <div className="marketing-period-switch" aria-label="รูปแบบ Broadcast">
                {[{ id: 'text', label: 'ข้อความ' }, { id: 'image', label: 'รูปภาพ' }, { id: 'card', label: 'การ์ด' }].map((option) => (
                  <button key={option.id} type="button" className={lineMode === option.id ? 'active' : ''} onClick={() => setLineMode(option.id as 'text' | 'image' | 'card')}>{option.label}</button>
                ))}
              </div>
            }
          >
            <div className="bo-settings-list">
              <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>ชื่อ Broadcast</strong></div><div className="bo-settings-row-control"><input value={broadcastName} onChange={(e) => setBroadcastName(e.target.value)} placeholder="เช่น โปรเที่ยวภูฏานเดือนนี้" /></div></div>
              {lineMode === 'text' && (
                <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>ข้อความ</strong><span>ประกาศข่าว · โปรโมชัน · ชวนคุยต่อ</span></div><div className="bo-settings-row-control"><textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="พิมพ์ข้อความ Broadcast..." rows={6} /></div></div>
              )}
              {lineMode === 'image' && <>
                <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>Image URL</strong><span>ลิงก์สาธารณะ https://</span></div><div className="bo-settings-row-control"><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://.../image.jpg" /></div></div>
                <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>Preview URL</strong><span>เว้นว่าง = ใช้ URL รูปหลัก</span></div><div className="bo-settings-row-control"><input value={imagePreviewUrl} onChange={(e) => setImagePreviewUrl(e.target.value)} placeholder="https://.../preview.jpg" /></div></div>
                <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>ข้อความแนบใต้รูป</strong></div><div className="bo-settings-row-control"><textarea value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} placeholder="ข้อความใต้รูป (ไม่บังคับ)" rows={4} /></div></div>
              </>}
              {lineMode === 'card' && <>
                <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>หัวข้อการ์ด</strong></div><div className="bo-settings-row-control"><input value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} placeholder="Private Journey to Bhutan" /></div></div>
                <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>รายละเอียด</strong></div><div className="bo-settings-row-control"><textarea value={cardBody} onChange={(e) => setCardBody(e.target.value)} placeholder="จุดขายแบบสั้น กระชับ" rows={5} /></div></div>
                <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>Hero Image URL</strong></div><div className="bo-settings-row-control"><input value={cardImageUrl} onChange={(e) => setCardImageUrl(e.target.value)} placeholder="https://.../cover.jpg" /></div></div>
                <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>ปุ่ม CTA</strong></div><div className="bo-settings-row-control"><input value={cardButtonLabel} onChange={(e) => setCardButtonLabel(e.target.value)} placeholder="คุยใน LINE" /></div></div>
                <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>CTA URL</strong></div><div className="bo-settings-row-control"><input value={cardButtonUrl} onChange={(e) => setCardButtonUrl(e.target.value)} placeholder="https://lin.ee/qQQMmYIt" /></div></div>
                <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>Alt Text</strong></div><div className="bo-settings-row-control"><input value={cardAltText} onChange={(e) => setCardAltText(e.target.value)} placeholder="ข้อความอธิบายการ์ด" /></div></div>
              </>}
              <div className="bo-settings-row"><div className="bo-settings-row-label"><strong>ตัวอย่างก่อนส่ง</strong></div><div className="bo-settings-row-control"><LineBroadcastPreview mode={lineMode} text={message} imageUrl={imageUrl} imageCaption={imageCaption} cardTitle={cardTitle} cardBody={cardBody} cardImageUrl={cardImageUrl} cardButtonLabel={cardButtonLabel} /></div></div>
            </div>
            <div className="marketing-config-actions">
              <small>{summary?.lineConfigured ? 'พร้อมส่งผ่าน Messaging API' : 'ยังส่งไม่ได้จนกว่าจะตั้งค่า LINE Channel Access Token / Secret'}</small>
              <button type="button" onClick={broadcast} disabled={!summary?.lineConfigured || !broadcastReady}><Send />ส่ง Broadcast</button>
            </div>
          </SectionCard>
        </>}

        {tab==='seo' && <>
          <SectionCard title="SEO Checklist">
            <div className="bo-status-list">
              <div className="bo-status-row ready"><span className="bo-status-icon"><CheckCircle2 /></span><div><strong>Legacy Wix URLs</strong><span>Preserved via rewrites</span></div><span className="bo-status-pill">พร้อม</span></div>
              <div className="bo-status-row ready"><span className="bo-status-icon"><CheckCircle2 /></span><div><strong>Sitemap.xml</strong><span>Auto generated</span></div><span className="bo-status-pill">พร้อม</span></div>
              <div className="bo-status-row ready"><span className="bo-status-icon"><CheckCircle2 /></span><div><strong>robots.txt</strong><span>/admin และ API ถูกกันออก</span></div><span className="bo-status-pill">พร้อม</span></div>
              <div className="bo-status-row ready"><span className="bo-status-icon"><CheckCircle2 /></span><div><strong>Package Metadata</strong><span>Dynamic from public package data</span></div><span className="bo-status-pill">พร้อม</span></div>
            </div>
          </SectionCard>
        </>}
    </div>
  </div>;
}

function FunnelStageTable({ stages }: { stages: { label: string; value: number; base: number; sub?: string }[] }) {
  return (
    <div className="module-table-wrap bo-table-wrap bo-funnel-table"><table className="module-table bo-table"><thead><tr><th>Stage</th><th>Count</th><th>Conv.</th><th>Progress</th></tr></thead><tbody>
      {stages.map((stage) => {
        const conversion = stage.base > 0 ? Math.min(100, Math.round((stage.value / stage.base) * 100)) : 0;
        return (
          <tr key={stage.label}>
            <td><strong>{stage.label}</strong>{stage.sub && <small style={{ display: 'block', color: 'var(--muted)' }}>{stage.sub}</small>}</td>
            <td><strong>{stage.value}</strong></td>
            <td>{conversion}%</td>
            <td><div className="bo-funnel-bar"><i style={{ width: `${conversion}%` }} /></div></td>
          </tr>
        );
      })}
    </tbody></table></div>
  );
}

function RetargetingTableRow({ label, value, desc, action }: { label: string; value: number; desc: string; action: string }) {
  return <tr><td><strong>{label}</strong></td><td><strong>{value}</strong></td><td>{desc}</td><td><span style={{ color: 'var(--muted)', fontSize: 12 }}>{action}</span></td></tr>;
}

function MetaStatusRow({ icon: Icon, label, ready, detail }: { icon: React.ComponentType<any>; label: string; ready: boolean; detail: string }) {
  return (
    <div className={`bo-status-row ${ready ? 'ready' : ''}`}>
      <span className="bo-status-icon"><Icon /></span>
      <div><strong>{label}</strong><span>{detail}</span></div>
      <span className="bo-status-pill">{ready ? 'พร้อม' : 'รอเชื่อม'}</span>
    </div>
  );
}

function MetaEventTableRow({ source, meta, trigger, state }: { source: string; meta: string; trigger: string; state: 'ready' | 'reserved' }) {
  return (
    <tr>
      <td><code>{source}</code></td>
      <td><strong>{meta}</strong></td>
      <td>{trigger}</td>
      <td><span className={`bo-status-pill ${state === 'ready' ? 'ready' : ''}`}>{state === 'ready' ? 'พร้อม' : 'เตรียมไว้'}</span></td>
    </tr>
  );
}

function MetaAudienceRecipeTableRow({ recipe, onCopy }: { recipe: MetaAudienceRecipe; onCopy: (text: string, label: string) => void }) {
  const recipeText = `${recipe.name}\nSource: ${recipe.source}\nRetention: ${recipe.retention}\nRule: ${recipe.rule}\nUse: ${recipe.use}${recipe.exclude ? `\nExclude: ${recipe.exclude}` : ''}`;
  return (
    <tr>
      <td><strong>{recipe.name}</strong>{recipe.note && <small style={{ display: 'block', color: 'var(--muted)' }}>{recipe.note}</small>}</td>
      <td>{recipe.priority}</td>
      <td>{recipe.source}</td>
      <td>{recipe.retention}</td>
      <td><span style={{ fontSize: 12 }}>{recipe.rule}</span></td>
      <td>
        <div className="bo-row-actions">
          <button type="button" className="bo-icon-btn" title="คัดลอกชื่อ" aria-label="คัดลอกชื่อ Audience" onClick={() => void onCopy(recipe.name, 'ชื่อ Audience')}><Copy /></button>
          <button type="button" className="bo-icon-btn" title="คัดลอกสูตร" aria-label="คัดลอกสูตร Audience" onClick={() => void onCopy(recipeText, 'สูตร Audience')}><Copy /></button>
        </div>
      </td>
    </tr>
  );
}

function LiveVisitorTableRow({ visitor }: { visitor: LiveVisitor }) {
  const page = visitor.packageSlug ? `แพ็กเกจ: ${visitor.packageSlug}` : visitor.pagePath || '/';
  const ago = visitor.lastSeenSeconds <= 5 ? 'เมื่อสักครู่' : `${visitor.lastSeenSeconds} วิ.`;
  return (
    <tr>
      <td><strong>{visitor.visitorId || 'Anonymous'}</strong><small style={{ display: 'block', color: 'var(--muted)' }}>{visitor.sessionId || 'Session'}</small></td>
      <td><strong>{page}</strong><small style={{ display: 'block', color: 'var(--muted)' }}>{visitor.pagePath}</small></td>
      <td><strong>{visitor.source || 'Direct'}</strong><small style={{ display: 'block', color: 'var(--muted)' }}>{visitor.campaign || '—'}</small></td>
      <td>{visitor.device}</td>
      <td>{ago}</td>
    </tr>
  );
}

function AudiencePresetTableRow({ item }: { item: AudiencePreset }) {
  return (
    <tr>
      <td><strong>{item.name}</strong><small style={{ display: 'block', color: 'var(--muted)' }}>{item.description}</small></td>
      <td>{item.source}</td>
      <td>{item.intent}</td>
      <td><strong>{item.count}</strong></td>
      <td><span style={{ color: 'var(--muted)', fontSize: 12 }}>{item.futureMeta}</span></td>
    </tr>
  );
}

function LineBroadcastPreview({ mode, text, imageUrl, imageCaption, cardTitle, cardBody, cardImageUrl, cardButtonLabel }:{ mode:'text'|'image'|'card'; text:string; imageUrl:string; imageCaption:string; cardTitle:string; cardBody:string; cardImageUrl:string; cardButtonLabel:string; }){
  if(mode==='text') return <div className="line-preview-bubble"><p>{text.trim() || 'ข้อความ Broadcast จะขึ้นตรงนี้'}</p></div>;
  if(mode==='image') return <div className="line-preview-card"><div className="line-preview-image">{imageUrl.trim()?<img src={imageUrl.trim()} alt="LINE preview"/>:<span>IMAGE PREVIEW</span>}</div><div className="line-preview-copy"><strong>รูปภาพ Broadcast</strong><p>{imageCaption.trim() || 'ข้อความแนบใต้รูปจะขึ้นตรงนี้'}</p></div></div>;
  return <div className="line-preview-card"><div className="line-preview-image">{cardImageUrl.trim()?<img src={cardImageUrl.trim()} alt="Flex preview"/>:<span>FLEX HERO IMAGE</span>}</div><div className="line-preview-copy"><strong>{cardTitle.trim() || 'หัวข้อการ์ด'}</strong><p>{cardBody.trim() || 'รายละเอียดการ์ดจะขึ้นตรงนี้'}</p><button type="button">{cardButtonLabel.trim() || 'CTA Button'}</button></div></div>;
}

function WebsitePriceTableRow({ row, onSave }: { row: PriceRow; onSave: (row: PriceRow, price: string, visible: boolean) => void }) {
  const [price, setPrice] = useState(row.override?.price_override_thb?.toString() || '');
  const [visible, setVisible] = useState(row.override?.visible !== false);
  useEffect(() => { setPrice(row.override?.price_override_thb?.toString() || ''); setVisible(row.override?.visible !== false); }, [row.override?.price_override_thb, row.override?.visible]);
  return (
    <tr>
      <td><strong>{row.name}</strong></td>
      <td>{row.nights + 1}D / {row.nights}N</td>
      <td><input type="number" min="0" step="500" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Auto" /></td>
      <td><Toggle checked={visible} onChange={setVisible} label="แสดง" ariaLabel={`แสดง ${row.name} บนเว็บไซต์`} /></td>
      <td><button type="button" className="bo-icon-btn" title="บันทึก" aria-label="บันทึก" onClick={() => onSave(row, price, visible)}><Save /></button></td>
    </tr>
  );
}

const DEMO_LIVE_VISITORS: LiveVisitor[] = [
  { sessionId: 'sess_demo_1', visitorId: 'vis_8f2a', pagePath: '/packages/bhutan-highlights', packageSlug: 'bhutan-highlights', source: 'google.com', campaign: 'brand', device: 'Mobile', lastSeenAt: new Date().toISOString(), lastSeenSeconds: 3, eventName: 'page_view' },
  { sessionId: 'sess_demo_2', visitorId: 'vis_3c91', pagePath: '/packages/festival-tour', packageSlug: 'festival-tour', source: 'facebook.com', campaign: 'retarget', device: 'Desktop', lastSeenAt: new Date().toISOString(), lastSeenSeconds: 8, eventName: 'ViewContent' },
  { sessionId: 'sess_demo_3', visitorId: 'vis_7b44', pagePath: '/visa', packageSlug: '', source: 'Direct', campaign: '', device: 'Mobile', lastSeenAt: new Date().toISOString(), lastSeenSeconds: 12, eventName: 'page_view' },
];

const DEMO_SUMMARY: Summary = {
  periodDays: 30,
  trackingConfigured: true,
  trackingStorageReady: true,
  trackingMode: 'rls_fallback',
  liveSessions: 3,
  liveVisitors: DEMO_LIVE_VISITORS,
  liveWindowSeconds: 18,
  uniqueVisitors: 842,
  pageViews: 2105,
  packageViews: 456,
  packageViewVisitors: 312,
  lineClicks: 89,
  lineClickVisitors: 74,
  websiteLeads: 23,
  lineFriends: 156,
  lineFriendVisitors: 42,
  lineFriendsWithoutTracking: 28,
  visitorsNoLineClick: 768,
  packageVisitorsNoLineClick: 238,
  lineClickVisitorsNoFriend: 12,
  lineConfigured: false,
  lineBasicIdConfigured: true,
  metaPixelConfigured: false,
  metaCapiConfigured: false,
  metaTestEventConfigured: false,
  metaPixelIdMasked: null,
  googleAdsVisitors: 45,
  googleTagConfigured: false,
  ga4Configured: false,
  googleAdsConfigured: false,
  googleAdsLineConversionConfigured: false,
  googleAdsLeadConversionConfigured: false,
  googleTagIdMasked: null,
  ga4IdMasked: null,
  googleAdsIdMasked: null,
};

const DEMO_REALTIME: RealtimeSnapshot = {
  liveSessions: 3,
  liveVisitors: DEMO_LIVE_VISITORS,
  liveWindowSeconds: 18,
  heartbeatSeconds: 6,
  pollSeconds: 2,
  storageReady: true,
};

const DEMO_AUDIENCE: AudienceData = {
  days: 30,
  tagStorageReady: true,
  sources: { website: true, line: true, crm: true, meta: false },
  audiences: [
    { id: 'all_visitors', name: 'All Website Visitors', count: 842, source: 'Website', intent: 'Warm', futureMeta: 'Retarget', description: 'เข้าเว็บอย่างน้อย 1 ครั้งในช่วงที่เลือก' },
    { id: 'package_viewers', name: 'Package Viewers', count: 312, source: 'Website', intent: 'Hot', futureMeta: 'ViewContent', description: 'เปิดดูหน้าแพ็กเกจ' },
    { id: 'line_intent', name: 'LINE Intent', count: 74, source: 'Website', intent: 'High', futureMeta: 'LineAddFriendClick', description: 'กด CTA ไป LINE OA' },
    { id: 'line_friends', name: 'LINE Friends', count: 156, source: 'LINE', intent: 'Engaged', futureMeta: 'CRM Segment', description: 'เพิ่มเพื่อน OA แล้ว' },
  ],
  tags: [
    { tag: 'website_visitor', count: 842, source: 'website' },
    { tag: 'package_interest', count: 312, source: 'website' },
    { tag: 'line_intent', count: 74, source: 'website' },
    { tag: 'line_friend', count: 156, source: 'line' },
  ],
  note: 'LINE userId ใช้แบ่งกลุ่มใน CRM ได้ · Meta/Google Retargeting ใช้ Website tag และข้อมูลติดต่อที่ได้รับอนุญาต',
};

const DEMO_INTEGRATIONS: IntegrationSettings = {
  storageReady: true,
  meta: {
    enabled: false,
    pixelId: '',
    pixelIdMasked: null,
    testEventCode: '',
    testEventConfigured: false,
    capiConfigured: false,
    accessTokenMasked: null,
    secretStorageReady: false,
    tokenSource: '',
    source: '',
    updatedAt: null,
    lastTestAt: null,
    lastTestOk: null,
    lastTestMessage: null,
    lastTestEventsReceived: 0,
  },
  line: {
    enabled: true,
    url: 'https://lin.ee/qQQMmYIt',
    source: '',
    updatedAt: null,
  },
};
