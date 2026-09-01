import Link from "next/link";
import { formatTHB, TourPackage } from "@/lib/packages";
import { packagePublicPath } from "@/lib/public-paths";

export default function PackageCard({ item, featured = false }: { item: TourPackage; featured?: boolean }) {
  return (
    <Link
      href={packagePublicPath(item.slug)}
      className={`package-card ${featured ? "package-card--featured" : ""}`}
      aria-label={`ดูรายละเอียดแพ็กเกจ ${item.name}`}
    >
      <div className="package-card__media">
        <img src={item.image} alt={`${item.name} Bhutan tour`} />
        <span className="package-card__badge">{item.badge}</span>
      </div>

      <div className="package-card__content">
        <div className="package-card__meta">
          <span>{item.duration}</span>
          <i></i>
          <span>{item.cities.join(" · ")}</span>
        </div>

        <div className="package-card__title-row">
          <h3>{item.name}</h3>
          <span className="package-card__arrow">→</span>
        </div>

        <p>{item.shortDescription}</p>

        <div className="package-card__footer">
          <div className="package-card__price">
            <small>เริ่มต้น</small>
            <div>
              <strong>฿{formatTHB(item.priceFrom)}</strong>
              <span>/ ท่าน</span>
            </div>
          </div>

          <div className="package-card__cta">
            ดูรายละเอียดแพ็กเกจ
            <span>→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
