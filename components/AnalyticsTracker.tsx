"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function storageId(storage: Storage, key:string, prefix:string){
  try {
    let value = storage.getItem(key);
    if (!value) {
      value = `${prefix}_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
      storage.setItem(key,value);
    }
    return value;
  } catch { return `${prefix}_${Date.now().toString(36)}`; }
}

export function getVisitorIds(){
  return {
    visitorId: storageId(localStorage,'bc_visitor_id','bcv'),
    sessionId: storageId(sessionStorage,'bc_session_id','bcs'),
  };
}

function readCookie(name:string){
  try{
    const prefix=`${name}=`;
    const item=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(prefix));
    return item ? decodeURIComponent(item.slice(prefix.length)) : '';
  }catch{return '';}
}

function newMetaEventId(prefix:string){
  try{return `bc_${prefix}_${crypto.randomUUID()}`;}catch{return `bc_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;}
}

export function getAttribution(){
  try {
    const params = new URLSearchParams(window.location.search);
    const current = {
      source: params.get('utm_source') || '',
      campaign: params.get('utm_campaign') || '',
      medium: params.get('utm_medium') || '',
      term: params.get('utm_term') || '',
      content: params.get('utm_content') || '',
      gclid: params.get('gclid') || '',
      gbraid: params.get('gbraid') || '',
      wbraid: params.get('wbraid') || '',
      dclid: params.get('dclid') || '',
      fbclid: params.get('fbclid') || '',
      fbclid_ts: params.get('fbclid') ? Date.now() : 0,
      referrer: document.referrer || '',
    };
    const key='bc_attribution';
    const previous=JSON.parse(sessionStorage.getItem(key)||'{}');
    const merged={
      source: current.source || previous.source || current.referrer || '',
      campaign: current.campaign || previous.campaign || '',
      medium: current.medium || previous.medium || '',
      term: current.term || previous.term || '',
      content: current.content || previous.content || '',
      gclid: current.gclid || previous.gclid || '',
      gbraid: current.gbraid || previous.gbraid || '',
      wbraid: current.wbraid || previous.wbraid || '',
      dclid: current.dclid || previous.dclid || '',
      fbclid: current.fbclid || previous.fbclid || '',
      fbclid_ts: current.fbclid ? current.fbclid_ts : (Number(previous.fbclid_ts)||0),
      referrer: previous.referrer || current.referrer || '',
    };
    sessionStorage.setItem(key,JSON.stringify(merged));
    return merged;
  } catch {
    return {source:'',campaign:'',medium:'',term:'',content:'',gclid:'',gbraid:'',wbraid:'',dclid:'',fbclid:'',fbclid_ts:0,referrer:''};
  }
}

function buildPublicEventPayload(eventName:string, extra:Record<string,unknown>={}){
  const { visitorId, sessionId } = getVisitorIds();
  const attr=getAttribution();
  return {
    visitor_id: visitorId,
    session_id: sessionId,
    event_name:eventName,
    page_path: window.location.pathname,
    package_slug: extra.package_slug || null,
    source: attr.source || null,
    campaign: attr.campaign || null,
    metadata: {
      ...extra,
      title: document.title || '',
      medium: attr.medium || null,
      term: attr.term || null,
      content: attr.content || null,
      gclid: attr.gclid || null,
      gbraid: attr.gbraid || null,
      wbraid: attr.wbraid || null,
      dclid: attr.dclid || null,
      fbclid: attr.fbclid || null,
      fbp: readCookie('_fbp') || null,
      fbc: readCookie('_fbc') || (attr.fbclid ? `fb.1.${attr.fbclid_ts || Date.now()}.${attr.fbclid}` : null),
      referrer: attr.referrer || null,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      visibility: document.visibilityState,
    },
  };
}

function sendPublicEvent(eventName:string, extra:Record<string,unknown>={}){
  try {
    const body=JSON.stringify(buildPublicEventPayload(eventName,extra));
    if(navigator.sendBeacon){
      const accepted=navigator.sendBeacon('/api/events', new Blob([body], {type:'application/json'}));
      if(accepted) return;
    }
    fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>null);
  } catch {}
}

export async function trackPublicEvent(eventName:string, extra:Record<string,unknown>={}){
  sendPublicEvent(eventName,extra);
}

