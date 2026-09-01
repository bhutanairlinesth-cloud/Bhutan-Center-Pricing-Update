import Link from "next/link";
import SectionIntro from "@/components/SectionIntro";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/visa", seo.pages);
}

export default function VisaPage() {
  return <>
    <section className="page-hero"><div className="container"><span className="breadcrumbs">Travel service / Visa</span><h1>วีซ่าภูฏาน<br/>ให้เราดูแลขั้นตอนให้</h1><p>เตรียมเอกสารหลักให้ครบ จากนั้นทีม Bhutan Center จะช่วยประสานขั้นตอนยื่นวีซ่าและแจ้งความคืบหน้าให้คุณ</p></div></section>
    <section className="section"><div className="container"><SectionIntro eyebrow="Visa process" title="ง่ายใน 3 ขั้นตอน" body="ข้อมูลด้านล่างย้ายมาจากเนื้อหาหลักของ Bhutan Center และสามารถปรับค่าธรรมเนียมหรือเงื่อนไขจากหลังบ้านได้ในอนาคต"/><div className="steps"><div className="step-row"><div><h3>เตรียมเอกสาร</h3><p>ไฟล์หน้าหนังสือเดินทางที่มีอายุใช้งานเหลืออย่างน้อย 6 เดือนนับจากวันเดินทาง และรูปถ่ายสีหน้าตรงตามข้อกำหนด</p></div></div><div className="step-row"><div><h3>ส่งเอกสารให้ Bhutan Center</h3><p>ทีมงานตรวจสอบความครบถ้วนและนำเข้าสู่กระบวนการยื่นวีซ่า ค่าธรรมเนียมวีซ่าที่เว็บไซต์เดิมระบุคือ USD 40 และรวมอยู่ในแพ็กเกจทัวร์</p></div></div><div className="step-row"><div><h3>รับ e‑Visa</h3><p>เมื่อได้รับการอนุมัติ ทีมงานจะส่งเอกสาร e‑Visa ให้ทางอีเมลเพื่อใช้ประกอบการเดินทาง</p></div></div></div></div></section>
    <section className="section section--white"><div className="container callout"><div><h2>เดินทางกับแพ็กเกจ Bhutan Center?</h2><p>Visa และ SDF สามารถรวมอยู่ในแพ็กเกจเดียว ไม่ต้องแยกประสานหลายจุด</p></div><Link href="/packagetour-bhutan-new" className="button button--gold">ดูแพ็กเกจ <span>→</span></Link></div></section>
  </>;
}
