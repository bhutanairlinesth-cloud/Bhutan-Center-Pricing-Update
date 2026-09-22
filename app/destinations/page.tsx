import Link from "next/link";
import LineCta from "@/components/LineCta";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";
import { siteImages } from "@/lib/site-images";

export async function generateMetadata(){const seo=await loadSeoState();return metadataForPath("/destinations",seo.pages)}

const cities=[
  {id:"paro",en:"Paro",th:"พาโร",desc:"ประตูสู่ภูฏานและเมืองที่หลายคนตกหลุมรักตั้งแต่วันแรก ทั้งหุบเขา วัดเก่า และวัดทักซังบนหน้าผา",places:"Tiger’s Nest · Paro Dzong · National Museum",image:siteImages.tigerNest},
  {id:"thimphu",en:"Thimphu",th:"ทิมพู",desc:"เมืองหลวงที่รวมสถาปัตยกรรมดั้งเดิม ชีวิตร่วมสมัย และสถานที่สำคัญของประเทศไว้ในเมืองเดียว",places:"Tashichho Dzong · Memorial Chorten · Buddha Point",image:siteImages.thimphuDzong},
  {id:"punakha",en:"Punakha",th:"พูนาคา",desc:"อดีตเมืองหลวงในหุบเขาอากาศอบอุ่น โดดเด่นด้วย Punakha Dzong ที่ตั้งอยู่บริเวณจุดบรรจบของแม่น้ำสองสาย",places:"Punakha Dzong · Dochula Pass · Chimi Lhakhang",image:siteImages.punakhaDzong},
  {id:"gangtey",en:"Gangtey / Phobjikha",th:"กังเต / โฟบจิกา",desc:"พื้นที่หุบเขาธรรมชาติที่สงบกว่าทริปเมืองหลัก เหมาะสำหรับคนที่อยากเห็นอีกมุมของภูฏานและเพิ่มเวลาสัมผัสธรรมชาติ",places:"Phobjikha Valley · Gangtey Goenpa · Nature Trail",image:siteImages.phobjikhaValley},
];

export default function DestinationsPage(){return <>
  <section className="inner-hero destination-sales-hero"><div className="page-container inner-hero-grid"><div><span className="section-label">DISCOVER BHUTAN</span><h1>แต่ละเมือง<br/><em>ให้ความรู้สึกไม่เหมือนกัน</em></h1></div><div className="inner-hero__copy"><p>ดูภาพจริงและไฮไลต์ของแต่ละพื้นที่ก่อนเลือกแพ็กเกจ เพื่อให้รู้ว่าควรใช้เวลา 4, 5 หรือ 6 วันจึงจะพอดีกับสิ่งที่อยากเห็น</p><Link href="/packages" className="gold-button">เทียบแพ็กเกจ 4–6 วัน <span>↗</span></Link></div></div></section>
  <section className="section"><div className="page-container destination-editorial-list">{cities.map((city,index)=><article id={city.id} className="destination-editorial" key={city.en}><div className="destination-editorial-media"><img src={city.image} alt={`${city.en}, Bhutan`}/><span>0{index+1}</span><div className="destination-photo-label"><small>{city.en.toUpperCase()}</small><strong>{city.places.split(" · ")[0]}</strong></div></div><div className="destination-editorial-copy"><small>{city.en.toUpperCase()}</small><h2>{city.th}</h2><p>{city.desc}</p><strong>{city.places}</strong><div className="destination-actions"><Link href="/packages" className="text-link">ดูแพ็กเกจที่เหมาะ <span>→</span></Link><LineCta className="destination-line-link">ถามทีมเรื่องเมืองนี้ทาง LINE</LineCta></div></div></article>)}</div></section>
  <section className="section destination-final-cta"><div className="page-container callout"><div><h2>อยากไปหลายเมือง แต่ไม่รู้กี่วันดี?</h2><p>ส่งรายชื่อเมืองหรือสถานที่ที่อยากไป ทีมจะช่วยจัดจำนวนวันและลำดับเส้นทางให้เหมาะกับเวลาจริง</p></div><LineCta className="button button--gold">ให้ทีมช่วยจัดเส้นทาง <span>→</span></LineCta></div></section>
</>}