const GOOGLE_TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID || '';
const GOOGLE_GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '';
const GOOGLE_ADS_LINE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LINE_CONVERSION_LABEL || '';
const GOOGLE_ADS_LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL || '';

function googleIds(){
  return [...new Set([GOOGLE_TAG_ID,GOOGLE_GA4_ID,GOOGLE_ADS_ID].map(x=>String(x||'').trim()).filter(Boolean))];
}

function ensureGoogleTag(){
  if(typeof window==='undefined') return null;
  const ids=googleIds();
  if(!ids.length) return null;
  const w=window as any;
  w.dataLayer=w.dataLayer||[];
  if(!w.gtag) w.gtag=function(){w.dataLayer.push(arguments);};
  w.__bcGoogleConfigured=w.__bcGoogleConfigured||{};
  if(!w.__bcGoogleBootstrapped){
    w.__bcGoogleBootstrapped=true;
    w.gtag('js',new Date());
    if(!document.getElementById('bc-google-tag')){
      const s=document.createElement('script');
      s.id='bc-google-tag';
      s.async=true;
      s.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids[0])}`;
      document.head.appendChild(s);
    }
  }
  ids.forEach((id)=>{
    if(w.__bcGoogleConfigured[id]) return;
    w.__bcGoogleConfigured[id]=true;
    if(id.startsWith('G-')) w.gtag('config',id,{send_page_view:false});
    else w.gtag('config',id);
  });
  return w.gtag as ((...args:any[])=>void);
}

function googleConversionDestination(label:string){
  const clean=String(label||'').trim();
  if(!clean) return '';
  if(clean.includes('/')) return clean;
  const adsId=String(GOOGLE_ADS_ID || (GOOGLE_TAG_ID.startsWith('AW-')?GOOGLE_TAG_ID:'')).trim();
  return adsId ? `${adsId}/${clean}` : '';
}

export function trackGoogleLineClick(packageSlug='', onComplete?:()=>void){
  const gtag=ensureGoogleTag();
  if(!gtag) return false;
  gtag('event','line_click',{
    package_slug:packageSlug || undefined,
    page_location:window.location.href,
  });
  const sendTo=googleConversionDestination(GOOGLE_ADS_LINE_LABEL);
  if(!sendTo) return false;
  let finished=false;
  const finish=()=>{ if(finished)return; finished=true; onComplete?.(); };
  gtag('event','conversion',{
    send_to:sendTo,
    event_callback:finish,
  });
  window.setTimeout(finish,650);
  return true;
}

export function trackGoogleLead(packageSlug=''){
  const gtag=ensureGoogleTag();
  if(!gtag) return;
  gtag('event','generate_lead',{
    package_slug:packageSlug || undefined,
    page_location:window.location.href,
  });
  const sendTo=googleConversionDestination(GOOGLE_ADS_LEAD_LABEL);
  if(sendTo) gtag('event','conversion',{send_to:sendTo});
}

function trackGooglePage(pathname:string, slug:string){
  const gtag=ensureGoogleTag();
  if(!gtag) return;
  gtag('event','page_view',{
    page_title:document.title || '',
    page_location:window.location.href,
    page_path:pathname,
  });
  if(slug){
    gtag('event','view_item',{
      items:[{item_id:slug,item_name:slug,item_category:'Bhutan Tour Package'}],
    });
    gtag('event','package_view',{package_slug:slug});
  }
}

let metaConfigPromise:Promise<{enabled:boolean;pixelId:string}>|null=null;

async function getMetaConfig(){
  if(!metaConfigPromise){
    metaConfigPromise=fetch('/api/marketing/meta-public',{cache:'no-store'})
      .then(async(r)=>r.ok?await r.json():({enabled:false,pixelId:''}))
      .then((j)=>({enabled:Boolean(j?.enabled),pixelId:String(j?.pixelId||'').trim()}))
      .catch(()=>({enabled:false,pixelId:''}));
  }
  return metaConfigPromise;
}

async function ensureMetaPixel(){
  if(typeof window==='undefined') return null;
  const cfg=await getMetaConfig();
  if(!cfg.enabled || !cfg.pixelId) return null;
  const w=window as any;
  if(!w.fbq){
    const f:any=function(){ f.callMethod ? f.callMethod.apply(f,arguments) : f.queue.push(arguments); };
    f.queue=[]; f.loaded=true; f.version='2.0'; w.fbq=f;
    const script=document.createElement('script');
    script.async=true; script.src='https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  w.__bcMetaPixels=w.__bcMetaPixels||{};
  if(!w.__bcMetaPixels[cfg.pixelId]){
    w.__bcMetaPixels[cfg.pixelId]=true;
    w.fbq('init',cfg.pixelId);
  }
  return w.fbq as ((...args:any[])=>void);
}

async function trackMeta(pathname:string, slug:string, pageEventId:string, viewEventId:string){
  const fbq=await ensureMetaPixel();
  if(!fbq) return;
  fbq('track','PageView',{}, {eventID:pageEventId});
  if(slug) fbq('track','ViewContent',{content_name:slug,content_category:'Bhutan Tour Package',content_ids:[slug],content_type:'product'}, {eventID:viewEventId});
}

export function trackMetaLineClick(packageSlug='', eventId=''){
  const resolvedEventId=eventId || newMetaEventId('line');
  try{
    const w=window as any;
    if(w.fbq){
      w.fbq('trackCustom','LineAddFriendClick',{package:packageSlug||undefined},{eventID:resolvedEventId});
      return true;
    }
    void ensureMetaPixel().then((fbq)=>{ if(fbq) fbq('trackCustom','LineAddFriendClick',{package:packageSlug||undefined},{eventID:resolvedEventId}); });
  }catch{}
  return false;
}

export function createMetaEventId(prefix='evt'){
  return newMetaEventId(prefix);
}

export function trackMetaLead(packageSlug='', eventId=''){
  const resolvedEventId=eventId || newMetaEventId('lead');
  try{
    const w=window as any;
    const params=packageSlug ? {content_name:packageSlug,content_category:'Bhutan Tour Package'} : {};
    if(w.fbq){
      w.fbq('track','Lead',params,{eventID:resolvedEventId});
      return true;
    }
    void ensureMetaPixel().then((fbq)=>{ if(fbq) fbq('track','Lead',params,{eventID:resolvedEventId}); });
  }catch{}
  return false;
}

export default function AnalyticsTracker(){
  const pathname = usePathname();
  useEffect(()=>{
    if (!pathname || pathname.startsWith('/admin')) return;
    const slug = pathname.startsWith('/package') || pathname.startsWith('/packages/')
      ? (new URLSearchParams(window.location.search).get('slug') || pathname.split('/').filter(Boolean).pop() || '')
      : '';

    const presenceExtra = slug ? {package_slug:slug} : {};
    const pageMetaEventId=newMetaEventId('page');
    const viewMetaEventId=slug ? newMetaEventId('view') : '';

    // Presence is intentionally separate from analytics. It is sent immediately
    // on entry and an explicit offline signal is sent when the page is closed.
    // This makes ONLINE NOW react in ~2 seconds instead of waiting for a long
    // heartbeat window.
    sendPublicEvent('heartbeat', {...presenceExtra,presence:'online'});
    trackPublicEvent('page_view', {...presenceExtra,meta_event_id:pageMetaEventId});
    if (slug) trackPublicEvent('package_view',{ package_slug:slug,meta_event_id:viewMetaEventId });

    const heartbeat=()=>{
      // Keep the session alive even when the user switches tabs. pagehide /
      // beforeunload are responsible for marking a closed page offline.
      sendPublicEvent('heartbeat', {...presenceExtra,presence:'online'});
    };
    const timer=window.setInterval(heartbeat,6_000);
    const onVisibility=()=>{
      if(document.visibilityState==='visible') sendPublicEvent('heartbeat',{...presenceExtra,presence:'online'});
    };
    const goOffline=()=>sendPublicEvent('heartbeat',{...presenceExtra,presence:'offline'});
    document.addEventListener('visibilitychange',onVisibility);
    window.addEventListener('pagehide',goOffline);
    window.addEventListener('beforeunload',goOffline);

    trackMeta(pathname,slug,pageMetaEventId,viewMetaEventId);
    trackGooglePage(pathname,slug);

    return()=>{
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange',onVisibility);
      window.removeEventListener('pagehide',goOffline);
      window.removeEventListener('beforeunload',goOffline);
    };
  },[pathname]);
  return null;
}
