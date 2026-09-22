import Link from "next/link";
import { bhutanCityGuides, BhutanCitySlug, destinationPublicPath } from "@/lib/bhutan-city-guide";

export default function BhutanInteractiveMap({ active }: { active?: BhutanCitySlug }) {
  return (
    <div className="bhutan-map-shell">
      <div className="bhutan-map-copy">
        <span className="section-label">EXPLORE THE MAP</span>
        <h2>กดบนแผนที่<br/>แล้วไปดูแต่ละเมือง</h2>
        <p>เลือกเมืองที่สนใจเพื่อดูเรื่องราว บรรยากาศ จำนวนประชากรระดับเขต และสถานที่ท่องเที่ยวสำคัญของพื้นที่นั้น</p>
        <div className="bhutan-map-legend"><span></span> 4 พื้นที่หลักในเส้นทางยอดนิยม</div>
      </div>

      <div className="bhutan-map-stage">
        <img className="bhutan-map-image" src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Bhutan_location_map.svg" alt="แผนที่ประเทศภูฏาน" />
        {bhutanCityGuides.map((city) => (
          <Link
            key={city.slug}
            href={destinationPublicPath(city.slug)}
            className={`bhutan-map-marker ${active === city.slug ? "active" : ""}`}
            style={{ left: city.mapPosition.left, top: city.mapPosition.top }}
            aria-label={`ดูข้อมูล ${city.th}`}
          >
            <i></i><strong>{city.mapLabel}</strong><small>{city.th}</small>
          </Link>
        ))}
        <div className="bhutan-map-note">BHUTAN · Western & Central Highlights</div>
      </div>

      <div className="bhutan-map-mobile-list">
        {bhutanCityGuides.map((city) => (
          <Link key={city.slug} href={destinationPublicPath(city.slug)} className={active === city.slug ? "active" : ""}>
            <span>{city.mapLabel}</span><strong>{city.th}</strong><em>ดูเมืองนี้ →</em>
          </Link>
        ))}
      </div>
      <p className="bhutan-map-credit">Map base: NordNordWest / Wikimedia Commons · CC BY-SA 3.0</p>
    </div>
  );
}
