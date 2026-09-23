import PackageCard from "@/components/PackageCard";
import LineCta from "@/components/LineCta";
import { getPublicPackages } from "@/lib/pricing-source";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata(){const seo=await loadSeoState();return metadataForPath("/packages",seo.pages)}

export default async function PackagesPage(){
  const packages=await getPublicPackages();
  return <>
    <section
      style={{
        padding: "150px 0 54px",
        background: "linear-gradient(180deg,#fffdf9 0%,#f8f2e8 100%)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div className="page-container">
        <div style={{maxWidth:"850px"}}>
          <span className="section-label">PRIVATE BHUTAN · เริ่มต้น 2 ท่าน</span>
          <h1
            style={{
              margin:"0",
              color:"var(--ink)",
              fontSize:"clamp(46px,5vw,72px)",
              lineHeight:"1.08",
              fontWeight:500,
              letterSpacing:"-.04em",
            }}
          >
            เลือกแพ็กเกจที่เหมาะ<br/>
            <span style={{color:"var(--gold-dark)",fontWeight:400}}>กับวันของคุณ</span>
          </h1>
          <p
            style={{
              maxWidth:"720px",
              margin:"22px 0 0",
              color:"var(--muted)",
              fontSize:"16px",
              lineHeight:"1.8",
            }}
          >
            ทริปส่วนตัว 4–6 วัน เลือกวันเดินทางเองได้ และสามารถปรับโรงแรม กิจกรรม
            และรายละเอียดให้เหมาะกับคุณ
          </p>
        </div>
      </div>
    </section>
    <section className="section" style={{paddingTop:"68px"}}>
      <div className="page-container">
        <div className="package-grid package-grid--all">
          {packages.map((item,index)=><PackageCard item={item} featured={index===1} key={item.slug}/>)}
        </div>

        <p className="package-price-disclaimer">
          * ราคาแสดงเป็นราคาเริ่มต้นต่อท่าน และอาจเปลี่ยนตามวันเดินทาง จำนวนผู้เดินทาง
          เที่ยวบิน และโรงแรมที่เลือก ทีมงานจะยืนยันราคาอีกครั้งก่อนการจอง
        </p>

        <div
          style={{
            marginTop:"34px",
            padding:"26px 30px",
            border:"1px solid var(--line)",
            borderRadius:"24px",
            background:"#fffdf9",
            display:"flex",
            alignItems:"center",
            justifyContent:"space-between",
            gap:"24px",
            flexWrap:"wrap",
          }}
        >
          <div style={{minWidth:"260px",flex:"1 1 520px"}}>
            <strong style={{display:"block",color:"var(--ink)",fontSize:"20px",fontWeight:600}}>
              ยังเลือกไม่ถูกว่า 4, 5 หรือ 6 วันเหมาะกับคุณ?
            </strong>
            <span style={{display:"block",marginTop:"6px",color:"var(--muted)",fontSize:"14px",lineHeight:"1.65"}}>
              บอกวันเดินทางและจำนวนคน ให้ทีม Bhutan Center ช่วยแนะนำแพ็กเกจที่พอดีกับคุณได้
            </span>
          </div>
          <LineCta className="line-button">ให้ทีมช่วยเลือกแพ็กเกจ <span>→</span></LineCta>
        </div>
      </div>
    </section>
    <section className="section compare-section"><div className="page-container"><div className="center-heading"><span className="section-label">QUICK COMPARE</span><h2>เลือกแบบไหนเหมาะกับคุณ?</h2><p>ดูจากเวลาที่มีและความลึกของเส้นทางก่อน แล้วค่อยปรับรายละเอียดภายหลัง</p></div><div className="compare-table"><div className="compare-row compare-row--head"><span></span>{packages.map(p=><strong key={p.slug}>{p.days} วัน {p.nights} คืน</strong>)}</div><div className="compare-row"><span>เหมาะกับ</span>{packages.map(p=><p key={p.slug}>{p.audience}</p>)}</div><div className="compare-row"><span>เมือง</span>{packages.map(p=><p key={p.slug}>{p.cities.join(" · ")}</p>)}</div><div className="compare-row"><span>รูปแบบ</span>{packages.map(p=><p key={p.slug}>Private Tour</p>)}</div><div className="compare-row"><span>โรงแรม</span>{packages.map(p=><p key={p.slug}>{p.hotel}</p>)}</div></div></div></section>
  </>;
}
