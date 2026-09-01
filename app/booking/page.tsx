import BookingForm from "@/components/BookingForm";
import { metadataForPath } from "@/lib/seo-config";
import { loadSeoState } from "@/lib/seo-store";

export async function generateMetadata(){const seo=await loadSeoState();return metadataForPath("/booking",seo.pages)}

export default async function BookingPage({searchParams}:{searchParams:Promise<{package?:string}>}){
  const query=await searchParams;
  return <>
    <section className="booking-hero">
      <div className="page-container booking-hero__inner">
        <span className="section-label">PLAN YOUR JOURNEY</span>
        <h1>เริ่มวางแผน<br/>ทริปภูฏานของคุณ</h1>
        <p>มีวันเดินทางแล้วก็ดี หรือยังไม่รู้ว่าจะเริ่มตรงไหนก็ได้ ส่งข้อมูลคร่าว ๆ มาให้เรา แล้วทีมจะช่วยจัดแพ็กเกจ เที่ยวบิน โรงแรม และเส้นทางให้เหมาะกับคุณ</p>
        <div className="booking-hero__trust"><span>Private Tour ตั้งแต่ 2 ท่าน</span><span>Flight · Visa · SDF · Hotel</span><span>ทีมภูฏานดูแลโดยตรง</span></div>
      </div>
    </section>

    <section className="booking-page-section">
      <div className="page-container booking-page-grid">
        <aside className="booking-aside">
          <div className="booking-how">
            <span className="section-label">HOW IT WORKS</span>
            <h2>ง่ายเพียง<br/>3 ขั้นตอน</h2>
            <div className="booking-step"><span>01</span><div><strong>ส่งข้อมูลคร่าว ๆ</strong><p>วันเดินทาง จำนวนคน และช่องทางติดต่อ</p></div></div>
            <div className="booking-step"><span>02</span><div><strong>ทีมจัดทางเลือกให้</strong><p>เลือกโปรแกรม เที่ยวบิน โรงแรม และกิจกรรมที่เหมาะ</p></div></div>
            <div className="booking-step"><span>03</span><div><strong>รับใบเสนอราคา</strong><p>พร้อมราคาและเงื่อนไขตามวันเดินทางจริง</p></div></div>
          </div>
          <div className="booking-help-card">
            <span>ไม่แน่ใจว่าจะเลือกอะไร?</span>
            <strong>เว้นช่องที่ไม่รู้ได้เลย</strong>
            <p>ทีมงานจะสอบถามเพิ่มเฉพาะข้อมูลที่จำเป็น ไม่ต้องกรอกทุกอย่างให้สมบูรณ์ตั้งแต่ครั้งแรก</p>
          </div>
        </aside>
        <div className="booking-form-card"><BookingForm defaultPackage={query.package??""}/></div>
      </div>
    </section>
  </>
}
