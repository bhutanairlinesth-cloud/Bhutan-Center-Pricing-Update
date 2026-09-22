import Link from "next/link";
import LineCta from "@/components/LineCta";
import SectionIntro from "@/components/SectionIntro";
import { Icon } from "@/components/Icons";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/travel-info", seo.pages);
}

const items = [
  ["เวลา","เวลาภูฏานช้ากว่าประเทศไทย 1 ชั่วโมง","calendar"],
  ["อินเทอร์เน็ตมือถือ","สามารถใช้ Roaming หรือซื้อซิมในภูฏานได้ ควรเตรียม Passport สำหรับยืนยันตัวตน","route"],
  ["เงินและการชำระ","สกุลเงินท้องถิ่นคือ Ngultrum บัตรสากลใช้ได้ค่อนข้างแพร่หลายในเมือง แต่ควรมีเงินสดสำรองสำหรับบางพื้นที่","visa"],
  ["ไฟฟ้า","ใช้ไฟ 220V และแนะนำให้พก Universal Adapter เพื่อความสะดวก","hotel"],
  ["รองเท้า","แนะนำรองเท้าที่เดินสบาย โดยเฉพาะวันที่ขึ้นวัดทักซังและวันที่มีทางลาดชัน","guide"],
  ["หนังสือเดินทาง","ควรมีอายุเหลือไม่น้อยกว่า 6 เดือนนับจากวันเดินทาง","shield"],
] as const;

export default function TravelInfoPage(){return <>
  <section className="page-hero"><div className="container"><span className="breadcrumbs">Before you go</span><h1>รู้ไว้ก่อนไปภูฏาน</h1><p>ข้อมูลพื้นฐานและรายการเตรียมตัวที่ช่วยให้วันเดินทางจริงราบรื่นขึ้น โดยไม่ต้องจำรายละเอียดเยอะเกินไป</p></div></section>
  <section className="section"><div className="container"><SectionIntro eyebrow="Essentials" title="6 เรื่องที่ควรรู้ก่อนเดินทาง" body="รายละเอียดบางอย่างอาจเปลี่ยนตามช่วงเวลา ทีมงานจะยืนยันข้อมูลที่เกี่ยวข้องกับทริปของคุณอีกครั้งก่อนเดินทาง"/><div className="content-grid">{items.map(([title,body,icon])=><div className="info-card" key={title}><Icon name={icon}/><h3>{title}</h3><p>{body}</p></div>)}</div></div></section>
  <section className="section section--white"><div className="container"><SectionIntro eyebrow="Packing checklist" title="สิ่งที่ควรเตรียม"/><div className="include-grid"><div><h3>ควรมีติดกระเป๋า</h3><ul className="check-list"><li>Passport และสำเนาเอกสารสำคัญ</li><li>ยาประจำตัวและยาสามัญที่จำเป็น</li><li>รองเท้าผ้าใบหรือรองเท้าเดินที่ใส่สบาย</li><li>เสื้อกันหนาวแบบเลเยอร์</li><li>Universal Adapter / Power bank</li></ul></div><div><h3>ควรวางแผนล่วงหน้า</h3><ul className="check-list"><li>เช็กสภาพอากาศก่อนเดินทาง</li><li>แจ้งอาหารที่แพ้หรือข้อจำกัดด้านอาหาร</li><li>เตรียมช่องทางชำระเงินและเงินสดสำรอง</li><li>เปิด Roaming หรือวางแผนซื้อ SIM</li><li>เตรียมตัวสำหรับการเดินบนพื้นที่สูง</li></ul></div></div></div></section>
  <section className="section"><div className="container callout"><div><h2>อยากให้ทีมเตรียม Checklist ให้ตามทริป?</h2><p>เมื่อยืนยันวันเดินทางแล้ว ทีมจะสรุปเอกสาร Visa + SDF และสิ่งที่ควรเตรียมให้สอดคล้องกับโปรแกรมจริง</p></div><div className="callout-actions"><Link href="/visa" className="button button--gold">ดูขั้นตอนวีซ่า <span>→</span></Link><LineCta className="button button--outline button--light">ถามทีมก่อนเดินทาง</LineCta></div></div></section>
</>}
