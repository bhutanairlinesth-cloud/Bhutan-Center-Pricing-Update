import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import BookingForm from "@/components/BookingForm";
import LineCta from "@/components/LineCta";
import { formatTHB } from "@/lib/packages";
import { getPublicPackages } from "@/lib/pricing-source";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";
import { siteImages } from "@/lib/site-images";

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

const experiences = [
  {
    tag: "ICONIC",
    title: "Tiger’s Nest",
    thai: "วัดทักซังบนหน้าผา",
    body: "แลนด์มาร์กระดับสัญลักษณ์ของภูฏาน เป็นทั้งเส้นทางเดินเขาและประสบการณ์ทางจิตวิญญาณในวันเดียว",
    image: siteImages.tigerNest,
    href: "/destinations#paro",
  },
  {
    tag: "CULTURE",
    title: "Tshechu Festival",
    thai: "เทศกาลระบำหน้ากาก",
    body: "สีสัน ความศรัทธา และการรวมตัวของผู้คนท้องถิ่น ทำให้การเดินทางตรงช่วงเทศกาลมีบรรยากาศพิเศษกว่าปกติ",
    image: siteImages.maskedDance,
    href: "/journal",
  },
  {
    tag: "WELLNESS",
    title: "Hot Stone Bath",
    thai: "แช่น้ำร้อนหินแบบภูฏาน",
    body: "ประสบการณ์พักกายหลังวันเดินทาง ใช้หินแม่น้ำร้อนและสมุนไพรตามวิถีดั้งเดิมของภูฏาน",
    image: siteImages.hotStoneBath,
    href: "/contact",
  },
  {
    tag: "LIVING CULTURE",
    title: "Traditional Archery",
    thai: "ยิงธนูแบบภูฏาน",
    body: "กีฬาประจำชาติที่ยังอยู่ในชีวิตประจำวัน ช่วยให้เห็นภูฏานในมุมที่มีชีวิตมากกว่าการชมสถานที่",
    image: siteImages.traditionalArchery,
    href: "/about-bhutan",
  },
];

const seasons = [
  { season: "SPRING", months: "มี.ค. – พ.ค.", title: "ดอกไม้และอากาศสบาย", body: "เหมาะกับคนที่อยากได้สีสันของธรรมชาติ อากาศกำลังดี และกิจกรรมกลางแจ้ง" },
  { season: "SUMMER", months: "มิ.ย. – ส.ค.", title: "ภูเขาเขียวและน้ำตก", body: "ช่วงภูมิประเทศเขียวสด นาข้าวและน้ำตกเด่น เหมาะกับคนที่ชอบธรรมชาติแบบชุ่มฉ่ำ" },
  { season: "AUTUMN", months: "ก.ย. – พ.ย.", title: "ฟ้าใสและเทศกาล", body: "หนึ่งในช่วงยอดนิยม อากาศดี ทัศนวิสัยชัด และมีเทศกาลสำคัญหลายงาน", featured: true },
  { season: "WINTER", months: "ธ.ค. – ก.พ.", title: "อากาศเย็นและวิวภูเขา", body: "ท้องฟ้ามักเปิด เหมาะกับการถ่ายภาพและคนที่ชอบบรรยากาศเงียบสงบ" },
];

