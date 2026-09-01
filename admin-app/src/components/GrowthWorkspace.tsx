import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, CheckCircle2, CircleDot, Globe2, MousePointerClick,
  RefreshCw, Save, Send, Server, Settings2, Target, UserCheck, UsersRound,
} from 'lucide-react';
import { CustomerTracking, QuotationRecord, TourPackage, User } from '../types';
import { supabaseAuth } from '../lib/supabase';

interface Summary {
  periodDays:number;
  liveSessions:number;
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
}
interface PriceRow { id:string; name:string; nights:number; override:null|{visible:boolean;price_override_thb:number|null}; }

type MarketingTab = 'overview' | 'funnel' | 'meta' | 'website' | 'line' | 'seo';
const MARKETING_TAB_PATHS: Record<MarketingTab, string> = {
  overview: '/admin/marketing',
  funnel: '/admin/marketing/funnel',
  meta: '/admin/marketing/meta',
  website: '/admin/marketing/website',
  line: '/admin/marketing/line',
  seo: '/admin/marketing/seo',
};
function marketingTabFromPath(pathname:string): MarketingTab {
  const path=pathname.replace(/\/+$/,'');
  if(path.startsWith('/admin/marketing/funnel')) return 'funnel';
  if(path.startsWith('/admin/marketing/meta')) return 'meta';
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
  overview:'ภาพรวมการตลาด', funnel:'Funnel & Retargeting', meta:'Facebook Pixel', website:'เว็บไซต์', line:'LINE OA', seo:'SEO',
};

