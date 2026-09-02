import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, CheckCircle2, CircleDot, Eye, Globe2, MonitorSmartphone, MousePointerClick,
  Megaphone, Radio, RefreshCw, Save, Send, Server, Settings2, Tags, Target, UserCheck, UsersRound, Wifi,
} from 'lucide-react';
import { CustomerTracking, QuotationRecord, TourPackage, User } from '../types';
import { supabaseAuth } from '../lib/supabase';

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

type MarketingTab = 'overview' | 'realtime' | 'audience' | 'funnel' | 'meta' | 'google' | 'website' | 'line' | 'seo';
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
};
function marketingTabFromPath(pathname:string): MarketingTab {
  const path=pathname.replace(/\/+$/,'');
  if(path.startsWith('/admin/marketing/realtime')) return 'realtime';
  if(path.startsWith('/admin/marketing/audience')) return 'audience';
  if(path.startsWith('/admin/marketing/funnel')) return 'funnel';
  if(path.startsWith('/admin/marketing/meta')) return 'meta';
  if(path.startsWith('/admin/marketing/google')) return 'google';
  if(path.startsWith('/admin/marketing/website')) return 'website';
  if(path.startsWith('/admin/marketing/line')) return 'line';
  if(path.startsWith('/admin/marketing/seo')) return 'seo';
  return 'overview';
}