const firstTimer = [
  { no: "01", title: "Visa", value: "US$40", body: "ค่าธรรมเนียมยื่นวีซ่าแบบครั้งเดียว และคำขอที่กรอกครบถ้วนใช้เวลาพิจารณาได้ถึง 5 วันทำการ" },
  { no: "02", title: "SDF", value: "US$100 / วัน", body: "อัตราสำหรับผู้ใหญ่ตามข้อมูลทางการปัจจุบัน เป็นส่วนหนึ่งของแนวทางท่องเที่ยวเพื่อการอนุรักษ์และพัฒนาประเทศ" },
  { no: "03", title: "Bhutan Center", value: "1 ทีมดูแล", body: "แพ็กเกจของเรารวมงานหลักอย่างเที่ยวบิน วีซ่า SDF โรงแรม ไกด์ รถ และรายละเอียดก่อนเดินทางไว้ในทีมเดียว" },
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
            <div className="hero-trust"><div><strong>4–6</strong><span>วัน · เลือกให้พอดีกับเวลา</span></div><div><strong>2013</strong><span>เริ่มดูแลเส้นทางภูฏาน</span></div><div><strong>1 ทีม</strong><span>Flight · Visa · Land</span></div></div>
          </div>

          <div className="home-hero-visual">
            <div className="hero-main-photo">
              <img src={siteImages.punakhaDzong} alt="Punakha Dzong in Punakha, Bhutan" />
              <div className="hero-route-pill"><span>BKK</span><i></i><span>PBH</span><small>Bhutan Airlines</small></div>
              <div className="hero-photo-caption"><small>PUNAKHA</small><strong>Punakha Dzong</strong></div>
              <nav className="hero-place-nav" aria-label="สถานที่ท่องเที่ยวภูฏาน">
                <Link href="/destinations#paro">Paro</Link>
                <Link href="/destinations#thimphu">Thimphu</Link>
                <Link className="active" href="/destinations#punakha">Punakha</Link>
                <Link href="/destinations#gangtey">Gangtey</Link>
              </nav>
            </div>
          </div>
        </div>
      </section>

      <section className="confidence-strip">
        <div className="page-container confidence-grid"><span>เที่ยวส่วนตัวตั้งแต่ 2 ท่าน</span><span>ทีมไทยดูแล Bhutan Airlines</span><span>Visa & SDF จัดให้พร้อม</span><span>ใบอนุญาตนำเที่ยว 11/07261</span></div>
      </section>

      <section className="section why-bhutan-section">
        <div className="page-container why-bhutan-grid">
          <div className="why-bhutan-copy">
            <span className="section-label">WHY BHUTAN</span>
            <h2>ภูฏานไม่ได้มีแค่<br/>วัดทักซัง</h2>
            <p>เสน่ห์ของภูฏานอยู่ที่การได้ใช้เวลาอยู่กับธรรมชาติ วัฒนธรรม และความสงบในจังหวะเดียวกัน จากเมืองเล็กบนหุบเขา ไปจนถึงพิธีกรรมที่ยังอยู่ในชีวิตประจำวัน</p>
            <Link href="/about-bhutan" className="text-link text-link--large">รู้จักภูฏานให้มากขึ้น <span>→</span></Link>
          </div>
          <div className="why-bhutan-facts">
            <article><strong>70%+</strong><span>พื้นที่ประเทศปกคลุมด้วยป่า</span></article>
            <article><strong>4 ฤดู</strong><span>เที่ยวได้ตลอดปี แต่ละช่วงให้บรรยากาศต่างกัน</span></article>
            <article><strong>160+</strong><span>เทศกาลทั่วประเทศในหนึ่งปี</span></article>
            <article><strong>High value</strong><span>การท่องเที่ยวที่ให้ความสำคัญกับธรรมชาติ วัฒนธรรม และชุมชน</span></article>
          </div>
        </div>
      </section>

      <section className="section experience-section">
        <div className="page-container">
          <div className="section-heading experience-heading">
            <div><span className="section-label">SIGNATURE EXPERIENCES</span><h2>ไปภูฏานแล้ว<br/>อยากให้คุณได้ “สัมผัส” มากกว่าดู</h2></div>
            <div><p>นอกจากแลนด์มาร์กสำคัญ ยังมีประสบการณ์ที่ทำให้ทริปมีเรื่องเล่าและความทรงจำเฉพาะตัว</p></div>
          </div>
          <div className="experience-grid">
            {experiences.map((item) => (
              <Link href={item.href} className="experience-card" key={item.title}>
                <div className="experience-card__media"><img src={item.image} alt={`${item.title} in Bhutan`} /></div>
                <div className="experience-card__body"><small>{item.tag}</small><h3>{item.thai}</h3><strong>{item.title}</strong><p>{item.body}</p><span>ดูรายละเอียด <b>↗</b></span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section package-section">
        <div className="page-container">
          <div className="section-heading"><div><span className="section-label">POPULAR JOURNEYS</span><h2>เลือกจากจำนวนวันที่มี<br/>แล้วค่อยปรับให้เป็นทริปของคุณ</h2></div><div><p>เริ่มจาก 4, 5 หรือ 6 วัน ดูราคาและเส้นทางให้เห็นภาพก่อน จากนั้นค่อยปรับโรงแรม กิจกรรม และรายละเอียดตามวันเดินทางจริง</p><Link href="/packages" className="text-link">ดูแพ็กเกจทั้งหมด <span>→</span></Link></div></div>
          <div className="package-grid">{packages.slice(0,3).map((item,index)=><PackageCard item={item} featured={index===1} key={item.slug}/>)}</div>
          <div className="package-section-cta"><div><strong>ยังเลือกจำนวนวันไม่ถูก?</strong><span>บอกวันเดินทางและจำนวนคน ทีมช่วยเทียบให้ได้</span></div><LineCta className="line-button">ให้ทีมช่วยเลือกแพ็กเกจ <span>→</span></LineCta></div>
        </div>
      </section>

      <section className="section season-section">
        <div className="page-container">
          <div className="section-heading season-heading"><div><span className="section-label">BEST TIME TO VISIT</span><h2>คุณอยากเห็นภูฏาน<br/>ในฤดูไหน?</h2></div><div><p>ภูฏานเที่ยวได้ตลอดปี เลือกช่วงเวลาให้เข้ากับภาพของทริปที่คุณอยากได้ แล้วให้ทีมช่วยจับคู่กับแพ็กเกจและเทศกาล</p><LineCta className="text-link">ถามทีมว่าช่วงไหนเหมาะกับคุณ <span>→</span></LineCta></div></div>
          <div className="season-grid">
            {seasons.map((item) => (
              <article className={`season-card${item.featured ? " season-card--featured" : ""}`} key={item.season}>
                <div><small>{item.season}</small><span>{item.months}</span></div><h3>{item.title}</h3><p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section festival-section">
        <div className="page-container festival-card">
          <div className="festival-media"><img src={siteImages.maskedDance} alt="Bhutanese masked dance during a festival" /></div>
          <div className="festival-copy">
            <span className="section-label section-label--light">FESTIVAL JOURNEYS</span>
            <h2>เที่ยวให้ตรงเทศกาล<br/>จะได้เห็นภูฏานมีชีวิต</h2>
            <p>ภูฏานมีเทศกาลมากกว่า 160 งานต่อปี ตั้งแต่ Paro Tshechu และ Thimphu Tshechu ไปจนถึงเทศกาลท้องถิ่นในหุบเขาต่าง ๆ วันที่จัดเปลี่ยนตามปฏิทินจันทรคติในแต่ละปี</p>
            <div className="festival-tags"><span>Paro Tshechu</span><span>Thimphu Tshechu</span><span>Black-necked Crane Festival</span></div>
            <LineCta className="gold-button">ให้ทีมเช็กเทศกาลตรงวันเดินทาง <span>↗</span></LineCta>
          </div>
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
        </div>
      </section>

      <section className="section first-timer-section">
        <div className="page-container">
          <div className="center-heading"><span className="section-label">FIRST TIME IN BHUTAN</span><h2>ไปภูฏานครั้งแรก<br/>รู้แค่นี้ก็เริ่มวางแผนได้</h2><p>ข้อมูลสำคัญที่มักเป็นคำถามก่อนจอง เราสรุปให้สั้นและเชื่อมต่อกับทีมที่ช่วยจัดการให้คุณได้</p></div>
          <div className="first-timer-grid">
            {firstTimer.map((item) => <article key={item.no}><span>{item.no}</span><small>{item.title}</small><strong>{item.value}</strong><p>{item.body}</p></article>)}
          </div>
          <div className="first-timer-note"><div><strong>ไม่อยากจัดการหลายขั้นตอนเอง?</strong><span>แพ็กเกจของ Bhutan Center รวมงานหลักที่จำเป็นต่อการเดินทางไว้ให้ทีมเดียวดูแล</span></div><Link href="/visa" className="text-link">ดูข้อมูล Visa & SDF <span>→</span></Link></div>
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
