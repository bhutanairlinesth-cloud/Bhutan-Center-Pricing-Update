import Link from "next/link";
import SectionIntro from "@/components/SectionIntro";
import LineCta from "@/components/LineCta";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/visa", seo.pages);
}

export default function VisaPage() {
  return <>
    <section className="page-hero"><div className="container"><span className="breadcrumbs">Travel service / Visa</span><h1>วีซ่าภูฏาน<br/>ไม่ต้องจัดการคนเดียว</h1><p>เตรียมเอกสารหลักให้ครบ จากนั้นทีม Bhutan Center ช่วยตรวจ ประสาน และส่งเอกสาร e‑Visa ให้ก่อนเดินทาง</p></div></section>
    <section className="section"><div className="container"><SectionIntro eyebrow="Visa process" title="3 ขั้นตอนที่ต้องรู้" body="สำหรับลูกค้าที่เดินทางกับแพ็กเกจ Bhutan Center ทีมงานจะสรุปเอกสารและค่าธรรมเนียมที่เกี่ยวข้องให้ตามวันเดินทางจริง"/><div className="steps"><div className="step-row"><div><h3>เตรียม Passport และรูปถ่าย</h3><p>ส่งไฟล์หน้าหนังสือเดินทางที่มีอายุใช้งานเพียงพอสำหรับการเดินทาง พร้อมรูปถ่ายสีหน้าตรงตามข้อกำหนดที่ทีมงานแจ้ง</p></div></div><div className="step-row"><div><h3>ส่งเอกสารให้ทีมตรวจ</h3><p>ทีม Bhutan Center ตรวจความครบถ้วนก่อนนำเข้าสู่ขั้นตอนยื่นวีซ่า และจะแจ้งค่าธรรมเนียม/เงื่อนไขที่เกี่ยวข้องในใบเสนอราคาหรือเอกสารการเดินทาง</p></div></div><div className="step-row"><div><h3>รับ e‑Visa ก่อนออกเดินทาง</h3><p>เมื่อได้รับการอนุมัติ ทีมงานจะส่งเอกสาร e‑Visa และแจ้งรายการเอกสารที่ควรพกติดตัวในวันเดินทาง</p></div></div></div></div></section>
    <section className="section section--white"><div className="container callout"><div><h2>เดินทางกับแพ็กเกจ Bhutan Center?</h2><p>ให้ทีมดูแล Visa + SDF ไปพร้อมกับตั๋ว โรงแรม และโปรแกรม จะง่ายกว่าการแยกประสานทีละส่วน</p></div><div className="callout-actions"><Link href="/packages" className="button button--gold">ดูแพ็กเกจ <span>→</span></Link><LineCta className="button button--outline button--light">ถามเรื่องเอกสาร</LineCta></div></div></section>
  </>;
}