async function authHeaders(){
  const session = await supabaseAuth.getSession();
  return { 'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token || ''}` };
}

const titleByTab:Record<MarketingTab,string> = {
  overview:'ภาพรวมการตลาด', realtime:'ผู้เข้าชมเรียลไทม์', audience:'Audience & Tags', funnel:'Funnel & Retargeting', meta:'Facebook Pixel', google:'Google Analytics & Ads', website:'เว็บไซต์', line:'LINE OA', seo:'SEO',
};

export function GrowthWorkspace({ currentUser, packages, trackings, quotations, onBack, onLogout }:{ currentUser:User; packages:TourPackage[]; trackings:CustomerTracking[]; quotations:QuotationRecord[]; onBack:()=>void; onLogout:()=>void; }){
  const [tab,setTab]=useState<MarketingTab>(()=>marketingTabFromPath(typeof window!=='undefined'?window.location.pathname:'/admin/marketing'));
  const [summary,setSummary]=useState<Summary|null>(null);
  const [audience,setAudience]=useState<AudienceData|null>(null);
  const [prices,setPrices]=useState<PriceRow[]>([]);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');
  const [notice,setNotice]=useState('');
  const [periodDays,setPeriodDays]=useState<7|30|90>(30);

  useEffect(()=>{
    function handlePopState(){
      if(!window.location.pathname.startsWith('/admin/marketing'))return;
      setTab(marketingTabFromPath(window.location.pathname));
    }
    window.addEventListener('popstate',handlePopState);
    return()=>window.removeEventListener('popstate',handlePopState);
  },[]);

  async function refresh(){
    setLoading(true); setNotice('');
    try {
      const headers=await authHeaders();
      const [a,b,c]=await Promise.all([
        fetch(`/api/marketing/summary?days=${periodDays}`,{headers}),
        fetch('/api/website/prices',{headers}),
        fetch(`/api/marketing/audiences?days=${periodDays}`,{headers}),
      ]);
      if(a.ok){
        setSummary(await a.json());
      }else{
        const j=await a.json().catch(()=>({}));
        setNotice(`Realtime API ยังไม่พร้อม: ${j.error||`HTTP ${a.status}`}`);
      }
      if(b.ok){const j=await b.json();setPrices(j.packages||[]);}
      if(c.ok)setAudience(await c.json());
    } finally { setLoading(false); }
  }
  useEffect(()=>{ refresh(); },[periodDays]);
  useEffect(()=>{
    if(tab!=='realtime') return;
    const timer=window.setInterval(()=>{ refresh(); },15_000);
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

  async function savePrice(row:PriceRow, price:string, visible:boolean){
    const headers=await authHeaders();
    const res=await fetch('/api/website/prices',{method:'POST',headers,body:JSON.stringify({package_id:row.id,price_override_thb:price===''?null:Number(price),visible})});
    const json=await res.json().catch(()=>({}));
    if(!res.ok){setNotice(json.error||'บันทึกไม่สำเร็จ');return;}
    setNotice('บันทึกราคาเว็บไซต์แล้ว'); refresh();
  }

  async function broadcast(){
    if(!message.trim())return;
    if(!window.confirm('ยืนยันส่งข้อความนี้ไปยัง LINE Contact ที่เป็นเพื่อนทั้งหมด?'))return;
    const headers=await authHeaders();
    const res=await fetch('/api/line/broadcast',{method:'POST',headers,body:JSON.stringify({text:message,name:'Manual Broadcast'})});
    const json=await res.json().catch(()=>({}));
    setNotice(res.ok?`ส่งสำเร็จ ${json.sent||0} คน`:(json.error||'ส่งไม่สำเร็จ'));
    if(res.ok)setMessage('');
  }

  return <div className="growth-shell unified-module-view">
    <div className="workspace-pagebar growth-pagebar">
      <div className="workspace-pagebar-title"><span>MARKETING / CRM</span><strong>{titleByTab[tab]}</strong></div>
      <div className="growth-pagebar-actions">
        {(tab==='overview'||tab==='funnel'||tab==='audience') && <div className="marketing-period-switch" aria-label="ช่วงเวลารายงาน">
          {([7,30,90] as const).map((days)=><button key={days} className={periodDays===days?'active':''} onClick={()=>setPeriodDays(days)}>{days}D</button>)}
        </div>}
        <button className="workspace-refresh-button" onClick={refresh}><RefreshCw className={loading?'spin':''}/><span>รีเฟรช</span></button>
      </div>
    </div>

    <div className="growth-layout growth-layout--single-nav">
      <main className="growth-main growth-main--single-nav">
        {notice && <div className="growth-notice">{notice}</div>}

        {tab==='overview' && <>
          <section className="growth-title"><span>MARKETING OVERVIEW</span><h1>เห็นตั้งแต่คนเข้าเว็บ<br/>จนถึงการปิดการขาย</h1><p>Website, LINE, Customer Tracking และเอกสารขายอยู่ใน Funnel เดียวกัน โดยทั้ง Meta/Facebook และ Google Analytics/Ads เตรียมจุดเชื่อมไว้แล้วและยังไม่ส่งข้อมูลออกจนกว่าจะใส่ค่าเชื่อมต่อ</p></section>
          <div className="growth-kpi-grid">
            <article><small>ONLINE NOW</small><strong>{summary?.liveSessions ?? 0}</strong><span>คนบนเว็บ 5 นาทีล่าสุด</span></article>
            <article><small>VISITORS · {periodDays}D</small><strong>{summary?.uniqueVisitors ?? 0}</strong><span>ผู้เข้าชมไม่ซ้ำ</span></article>
            <article><small>PACKAGE INTEREST</small><strong>{summary?.packageViewVisitors ?? 0}</strong><span>คนที่เปิดดูแพ็กเกจ</span></article>
            <article><small>LINE INTENT</small><strong>{summary?.lineClickVisitors ?? 0}</strong><span>คนที่กดไป LINE OA</span></article>
          </div>
          <section className="growth-funnel-card"><div className="growth-funnel-head"><div><span>FUNNEL</span><h2>Website → LINE → Sale</h2></div><small>{periodDays} DAYS + SALES DATABASE</small></div><div className="growth-funnel growth-funnel--tour">
            <FunnelStage value={summary?.uniqueVisitors??0} label="Visitors" />
            <i>→</i><FunnelStage value={summary?.packageViewVisitors??0} label="Package" />
            <i>→</i><FunnelStage value={summary?.lineClickVisitors??0} label="LINE Click" />
            <i>→</i><FunnelStage value={summary?.lineFriends??0} label="LINE Friend" />
            <i>→</i><FunnelStage value={sales.leads} label="Tracking" />
            <i>→</i><FunnelStage value={sales.quoteSent} label="Quotation" />
            <i>→</i><FunnelStage value={sales.confirmed} label="Confirmed" />
          </div></section>
          <div className="marketing-shortcuts">
            <article><Target/><div><small>NEXT STEP</small><strong>Funnel & Retargeting</strong><span>ดูจุดตกหล่นและกลุ่มเป้าหมายที่ตามต่อได้</span></div></article>
            <article><Target/><div><small>META READY</small><strong>Facebook Pixel</strong><span>{summary?.metaPixelConfigured?'เชื่อม Browser Pixel แล้ว':'เตรียมระบบไว้แล้ว · รอ Pixel ID'}</span></div></article>
            <article><Activity/><div><small>GOOGLE READY</small><strong>Analytics & Ads</strong><span>{summary?.googleTagConfigured?'Google Tag พร้อมทำงาน':'เตรียมระบบไว้แล้ว · รอ Google Tag / GA4 / Ads ID'}</span></div></article>
            <article><UserCheck/><div><small>KNOWN CUSTOMER</small><strong>{summary?.lineFriends??0} LINE Friends</strong><span>พร้อมต่อยอด Tag / Broadcast / CRM</span></div></article>
          </div>
        </>}

        {tab==='realtime' && <>
          <section className="growth-title realtime-title"><span>LIVE WEBSITE</span><h1>ตอนนี้มีคนอยู่บนเว็บ<br/>และกำลังดูอะไรอยู่</h1><p>ระบบส่ง heartbeat ทุก 30 วินาทีจากหน้า Public และหน้านี้รีเฟรชอัตโนมัติทุก 15 วินาที โดยนับเฉพาะ session ที่ยัง active ในช่วงประมาณ {summary?.liveWindowSeconds??90} วินาทีล่าสุด</p></section>
          {summary && (!summary.trackingConfigured || !summary.trackingStorageReady) && <div className="tracking-health tracking-health--error">
            <Wifi/><div><strong>Realtime Tracking ยังไม่พร้อม</strong><span>{!summary.trackingConfigured ? 'ยังไม่พบค่า Supabase สำหรับ Server API ใน Vercel' : summary.trackingError?.code==='42P01' ? 'ยังไม่มีตาราง website_events — ให้รัน SQL V13.5.1 Realtime Repair' : summary.trackingError?.code==='42501' ? 'RLS ยังไม่อนุญาตให้ระบบอ่าน Realtime — ให้รัน SQL V13.5.1 Realtime Repair' : `Database: ${summary.trackingError?.code||'not ready'} ${summary.trackingError?.message||''}`}</span></div>
          </div>}
          {summary?.trackingStorageReady && <div className="tracking-health tracking-health--ok"><CheckCircle2/><span>Tracking พร้อม · {summary.trackingMode==='service_role'?'Service Role':'RLS fallback'} · หน้า /admin ไม่นับเป็นผู้เข้าชมเว็บไซต์</span></div>}
          <div className="realtime-hero-grid">
            <article className="realtime-online-card"><div className="live-pulse"><i/><Radio/></div><small>ONLINE NOW</small><strong>{summary?.liveSessions??0}</strong><span>คนกำลังอยู่บนเว็บไซต์</span><p>อัปเดตอัตโนมัติ · ไม่ต้องรู้ชื่อผู้เข้าชม</p></article>
            <article><Wifi/><div><small>TRACKING</small><strong>Heartbeat 30s</strong><span>เห็นคนที่ยังเปิดเว็บอยู่จริง ไม่ใช่แค่ PageView ล่าสุด</span></div></article>
            <article><MonitorSmartphone/><div><small>DEVICE</small><strong>Desktop / Mobile</strong><span>ดูได้ว่าผู้ชมกำลังเข้าจากอุปกรณ์แบบไหน</span></div></article>
            <article><Eye/><div><small>LIVE PAGE</small><strong>Page + Package</strong><span>เห็นหน้าที่กำลังดูและแพ็กเกจที่สนใจ</span></div></article>
          </div>
          <section className="realtime-table-card">
            <div className="realtime-table-head"><div><span>ACTIVE SESSIONS</span><h2>ผู้เข้าชมที่กำลังอยู่บนเว็บ</h2></div><small><i/> LIVE · AUTO REFRESH 15s</small></div>
            {(summary?.liveVisitors?.length??0)>0 ? <div className="realtime-table">
              <div className="realtime-row realtime-row--head"><span>ผู้เข้าชม</span><span>หน้าที่กำลังดู</span><span>ที่มา</span><span>อุปกรณ์</span><span>ล่าสุด</span></div>
              {(summary?.liveVisitors||[]).map((visitor,index)=><LiveVisitorRow key={`${visitor.sessionId}-${index}`} visitor={visitor}/>) }
            </div> : <div className="realtime-empty"><Radio/><strong>ตอนนี้ยังไม่มี Active Session</strong><span>เมื่อมีคนเปิดหน้าเว็บไซต์ ระบบจะแสดงที่นี่ภายในไม่กี่วินาที</span></div>}
          </section>
        </>}

        {tab==='audience' && <>
          <section className="growth-title"><span>AUDIENCE & TAGS</span><h1>แบ่งกลุ่มคนจาก Website + LINE<br/>ไว้เล่นการตลาดต่อภายหลัง</h1><p>Audience ในหน้านี้เป็น First-party Audience ของ Bhutan Center ก่อน ยังไม่ส่งข้อมูลออกไป Meta หรือ Google Ads จนกว่าจะเชื่อมจริง คุณสามารถใช้ข้อมูลเว็บและ LINE มาช่วยบอกระดับความสนใจของลูกค้าได้</p></section>
          <div className="audience-source-grid">
            <article className="ready"><Globe2/><div><small>DATA SOURCE</small><strong>Website</strong><span>PageView · Package · Returning · LINE Click</span></div><b>พร้อม</b></article>
            <article className={audience?.sources.line?'ready':''}><Megaphone/><div><small>DATA SOURCE</small><strong>LINE OA</strong><span>Friend · Message · Tags · Website Match</span></div><b>{audience?.sources.line?'พร้อม':'รอข้อมูล'}</b></article>
            <article className="ready"><UsersRound/><div><small>DATA SOURCE</small><strong>Customer Tracking</strong><span>Quotation · Confirmed · Paid · Exclusion</span></div><b>พร้อม</b></article>
            <article><Target/><div><small>DESTINATION</small><strong>Meta / Google Ads</strong><span>เตรียมไว้ · ยังไม่ Sync Audience ออก</span></div><b>รอเชื่อม</b></article>
          </div>
          <section className="audience-library">
            <div className="retargeting-section-title"><div><span>AUDIENCE LIBRARY</span><h2>กลุ่มที่ระบบสร้างให้จากพฤติกรรม</h2></div><small>{periodDays} DAYS</small></div>
            <div className="audience-preset-grid">
              {(audience?.audiences||[]).map((item)=><AudiencePresetCard key={item.id} item={item}/>) }
              <AudiencePresetCard item={{id:'tracking_no_quote',name:'Tracking · ยังไม่ Quote',count:sales.trackingNoQuote,source:'CRM',intent:'Hot',futureMeta:'Sales Follow-up',description:'มีข้อมูลลูกค้าแล้ว แต่ยังไม่ส่งใบเสนอราคา'}}/>
              <AudiencePresetCard item={{id:'quote_no_confirm',name:'Quote · ยังไม่ Confirm',count:sales.quoteNoConfirm,source:'CRM',intent:'Hot',futureMeta:'Retarget / Reminder',description:'ส่งใบเสนอราคาแล้ว แต่ยังไม่ยืนยัน'}}/>
              <AudiencePresetCard item={{id:'paid_exclusion',name:'Confirmed / Paid',count:sales.paid,source:'CRM',intent:'Exclude',futureMeta:'Exclude from acquisition',description:'ใช้เป็นกลุ่มตัดออกจากโฆษณาหาลูกค้าใหม่'}}/>
            </div>
          </section>
          <section className="tag-center-card">
            <div className="tag-center-head"><div><span>RETARGETING TAGS</span><h2>Tag ที่ระบบรู้จักแล้ว</h2></div><small>{audience?.tagStorageReady?'TAG STORAGE READY':'รัน SQL V13.5 เพื่อเก็บ Tag ถาวร'}</small></div>
            <div className="tag-cloud">{(audience?.tags||[]).length ? (audience?.tags||[]).map((item)=><span key={item.tag} className={`tag-chip tag-chip--${item.source}`}><Tags/><b>{item.tag}</b><em>{item.count}</em><small>{item.source}</small></span>) : <span className="tag-empty">Tag จะเริ่มเพิ่มเมื่อมีคนเข้าเว็บ ดูแพ็กเกจ กด LINE หรือมี LINE Interaction</span>}</div>
            <div className="tag-rule-grid"><article><strong>Website Visitor</strong><span>เข้าเว็บอย่างน้อย 1 ครั้ง</span></article><article><strong>Package Interest</strong><span>ดูหน้าแพ็กเกจ</span></article><article><strong>LINE Intent</strong><span>กด CTA ไป LINE</span></article><article><strong>LINE Friend</strong><span>เพิ่มเพื่อน OA</span></article><article><strong>LINE Engaged</strong><span>เคยส่งข้อความ</span></article><article><strong>Website ↔ LINE Matched</strong><span>จับคู่ Visitor กับ LINE ได้แล้ว</span></article></div>
          </section>
          <section className="audience-note"><Target/><div><strong>เรื่องสำคัญตอนเชื่อม Ads ภายหลัง</strong><span>{audience?.note||'LINE userId ใช้แบ่งกลุ่มใน CRM ของเราได้ ส่วน Meta/Google Retargeting จะใช้ Website tag และข้อมูลติดต่อที่ได้รับอนุญาตในการ Match Audience ไม่ส่ง LINE userId ไปเป็น advertising identifier โดยตรง'}</span></div></section>
        </>}

        {tab==='funnel' && <>
          <section className="growth-title"><span>FUNNEL & RETARGETING</span><h1>รู้ว่าใครหลุดตรงไหน<br/>แล้วตามกลับมาได้</h1><p>โครงนี้ใช้แนวเดียวกับระบบไร่อมร แต่ปรับให้เข้ากับการขายทัวร์: ไม่บังคับซื้อบนเว็บ และใช้ LINE + Customer Tracking เป็นจุดเปลี่ยนจากผู้ชมเป็นลูกค้าที่รู้จักตัวตน</p></section>

          <section className="retargeting-funnel-panel">
            <div className="retargeting-panel-head"><div><span>CONVERSION JOURNEY</span><h2>Bhutan Tour Funnel</h2></div><div className="retargeting-legend"><i className="ready"/>First-party พร้อมเก็บ <i/>Meta / Google Ads รอเชื่อม</div></div>
            <div className="funnel-stage-grid">
              <FunnelDetail index="01" label="Visitors" value={summary?.uniqueVisitors??0} sub="เข้าเว็บไซต์" base={summary?.uniqueVisitors??0}/>
              <FunnelDetail index="02" label="Package View" value={summary?.packageViewVisitors??0} sub="เริ่มสนใจทริป" base={summary?.uniqueVisitors??0}/>
              <FunnelDetail index="03" label="LINE Click" value={summary?.lineClickVisitors??0} sub="Intent สูง" base={summary?.packageViewVisitors??0}/>
              <FunnelDetail index="04" label="LINE Friend" value={summary?.lineFriends??0} sub="รู้จัก LINE user" base={summary?.lineClickVisitors??0}/>
              <FunnelDetail index="05" label="Customer Tracking" value={sales.leads} sub="ทีมเริ่มติดตาม" base={Math.max(summary?.lineFriends??0,sales.leads)}/>
              <FunnelDetail index="06" label="Quotation" value={sales.quoteSent} sub="ส่งข้อเสนอแล้ว" base={sales.leads}/>
              <FunnelDetail index="07" label="Confirmed" value={sales.confirmed} sub="ลูกค้ายืนยัน" base={sales.quoteSent}/>
              <FunnelDetail index="08" label="Paid" value={sales.paid} sub="มีการรับชำระ" base={sales.confirmed}/>
            </div>
          </section>

          <section className="retargeting-section">
            <div className="retargeting-section-title"><div><span>RETARGETING CENTER</span><h2>กลุ่มที่ควรตามกลับมา</h2></div><small>เตรียม Audience Logic ไว้แล้ว · ยังไม่ Sync ไป Meta / Google Ads</small></div>
            <div className="retargeting-audience-grid">
              <AudienceCard tone="cold" icon={Globe2} label="Website Visitors" value={summary?.visitorsNoLineClick??0} desc="เข้าเว็บแล้ว แต่ยังไม่กด LINE" action="ยิง Content / Package Reminder" />
              <AudienceCard tone="warm" icon={MousePointerClick} label="Package Interest" value={summary?.packageVisitorsNoLineClick??0} desc="เปิดดูแพ็กเกจ แต่ยังไม่เข้า LINE" action="ยิงแพ็กเกจ / High Season" />
              <AudienceCard tone="hot" icon={Target} label="LINE Intent" value={summary?.lineClickVisitorsNoFriend??0} desc="กด LINE แล้ว แต่ยังจับคู่ Friend ไม่ได้" action="Retarget ด้วย Meta / Google Ads" />
              <AudienceCard tone="known" icon={UserCheck} label="LINE Friend · No CRM" value={summary?.lineFriendsWithoutTracking??0} desc="เป็นเพื่อนแล้ว แต่ยังไม่มี Customer Tracking" action="LINE Broadcast / Follow-up" />
              <AudienceCard tone="known" icon={UsersRound} label="Tracking · No Quote" value={sales.trackingNoQuote} desc="ทีมมีข้อมูลแล้ว แต่ยังไม่ส่งใบเสนอราคา" action="Sales Follow-up" />
              <AudienceCard tone="hot" icon={CircleDot} label="Quote · No Confirm" value={sales.quoteNoConfirm} desc="ส่งใบเสนอราคาแล้ว แต่ยังไม่ยืนยัน" action="Reminder / Offer / Deadline" />
            </div>
          </section>

          <section className="retargeting-ready-card">
            <div className="retargeting-ready-icon"><Target/></div>
            <div><span>FUTURE AD SYNC</span><h2>Audience พร้อมสำหรับผูก Retargeting ภายหลัง</h2><p>เมื่อเชื่อม Meta Pixel/CAPI หรือ Google Ads ในอนาคต เราจะใช้กลุ่ม First-party เหล่านี้เป็นฐานสร้าง Audience, Remarketing และ Exclusion เช่น ตัดลูกค้าที่ Confirmed/Paid ออกจากโฆษณาหาลูกค้าใหม่ได้</p></div>
            <b>READY</b>
          </section>
        </>}

        {tab==='meta' && <>
          <section className="growth-title"><span>FACEBOOK / META</span><h1>Pixel พร้อมรอเชื่อม<br/>โดยไม่กระทบเว็บตอนนี้</h1><p>ระบบเตรียม Browser Pixel, event mapping และจุดต่อ Conversions API ไว้ก่อน หากยังไม่ใส่ข้อมูล Meta ทุกอย่างจะอยู่ในสถานะ “รอเชื่อมต่อ” และเว็บไซต์ยังทำงานตามปกติ</p></section>

          <div className="meta-status-grid">
            <MetaStatusCard icon={MousePointerClick} label="Browser Pixel" ready={Boolean(summary?.metaPixelConfigured)} detail={summary?.metaPixelConfigured?`เชื่อมแล้ว · ${summary?.metaPixelIdMasked||'Pixel ID'}`:'รอ NEXT_PUBLIC_META_PIXEL_ID'} />
            <MetaStatusCard icon={Server} label="Conversions API" ready={Boolean(summary?.metaCapiConfigured)} detail={summary?.metaCapiConfigured?'พบ CAPI Access Token':'เตรียมจุดเชื่อม · รอ META_CONVERSIONS_API_TOKEN'} />
            <MetaStatusCard icon={Activity} label="Test Events" ready={Boolean(summary?.metaTestEventConfigured)} detail={summary?.metaTestEventConfigured?'มี Test Event Code':'Optional · ใช้ตอนทดสอบ CAPI'} />
            <MetaStatusCard icon={Target} label="Retargeting Logic" ready detail="First-party Funnel พร้อมใช้งานในหลังบ้าน" />
          </div>

          <section className="meta-event-panel">
            <div className="meta-event-head"><div><span>EVENT MAPPING</span><h2>เหตุการณ์ที่ระบบเตรียมไว้</h2></div><small>Browser + CRM / Server-ready</small></div>
            <div className="meta-event-table">
              <MetaEvent source="page_view" meta="PageView" trigger="เปิดหน้าเว็บไซต์" state="ready" />
              <MetaEvent source="package_view" meta="ViewContent" trigger="ดูหน้าแพ็กเกจ" state="ready" />
              <MetaEvent source="line_click" meta="LineAddFriendClick" trigger="กด CTA ไป LINE OA" state="ready" />
              <MetaEvent source="lead_submit" meta="Lead" trigger="ส่งแบบฟอร์มให้ติดต่อกลับ" state="ready" />
              <MetaEvent source="quotation_sent" meta="QuoteSent" trigger="Customer Tracking ส่ง Quotation" state="reserved" />
              <MetaEvent source="payment_received" meta="Purchase" trigger="รับชำระเงินจริง" state="reserved" />
            </div>
          </section>

          <section className="meta-connect-card">
            <div><span>CONNECT LATER</span><h2>ตอนนี้ยังไม่ต้องใส่ข้อมูล Facebook</h2><p>เมื่อพร้อม เพียงเพิ่ม Environment Variables ใน Vercel แล้ว Deploy ใหม่ Browser Pixel จะเริ่มทำงานทันที ส่วน CAPI สามารถเปิดต่อใน Phase เชื่อม Meta โดยไม่ต้องรื้อ Funnel หรือ Customer Tracking ใหม่</p></div>
            <div className="meta-env-list"><code>NEXT_PUBLIC_META_PIXEL_ID</code><code>META_CONVERSIONS_API_TOKEN</code><code>META_TEST_EVENT_CODE</code></div>
          </section>
        </>}

        {tab==='google' && <>
          <section className="growth-title"><span>GOOGLE MEASUREMENT</span><h1>Google Tag + GA4 + Google Ads<br/>พร้อมรอเชื่อมบัญชีเดิม</h1><p>รองรับการวัดพฤติกรรมเว็บไซต์, Conversion จาก LINE/แบบฟอร์ม และ Remarketing สำหรับ Google Ads โดยตอนนี้ยังไม่โหลด Google tag ถ้ายังไม่ได้ใส่ ID ใน Vercel</p></section>

          <div className="meta-status-grid">
            <MetaStatusCard icon={Activity} label="Google Tag" ready={Boolean(summary?.googleTagConfigured)} detail={summary?.googleTagConfigured?`พร้อมแล้ว · ${summary?.googleTagIdMasked||summary?.ga4IdMasked||summary?.googleAdsIdMasked||'Tag configured'}`:'รอ NEXT_PUBLIC_GOOGLE_TAG_ID หรือ Destination ID'} />
            <MetaStatusCard icon={Globe2} label="Google Analytics 4" ready={Boolean(summary?.ga4Configured)} detail={summary?.ga4Configured?`GA4 พร้อม · ${summary?.ga4IdMasked||summary?.googleTagIdMasked||'G-...'}`:'Optional · รอ NEXT_PUBLIC_GA4_MEASUREMENT_ID'} />
            <MetaStatusCard icon={Target} label="Google Ads" ready={Boolean(summary?.googleAdsConfigured)} detail={summary?.googleAdsConfigured?`Ads tag พร้อม · ${summary?.googleAdsIdMasked||summary?.googleTagIdMasked||'AW-...'}`:'รอ NEXT_PUBLIC_GOOGLE_ADS_ID'} />
            <MetaStatusCard icon={MousePointerClick} label="Ads Traffic" ready detail={`${summary?.googleAdsVisitors??0} visitor(s) มี Google Ads click ID / paid Google attribution ในช่วงนี้`} />
          </div>

          <section className="meta-event-panel">
            <div className="meta-event-head"><div><span>EVENT MAPPING</span><h2>Google Analytics + Ads Conversion</h2></div><small>Browser-ready · Remarketing-ready</small></div>
            <div className="meta-event-table">
              <MetaEvent source="page_view" meta="page_view" trigger="เปิดหน้าเว็บไซต์ · ใช้สร้าง Website Remarketing" state="ready" />
              <MetaEvent source="package_view" meta="view_item" trigger="ดูแพ็กเกจ · เก็บความสนใจแพ็กเกจ" state="ready" />
              <MetaEvent source="line_click" meta="line_click / Ads conversion" trigger="กด CTA ไป LINE OA" state={summary?.googleAdsLineConversionConfigured?'ready':'reserved'} />
              <MetaEvent source="lead_submit" meta="generate_lead / Ads conversion" trigger="ส่งแบบฟอร์มให้ติดต่อกลับ" state={summary?.googleAdsLeadConversionConfigured?'ready':'reserved'} />
              <MetaEvent source="quotation_sent" meta="Offline Conversion" trigger="Customer Tracking ส่ง Quotation · เตรียมไว้ Phase ต่อไป" state="reserved" />
              <MetaEvent source="payment_received" meta="Purchase / Offline Conversion" trigger="รับชำระเงินจริง · เตรียมไว้ Phase ต่อไป" state="reserved" />
            </div>
          </section>

          <section className="retargeting-section">
            <div className="retargeting-section-title"><div><span>GOOGLE ADS REMARKETING</span><h2>รองรับคนเข้าเว็บแล้วกลับไปเจอโฆษณาเรา</h2></div><small>รอเชื่อม AW-... / Google tag</small></div>
            <div className="retargeting-audience-grid">
              <AudienceCard tone="cold" icon={Globe2} label="All Website Visitors" value={summary?.uniqueVisitors??0} desc="คนที่เคยเข้า Bhutan Center" action="Google Ads Website Audience" />
              <AudienceCard tone="warm" icon={MousePointerClick} label="Package Viewers" value={summary?.packageViewVisitors??0} desc="คนที่เคยเปิดดูแพ็กเกจ" action="Remarketing Package / High Season" />
              <AudienceCard tone="hot" icon={Target} label="LINE Intent" value={summary?.lineClickVisitors??0} desc="คนที่กด LINE จากเว็บไซต์" action="High-intent Remarketing" />
            </div>
          </section>

          <section className="meta-connect-card">
            <div><span>CONNECT LATER</span><h2>นำ Google Ads / Analytics เดิมมาเชื่อมภายหลังได้</h2><p>แนะนำให้ใช้ Google tag เป็นฐานเดียวแล้วเชื่อม GA4 และ Google Ads เป็น destinations เพื่อลด tag ซ้ำ ระบบรองรับ Google click IDs เช่น GCLID, GBRAID และ WBRAID ใน Website Events ไว้แล้ว เพื่อใช้ Attribution และต่อยอด Offline Conversion ในอนาคต</p></div>
            <div className="meta-env-list"><code>NEXT_PUBLIC_GOOGLE_TAG_ID</code><code>NEXT_PUBLIC_GA4_MEASUREMENT_ID</code><code>NEXT_PUBLIC_GOOGLE_ADS_ID</code><code>NEXT_PUBLIC_GOOGLE_ADS_LINE_CONVERSION_LABEL</code><code>NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL</code></div>
          </section>
        </>}

        {tab==='website' && <>
          <section className="growth-title"><span>PUBLIC WEBSITE</span><h1>ราคาเว็บไซต์<br/>จาก Pricing เดียวกัน</h1><p>ถ้าไม่ใส่ Override ระบบจะคำนวณราคาเริ่มต้นจาก Retail Pricing ปัจจุบันสำหรับ 2 ท่าน / 3 ดาวอัตโนมัติ</p></section>
          <div className="website-price-list">{prices.map((row)=><WebsitePriceRow key={row.id} row={row} onSave={savePrice}/>)}</div>
          <a className="growth-open-site" href="/" target="_blank" rel="noreferrer"><Globe2/>เปิดเว็บไซต์ Public <span>↗</span></a>
        </>}

        {tab==='line' && <>
          <section className="growth-title"><span>LINE OA</span><h1>ช่องทางหลัก<br/>สำหรับปิดการขาย</h1><p>Website จะพาลูกค้าเข้า LINE พร้อมเก็บ Line Click ใน Funnel และ Webhook จะเก็บ LINE userId เมื่อมี Follow / Message</p></section>
          <div className="line-status-grid"><article className={summary?.lineConfigured?'ready':''}><i>{summary?.lineConfigured?<CheckCircle2/>:<Settings2/>}</i><div><strong>Messaging API</strong><span>{summary?.lineConfigured?'พร้อมใช้งาน':'รอตั้งค่า Channel Token / Secret'}</span></div></article><article className={summary?.lineBasicIdConfigured?'ready':''}><i>{summary?.lineBasicIdConfigured?<CheckCircle2/>:<Globe2/>}</i><div><strong>LINE OA Link</strong><span>{summary?.lineBasicIdConfigured?'ปุ่มหน้าเว็บพร้อมส่งเข้า LINE':'รอตั้งค่า LINE_OA_BASIC_ID หรือ LINE_OA_URL'}</span></div></article></div>
          <section className="broadcast-card"><div><span>BROADCAST</span><h2>ส่งข้อความจากหลังบ้าน</h2><p>เวอร์ชันนี้ส่งไปยัง LINE Contacts ที่ระบบรู้จักและยังเป็นเพื่อนอยู่ทั้งหมด การแบ่ง Tag จะเพิ่มต่อใน CRM Phase ถัดไป</p></div><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="พิมพ์ข้อความ Broadcast..." rows={7}/><button onClick={broadcast} disabled={!summary?.lineConfigured || !message.trim()}><Send/>ส่ง Broadcast</button></section>
        </>}

        {tab==='seo' && <>
          <section className="growth-title"><span>SEO MIGRATION</span><h1>SEO เดิม<br/>ไม่ถูกทิ้ง</h1><p>Public Website ยังเป็น Next.js และเก็บ Legacy URL / Sitemap / Robots / Metadata จาก V8.7 ไว้ เพื่อย้ายจาก Wix แบบลดความเสี่ยงต่อ Ranking</p></section>
          <div className="seo-check-grid"><article><strong>Legacy Wix URLs</strong><span>Preserved via rewrites</span></article><article><strong>Sitemap.xml</strong><span>Auto generated</span></article><article><strong>robots.txt</strong><span>/admin และ API ถูกกันออก</span></article><article><strong>Package Metadata</strong><span>Dynamic from public package data</span></article></div>
        </>}
      </main>
    </div>
  </div>;
}

function FunnelStage({value,label}:{value:number;label:string}){
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function FunnelDetail({index,label,value,sub,base}:{index:string;label:string;value:number;sub:string;base:number}){
  const conversion=base>0?Math.min(100,Math.round((value/base)*100)):0;
  return <article><div className="funnel-detail-top"><small>{index}</small><b>{conversion}%</b></div><strong>{value}</strong><h3>{label}</h3><span>{sub}</span><div className="funnel-detail-track"><i style={{width:`${conversion}%`}}/></div></article>;
}

function AudienceCard({tone,icon:Icon,label,value,desc,action}:{tone:'cold'|'warm'|'hot'|'known';icon:React.ComponentType<any>;label:string;value:number;desc:string;action:string}){
  return <article className={`retargeting-audience retargeting-audience--${tone}`}><div className="retargeting-audience-top"><i><Icon/></i><b>{value}</b></div><strong>{label}</strong><p>{desc}</p><span>{action}</span><small>FIRST-PARTY AUDIENCE</small></article>;
}

function MetaStatusCard({icon:Icon,label,ready,detail}:{icon:React.ComponentType<any>;label:string;ready:boolean;detail:string}){
  return <article className={ready?'ready':''}><i><Icon/></i><div><small>{ready?'CONNECTED / READY':'WAITING'}</small><strong>{label}</strong><span>{detail}</span></div><b>{ready?'พร้อม':'รอเชื่อม'}</b></article>;
}

function MetaEvent({source,meta,trigger,state}:{source:string;meta:string;trigger:string;state:'ready'|'reserved'}){
  return <div className="meta-event-row"><code>{source}</code><span>→</span><strong>{meta}</strong><p>{trigger}</p><b className={state}>{state==='ready'?'พร้อม':'เตรียมไว้'}</b></div>;
}

function LiveVisitorRow({visitor}:{visitor:LiveVisitor}){
  const page=visitor.packageSlug ? `แพ็กเกจ: ${visitor.packageSlug}` : visitor.pagePath || '/';
  const ago=visitor.lastSeenSeconds<=5?'เมื่อสักครู่':`${visitor.lastSeenSeconds} วิ.`;
  return <div className="realtime-row"><span><i className="live-dot"/><strong>{visitor.visitorId||'Anonymous'}</strong><small>{visitor.sessionId||'Session'}</small></span><span><strong>{page}</strong><small>{visitor.pagePath}</small></span><span><strong>{visitor.source||'Direct'}</strong><small>{visitor.campaign||'—'}</small></span><span><strong>{visitor.device}</strong><small>{visitor.eventName==='heartbeat'?'Active':'Interacting'}</small></span><span><strong>{ago}</strong><small>Live</small></span></div>;
}

function AudiencePresetCard({item}:{item:AudiencePreset}){
  const tone=item.intent.toLowerCase().replace(/\s+/g,'-');
  return <article className={`audience-preset audience-preset--${tone}`}><div className="audience-preset-top"><small>{item.source}</small><b>{item.intent}</b></div><strong>{item.count}</strong><h3>{item.name}</h3><p>{item.description}</p><span>อนาคต: {item.futureMeta}</span></article>;
}

function WebsitePriceRow({row,onSave}:{row:PriceRow;onSave:(row:PriceRow,price:string,visible:boolean)=>void}){
  const [price,setPrice]=useState(row.override?.price_override_thb?.toString()||'');
  const [visible,setVisible]=useState(row.override?.visible!==false);
  useEffect(()=>{setPrice(row.override?.price_override_thb?.toString()||'');setVisible(row.override?.visible!==false)},[row.override?.price_override_thb,row.override?.visible]);
  return <article><div><small>{row.nights+1} DAYS / {row.nights} NIGHTS</small><strong>{row.name}</strong><span>เว้นราคา Override ว่าง = ใช้ราคาที่คำนวณจาก Pricing</span></div><label><span>ราคาแสดงหน้าเว็บ</span><input type="number" min="0" step="500" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Auto"/></label><label className="website-visible"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/><span>แสดงบนเว็บไซต์</span></label><button onClick={()=>onSave(row,price,visible)}><Save/>บันทึก</button></article>;
}
