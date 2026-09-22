import Link from "next/link";
import LineCta from "@/components/LineCta";
import BhutanInteractiveMap from "@/components/BhutanInteractiveMap";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";
import { bhutanCityGuides, destinationPublicPath } from "@/lib/bhutan-city-guide";

export async function generateMetadata() {
  const seo = await loadSeoState();
  return metadataForPath("/destinations", seo.pages);
}

export default function DestinationsPage() {
  return (
    <>
      <section className="inner-hero destination-sales-hero">
        <div className="page-container inner-hero-grid">
          <div>
            <span className="section-label">DISCOVER BHUTAN</span>
            <h1>แต่ละเมือง<br/><em>ให้ความรู้สึกไม่เหมือนกัน</em></h1>
          </div>
          <div className="inner-hero__copy">
            <p>เริ่มจากแผนที่ เลือกเมืองที่อยากรู้จัก แล้วค่อยดูว่าเส้นทาง 4, 5 หรือ 6 วันแบบไหนเหมาะกับสิ่งที่คุณอยากเห็น</p>
            <Link href="/packagetour-bhutan-new" className="gold-button">เทียบแพ็กเกจ 4–6 วัน <span>↗</span></Link>
          </div>
        </div>
      </section>

      <section className="section bhutan-map-section">
        <div className="page-container"><BhutanInteractiveMap /></div>
      </section>

      <section className="section destination-overview-section">
        <div className="page-container">
          <div className="section-intro">
            <span className="eyebrow">DESTINATION OVERVIEW</span>
            <h2>เลือกอารมณ์ของทริป<br/>ก่อนค่อยเลือกจำนวนวัน</h2>
            <p>พาโร ทิมพู พูนาคา และกังเต/โฟบจิกาให้อารมณ์ต่างกันชัดเจน กดเมืองที่สนใจเพื่อดูประวัติย่อ จำนวนประชากรระดับเขต และสถานที่เที่ยวสำคัญ</p>
          </div>
          <div className="destination-glance-grid">
            {bhutanCityGuides.map((city) => (
              <Link key={city.slug} href={destinationPublicPath(city.slug)} className="destination-glance-card">
                <img src={city.hero} alt={`${city.en}, Bhutan`} />
                <div><small>{city.en.toUpperCase()}</small><strong>{city.th}</strong><p>{city.mood}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-container destination-editorial-list">
          {bhutanCityGuides.map((city, index) => (
            <article id={city.slug} className="destination-editorial" key={city.slug}>
              <div className="destination-editorial-media">
                <img src={city.hero} alt={`${city.en}, Bhutan`} />
                <span>0{index + 1}</span>
                <div className="destination-photo-label"><small>{city.en.toUpperCase()}</small><strong>{city.attractions[0].name}</strong></div>
              </div>
              <div className="destination-editorial-copy">
                <small>{city.en.toUpperCase()}</small>
                <h2>{city.th}</h2>
                <p>{city.summary}</p>
                <div className="destination-mood-badge">{city.status}</div>
                <strong>{city.attractions.slice(0, 3).map((item) => item.name).join(" · ")}</strong>
                <ul className="destination-bullet-list">{city.bestFor.map((item) => <li key={item}>{item}</li>)}</ul>
                <div className="destination-actions">
                  <Link href={destinationPublicPath(city.slug)} className="text-link">ดูข้อมูลเมืองและที่เที่ยว <span>→</span></Link>
                  <LineCta className="destination-line-link">ถามทีมเรื่องเมืองนี้ทาง LINE</LineCta>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section destination-final-cta">
        <div className="page-container callout">
          <div><h2>อยากไปหลายเมือง แต่ไม่รู้กี่วันดี?</h2><p>ส่งรายชื่อเมืองหรือสถานที่ที่อยากไป ทีมจะช่วยจัดจำนวนวันและลำดับเส้นทางให้เหมาะกับเวลาจริง</p></div>
          <LineCta className="button button--gold">ให้ทีมช่วยจัดเส้นทาง <span>→</span></LineCta>
        </div>
      </section>
    </>
  );
}
