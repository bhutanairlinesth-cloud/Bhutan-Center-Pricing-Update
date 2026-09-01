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

function attribution(){
  try {
    const params = new URLSearchParams(window.location.search);
    const current = {
      source: params.get('utm_source') || '',
      campaign: params.get('utm_campaign') || '',
      medium: params.get('utm_medium') || '',
      referrer: document.referrer || '',
    };
    const key='bc_attribution';
    const previous=JSON.parse(sessionStorage.getItem(key)||'{}');
    const merged={
      source: current.source || previous.source || current.referrer || '',
      campaign: current.campaign || previous.campaign || '',
      medium: current.medium || previous.medium || '',
      referrer: previous.referrer || current.referrer || '',
    };
    sessionStorage.setItem(key,JSON.stringify(merged));
    return merged;
  } catch { return {source:'',campaign:'',medium:'',referrer:''}; }
}

export async function trackPublicEvent(eventName:string, extra:Record<string,unknown>={}){
  try {
    const { visitorId, sessionId } = getVisitorIds();
    const attr=attribution();
    const payload = {
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
        referrer: attr.referrer || null,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        visibility: document.visibilityState,
      },
    };
    const body=JSON.stringify(payload);
    navigator.sendBeacon?.('/api/events', new Blob([body], {type:'application/json'}))
      || fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>null);
  } catch {}
}

export default function AnalyticsTracker(){
  const pathname = usePathname();
  useEffect(()=>{
    if (!pathname || pathname.startsWith('/admin')) return;
    const slug = pathname.startsWith('/package') || pathname.startsWith('/packages/')
      ? (new URLSearchParams(window.location.search).get('slug') || pathname.split('/').filter(Boolean).pop() || '')
      : '';

    trackPublicEvent('page_view', slug ? {package_slug:slug} : {});
    if (slug) trackPublicEvent('package_view',{ package_slug:slug });

    const heartbeat=()=>{
      if(document.visibilityState!=='visible') return;
      trackPublicEvent('heartbeat', slug ? {package_slug:slug} : {});
    };
    heartbeat();
    const timer=window.setInterval(heartbeat,30_000);
    const onVisibility=()=>{ if(document.visibilityState==='visible') heartbeat(); };
    document.addEventListener('visibilitychange',onVisibility);

    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (pixelId && typeof window !== 'undefined') {
      const w = window as any;
      if (!w.fbq) {
        const f:any = function(){ f.callMethod ? f.callMethod.apply(f,arguments) : f.queue.push(arguments); };
        f.queue=[]; f.loaded=true; f.version='2.0'; w.fbq=f;
        const s=document.createElement('script'); s.async=true; s.src='https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(s);
        f('init',pixelId);
      }
      w.fbq('track','PageView');
      if (slug) w.fbq('track','ViewContent',{content_name:slug,content_category:'Bhutan Tour Package'});
    }

    return()=>{
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange',onVisibility);
    };
  },[pathname]);
  return null;
}
