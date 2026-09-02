"use client";

import { MouseEvent, useMemo } from 'react';
import { getVisitorIds, trackGoogleLineClick } from './AnalyticsTracker';

export default function LineCta({ packageSlug='', className='line-button', children }:{ packageSlug?:string; className?:string; children?:React.ReactNode }){
  const href = useMemo(()=>'/go/line',[]);
  function click(e:MouseEvent<HTMLAnchorElement>){
    e.preventDefault();
    const { visitorId, sessionId } = getVisitorIds();
    const params=new URLSearchParams({ visitor:visitorId, session:sessionId, page:window.location.pathname });
    if(packageSlug) params.set('package',packageSlug);
    const w=window as any; if(w.fbq) w.fbq('trackCustom','LineAddFriendClick',{package:packageSlug||undefined});
    const target=`${href}?${params.toString()}`;
    const navigated=trackGoogleLineClick(packageSlug,()=>{ window.location.href=target; });
    if(!navigated) window.location.href=target;
  }
  return <a href={href} onClick={click} className={className}>{children || <>LINE คุยกับทีม Bhutan Center <span>→</span></>}</a>;
}

export function FloatingLineButton(){
  return <LineCta className="floating-line-button"><span className="floating-line-dot">LINE</span><strong>คุยกับเรา</strong></LineCta>;
}
