import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Globe2, LineChart, Megaphone, RefreshCw, Save, Send, Settings2, Users } from 'lucide-react';
import { CustomerTracking, QuotationRecord, TourPackage, User } from '../types';
import { supabaseAuth } from '../lib/supabase';

interface Summary {
  liveSessions:number; uniqueVisitors:number; pageViews:number; packageViews:number; lineClicks:number; websiteLeads:number; lineFriends:number;
  lineConfigured:boolean; lineBasicIdConfigured:boolean;
}
interface PriceRow { id:string; name:string; nights:number; override:null|{visible:boolean;price_override_thb:number|null}; }

type MarketingTab = 'overview' | 'website' | 'line' | 'seo';
const MARKETING_TAB_PATHS: Record<MarketingTab, string> = {
  overview: '/admin/marketing',
  website: '/admin/marketing/website',
  line: '/admin/marketing/line',
  seo: '/admin/marketing/seo',
};
function marketingTabFromPath(pathname:string): MarketingTab {
  const path=pathname.replace(/\/+$/,'');
  if(path.startsWith('/admin/marketing/website')) return 'website';
  if(path.startsWith('/admin/marketing/line')) return 'line';
  if(path.startsWith('/admin/marketing/seo')) return 'seo';
  return 'overview';
}

async function authHeaders(){
  const session = await supabaseAuth.getSession();
  return { 'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token || ''}` };
}

export function GrowthWorkspace({ currentUser, packages, trackings, quotations, onBack, onLogout }:{ currentUser:User; packages:TourPackage[]; trackings:CustomerTracking[]; quotations:QuotationRecord[]; onBack:()=>void; onLogout:()=>void; }){
  const [tab,setTab]=useState<MarketingTab>(()=>marketingTabFromPath(typeof window!=='undefined'?window.location.pathname:'/admin/marketing'));
  const [summary,setSummary]=useState<Summary|null>(null);
  const [prices,setPrices]=useState<PriceRow[]>([]);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState('');
  const [notice,setNotice]=useState('');

  function openTab(next:MarketingTab, mode:'push'|'replace'='push'){
    setTab(next);
    if(typeof window==='undefined')return;
    const target=MARKETING_TAB_PATHS[next];
    if(window.location.pathname===target)return;
    window.history[mode==='replace'?'replaceState':'pushState']({workspace:'growth',marketingTab:next},'',target);
  }
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
      const [a,b]=await Promise.all([fetch('/api/marketing/summary',{headers}),fetch('/api/website/prices',{headers})]);
      if(a.ok)setSummary(await a.json());
      if(b.ok){const j=await b.json();setPrices(j.packages||[]);}
    } finally { setLoading(false); }
  }
  useEffect(()=>{refresh()},[]);

  const sales=useMemo(()=>({
    leads:trackings.length,
    quoteSent:trackings.filter(x=>x.status==='quote_sent').length,
    won:trackings.filter(x=>x.status==='won').length,
    quotes:quotations.length,
  }),[trackings,quotations]);

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
      <button className="workspace-back-button" onClick={onBack}><ArrowLeft/>กลับ Dashboard</button>
      <div className="workspace-pagebar-title"><span>WEBSITE / LINE / CRM</span><strong>เว็บไซต์ & การตลาด</strong></div>
      <button className="workspace-refresh-button" onClick={refresh}><RefreshCw className={loading?'spin':''}/><span>รีเฟรช</span></button>
    </div>

    <div className="growth-layout">
      <aside className="growth-subnav">
        <div className="growth-subnav-label">MARKETING</div>
        <button className={tab==='overview'?'active':''} onClick={()=>openTab('overview')}><LineChart/><span><strong>ภาพรวม</strong><small>Funnel & Visitors</small></span></button>
        <button className={tab==='website'?'active':''} onClick={()=>openTab('website')}><Globe2/><span><strong>เว็บไซต์</strong><small>ราคา & Public</small></span></button>
        <button className={tab==='line'?'active':''} onClick={()=>openTab('line')}><Megaphone/><span><strong>LINE & Funnel</strong><small>OA & Broadcast</small></span></button>
        <button className={tab==='seo'?'active':''} onClick={()=>openTab('seo')}><Settings2/><span><strong>SEO</strong><small>Migration & Indexing</small></span></button>
        <div className="growth-subnav-note"><span>ผู้ใช้งาน</span><strong>{currentUser.name}</strong></div>
      </aside>

      <main className="growth-main">
        {notice && <div className="growth-notice">{notice}</div>}
        {tab==='overview' && <>
          <section className="growth-title"><span>MARKETING OVERVIEW</span><h1>จากคนเข้าเว็บ<br/>ไปจนถึงลูกค้า</h1><p>ข้อมูลเว็บไซต์จะเริ่มเก็บหลังรัน Migration V13 ส่วนข้อมูล Sales ใช้ Customer Tracking เดิมทันที</p></section>
          <div className="growth-kpi-grid">
            <article><small>ONLINE NOW</small><strong>{summary?.liveSessions ?? 0}</strong><span>คนบนเว็บ 5 นาทีล่าสุด</span></article>
            <article><small>VISITORS · 30D</small><strong>{summary?.uniqueVisitors ?? 0}</strong><span>ผู้เข้าชมไม่ซ้ำ</span></article>
            <article><small>LINE CLICKS · 30D</small><strong>{summary?.lineClicks ?? 0}</strong><span>กดไป LINE OA</span></article>
            <article><small>LINE FRIENDS</small><strong>{summary?.lineFriends ?? 0}</strong><span>รู้จักตัวตนผ่าน LINE</span></article>
          </div>
          <section className="growth-funnel-card"><div className="growth-funnel-head"><div><span>FUNNEL</span><h2>Website → Sale</h2></div><small>30 DAYS + SALES DATABASE</small></div><div className="growth-funnel">
            <div><strong>{summary?.uniqueVisitors??0}</strong><span>Visitors</span></div><i>→</i><div><strong>{summary?.packageViews??0}</strong><span>Package views</span></div><i>→</i><div><strong>{summary?.lineClicks??0}</strong><span>LINE clicks</span></div><i>→</i><div><strong>{sales.leads}</strong><span>Tracking</span></div><i>→</i><div><strong>{sales.quoteSent}</strong><span>Quote sent</span></div><i>→</i><div><strong>{sales.won}</strong><span>Won</span></div>
          </div></section>
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

function WebsitePriceRow({row,onSave}:{row:PriceRow;onSave:(row:PriceRow,price:string,visible:boolean)=>void}){
  const [price,setPrice]=useState(row.override?.price_override_thb?.toString()||'');
  const [visible,setVisible]=useState(row.override?.visible!==false);
  useEffect(()=>{setPrice(row.override?.price_override_thb?.toString()||'');setVisible(row.override?.visible!==false)},[row.override?.price_override_thb,row.override?.visible]);
  return <article><div><small>{row.nights+1} DAYS / {row.nights} NIGHTS</small><strong>{row.name}</strong><span>เว้นราคา Override ว่าง = ใช้ราคาที่คำนวณจาก Pricing</span></div><label><span>ราคาแสดงหน้าเว็บ</span><input type="number" min="0" step="500" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Auto"/></label><label className="website-visible"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/><span>แสดงบนเว็บไซต์</span></label><button onClick={()=>onSave(row,price,visible)}><Save/>บันทึก</button></article>
}
