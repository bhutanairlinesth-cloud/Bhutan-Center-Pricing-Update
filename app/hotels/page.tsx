import SectionIntro from "@/components/SectionIntro";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/hotels", seo.pages);
}

const hotels = [
  ["Paro","Aari Sangdrup"],["Paro","Paro Grand"],["Paro","Olathang"],["Paro","Olathang Cottages"],["Paro","Himalayan Keys Forest Resort"],["Paro","Le Méridien Paro Riverfront"],
  ["Thimphu","Phuntsho Pelri"],["Thimphu","Tashi Yoedling"],["Thimphu","Ramada Valley"],["Thimphu","Le Méridien Thimphu"],["Punakha","Zhingkham Resort"],
];

export default function HotelsPage(){ return <>
  <section className="page-hero"><div className="container"><span className="breadcrumbs">Bhutan / Hotels</span><h1>Stay well,<br/>travel better.</h1><p>รายชื่อที่พักที่ Bhutan Center ใช้หรือแนะนำในเมืองหลัก สามารถเลือกมาตรฐานโรงแรมให้เหมาะกับงบและสไตล์การเดินทางได้</p></div></section>
  <section className="section"><div className="container"><SectionIntro eyebrow="Hotel collection" title="พักที่ไหนในภูฏาน" body="โรงแรมจริงขึ้นอยู่กับช่วงวันเดินทางและห้องว่าง ทีมงานจะยืนยันชื่อโรงแรมในใบเสนอราคาหรือเอกสารการเดินทาง"/><div className="hotel-grid">{hotels.map(([city,name])=><div className="hotel-card" key={name}><small>{city}</small><h3>{name}</h3></div>)}</div></div></section>
  <section className="section section--white"><div className="container callout"><div><h2>อยากอัปเกรดโรงแรม?</h2><p>แจ้งระดับที่ต้องการกับทีมงานได้ เช่น 4–5 ดาว หรือโรงแรมเฉพาะที่มีในใจ</p></div><a className="button button--gold" href="/packagetours-bhutan-booking">ออกแบบทริป <span>→</span></a></div></section>
</>; }