export function GrowthWorkspace({ currentUser, packages, trackings, quotations, onBack, onLogout }:{ currentUser:User; packages:TourPackage[]; trackings:CustomerTracking[]; quotations:QuotationRecord[]; onBack:()=>void; onLogout:()=>void; }){
  const [tab,setTab]=useState<MarketingTab>(()=>marketingTabFromPath(typeof window!=='undefined'?window.location.pathname:'/admin/marketing'));
  const [summary,setSummary]=useState<Summary|null>(null);
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
      const [a,b]=await Promise.all([
        fetch(`/api/marketing/summary?days=${periodDays}`,{headers}),
        fetch('/api/website/prices',{headers}),
      ]);
      if(a.ok)setSummary(await a.json());
      if(b.ok){const j=await b.json();setPrices(j.packages||[]);}
    } finally { setLoading(false); }
  }
  useEffect(()=>{ refresh(); },[periodDays]);

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
        {(tab==='overview'||tab==='funnel') && <div className="marketing-period-switch" aria-label="ช่วงเวลารายงาน">
          {([7,30,90] as const).map((days)=><button key={days} className={periodDays===days?'active':''} onClick={()=>setPeriodDays(days)}>{days}D</button>)}
        </div>}
        <button className="workspace-refresh-button" onClick={refresh}><RefreshCw className={loading?'spin':''}/><span>รีเฟรช</span></button>
      </div>
    </div>

    <div className="growth-layout growth-layout--single-nav">
      <main className="growth-main growth-main--single-nav">
        {notice && <div className="growth-notice">{notice}</div>}

        {tab==='overview' && <>
          <section className="growth-title"><span>MARKETING OVERVIEW</span><h1>เห็นตั้งแต่คนเข้าเว็บ<br/>จนถึงการปิดการขาย</h1><p>Website, LINE, Customer Tracking และเอกสารขายอยู่ใน Funnel เดียวกัน โดย Meta/Facebook เตรียมจุดเชื่อมไว้แล้วและยังไม่ส่งข้อมูลออกจนกว่าจะใส่ค่าเชื่อมต่อ</p></section>
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
            <article><UserCheck/><div><small>KNOWN CUSTOMER</small><strong>{summary?.lineFriends??0} LINE Friends</strong><span>พร้อมต่อยอด Tag / Broadcast / CRM</span></div></article>
          </div>
        </>}

        {tab==='funnel' && <>
          <section className="growth-title"><span>FUNNEL & RETARGETING</span><h1>รู้ว่าใครหลุดตรงไหน<br/>แล้วตามกลับมาได้</h1><p>โครงนี้ใช้แนวเดียวกับระบบไร่อมร แต่ปรับให้เข้ากับการขายทัวร์: ไม่บังคับซื้อบนเว็บ และใช้ LINE + Customer Tracking เป็นจุดเปลี่ยนจากผู้ชมเป็นลูกค้าที่รู้จักตัวตน</p></section>

          <section className="retargeting-funnel-panel">
            <div className="retargeting-panel-head"><div><span>CONVERSION JOURNEY</span><h2>Bhutan Tour Funnel</h2></div><div className="retargeting-legend"><i className="ready"/>First-party พร้อมเก็บ <i/>Meta รอเชื่อม</div></div>
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
            <div className="retargeting-section-title"><div><span>RETARGETING CENTER</span><h2>กลุ่มที่ควรตามกลับมา</h2></div><small>เตรียม Audience Logic ไว้แล้ว · ยังไม่ Sync ไป Meta</small></div>
            <div className="retargeting-audience-grid">
              <AudienceCard tone="cold" icon={Globe2} label="Website Visitors" value={summary?.visitorsNoLineClick??0} desc="เข้าเว็บแล้ว แต่ยังไม่กด LINE" action="ยิง Content / Package Reminder" />
              <AudienceCard tone="warm" icon={MousePointerClick} label="Package Interest" value={summary?.packageVisitorsNoLineClick??0} desc="เปิดดูแพ็กเกจ แต่ยังไม่เข้า LINE" action="ยิงแพ็กเกจ / High Season" />
              <AudienceCard tone="hot" icon={Target} label="LINE Intent" value={summary?.lineClickVisitorsNoFriend??0} desc="กด LINE แล้ว แต่ยังจับคู่ Friend ไม่ได้" action="Retarget ด้วย Meta" />
              <AudienceCard tone="known" icon={UserCheck} label="LINE Friend · No CRM" value={summary?.lineFriendsWithoutTracking??0} desc="เป็นเพื่อนแล้ว แต่ยังไม่มี Customer Tracking" action="LINE Broadcast / Follow-up" />
              <AudienceCard tone="known" icon={UsersRound} label="Tracking · No Quote" value={sales.trackingNoQuote} desc="ทีมมีข้อมูลแล้ว แต่ยังไม่ส่งใบเสนอราคา" action="Sales Follow-up" />
              <AudienceCard tone="hot" icon={CircleDot} label="Quote · No Confirm" value={sales.quoteNoConfirm} desc="ส่งใบเสนอราคาแล้ว แต่ยังไม่ยืนยัน" action="Reminder / Offer / Deadline" />
            </div>
          </section>

          <section className="retargeting-ready-card">
            <div className="retargeting-ready-icon"><Target/></div>
            <div><span>FUTURE META SYNC</span><h2>Audience พร้อมสำหรับผูก Retargeting ภายหลัง</h2><p>เมื่อใส่ Facebook Pixel / CAPI ในอนาคต เราจะ map กลุ่ม First-party เหล่านี้ไปใช้สร้าง Custom Audience และ Exclusion เช่น ตัดลูกค้าที่ Confirmed/Paid ออกจากโฆษณาหาลูกค้าใหม่ได้</p></div>
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

function WebsitePriceRow({row,onSave}:{row:PriceRow;onSave:(row:PriceRow,price:string,visible:boolean)=>void}){
  const [price,setPrice]=useState(row.override?.price_override_thb?.toString()||'');
  const [visible,setVisible]=useState(row.override?.visible!==false);
  useEffect(()=>{setPrice(row.override?.price_override_thb?.toString()||'');setVisible(row.override?.visible!==false)},[row.override?.price_override_thb,row.override?.visible]);
  return <article><div><small>{row.nights+1} DAYS / {row.nights} NIGHTS</small><strong>{row.name}</strong><span>เว้นราคา Override ว่าง = ใช้ราคาที่คำนวณจาก Pricing</span></div><label><span>ราคาแสดงหน้าเว็บ</span><input type="number" min="0" step="500" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Auto"/></label><label className="website-visible"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/><span>แสดงบนเว็บไซต์</span></label><button onClick={()=>onSave(row,price,visible)}><Save/>บันทึก</button></article>;
}
