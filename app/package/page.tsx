import type { Metadata } from "next";
import Link from "next/link";
import LineCta from "@/components/LineCta";
import { notFound } from "next/navigation";
import { formatTHB } from "@/lib/packages";
import { getPublicPackage } from "@/lib/pricing-source";
import { packagePublicPath } from "@/lib/public-paths";
import { loadSeoState } from "@/lib/seo-store";
import { metadataForPath } from "@/lib/seo-config";

type SearchParams = Promise<{ slug?: string | string[] }>;
const getSlug=(v?:string|string[])=>Array.isArray(v)?v[0]:v;

export async function generateMetadata({ searchParams }:{searchParams:SearchParams}):Promise<Metadata>{
  const params=await searchParams; const slug=getSlug(params.slug);
  if(!slug)return {title:"แพ็กเกจภูฏาน | Bhutan Center",robots:{index:false,follow:false}};
  const item=await getPublicPackage(slug); if(!item)return {title:"แพ็กเกจภูฏาน | Bhutan Center"};
  const seo=await loadSeoState(); const configured=metadataForPath(`/packages/${item.slug}`,seo.pages); const canonical=`https://www.bhutancenter.org${packagePublicPath(item.slug)}`;
  return {...configured,title:configured.title||`${item.name} ${item.duration}`,description:configured.description||item.shortDescription,alternates:configured.alternates||{canonical},robots:configured.robots||{index:true,follow:true}};
}

export default async function PackageDetailPage({searchParams}:{searchParams:SearchParams}){
  const params=await searchParams; const slug=getSlug(params.slug); if(!slug)notFound(); const item=await getPublicPackage(slug); if(!item)notFound();
  return <>
    <section className="package-hero"><div className="page-container package-hero-grid"><div className="package-hero-copy"><span className="section-label">{item.badge}</span><h1>{item.name}</h1><p>{item.overview}</p><div className="package-city-list">{item.cities.map(city=><span key={city}>{city}</span>)}</div><div className="package-hero-price"><div><small>ราคาเริ่มต้น / ท่าน</small><strong>฿{formatTHB(item.priceFrom)}</strong><span>{item.duration} · Private Tour</span></div><div className="package-hero-actions"><LineCta packageSlug={item.slug} className="line-button">ถามราคาและวันว่างทาง LINE <span>↗</span></LineCta><Link href={`/booking?package=${item.slug}`} className="gold-button package-quote-button">ขอใบเสนอราคา <span>→</span></Link></div></div><p className="package-price-note">ราคาจริงขึ้นอยู่กับวันเดินทาง จำนวนผู้เดินทาง เที่ยวบิน และระดับโรงแรม ทีมงานจะยืนยันราคาก่อนการจอง</p></div><div className="package-hero-media"><img src={item.image} alt={`${item.name} - ${item.cities.join(", ")}, Bhutan`}/><div className="package-duration"><strong>{item.days}</strong><span>Days</span><strong>{item.nights}</strong><span>Nights</span></div></div></div></section>

    <section className="section trip-overview"><div className="page-container trip-overview-grid"><div><span className="section-label">TRIP AT A GLANCE</span><h2>ดูภาพรวมก่อน<br/>แล้วค่อยตัดสินใจ</h2><p>{item.shortDescription}</p></div><div className="trip-facts"><div><span>TRAVEL STYLE</span><strong>Private Tour</strong></div><div><span>AIRLINE</span><strong>{item.airline}</strong></div><div><span>HOTEL</span><strong>{item.hotel}</strong></div><div><span>ROUTE</span><strong>{item.cities.join(" · ")}</strong></div></div></div></section>

    <section className="section highlights-section"><div className="page-container"><div className="section-heading"><div><span className="section-label">HIGHLIGHTS</span><h2>ไฮไลต์ที่ทำให้<br/>ทริปนี้น่าไป</h2></div><p>สรุปจุดเด่นของแพ็กเกจก่อนเปิดดูรายละเอียดรายวัน เพื่อให้เทียบกับแพ็กเกจอื่นได้ง่าย</p></div><div className="highlight-grid">{item.highlights.map((h,i)=><article key={h}><span>0{i+1}</span><h3>{h}</h3></article>)}</div></div></section>

    <section className="section itinerary-section"><div className="page-container"><div className="section-heading"><div><span className="section-label">DAY BY DAY</span><h2>โปรแกรมรายวัน</h2></div><p>โปรแกรมเป็นแนวทางสำหรับการวางแผนและสามารถปรับรายละเอียดตามวันเดินทาง สภาพอากาศ และความเหมาะสมของผู้เดินทาง</p></div><div className="itinerary-list">{item.itinerary.map((day,index)=><details key={day.day} open={index===0}><summary><span>DAY {String(day.day).padStart(2,"0")}</span><strong>{day.title}</strong><i>+</i></summary><p>{day.summary}</p></details>)}</div></div></section>

    <section className="section inclusions-section"><div className="page-container inclusions-grid"><div className="inclusion-card inclusion-card--gold"><span className="section-label">INCLUDED</span><h3>รวมในแพ็กเกจ</h3>{item.includes.map(x=><p key={x}><b>✓</b><span>{x}</span></p>)}</div><div className="inclusion-card"><span className="section-label">NOT INCLUDED</span><h3>ไม่รวม</h3>{item.excludes.map(x=><p key={x}><b>—</b><span>{x}</span></p>)}</div></div></section>

    <section className="section final-cta"><div className="page-container final-cta-card"><div><span className="section-label section-label--light">YOUR DATES, YOUR JOURNEY</span><h2>{item.name}<br/>ในวันที่คุณเลือกเอง</h2></div><div><p>{item.priceNote}</p><div className="final-cta-actions"><LineCta packageSlug={item.slug} className="footer-button">คุยเรื่องวันเดินทางทาง LINE <span>↗</span></LineCta><Link href={`/booking?package=${item.slug}`} className="footer-secondary-button">ฝากข้อมูลเพื่อรับใบเสนอราคา</Link></div></div></div></section>
  </>;
}
