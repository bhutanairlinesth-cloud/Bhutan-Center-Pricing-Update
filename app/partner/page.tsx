import type { Metadata } from "next";

export const metadata: Metadata = { title: "Travel Agent / Partner" };
export default function PartnerPage(){return <>
  <section className="page-hero"><div className="container"><span className="breadcrumbs">B2B / Travel Agent</span><h1>Bhutan for<br/>travel partners.</h1><p>พื้นที่สำหรับบริษัททัวร์และพันธมิตร แยกจากหน้าลูกค้าทั่วไป เพื่อให้การขอราคา Agent และการประสานงานชัดเจนขึ้น</p></div></section>
  <section className="section"><div className="container callout"><div><h2>Agent / Wholesale pricing</h2><p>เมื่อเชื่อม Bhutan Pricing แล้ว หน้านี้สามารถส่งคำขอเข้าสู่ Price Channel “Agent / Wholesale” โดยไม่เปิดราคา Agent ต่อสาธารณะ</p></div><a className="button button--gold" href="mailto:info@omgexp.com">ติดต่อทีม Partner <span>→</span></a></div></section>
</>}
