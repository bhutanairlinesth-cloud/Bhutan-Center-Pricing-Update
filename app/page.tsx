import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import BookingForm from "@/components/BookingForm";
import LineCta from "@/components/LineCta";
import { getPublicPackages } from "@/lib/pricing-source";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/", seo.pages);
}

const services = [
  ["01", "Bhutan Airlines", "เช็กเที่ยวบินและชั้นโดยสารให้เข้ากับวันเดินทางของคุณ"],
  ["02", "Visa + SDF", "ดูแลเอกสาร วีซ่า และค่าธรรมเนียมที่จำเป็นก่อนเข้าประเทศ"],
  ["03", "Hotels", "เลือกมาตรฐาน 3–5 ดาว หรือระบุโรงแรมที่ต้องการได้"],
  ["04", "Private Guide & Car", "ไกด์และรถส่วนตัวตลอดเส้นทางตามโปรแกรม"],
];

const cities = [
  ["Paro", "พาโร", "Tiger’s Nest · Paro Dzong · National Museum"],
  ["Thimphu", "ทิมพู", "Buddha Dordenma · Memorial Chorten · Tashichho Dzong"],
  ["Punakha", "พูนาคา", "Punakha Dzong · Dochula Pass · Chimi Lhakhang"],
  ["Gangtey", "กังเต", "Phobjikha Valley · Gangtey Goenpa · Nature Trail"],
];

