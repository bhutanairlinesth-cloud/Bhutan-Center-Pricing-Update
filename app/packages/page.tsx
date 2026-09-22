import PackageCard from "@/components/PackageCard";
import LineCta from "@/components/LineCta";
import { getPublicPackages } from "@/lib/pricing-source";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata(){const seo=await loadSeoState();return metadataForPath("/packages",seo.pages)}

export default async function PackagesPage(){
  const packages=await getPublicPackages();
  return <>
    <section className="inner-hero inner-hero--packages">
      <div className="page-container">
        <div className="inner-hero__topline">
          <span className="section-label">BHUTAN JOURNEYS</span>
          <span className="inner-hero__note">PRIVATE · FLEXIBLE · FROM 2 GUESTS</span>
        </div>
        <div className="inner-hero-grid">
          <div className="inner-hero__title">
            <h1>เลือกจำนวนวัน<br/><span>ที่พอดีกับคุณ</span></h1>
          </div>
          <div className="inner-hero__copy">
            <p>ราคาเริ่มต้นช่วยให้เห็นงบประมาณก่อนตัดสินใจ จากนั้นทีมจะยืนยันราคาตามวันเดินทาง จำนวนผู้เดินทาง เที่ยวบิน และระดับโรงแรมที่เลือก</p>
            <div className="inner-hero__pills">
              <span>4 วัน 3 คืน</span>
              <span>5 วัน 4 คืน</span>
              <span>6 วัน 5 คืน</span>
            </div>
            <LineCta className="packages-hero-line">ยังเลือกไม่ถูก? ให้ทีมช่วยเทียบให้ <span>→</span></LineCta>
          </div>
        </div>
      </div>
    </section>
    <section className="section"><div className="page-container"><div className="package-grid package-grid--all">{packages.map((item,index)=><PackageCard item={item} featured={index===1} key={item.slug}/>)}</div><p className="package-price-disclaimer">* ราคาแสดงเป็นราคาเริ่มต้นต่อท่าน และอาจเปลี่ยนตามวันเดินทาง จำนวนผู้เดินทาง เที่ยวบิน และโรงแรมที่เลือก ทีมงานจะยืนยันราคาอีกครั้งก่อนการจอง</p></div></section>
    <section className="section compare-section"><div className="page-container"><div className="center-heading"><span className="section-label">QUICK COMPARE</span><h2>เลือกแบบไหนเหมาะกับคุณ?</h2><p>ดูจากเวลาที่มีและความลึกของเส้นทางก่อน แล้วค่อยปรับรายละเอียดภายหลัง</p></div><div className="compare-table"><div className="compare-row compare-row--head"><span></span>{packages.map(p=><strong key={p.slug}>{p.days} วัน {p.nights} คืน</strong>)}</div><div className="compare-row"><span>เหมาะกับ</span>{packages.map(p=><p key={p.slug}>{p.audience}</p>)}</div><div className="compare-row"><span>เมือง</span>{packages.map(p=><p key={p.slug}>{p.cities.join(" · ")}</p>)}</div><div className="compare-row"><span>รูปแบบ</span>{packages.map(p=><p key={p.slug}>Private Tour</p>)}</div><div className="compare-row"><span>โรงแรม</span>{packages.map(p=><p key={p.slug}>{p.hotel}</p>)}</div></div><div className="compare-cta"><div><strong>ถ้ามีวันเดินทางแล้ว ให้ทีมเช็กราคาจริงได้เลย</strong><span>ใช้เพียงวันเดินทาง จำนวนคน และระดับโรงแรมที่ต้องการ</span></div><LineCta className="line-button">ขอราคาใน LINE <span>→</span></LineCta></div></div></section>
  </>;
}
