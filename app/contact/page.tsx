import Link from "next/link";
import LineCta from "@/components/LineCta";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/contact", seo.pages);
}

export default function ContactPage(){return <>
  <section className="page-hero"><div className="container"><span className="breadcrumbs">Contact</span><h1>เริ่มทริปภูฏาน<br/>ด้วยการคุยกับทีมเรา</h1><p>มีวันเดินทางแล้ว หรือยังไม่รู้ว่าจะเลือกแพ็กเกจไหนก็ได้ บอกจำนวนคนและสิ่งที่อยากได้จากทริป แล้วให้ทีมช่วยต่อภาพทั้งหมดให้</p><div className="contact-hero-actions"><LineCta className="line-button">คุยกับ Bhutan Center ทาง LINE <span>→</span></LineCta><Link href="/booking" className="button button--outline">ฝากข้อมูลเพื่อรับใบเสนอราคา</Link></div></div></section>
  <section className="section"><div className="container content-grid"><div className="info-card"><span className="contact-card-label">CALL</span><h3>โทรคุยกับทีม</h3><p><a className="contact-direct-link" href="tel:+6626304500">+66 2 630 4500</a></p></div><div className="info-card"><span className="contact-card-label">EMAIL</span><h3>ส่งรายละเอียดทางอีเมล</h3><p><a className="contact-direct-link" href="mailto:info@omgexp.com">info@omgexp.com</a></p></div><div className="info-card"><span className="contact-card-label">OFFICE</span><h3>สำนักงานกรุงเทพฯ</h3><p>52/13 ชั้น 5 สีลมคอนโด ซอยศาลาแดง 2 แขวงสีลม เขตบางรัก กรุงเทพฯ 10500</p></div></div></section>
  <section className="section section--white"><div className="container callout"><div><h2>เพื่อเช็กราคาได้เร็วขึ้น</h2><p>เตรียมแค่วันที่อยากเดินทาง จำนวนผู้เดินทาง และระดับโรงแรมคร่าว ๆ ที่เหลือทีมช่วยแนะนำได้</p></div><Link href="/booking" className="button button--gold">เริ่มขอราคา <span>→</span></Link></div></section>
</>}