export default async function HomePage() {
  const packages = await getPublicPackages();
  return (
    <>
      <section className="home-hero">
        <div className="page-container home-hero-grid">
          <div className="home-hero-copy">
            <span className="section-label">BHUTAN CENTER · SINCE 2013</span>
            <h1>เที่ยวภูฏาน<br/><em>แบบที่เป็นคุณ</em></h1>
            <p>ทริปส่วนตัวที่เริ่มจากวันเดินทางของคุณ พร้อมทีมเดียวดูแลเที่ยวบิน วีซ่า SDF โรงแรม ไกด์ รถ และรายละเอียดตลอดเส้นทาง</p>
            <div className="hero-actions"><Link href="/packagetour-bhutan-new" className="gold-button gold-button--large">ดูแพ็กเกจ <span>↗</span></Link><LineCta className="text-link text-link--large">คุยกับเราทาง LINE <span>→</span></LineCta></div>
            <div className="hero-benefits"><span>เลือกวันเอง</span><span>Private 2+</span><span>Visa + SDF</span><span>Hotel 3–5★</span></div>
            <div className="hero-trust"><div><strong>2+</strong><span>เริ่ม Private Tour</span></div><div><strong>10+</strong><span>ปีที่ดูแลภูฏาน</span></div><div><strong>ครบ</strong><span>Flight · Visa · Land</span></div></div>
          </div>
          <div className="home-hero-visual">
            <div className="hero-main-photo">
              <img src="/images/hero-bhutan.png" alt="Bhutan dzong and Himalayan valley" />
              <div className="hero-route-pill"><span>BKK</span><i></i><span>PBH</span><small>Bhutan Airlines</small></div>
              <div className="hero-place-nav" aria-label="Bhutan destinations">
                <span className="active">Paro</span><span>Thimphu</span><span>Punakha</span><span>Gangtey</span>
              </div>
            </div>
            <div className="hero-inset-photo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/0/0c/Paro_Taktsang%2C_Taktsang_Palphug_Monastery%2C_Tiger%27s_Nest_-views_from_the_trekking_path-_during_LGFC_-_Bhutan_2019_%28210%29.jpg" alt="Tiger's Nest in Paro, Bhutan"/>
              <div><span>PARO</span><strong>Tiger’s Nest</strong></div>
            </div>
            <div className="hero-gold-orbit" aria-hidden="true"></div>
          </div>
        </div>
      </section>

      <section className="confidence-strip">
        <div className="page-container confidence-grid"><span>Private journey from 2 guests</span><span>Bhutan Airlines support</span><span>Visa & SDF arranged</span><span>Licensed tour operator</span></div>
      </section>

      <section className="section package-section">
        <div className="page-container">
          <div className="section-heading"><div><span className="section-label">OUR JOURNEYS</span><h2>เลือกจำนวนวันที่พอดี<br/>แล้วค่อยปรับให้เป็นของคุณ</h2></div><div><p>เริ่มจากโปรแกรมยอดนิยม 4, 5 หรือ 6 วัน แล้วปรับวันเดินทาง โรงแรม กิจกรรม และรูปแบบการเที่ยวได้ตามความเหมาะสม</p><Link href="/packagetour-bhutan-new" className="text-link">ดูแพ็กเกจทั้งหมด <span>→</span></Link></div></div>
          <div className="package-grid">{packages.slice(0,3).map((item,index)=><PackageCard item={item} featured={index===1} key={item.slug}/>)}</div>
        </div>
      </section>

      <section className="section philosophy-section">
        <div className="page-container philosophy-grid">
          <div className="philosophy-media"><img src="https://upload.wikimedia.org/wikipedia/commons/0/0c/Paro_Taktsang%2C_Taktsang_Palphug_Monastery%2C_Tiger%27s_Nest_-views_from_the_trekking_path-_during_LGFC_-_Bhutan_2019_%28210%29.jpg" alt="Tiger's Nest Bhutan"/><div className="media-caption"><span>PARO</span><strong>Tiger’s Nest</strong></div></div>
          <div className="philosophy-copy"><span className="section-label">WHY BHUTAN CENTER</span><h2>เรื่องยากให้เรา<br/>เรื่องเที่ยวให้เป็นของคุณ</h2><p>เราไม่ได้เริ่มจากการขายโปรแกรม แต่เริ่มจากดูว่าใครเดินทาง วันไหน มีเวลากี่วัน และอยากได้ทริปแบบไหน แล้วค่อยจัดเที่ยวบิน เอกสาร ที่พัก และเส้นทางให้ลงตัว</p><div className="reason-row"><span>01</span><div><strong>Private & Flexible</strong><p>เลือกวันเองและปรับจังหวะของโปรแกรมให้เหมาะกับคนในทริป</p></div></div><div className="reason-row"><span>02</span><div><strong>One team, one journey</strong><p>ตั๋ว วีซ่า SDF โรงแรม ไกด์ รถ และเอกสาร อยู่ในทีมเดียวกัน</p></div></div><div className="reason-row"><span>03</span><div><strong>Bhutan specialist</strong><p>ประสบการณ์เส้นทางภูฏานช่วยให้คำแนะนำได้ตรงกับการเดินทางจริง</p></div></div><Link href="/bhutan" className="text-link text-link--large">รู้จัก Bhutan Center <span>→</span></Link></div>
        </div>
      </section>

      <section className="section services-section">
        <div className="page-container">
          <div className="center-heading"><span className="section-label">EVERYTHING IN ONE PLACE</span><h2>ดูแลครบก่อนออกเดินทาง</h2><p>ข้อมูลที่ลูกค้าต้องใช้ถูกจัดให้อยู่ในที่เดียว ไม่ต้องตามหลายช่องทาง</p></div>
          <div className="service-grid">{services.map(([no,title,body])=><article key={no}><span>{no}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
        </div>
      </section>

      <section className="section airline-feature-section">
        <div className="page-container airline-feature">
          <div className="airline-feature-copy"><span className="section-label">BHUTAN AIRLINES</span><h2>Bangkok <em>↔</em> Paro</h2><p>เช็กเที่ยวบินไปพร้อมกับการวางแพ็กเกจ เพื่อให้วันบิน โรงแรม และโปรแกรมเดินทางสอดคล้องกันตั้งแต่ต้น</p><div className="route-line"><div><small>BANGKOK</small><strong>BKK</strong></div><span>✈</span><div><small>PARO</small><strong>PBH</strong></div></div><Link href="/bhutan-airlines" className="gold-button">ดูข้อมูลเที่ยวบิน <span>↗</span></Link></div>
          <div className="airline-feature-media"><img src="/images/hero-bhutan.png" alt="Bhutan landscape"/></div>
        </div>
      </section>

      <section className="section destination-section-home">
        <div className="page-container">
          <div className="section-heading"><div><span className="section-label">DISCOVER BHUTAN</span><h2>4 เมืองหลัก<br/>ที่ทำให้ภูฏานแตกต่าง</h2></div><div><p>ยังไม่ต้องใช้แผนที่ในเวอร์ชันนี้ เราจัดเมืองให้เป็นข้อมูลสั้น ๆ ที่อ่านง่ายก่อน และสามารถเพิ่ม Interactive Map ภายหลังได้โดยไม่ต้องรื้อโครงเว็บใหม่</p><Link href="/bhutan-attractions" className="text-link">สำรวจสถานที่ท่องเที่ยว <span>→</span></Link></div></div>
          <div className="city-list">{cities.map(([en,th,places],index)=><Link href="/bhutan-attractions" className="city-row" key={en}><span className="city-index">0{index+1}</span><div><strong>{th}</strong><small>{en}</small></div><p>{places}</p><span className="city-arrow">↗</span></Link>)}</div>
        </div>
      </section>

      <section className="section planner-section">
        <div className="page-container planner-card">
          <div className="planner-copy"><span className="section-label section-label--light">PLAN YOUR JOURNEY</span><h2>มีวันเดินทางแล้ว?<br/>ส่งมาให้เราดูได้เลย</h2><p>กรอกข้อมูลสั้น ๆ ทีมจะช่วยเลือกจำนวนวัน โปรแกรม และราคาให้เหมาะกับทริปจริง</p><div className="planner-points"><span>Private 2+</span><span>Hotel 3–5 Star</span><span>Economy / Business</span></div></div>
          <BookingForm compact />
        </div>
      </section>
    </>
  );
}
