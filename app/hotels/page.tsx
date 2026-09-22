import Link from "next/link";
import LineCta from "@/components/LineCta";
import SectionIntro from "@/components/SectionIntro";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/hotels", seo.pages);
}

const hotelLevels = [
  ["3★", "Comfort", "เน้นคุ้มค่า สะอาด เดินทางสะดวก เหมาะกับคนที่ให้ความสำคัญกับโปรแกรมเที่ยวมากกว่าสิ่งอำนวยความสะดวกในโรงแรม"],
  ["4★", "Premium", "เพิ่มความสบาย ห้องพักและพื้นที่ส่วนกลางดีขึ้น เหมาะกับคู่เดินทางหรือครอบครัวที่อยากพักสบายขึ้นหลังเที่ยวทั้งวัน"],
  ["5★", "Luxury", "สำหรับคนที่ต้องการประสบการณ์พิเศษขึ้น ทั้งบรรยากาศ บริการ และมาตรฐานที่พัก ทีมช่วยเช็กตัวเลือกตามเมืองและวันเดินทาง"],
];

export default function HotelsPage(){ return <>
  <section className="page-hero"><div className="container"><span className="breadcrumbs">Bhutan / Hotels</span><h1>พักให้เหมาะกับทริป<br/>ไม่ใช่แค่เลือกดาว</h1><p>เลือกมาตรฐานที่พักจากงบและสไตล์ที่ต้องการ แล้วให้ทีมเช็กโรงแรมจริงตามเมือง วันเดินทาง และห้องว่างก่อนยืนยันราคา</p></div></section>
  <section className="section"><div className="container"><SectionIntro eyebrow="Choose your stay" title="เลือกมาตรฐานที่เหมาะกับคุณ" body="เราไม่ล็อกชื่อโรงแรมก่อนเช็กห้องว่าง เพราะโรงแรมที่ดีที่สุดคือโรงแรมที่เหมาะกับเส้นทางและมีห้องจริงในวันที่คุณเดินทาง"/><div className="content-grid">{hotelLevels.map(([level,title,body])=><div className="info-card" key={level}><span className="hotel-level-badge">{level}</span><h3>{title}</h3><p>{body}</p></div>)}</div><p className="package-price-disclaimer">ชื่อโรงแรมและประเภทห้องจะยืนยันในใบเสนอราคาหรือเอกสารการเดินทางตามห้องว่างจริง ณ วันที่จอง</p></div></section>
  <section className="section section--white"><div className="container callout"><div><h2>มีโรงแรมที่อยากพักอยู่แล้ว?</h2><p>ส่งชื่อโรงแรมหรือระดับที่ต้องการให้ทีมเช็กพร้อมแพ็กเกจได้เลย ไม่ต้องแยกจองหลายที่</p></div><div className="callout-actions"><Link className="button button--gold" href="/packages">ดูแพ็กเกจ <span>→</span></Link><LineCta className="button button--outline button--light">ให้ทีมเช็กโรงแรม</LineCta></div></div></section>
</>; }
