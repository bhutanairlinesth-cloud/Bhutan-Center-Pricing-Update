import React, { useMemo } from 'react';
import { BarChart3, Calculator, ClipboardList, Globe2, LineChart, LogOut, Megaphone, Settings2, Users } from 'lucide-react';
import { CustomerTracking, QuotationRecord, User } from '../types';
import { Brand } from './Brand';

interface Props {
  currentUser: User;
  trackings: CustomerTracking[];
  quotations: QuotationRecord[];
  onOpenPricing: () => void;
  onOpenTracking: () => void;
  onOpenAdmin: () => void;
  onOpenGrowth: () => void;
  onLogout: () => void;
}

export function UnifiedDashboard({ currentUser, trackings, quotations, onOpenPricing, onOpenTracking, onOpenAdmin, onOpenGrowth, onLogout }: Props) {
  const stats = useMemo(() => ({
    active: trackings.filter((x) => !['lost','completed'].includes(x.status)).length,
    won: trackings.filter((x) => x.status === 'won').length,
    quoteSent: trackings.filter((x) => x.status === 'quote_sent').length,
    quotes: quotations.length,
  }), [trackings, quotations]);

  return <div className="unified-shell">
    <header className="unified-topbar">
      <Brand/>
      <div className="unified-user"><span><b>{currentUser.name}</b><small>{currentUser.role}</small></span><button onClick={onLogout} title="ออกจากระบบ"><LogOut/></button></div>
    </header>

    <main className="unified-main">
      <section className="unified-hero">
        <div><span className="unified-eyebrow">BHUTAN CENTER · UNIFIED BACK OFFICE</span><h1>ทุกอย่างอยู่ใน<br/>ระบบเดียวกัน</h1><p>Pricing, Customer Tracking, Quotation, Invoice, Website, LINE และ Marketing ใช้ข้อมูลชุดเดียวกัน</p></div>
        <a className="unified-site-link" href="/" target="_blank" rel="noreferrer"><Globe2/><span><small>PUBLIC WEBSITE</small><strong>เปิด BhutanCenter.org</strong></span>↗</a>
      </section>

      <section className="unified-stat-grid">
        <article><span>ลูกค้าที่กำลังติดตาม</span><strong>{stats.active}</strong><small>Active opportunities</small></article>
        <article><span>ส่งใบเสนอราคาแล้ว</span><strong>{stats.quoteSent}</strong><small>Quote sent</small></article>
        <article><span>ปิดการขาย</span><strong>{stats.won}</strong><small>Won customers</small></article>
        <article><span>ใบเสนอราคาทั้งหมด</span><strong>{stats.quotes}</strong><small>Quotation archive</small></article>
      </section>

      <section className="unified-modules">
        <button onClick={onOpenPricing}><i><Calculator/></i><span><small>PRICING</small><strong>Pricing Desk</strong><p>คำนวณราคา Retail / Agent และออกใบเสนอราคา</p></span><b>→</b></button>
        <button onClick={onOpenTracking}><i><ClipboardList/></i><span><small>CRM / SALES</small><strong>Customer Tracking</strong><p>ติดตามลูกค้า Invoice การชำระเงิน และความพร้อมเดินทาง</p></span><b>→</b></button>
        <button onClick={onOpenGrowth}><i><Megaphone/></i><span><small>WEBSITE / LINE</small><strong>Website & Marketing</strong><p>Funnel, LINE OA, ราคาเว็บไซต์ และ Broadcast</p></span><b>→</b></button>
        {currentUser.role === 'admin' && <button onClick={onOpenAdmin}><i><Settings2/></i><span><small>SYSTEM</small><strong>System Settings</strong><p>Tour Programs, Hotels, Flight, Visa, Users และการตั้งค่าหลัก</p></span><b>→</b></button>}
      </section>

      <section className="unified-flow-card">
        <div><span className="unified-eyebrow">SALES FLOW</span><h2>Website → LINE → Lead → Quote → Customer</h2><p>หน้า Website และ LINE เป็นช่องทางเข้าหาลูกค้า ส่วน Customer Tracking เดิมยังเป็นข้อมูลหลักของทีมขาย</p></div>
        <div className="unified-flow"><span><Globe2/>Website</span><b>→</b><span><Users/>LINE / Lead</span><b>→</b><span><ClipboardList/>Tracking</span><b>→</b><span><BarChart3/>Quotation</span><b>→</b><span><LineChart/>Won</span></div>
      </section>
    </main>
  </div>;
}
