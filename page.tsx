import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import BookingForm from "@/components/BookingForm";
import LineCta from "@/components/LineCta";
import { formatTHB } from "@/lib/packages";
import { getPublicPackages } from "@/lib/pricing-source";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";
import { siteImages } from "@/lib/site-images";
import HomeHeroGallery from "@/components/HomeHeroGallery";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/", seo.pages);
}

const services = [
  ["01", "Bhutan Airlines", "ทีมไทยช่วยเช็กเที่ยวบินและชั้นโดยสารให้สอดคล้องกับวันเดินทาง"],
  ["02", "Visa + SDF", "ดูแลเอกสาร วีซ่า และค่าธรรมเนียมที่จำเป็นก่อนเข้าประเทศ"],
  ["03", "Hotels", "เลือกมาตรฐาน 3–5 ดาว หรือแจ้งโรงแรมที่ต้องการให้ทีมช่วยเช็กได้"],
  ["04", "Private Guide & Car", "ไกด์และรถส่วนตัวตลอดเส้นทาง ปรับจังหวะการเที่ยวให้เหมาะกับคุณ"],
];

const cities = [
  ["Paro", "พาโร", "Tiger’s Nest · Paro Dzong · National Museum", "paro"],
  ["Thimphu", "ทิมพู", "Tashichho Dzong · Memorial Chorten · Buddha Point", "thimphu"],
  ["Punakha", "พูนาคา", "Punakha Dzong · Dochula Pass · Chimi Lhakhang", "punakha"],
  ["Gangtey", "กังเต / โฟบจิกา", "Phobjikha Valley · Gangtey Goenpa · Nature Trail", "gangtey"],
];

