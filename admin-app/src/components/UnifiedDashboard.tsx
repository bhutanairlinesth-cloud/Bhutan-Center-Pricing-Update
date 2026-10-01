import React, { useMemo } from 'react';
import { BarChart3, Calculator, ClipboardList, Globe2, LineChart, Megaphone, Settings2 } from 'lucide-react';
import { CustomerTracking, QuotationRecord, User } from '../types';
import { PageHeader, SectionCard } from '../shared/ui';

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

  const upcoming = [...trackings]
    .filter((x) => x.travelStartDate && !['lost', 'completed'].includes(x.status))
    .sort((a, b) => (a.travelStartDate || '').localeCompare(b.travelStartDate || ''))
    .slice(0, 5);
  const needsAction = trackings.filter((x) => x.nextAction && !['lost', 'completed'].includes(x.status)).slice(0, 5);

  return (
    <div className="module-list-page bo-list-page">
      <PageHeader title="Dashboard" subtitle={`${currentUser.name} · ${currentUser.role}`} />
      <div className="unified-stat-grid">
        <article><span>กำลังติดตาม</span><strong>{stats.active}</strong></article>
        <article><span>ส่ง QT แล้ว</span><strong>{stats.quoteSent}</strong></article>
        <article><span>ปิดการขาย</span><strong>{stats.won}</strong></article>
        <article><span>ใบเสนอราคา</span><strong>{stats.quotes}</strong></article>
      </div>
      <div className="bo-detail-grid">
        <SectionCard title="ทริปใกล้เดินทาง">
          {upcoming.length ? upcoming.map((t) => (
            <p key={t.id} className="bo-list-row"><strong className="mono">{t.bookingNo || '—'}</strong> {t.customerName} · {t.travelStartDate}</p>
          )) : <p className="muted">ไม่มีทริปที่กำหนดวันเดินทาง</p>}
        </SectionCard>
        <SectionCard title="งานที่ต้องทำ">
          {needsAction.length ? needsAction.map((t) => (
            <p key={t.id} className="bo-list-row"><strong>{t.bookingNo || t.customerName}</strong> — {t.nextAction}</p>
          )) : <p className="muted">ไม่มีงานค้าง</p>}
        </SectionCard>
      </div>
      <SectionCard title="เมนูลัด">
        <div className="unified-modules unified-modules--compact">
          <button type="button" onClick={onOpenPricing}><Calculator /> ใบเสนอราคา</button>
          <button type="button" onClick={onOpenTracking}><ClipboardList /> การจอง</button>
          <button type="button" onClick={onOpenGrowth}><Megaphone /> การตลาด</button>
          {currentUser.role === 'admin' && <button type="button" onClick={onOpenAdmin}><Settings2 /> ข้อมูลหลัก</button>}
          <a href="/" target="_blank" rel="noreferrer"><Globe2 /> เปิดเว็บไซต์</a>
        </div>
      </SectionCard>
    </div>
  );
}
