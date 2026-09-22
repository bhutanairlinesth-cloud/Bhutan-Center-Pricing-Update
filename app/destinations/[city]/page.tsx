import Link from "next/link";
import { notFound } from "next/navigation";
import LineCta from "@/components/LineCta";
import BhutanInteractiveMap from "@/components/BhutanInteractiveMap";
import { bhutanCityGuideBySlug, bhutanCityGuides, BhutanCitySlug, destinationPublicPath } from "@/lib/bhutan-city-guide";

export function generateStaticParams() {
  return bhutanCityGuides.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const guide = bhutanCityGuideBySlug[city as BhutanCitySlug];
  if (!guide) return {};
  return {
    title: `${guide.th} (${guide.en}) | เที่ยวภูฏาน | Bhutan Center`,
    description: `รู้จัก${guide.th} ประวัติ บรรยากาศ จำนวนประชากรระดับเขต และสถานที่ท่องเที่ยวสำคัญ พร้อมวางแผนทริปภูฏานกับ Bhutan Center`,
  };
}

export default async function BhutanCityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const guide = bhutanCityGuideBySlug[city as BhutanCitySlug];
  if (!guide) notFound();

  return (
    <>
      <section className="city-guide-hero">
        <img src={guide.hero} alt={`${guide.en}, Bhutan`} />
        <div className="city-guide-hero-overlay"></div>
        <div className="page-container city-guide-hero-content">
          <Link href="/bhutan-attractions" className="city-guide-back">← เที่ยวภูฏาน</Link>
          <span className="section-label section-label--light">{guide.eyebrow}</span>
          <h1>{guide.th}<small>{guide.en}</small></h1>
          <p>{guide.summary}</p>
          <div className="city-guide-hero-actions">
            <LineCta className="gold-button">ถามทีมเรื่อง{guide.th} <span>→</span></LineCta>
            <Link href="/packagetour-bhutan-new" className="button button--light">ดูแพ็กเกจภูฏาน</Link>
          </div>
        </div>
      </section>

      <section className="city-guide-facts-section">
        <div className="page-container city-guide-facts">
          <div><small>สถานะของพื้นที่</small><strong>{guide.status}</strong></div>
          <div><small>ประชากรเขต · 2025</small><strong>{guide.population2025.toLocaleString("en-US")} คน</strong><em>{guide.populationLabel}</em></div>
          <div><small>บรรยากาศ</small><strong>{guide.mood}</strong></div>
          <div><small>เวลาที่แนะนำ</small><strong>{guide.recommendedStay}</strong></div>
        </div>
        <p className="city-guide-pop-note">* ตัวเลขประชากรเป็นประมาณการระดับ Dzongkhag ปี 2025 จาก National Statistics Bureau of Bhutan ไม่ใช่ประชากรเฉพาะเขตเมือง</p>
      </section>

      <section className="section city-guide-story-section">
        <div className="page-container city-guide-story-grid">
          <div>
            <span className="section-label">STORY OF THE PLACE</span>
            <h2>ทำความรู้จัก{guide.th}<br/>ก่อนออกเดินทาง</h2>
          </div>
          <div className="city-guide-story-copy">
            <p>{guide.history}</p>
            <div className="city-guide-bestfor"><small>เหมาะกับ</small>{guide.bestFor.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
        </div>
      </section>

      <section className="section city-attractions-section">
        <div className="page-container">
          <div className="section-heading"><div><span className="section-label">PLACES TO SEE</span><h2>ที่เที่ยวที่ควรอยู่<br/>ในทริป{guide.th}</h2></div><div><p>คัดเฉพาะจุดที่ช่วยให้เข้าใจอารมณ์ของเมือง ไม่จำเป็นต้องเก็บทุกแห่งในวันเดียว ทีมสามารถจัดลำดับตามจำนวนวันและจังหวะการเดินทางของคุณ</p></div></div>
          <div className="city-attraction-grid">
            {guide.attractions.map((place, index) => (
              <article className="city-attraction-card" key={place.name}>
                <span>0{index + 1}</span>
                <small>{place.subtitle}</small>
                <h3>{place.name}</h3>
                <p>{place.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section city-map-section">
        <div className="page-container"><BhutanInteractiveMap active={guide.slug} /></div>
      </section>

      <section className="section city-guide-more-section">
        <div className="page-container">
          <div className="section-heading"><div><span className="section-label">KEEP EXPLORING</span><h2>ดูเมืองอื่น<br/>ในเส้นทางเดียวกัน</h2></div></div>
          <div className="city-guide-more-grid">
            {bhutanCityGuides.filter((item) => item.slug !== guide.slug).map((item) => (
              <Link href={destinationPublicPath(item.slug)} key={item.slug}>
                <img src={item.hero} alt={item.en} />
                <div><small>{item.en.toUpperCase()}</small><strong>{item.th}</strong><span>{item.mood}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
