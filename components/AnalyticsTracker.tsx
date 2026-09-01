"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function storageId(storage: Storage, key:string, prefix:string){
  try {
    let value = storage.getItem(key);
    if (!value) { value = `${prefix}_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`; storage.setItem(key,value); }
    return value;
  } catch { return `${prefix}_${Date.now().toString(36)}`; }
}

export function getVisitorIds(){
  return {
    visitorId: storageId(localStorage,'bc_visitor_id','bcv'),
    sessionId: storageId(sessionStorage,'bc_session_id','bcs'),
  };
}

export async function trackPublicEvent(eventName:string, extra:Record<string,unknown>={}){
  try {
    const { visitorId, sessionId } = getVisitorIds();
    const params = new URLSearchParams(window.location.search);
    const payload = {
      visitor_id: visitorId, session_id: sessionId, event_name:eventName,
      page_path: window.location.pathname,
      package_slug: extra.package_slug || null,
      source: params.get('utm_source') || document.referrer || null,
      campaign: params.get('utm_campaign') || null,
      metadata: extra,
    };
    navigator.sendBeacon?.('/api/events', new Blob([JSON.stringify(payload)], {type:'application/json'}))
      || fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>null);
  } catch {}
}

export default function AnalyticsTracker(){
  const pathname = usePathname();
  useEffect(()=>{
    if (!pathname || pathname.startsWith('/admin')) return;
    trackPublicEvent('page_view');
    if (pathname.startsWith('/package') || pathname.startsWith('/packages/')) {
      const slug = new URLSearchParams(window.location.search).get('slug') || pathname.split('/').filter(Boolean).pop() || '';
      trackPublicEvent('package_view',{ package_slug:slug });
    }
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
      if (pathname.startsWith('/package') || pathname.startsWith('/packages/')) w.fbq('track','ViewContent');
    }
  },[pathname]);
  return null;
}
