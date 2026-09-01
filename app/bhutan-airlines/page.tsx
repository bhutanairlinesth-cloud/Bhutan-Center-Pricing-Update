import BookingForm from "@/components/BookingForm";
import SectionIntro from "@/components/SectionIntro";
import { Icon } from "@/components/Icons";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/bhutan-airlines", seo.pages);
}

export default function AirlinesPage() {
  return <>
    <section className="airline-hero"><div className="container"><div className="airline-hero-copy"><span className="hero-kicker">Bhutan Airlines · GSA Thailand</span><h1>Your gateway<br/>to Bhutan.</h1><p>Bhutan Center และ OMG Experience ดูแลการจองเที่ยวบิน Bhutan Airlines สำหรับการเดินทางสู่พาโร พร้อมประสานเที่ยวบินเข้ากับแพ็กเกจท่องเที่ยวได้ในจุดเดียว</p><a href="#request-flight" className="button button--gold">ขอราคาเที่ยวบิน <span>→</span></a></div></div></section>
    <section className="section"><div className="container"><SectionIntro eyebrow="About Bhutan Airlines" title="From Bangkok to the Kingdom of Happiness" body="Bhutan Airlines เป็นสายการบินเอกชนของภูฏาน มีฐานปฏิบัติการหลักที่ท่าอากาศยานนานาชาติพาโร และให้บริการเส้นทางระหว่างประเทศในภูมิภาคเอเชีย"/><div className="content-grid"><div className="info-card"><Icon name="shield"/><h3>Safety</h3><p>ให้ความสำคัญกับมาตรฐานการปฏิบัติการและความปลอดภัยตลอดการเดินทาง</p></div><div className="info-card"><Icon name="plane"/><h3>Service</h3><p>บริการเที่ยวบินพร้อมทีมงานที่ดูแลประสบการณ์ของผู้โดยสารตั้งแต่ก่อนเดินทาง</p></div><div className="info-card"><Icon name="calendar"/><h3>Planning</h3><p>ทีมงานช่วยเช็กเที่ยวบิน ชั้นโดยสาร และวางตารางให้สอดคล้องกับโปรแกรมทัวร์ภูฏาน</p></div></div></div></section>
    <section id="request-flight" className="section section--white"><div className="container booking-panel"><div className="booking-copy"><span className="eyebrow">Flight request</span><h2>ต้องการเช็กเที่ยวบิน?</h2><p>กรอกวันที่ไป–กลับ จำนวนผู้เดินทาง และช่องทางติดต่อ ทีมงานจะช่วยเช็กเที่ยวบินและราคาให้</p><ul><li>เส้นทาง Bangkok – Paro</li><li>Economy / Business Class</li><li>เชื่อมต่อกับแพ็กเกจทัวร์ได้</li></ul></div><BookingForm compact/></div></section>
  </>;
}
