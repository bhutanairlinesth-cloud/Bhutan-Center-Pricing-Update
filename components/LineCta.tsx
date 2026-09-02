"use client";

import { MouseEvent, useMemo } from 'react';
import { createMetaEventId, getVisitorIds, trackGoogleLineClick, trackMetaLineClick, trackPublicEvent } from './AnalyticsTracker';

export default function LineCta({ packageSlug='', className='line-button', children }:{ packageSlug?:string; className?:string; children?:React.ReactNode }){
  const href = useMemo(()=>'/go/line',[]);
  function click(e:MouseEvent<HTMLAnchorElement>){
    e.preventDefault();
    const { visitorId, sessionId } = getVisitorIds();
    const metaEventId=createMetaEventId('line');
    const params=new URLSearchParams({ visitor:visitorId, session:sessionId, page:window.location.pathname, tracked:'1', event_id:metaEventId });
    if(packageSlug) params.set('package',packageSlug);
    trackPublicEvent('line_click',{package_slug:packageSlug||undefined,meta_event_id:metaEventId});
    trackMetaLineClick(packageSlug,metaEventId);
    const target=`${href}?${params.toString()}`;
    const navigated=trackGoogleLineClick(packageSlug,()=>{ window.location.href=target; });
    if(!navigated) window.location.href=target;
  }
  return <a href={href} onClick={click} className={className}>{children || <>LINE คุยกับทีม Bhutan Center <span>→</span></>}</a>;
}

export function FloatingLineButton(){
  return <LineCta className="floating-line-button"><span className="floating-line-dot">LINE</span><strong>คุยกับเรา</strong></LineCta>;
}
