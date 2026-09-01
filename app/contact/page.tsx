import Link from "next/link";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/contact", seo.pages);
}

export default function ContactPage(){return <>
  <section className="page-hero"><div className="container"><span className="breadcrumbs">Contact</span><h1>คุยกับทีม<br/>Bhutan Center</h1><p>สอบถามแพ็กเกจ เที่ยวบิน Bhutan Airlines วีซ่า โรงแรม หรือให้เราช่วยวางแผนการเดินทางส่วนตัวได้</p></div></section>
  <section className="section"><div className="container content-grid"><div className="info-card"><h3>โทร</h3><p><a href="tel:+6626304500">+66 2 630 4500</a></p></div><div className="info-card"><h3>อีเมล</h3><p><a href="mailto:info@omgexp.com">info@omgexp.com</a></p></div><div className="info-card"><h3>สำนักงาน</h3><p>52/13 ชั้น 5 สีลมคอนโด ซอยศาลาแดง 2 แขวงสีลม เขตบางรัก กรุงเทพฯ 10500</p></div></div></section>
  <section className="section section--white"><div className="container callout"><div><h2>มีวันเดินทางแล้ว?</h2><p>ส่งวันเดินทางและจำนวนคนมาให้เรา เพื่อเช็กราคาได้เร็วขึ้น</p></div><Link href="/packagetours-bhutan-booking" className="button button--gold">ขอใบเสนอราคา <span>→</span></Link></div></section>
</>}
