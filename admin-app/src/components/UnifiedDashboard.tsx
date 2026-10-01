import React, { useMemo } from 'react';
import { Calculator, ClipboardList, FileText, Globe2, Megaphone, Settings2 } from 'lucide-react';
import { CustomerTracking, QuotationRecord, User } from '../types';

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

const statusLabel: Record<string,string> = {
  new: 'ใหม่', contacted: 'ติดต่อแล้ว', quote_sent: 'ส่ง QT แล้ว', won: 'ปิดการขาย',
  lost: 'ไม่สำเร็จ', completed: 'จบทริป', booked: 'จองแล้ว', confirmed: 'ยืนยันแล้ว',
};

export function UnifiedDashboard({ currentUser, trackings, quotations, onOpenPricing, onOpenTracking, onOpenAdmin, onOpenGrowth }: Props) {
  const stats = useMemo(() => ({
    active: trackings.filter((x) => !['lost','completed'].includes(x.status)).length,
    quoteSent: trackings.filter((x) => x.status === 'quote_sent').length,
    won: trackings.filter((x) => x.status === 'won').length,
    quotes: quotations.length,
  }), [trackings, quotations]);

  const recent = useMemo(() => [...trackings]
    .sort((a,b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
    .slice(0, 5), [trackings]);

  return <div className="ui-v2-dashboard">
    <section className="ui-v2-page-heading">
      <div><span>OVERVIEW</span><h1>Dashboard</h1></div>
      <div className="ui-v2-heading-actions">
        <button onClick={onOpenPricing}><Calculator/>Pricing Desk</button>
        <button className="primary" onClick={onOpenTracking}><ClipboardList/>ลูกค้า</button>
      </div>
    </section>

    <section className="ui-v2-stat-grid">
      <article><span>กำลังติดตาม</span><strong>{stats.active}</strong></article>
      <article><span>ส่ง QT แล้ว</span><strong>{stats.quoteSent}</strong></article>
      <article><span>ปิดการขาย</span><strong>{stats.won}</strong></article>
      <article><span>ใบเสนอราคา</span><strong>{stats.quotes}</strong></article>
    </section>

    <section className="ui-v2-dashboard-grid">
      <article className="ui-v2-card ui-v2-recent-card">
        <header><strong>รายการล่าสุด</strong><button onClick={onOpenTracking}>ดูทั้งหมด →</button></header>
        <div className="ui-v2-trip-list">
          {recent.length ? recent.map((item) => <button key={item.id} onClick={onOpenTracking}>
            <div><strong>{item.bookingNo || item.sourceQuotationNo || '—'}</strong><span>{item.customerName || item.opportunityName}</span></div>
            <div><span>{item.travelStartDate || '—'}</span><small>{statusLabel[item.status] || item.status}</small></div>
          </button>) : <div className="ui-v2-empty">ยังไม่มีรายการ</div>}
        </div>
      </article>

      <article className="ui-v2-card ui-v2-quick-card">
        <header><strong>เมนูลัด</strong></header>
        <div className="ui-v2-quick-grid">
          <button onClick={onOpenPricing}><i><Calculator/></i><span>Pricing Desk</span></button>
          <button onClick={onOpenTracking}><i><ClipboardList/></i><span>ลูกค้า & การจอง</span></button>
          <button onClick={onOpenGrowth}><i><Megaphone/></i><span>การตลาด</span></button>
          {currentUser.role === 'admin' && <button onClick={onOpenAdmin}><i><Settings2/></i><span>ข้อมูลหลัก</span></button>}
          <a href="/" target="_blank" rel="noreferrer"><i><Globe2/></i><span>เปิดเว็บไซต์</span></a>
          <button onClick={onOpenTracking}><i><FileText/></i><span>เอกสารขาย</span></button>
        </div>
      </article>
    </section>
  </div>;
}
