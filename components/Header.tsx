"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import BrandMark from "./BrandMark";
import LineCta from "./LineCta";
import { publicPaths } from "@/lib/public-paths";

const nav = [
  { href: publicPaths.packages, label: "แพ็กเกจ" },
  { href: publicPaths.destinations, label: "เที่ยวภูฏาน" },
  { href: "/bhutan-airlines", label: "Bhutan Airlines" },
  { href: publicPaths.hotels, label: "โรงแรม" },
  { href: publicPaths.travelInfo, label: "ก่อนเดินทาง" },
  { href: publicPaths.journal, label: "บทความ" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link href="/" className="nav-brand" onClick={() => setOpen(false)} aria-label="Bhutan Center home">
          <BrandMark />
        </Link>
        <nav className={`nav-main ${open ? "open" : ""}`} aria-label="Main navigation">
          {nav.map((item) => <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}
          <Link className="nav-mobile-contact" href={publicPaths.contact} onClick={() => setOpen(false)}>ติดต่อเรา</Link>
        </nav>
        <div className="nav-actions">
          <Link className="nav-contact" href={publicPaths.contact}>ติดต่อเรา</Link>
          <LineCta className="gold-button gold-button--nav">LINE ปรึกษาทริป <span>↗</span></LineCta>
          <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="เปิดเมนู" aria-expanded={open}><i></i><i></i></button>
        </div>
      </div>
    </header>
  );
}