export default async function HomePage() {
  const packages = await getPublicPackages();
  const minPrice = packages.length ? Math.min(...packages.map((item) => item.priceFrom)) : 59000;

  return (
    <>
      <section className="home-hero">
        <div className="page-container home-hero-grid">
          <div className="home-hero-copy">
            <span className="section-label">PRIVATE BHUTAN · เริ่มเดินทางได้ตั้งแต่ 2 ท่าน</span>
            <h1>เที่ยวภูฏาน<br/><em>ง่ายกว่าที่คิด</em></h1>
            <p>เลือกแพ็กเกจ 4–6 วันและวันเดินทางที่สะดวก แล้วให้ Bhutan Center ดูแลต่อทั้งเที่ยวบิน วีซ่า SDF โรงแรม ไกด์ รถ และรายละเอียดก่อนออกเดินทาง</p>

            <div className="hero-price-callout">
              <span>แพ็กเกจเริ่มต้น</span>
              <strong>฿{formatTHB(minPrice)}</strong>
              <small>/ ท่าน</small>
              <em>ราคาเริ่มต้น · ทีมงานยืนยันราคาตามวันเดินทางจริง</em>
            </div>

            <div className="hero-actions">
              <Link href="/packages" className="gold-button gold-button--large">ดูแพ็กเกจและราคา <span>↗</span></Link>
              <LineCta className="text-link text-link--large">ถามวันเดินทางทาง LINE <span>→</span></LineCta>
            </div>

            <div className="hero-benefits"><span>Private 2+</span><span>Bhutan Airlines</span><span>Visa + SDF</span><span>Hotel 3–5★</span></div>
            <div className="hero-trust"><div><small>01</small><strong>ทัวร์ส่วนตัว</strong><span>เลือกวันเดินทางเองได้</span></div><div><small>02</small><strong>ผู้เชี่ยวชาญเส้นทางภูฏาน</strong><span>เกือบ 15 ปี</span></div><div><small>03</small><strong>One Stop Service</strong><span>เที่ยวบิน · วีซ่า · SDF · โรงแรม · รถ · ไกด์</span></div></div>
          </div>

<HomeHeroGallery />
        </div>
      </section>

      <section className="confidence-strip">
        <div className="page-container confidence-grid"><span>เที่ยวส่วนตัวตั้งแต่ 2 ท่าน</span><span>ทีมไทยดูแล Bhutan Airlines</span><span>Visa & SDF จัดให้พร้อม</span><span>ใบอนุญาตนำเที่ยว 11/07261</span></div>
      </section>

      <section className="section package-section">
        <div className="page-container">
          <div className="section-heading"><div><span className="section-label">POPULAR JOURNEYS</span><h2>เลือกจากจำนวนวันที่มี<br/>แล้วค่อยปรับให้เป็นทริปของคุณ</h2></div><div><p>เริ่มจาก 4, 5 หรือ 6 วัน ดูราคาและเส้นทางให้เห็นภาพก่อน จากนั้นค่อยปรับโรงแรม กิจกรรม และรายละเอียดตามวันเดินทางจริง</p><Link href="/packages" className="text-link">ดูแพ็กเกจทั้งหมด <span>→</span></Link></div></div>
          <div className="package-grid">{packages.slice(0,3).map((item,index)=><PackageCard item={item} featured={index===1} key={item.slug}/>)}</div>
          <div className="package-section-cta"><div><strong>ยังเลือกจำนวนวันไม่ถูก?</strong><span>บอกวันเดินทางและจำนวนคน ทีมช่วยเทียบให้ได้</span></div><LineCta className="line-button">ให้ทีมช่วยเลือกแพ็กเกจ <span>→</span></LineCta></div>
        </div>
      </section>

      <section className="section philosophy-section">
        <div className="page-container philosophy-grid">
          <div className="philosophy-media"><img src={siteImages.tigerNest} alt="Paro Taktsang, Tiger's Nest in Bhutan"/><div className="media-caption"><span>PARO</span><strong>Tiger’s Nest</strong></div></div>
          <div className="philosophy-copy"><span className="section-label">WHY BHUTAN CENTER</span><h2>เรื่องยากให้เรา<br/>เรื่องเที่ยวให้เป็นของคุณ</h2><p>ทริปภูฏานมีทั้งเที่ยวบิน เอกสาร ค่าธรรมเนียม ที่พัก และเส้นทางบนภูเขา เราจึงดูทั้งหมดเป็นภาพเดียว เพื่อให้คุณตัดสินใจจากสิ่งที่สำคัญจริง ๆ: วันเดินทาง จำนวนคน และสไตล์ที่อยากเที่ยว</p><div className="reason-row"><span>01</span><div><strong>Private & Flexible</strong><p>เลือกวันเองและปรับจังหวะโปรแกรมให้เหมาะกับคนในทริป</p></div></div><div className="reason-row"><span>02</span><div><strong>One team, one journey</strong><p>ตั๋ว วีซ่า SDF โรงแรม ไกด์ รถ และเอกสาร อยู่ในทีมเดียวกัน</p></div></div><div className="reason-row"><span>03</span><div><strong>Bhutan specialist</strong><p>ประสบการณ์บนเส้นทางภูฏานช่วยให้คำแนะนำสอดคล้องกับการเดินทางจริง</p></div></div><Link href="/about-bhutan" className="text-link text-link--large">รู้จักภูฏานก่อนเดินทาง <span>→</span></Link></div>
        </div>
      </section>

      <section className="section services-section">
        <div className="page-container">
          <div className="center-heading"><span className="section-label">EVERYTHING IN ONE PLACE</span><h2>จองครั้งเดียว ดูแลครบทั้งทริป</h2><p>ลดความยุ่งยากจากการต้องประสานหลายที่ และเห็นภาพค่าใช้จ่ายกับขั้นตอนก่อนตัดสินใจ</p></div>
          <div className="service-grid">{services.map(([no,title,body])=><article key={no}><span>{no}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
        </div>
      </section>

      <section className="section airline-feature-section">
        <div className="page-container airline-feature">
          <div className="airline-feature-copy"><span className="section-label">BHUTAN AIRLINES · OFFICIAL GSA THAILAND</span><h2>Bangkok <em>↔</em> Paro</h2><p>OMG Experience เป็น General Sales Agent ของ Bhutan Airlines ในประเทศไทย ทีมเดียวกับ Bhutan Center จึงช่วยวางเที่ยวบินให้เข้ากับแพ็กเกจและวันเดินทางได้ตั้งแต่ต้น</p><div className="route-line"><div><small>BANGKOK</small><strong>BKK</strong></div><span>✈</span><div><small>PARO</small><strong>PBH</strong></div></div><Link href="/bhutan-airlines" className="gold-button">ดูข้อมูล Bhutan Airlines <span>↗</span></Link></div>
          <div className="airline-feature-media"><img src={siteImages.bhutanAirlinesParo} alt="Bhutan Airlines Airbus A319 at Paro Airport"/><div className="airline-photo-caption">Bhutan Airlines · Paro Airport</div></div>
        </div>
      </section>

      <section className="section destination-section-home">
        <div className="page-container">
          <div className="section-heading"><div><span className="section-label">DISCOVER BHUTAN</span><h2>4 พื้นที่หลัก<br/>ให้เลือกจังหวะของทริป</h2></div><div><p>พาโร ทิมพู พูนาคา และกังเต/โฟบจิกาให้บรรยากาศต่างกัน ตั้งแต่วัดบนหน้าผา เมืองหลวง ป้อมริมแม่น้ำ ไปจนถึงหุบเขาธรรมชาติ</p><Link href="/destinations" className="text-link">ดูสถานที่และภาพจริง <span>→</span></Link></div></div>
          <div className="city-list">{cities.map(([en,th,places,id],index)=><Link href={`/destinations#${id}`} className="city-row" key={en}><span className="city-index">0{index+1}</span><div><strong>{th}</strong><small>{en}</small></div><p>{places}</p><span className="city-arrow">↗</span></Link>)}</div>
          <div className="destination-peek-grid">
            <article><img src={siteImages.tigerNest} alt="Tiger’s Nest in Bhutan"/><div><small>PARO</small><strong>วัดทักซัง</strong></div></article>
            <article><img src={siteImages.thimphuDzong} alt="Tashichho Dzong in Bhutan"/><div><small>THIMPHU</small><strong>ทิมพู เมืองหลวง</strong></div></article>
            <article><img src={siteImages.phobjikhaValley} alt="Phobjikha Valley in Bhutan"/><div><small>GANGTEY</small><strong>หุบเขาโฟบจิกา</strong></div></article>
          </div>
        </div>
      </section>

      <section className="section planner-section">
        <div className="page-container planner-card">
          <div className="planner-copy"><span className="section-label section-label--light">GET A TRIP PLAN</span><h2>มีวันเดินทางแล้ว?<br/>เริ่มเช็กราคาได้เลย</h2><p>ส่งวันเดินทาง จำนวนคน และแพ็กเกจที่สนใจ ทีมจะช่วยจัดทางเลือกและยืนยันราคาตามวันที่ต้องการ</p><div className="planner-points"><span>Private 2+</span><span>Hotel 3–5 Star</span><span>Economy / Business</span></div></div>
          <BookingForm compact />
        </div>
      </section>
    </>
  );
}
