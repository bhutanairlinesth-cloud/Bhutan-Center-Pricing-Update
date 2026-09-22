import type { Metadata } from "next";

export const metadata: Metadata = { title: "Travel Agent / Partner" };
export default function PartnerPage(){return <>
  <section className="page-hero"><div className="container"><span className="breadcrumbs">B2B / Travel Agent</span><h1>Bhutan solutions<br/>for travel partners.</h1><p>สำหรับบริษัททัวร์และพันธมิตรที่ต้องการราคา Agent, เที่ยวบิน Bhutan Airlines และการจัด Land Package ภูฏานแบบครบวงจร</p></div></section>
  <section className="section"><div className="container content-grid"><div className="info-card"><h3>Agent rates</h3><p>ขอราคาแพ็กเกจตามจำนวนวัน ระดับโรงแรม และจำนวนผู้เดินทาง พร้อมเงื่อนไขสำหรับพันธมิตร</p></div><div className="info-card"><h3>Bhutan Airlines</h3><p>ประสานเที่ยวบินผ่านทีม OMG Experience ซึ่งเป็น GSA ของ Bhutan Airlines ในประเทศไทย</p></div><div className="info-card"><h3>Operations support</h3><p>ทีมช่วยประสานเอกสาร วีซ่า SDF รถ ไกด์ โรงแรม และรายละเอียดหน้างานตามโปรแกรม</p></div></div></section>
  <section className="section section--white"><div className="container callout"><div><h2>ต้องการ Agent / Wholesale rate?</h2><p>ส่งช่วงวันเดินทาง จำนวนผู้เดินทาง จำนวนคืน และระดับโรงแรมที่ต้องการให้ทีม Partner ประเมินราคาได้เลย</p></div><a className="button button--gold" href="mailto:info@omgexp.com">ติดต่อทีม Partner <span>→</span></a></div></section>
</>}
