"use client";

import { FormEvent, useState } from "react";
import LineCta from "./LineCta";
import { trackPublicEvent } from "./AnalyticsTracker";

export default function BookingForm({ compact = false, defaultPackage = "" }: { compact?: boolean; defaultPackage?: string }) {
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/leads", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
      if (!response.ok) throw new Error("submit failed");
      const packageSlug = String(payload.package_slug || defaultPackage || "");
      trackPublicEvent("lead_submit", { package_slug: packageSlug || undefined });
      const w = window as any;
      if (w.fbq) w.fbq("track", "Lead", packageSlug ? { content_name: packageSlug } : undefined);
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="form-success">
        <span className="form-success__icon">✓</span>
        <strong>ส่งข้อมูลเรียบร้อย</strong>
        <p>ทีม Bhutan Center จะติดต่อกลับเพื่อช่วยวางแผนการเดินทางของคุณ</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div>
        <div className="line-first-panel">
          <div><h3>คุยกับทีมเราใน LINE ได้เลย</h3><p>ช่องทางหลักสำหรับสอบถามวันเดินทาง ราคา โรงแรม และรายละเอียดทริป</p></div>
          <LineCta packageSlug={defaultPackage} />
        </div>
        <form className="booking-form booking-form--compact" onSubmit={submit}>
        <div className="form-field"><label htmlFor="compact-name">ชื่อ–นามสกุล</label><input id="compact-name" name="name" placeholder="ชื่อผู้ติดต่อ" required /></div>
        <div className="form-field"><label htmlFor="compact-date">วันที่อยากเดินทาง</label><input id="compact-date" name="travel_date" type="date" /></div>
        <div className="form-field"><label htmlFor="compact-pax">จำนวนผู้เดินทาง</label><input id="compact-pax" name="pax" type="number" min="1" placeholder="เช่น 4" /></div>
        <div className="form-field"><label htmlFor="compact-contact">โทรศัพท์ / LINE</label><input id="compact-contact" name="contact" placeholder="เบอร์โทรหรือ LINE ID" required /></div>
        <button className="form-submit form-submit--compact" type="submit" disabled={status === "sending"}>{status === "sending" ? "กำลังส่ง..." : <>ให้ทีมช่วยวางแผน <span>→</span></>}</button>
        {status === "error" && <p className="form-status form-status--error">ส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้งหรือติดต่อทีมงานทาง LINE</p>}
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="line-first-panel">
        <div><h3>LINE คือช่องทางหลักของเรา</h3><p>ถ้าต้องการคุยรายละเอียดทันที กด LINE ได้เลย ส่วนแบบฟอร์มด้านล่างใช้กรณีต้องการฝากข้อมูลให้ทีมติดต่อกลับ</p></div>
        <LineCta packageSlug={defaultPackage} />
      </div>
      <form className="booking-form booking-form--full" onSubmit={submit}>
      <div className="booking-form__heading">
        <span>TRIP DETAILS</span>
        <h2>ข้อมูลสำหรับวางแผนทริป</h2>
        <p>กรอกเท่าที่ทราบได้เลย หากยังไม่แน่ใจบางข้อ ทีมงานช่วยแนะนำให้ภายหลังได้</p>
      </div>

      <section className="form-section">
        <div className="form-section__title"><span>01</span><div><strong>ข้อมูลผู้ติดต่อ</strong><small>สำหรับส่งรายละเอียดและใบเสนอราคา</small></div></div>
        <div className="form-grid">
          <div className="form-field"><label htmlFor="name">ชื่อ–นามสกุล <b>*</b></label><input id="name" name="name" placeholder="ชื่อผู้ติดต่อ" required /></div>
          <div className="form-field"><label htmlFor="contact">โทรศัพท์ / LINE <b>*</b></label><input id="contact" name="contact" placeholder="เบอร์โทรหรือ LINE ID" required /></div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section__title"><span>02</span><div><strong>วันเดินทางและจำนวนคน</strong><small>ใช้สำหรับคำนวณราคาและจัดเส้นทาง</small></div></div>
        <div className="form-grid form-grid--three">
          <div className="form-field"><label htmlFor="travel_date">วันที่อยากเดินทาง</label><input id="travel_date" name="travel_date" type="date" /></div>
          <div className="form-field"><label htmlFor="adults">ผู้ใหญ่</label><input id="adults" name="adults" type="number" min="1" defaultValue="2" /></div>
          <div className="form-field"><label htmlFor="children">เด็ก</label><input id="children" name="children" type="number" min="0" defaultValue="0" /></div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section__title"><span>03</span><div><strong>รูปแบบทริปที่สนใจ</strong><small>เลือกคร่าว ๆ ก่อน แล้วปรับรายละเอียดภายหลังได้</small></div></div>
        <div className="form-grid">
          <div className="form-field form-field--wide"><label htmlFor="package_slug">แพ็กเกจที่สนใจ</label><select id="package_slug" name="package_slug" defaultValue={defaultPackage}><option value="">ยังไม่แน่ใจ / ให้ทีมแนะนำ</option><option value="journey-to-bhutan">Journey to Bhutan · 4 วัน 3 คืน</option><option value="wonders-of-bhutan">Wonders of Bhutan · 5 วัน 4 คืน</option><option value="the-ultimate-bhutan">The Ultimate Bhutan · 6 วัน 5 คืน</option><option value="custom">ออกแบบทริปใหม่</option></select></div>
          <div className="form-field"><label htmlFor="hotel_level">ระดับโรงแรม</label><select id="hotel_level" name="hotel_level" defaultValue="3"><option value="3">Tourist Class / 3-star</option><option value="4">4-star</option><option value="5">5-star / Luxury</option><option value="custom">ให้ทีมแนะนำ</option></select></div>
          <div className="form-field"><label htmlFor="cabin_class">ชั้นโดยสาร</label><select id="cabin_class" name="cabin_class" defaultValue="economy"><option value="economy">Economy Class</option><option value="business">Business Class</option></select></div>
          <div className="form-field form-field--wide"><label htmlFor="note">รายละเอียดเพิ่มเติม <span>ไม่บังคับ</span></label><textarea id="note" name="note" rows={5} placeholder="เช่น มีผู้สูงอายุ อยากพักโรงแรมเฉพาะ ต้องการเพิ่มกิจกรรม หรือมีข้อจำกัดด้านอาหาร" /></div>
        </div>
      </section>

      <div className="form-action">
        <div><strong>พร้อมให้เราช่วยวางแผน</strong><p>ทีมงานจะนำข้อมูลนี้ไปจัดทางเลือกและราคาให้เหมาะกับวันเดินทางจริง</p></div>
        <button className="form-submit" type="submit" disabled={status === "sending"}>{status === "sending" ? "กำลังส่ง..." : <>ส่งข้อมูลให้ทีมงาน <span>→</span></>}</button>
      </div>

      {status === "error" && <p className="form-status form-status--error">ส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้งหรือติดต่อทีมงานทาง LINE</p>}
      </form>
    </div>
  );
}
