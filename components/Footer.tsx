"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "./BrandMark";
import LineCta from "./LineCta";
import { publicPaths } from "@/lib/public-paths";

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="site-footer">
      <div className="page-container footer-top">
        <div className="footer-message">
          <span className="section-label section-label--light">BHUTAN CENTER</span>
          <h2>เริ่มต้นทริปภูฏาน<br/>ด้วยบทสนทนาง่าย ๆ</h2>
          <p>บอกวันที่ จำนวนคน และสิ่งที่อยากได้จากทริป ที่เหลือให้ทีมเราช่วยจัดการ</p>
          <LineCta className="footer-button">คุยกับเราทาง LINE <span>↗</span></LineCta>
        </div>
        <div className="footer-links-grid">
          <div><strong>TRAVEL</strong><Link href={publicPaths.packages}>แพ็กเกจภูฏาน</Link><Link href={publicPaths.destinations}>สถานที่ท่องเที่ยว</Link><Link href={publicPaths.hotels}>โรงแรม</Link><Link href={publicPaths.journal}>บทความ</Link></div>
          <div><strong>SERVICE</strong><Link href="/bhutan-airlines">Bhutan Airlines</Link><Link href={publicPaths.visa}>Visa & SDF</Link><Link href={publicPaths.travelInfo}>ก่อนเดินทาง</Link><Link href="/partner">Travel Agent</Link></div>
          <div><strong>CONTACT</strong><a href="tel:+6626304500">+66 2 630 4500</a><a href="mailto:info@omgexp.com">info@omgexp.com</a><p>52/13 ชั้น 5 สีลมคอนโด<br/>ซอยศาลาแดง 2 สีลม บางรัก<br/>กรุงเทพฯ 10500</p></div>
        </div>
      </div>
      <div className="page-container footer-bottom"><BrandMark light/><span>© {new Date().getFullYear()} OMG Experience Co., Ltd.</span><span>ใบอนุญาตนำเที่ยว 11/07261</span></div>
    </footer>
  );
}
