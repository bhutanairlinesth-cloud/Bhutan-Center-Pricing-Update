import BookingForm from "@/components/BookingForm";
import LineCta from "@/components/LineCta";
import SectionIntro from "@/components/SectionIntro";
import { Icon } from "@/components/Icons";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";
import { siteImages } from "@/lib/site-images";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/bhutan-airlines", seo.pages);
}

export default function AirlinesPage() {
  return <>
    <section className="airline-hero airline-hero--photo">
      <div className="page-container airline-hero-grid">
        <div className="airline-hero-copy">
          <span className="hero-kicker">BHUTAN AIRLINES · OFFICIAL GSA THAILAND</span>
          <h1>บินจากกรุงเทพฯ<br/>สู่พาโรอย่างมั่นใจ</h1>
          <p>OMG Experience เป็น General Sales Agent (GSA) ของ Bhutan Airlines ในประเทศไทย และทำงานร่วมกับ Bhutan Center เพื่อจัดเที่ยวบินให้สอดคล้องกับแพ็กเกจท่องเที่ยวในจุดเดียว</p>
          <div className="airline-hero-actions"><a href="#request-flight" className="button button--gold">ขอราคาเที่ยวบิน <span>→</span></a><LineCta className="airline-line-link">คุยกับทีมสำรองที่นั่งทาง LINE</LineCta></div>
          <div className="airline-hero-trust"><span>Bangkok · BKK</span><b>→</b><span>Paro · PBH</span></div>
        </div>
        <div className="airline-hero-photo"><img src={siteImages.bhutanAirlinesParo} alt="Bhutan Airlines Airbus A319 at Paro International Airport"/><div><small>PARO INTERNATIONAL AIRPORT</small><strong>Bhutan Airlines</strong></div></div>
      </div>
    </section>

    <section className="section"><div className="container"><SectionIntro eyebrow="Why book with the Thailand team" title="เที่ยวบินเป็นส่วนแรกของทริป ไม่ควรแยกวางแผน" body="วันบินมีผลต่อจำนวนคืน โรงแรม และโปรแกรมเที่ยว ทีมจึงเช็กเที่ยวบินไปพร้อมกับแพ็กเกจ เพื่อให้แผนทั้งหมดสอดคล้องกันตั้งแต่ต้น"/><div className="content-grid"><div className="info-card"><Icon name="plane"/><h3>Official Thailand team</h3><p>คำขอจองและการประสานงานในประเทศไทยดูแลโดย OMG Experience ซึ่งเป็น GSA ของ Bhutan Airlines</p></div><div className="info-card"><Icon name="calendar"/><h3>Plan flight + land together</h3><p>เช็กวันบินพร้อมโปรแกรม โรงแรม และจำนวนคืน เพื่อลดการแก้แผนภายหลัง</p></div><div className="info-card"><Icon name="shield"/><h3>Human support</h3><p>มีทีมช่วยประสานราคา ที่นั่ง ชั้นโดยสาร และรายละเอียดก่อนออกบัตร ไม่ต้องจัดการหลายช่องทาง</p></div></div></div></section>

    <section id="request-flight" className="section section--white"><div className="container booking-panel"><div className="booking-copy"><span className="eyebrow">FLIGHT REQUEST</span><h2>มีวันเดินทางแล้ว?<br/>ให้ทีมเช็กเที่ยวบินให้</h2><p>ส่งวันที่ไป–กลับและจำนวนผู้เดินทาง ทีมจะช่วยเช็กทางเลือกที่เหมาะสมและประสานต่อให้</p><ul><li>Bangkok (BKK) – Paro (PBH)</li><li>Economy / Business Class</li><li>เชื่อมเที่ยวบินเข้ากับแพ็กเกจทัวร์ได้</li></ul></div><BookingForm compact/></div></section>
  </>;
}
