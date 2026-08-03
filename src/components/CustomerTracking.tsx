import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, BadgeCheck, CalendarClock, ChevronDown, CircleDollarSign, ClipboardList,
  Download, Edit3, FilePlus2, FileText, Filter, LogOut, Mail, MapPin, Phone,
  Plane, Plus, ReceiptText, Search, Settings2, Trash2, UserRound, Users, WalletCards,
} from 'lucide-react';
import {
  CustomerTracking, GlobalSettings, HotelCategory, InvoiceInstallment, LeadSource,
  PaymentInvoice, PaymentStageStatus, PricingChannel, TourPackage, TrackingStatus, User,
} from '../types';
import { LanguageSwitch, useI18n } from '../i18n';
import { calculatePrice } from '../utils/pricing';
import { formatDate, formatNumber, formatTHB, makeId } from '../utils/format';
import { Brand } from './Brand';
import { EmptyState, Modal } from './Ui';

interface Props {
  settings: GlobalSettings;
  packages: TourPackage[];
  users: User[];
  currentUser: User;
  trackings: CustomerTracking[];
  invoices: PaymentInvoice[];
  onBack: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onSaveTracking: (item: CustomerTracking) => Promise<void>;
  onDeleteTracking: (id: string) => Promise<void>;
  onSaveInvoice: (item: PaymentInvoice) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
}

const leadSources: LeadSource[] = ['LINE OA', 'LINE', 'Facebook', 'Call in', 'Referral', 'Walk in', 'Other'];
const statuses: TrackingStatus[] = ['new', 'following', 'quote_sent', 'won', 'lost', 'completed'];
const paymentStatuses: PaymentStageStatus[] = ['pending', 'invoiced', 'paid', 'overdue', 'cancelled'];

function isoToday() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function addDays(value: string, days: number) {
  if (!value) return '';
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function minusOneMonth(value: string) {
  if (!value) return '';
  const d = new Date(`${value}T12:00:00`);
  const originalDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(originalDay, maxDay));
  return d.toISOString().slice(0, 10);
}
function makeInvoiceNo(stage: InvoiceInstallment) {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `INV-BH-${y}${m}${d}-${stage === 'deposit' ? 'D' : 'B'}${Math.floor(100 + Math.random() * 900)}`;
}
function effectiveStageStatus(status: PaymentStageStatus, dueDate: string): PaymentStageStatus {
  if (['paid', 'cancelled'].includes(status)) return status;
  if (dueDate && dueDate < isoToday()) return 'overdue';
  return status;
}
function paymentSummary(item: CustomerTracking) {
  const deposit = effectiveStageStatus(item.depositStatus, item.depositDueDate);
  const balance = effectiveStageStatus(item.balanceStatus, item.balanceDueDate);
  if (deposit === 'paid' && balance === 'paid') return 'paid';
  if (deposit === 'overdue' || balance === 'overdue') return 'overdue';
  if (deposit === 'paid' || balance === 'paid') return 'partial';
  if (deposit === 'invoiced' || balance === 'invoiced') return 'invoiced';
  return 'pending';
}

export function CustomerTrackingWorkspace(props: Props) {
  const { language } = useI18n();
  const th = language === 'th';
  const [editing, setEditing] = useState<CustomerTracking | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<{ tracking: CustomerTracking; invoice: PaymentInvoice } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TrackingStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | ReturnType<typeof paymentSummary>>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return props.trackings.filter((item) => {
      const matchSearch = !q || [item.opportunityName, item.customerName, item.phone, item.email, item.packageName, item.airline]
        .join(' ').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchPayment = paymentFilter === 'all' || paymentSummary(item) === paymentFilter;
      return matchSearch && matchStatus && matchPayment;
    });
  }, [props.trackings, search, statusFilter, paymentFilter]);

  const totals = useMemo(() => {
    const active = props.trackings.filter((x) => !['lost', 'completed'].includes(x.status));
    return {
      all: props.trackings.length,
      active: active.length,
      pending: props.trackings.filter((x) => paymentSummary(x) !== 'paid').length,
      revenue: props.trackings.filter((x) => x.status === 'won' || x.status === 'completed').reduce((sum, x) => sum + x.totalAmount, 0),
    };
  }, [props.trackings]);

  function newTracking(): CustomerTracking {
    const first = props.packages[0];
    const now = new Date().toISOString();
    return {
      id: makeId('crm'), opportunityName: '', customerName: '', phone: '', email: '', leadSource: 'LINE OA',
      landSupplier: '', airline: 'Bhutan Airlines', travelStartDate: '', travelEndDate: '',
      packageId: first?.id || '', packageName: first?.name || '', hotelCategory: '3 Stars', passengerCount: 2,
      channel: 'retail', sellingPricePerPerson: 0, totalAmount: 0, ticketAmount: 0,
      airportTaxAmount: props.settings.airportTaxTHB * 2, landPayment: 0, profitAmount: 0,
      depositAmount: 0, depositDueDate: '', depositStatus: 'pending', balanceAmount: 0,
      balanceDueDate: '', balanceStatus: 'pending', status: 'new', salesOwnerId: props.currentUser.id,
      salesOwnerName: props.currentUser.name, note: '', createdAt: now, updatedAt: now,
    };
  }

  async function issueInvoice(tracking: CustomerTracking, installment: InvoiceInstallment) {
    const existing = props.invoices.find((x) => x.trackingId === tracking.id && x.installment === installment);
    const now = new Date().toISOString();
    const dueDate = installment === 'deposit' ? tracking.depositDueDate : tracking.balanceDueDate;
    const amount = installment === 'deposit' ? tracking.depositAmount : tracking.balanceAmount;
    const invoice: PaymentInvoice = existing ? {
      ...existing,
      issueDate: existing.issueDate || isoToday(), dueDate, amount,
      status: existing.status === 'cancelled' ? 'invoiced' : existing.status,
      updatedAt: now,
    } : {
      id: makeId('inv'), trackingId: tracking.id, invoiceNo: makeInvoiceNo(installment), installment,
      issueDate: isoToday(), dueDate, amount, status: 'invoiced', paidAt: '', note: '', createdAt: now, updatedAt: now,
    };
    await props.onSaveInvoice(invoice);
    const nextStageStatus = invoice.status === 'pending' ? 'invoiced' : invoice.status;
    const nextTracking = {
      ...tracking,
      depositStatus: installment === 'deposit' ? nextStageStatus : tracking.depositStatus,
      balanceStatus: installment === 'balance' ? nextStageStatus : tracking.balanceStatus,
      updatedAt: now,
    };
    await props.onSaveTracking(nextTracking);
    setInvoicePreview({ tracking: nextTracking, invoice: { ...invoice, status: nextStageStatus } });
  }

  return <div className="tracking-shell">
    <header className="tracking-header">
      <Brand/>
      <div className="tracking-header-actions">
        <LanguageSwitch compact/>
        <button className="ghost-button" onClick={props.onBack}><ArrowLeft/>{th ? 'หน้าคำนวณราคา' : 'Price calculator'}</button>
        {props.currentUser.role === 'admin' && <button className="ghost-button desktop-only" onClick={props.onOpenAdmin}><Settings2/>{th ? 'หลังบ้าน' : 'Back office'}</button>}
        <button className="icon-button" onClick={props.onLogout}><LogOut/></button>
      </div>
    </header>

    <main className="tracking-main">
      <section className="tracking-page-head">
        <div><span className="eyebrow"><ClipboardList/> SALES PIPELINE</span><h1>{th ? 'ติดตามลูกค้าและการชำระเงิน' : 'Customer & payment tracking'}</h1><p>{th ? 'รวมข้อมูลลูกค้า สถานะการขาย กำหนดชำระ และ Invoice ไว้ในที่เดียว' : 'Manage leads, sales stages, payment deadlines and invoices in one place.'}</p></div>
        <button className="primary-button tracking-add" onClick={() => setEditing(newTracking())}><Plus/>{th ? 'เพิ่มลูกค้า / โอกาสขาย' : 'Add opportunity'}</button>
      </section>

      <section className="tracking-stats">
        <TrackingStat icon={<Users/>} label={th ? 'ลูกค้าทั้งหมด' : 'All opportunities'} value={totals.all.toString()} note={th ? 'รายการในระบบ' : 'records'}/>
        <TrackingStat icon={<BadgeCheck/>} label={th ? 'กำลังติดตาม' : 'Active pipeline'} value={totals.active.toString()} note={th ? 'ยังไม่ปิดงาน' : 'open deals'}/>
        <TrackingStat icon={<CalendarClock/>} label={th ? 'รอเรียกเก็บ / รอชำระ' : 'Payment follow-up'} value={totals.pending.toString()} note={th ? 'ต้องติดตามต่อ' : 'need action'}/>
        <TrackingStat icon={<CircleDollarSign/>} label={th ? 'ยอดขายที่ปิดแล้ว' : 'Won revenue'} value={formatTHB(totals.revenue, language)} note={th ? 'รวมรายการ Close Won' : 'closed deals'}/>
      </section>

      <section className="tracking-panel">
        <div className="tracking-toolbar">
          <div className="tracking-search"><Search/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={th ? 'ค้นหาชื่อลูกค้า เบอร์โทร โปรแกรม สายการบิน...' : 'Search customer, phone, package, airline...'}/></div>
          <label className="tracking-filter"><Filter/><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}><option value="all">{th ? 'ทุกสถานะการขาย' : 'All sales status'}</option>{statuses.map((x) => <option key={x} value={x}>{trackingStatusLabel(x, th)}</option>)}</select><ChevronDown/></label>
          <label className="tracking-filter"><WalletCards/><select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)}><option value="all">{th ? 'ทุกสถานะการเงิน' : 'All payment status'}</option><option value="pending">{th ? 'ยังไม่ออก Invoice' : 'Not invoiced'}</option><option value="invoiced">{th ? 'ออก Invoice แล้ว' : 'Invoiced'}</option><option value="partial">{th ? 'ชำระบางส่วน' : 'Partially paid'}</option><option value="paid">{th ? 'ชำระครบแล้ว' : 'Paid'}</option><option value="overdue">{th ? 'เกินกำหนด' : 'Overdue'}</option></select><ChevronDown/></label>
        </div>

        {filtered.length ? <div className="tracking-table-wrap"><table className="tracking-table">
          <thead><tr><th>{th ? 'ลูกค้า / โอกาสขาย' : 'Opportunity'}</th><th>{th ? 'การเดินทาง' : 'Trip'}</th><th>{th ? 'ยอดขาย' : 'Sales'}</th><th>{th ? 'งวดที่ 1: ตั๋ว + ภาษี' : 'Payment 1: Flight + tax'}</th><th>{th ? 'งวดที่ 2: แพ็กเกจ' : 'Payment 2: Package'}</th><th>{th ? 'สถานะ' : 'Status'}</th><th/></tr></thead>
          <tbody>{filtered.map((item) => <tr key={item.id}>
            <td><div className="tracking-customer"><span>{item.customerName?.[0]?.toUpperCase() || '?'}</span><div><b>{item.opportunityName || item.customerName || '-'}</b><small>{item.customerName}{item.leadSource ? ` · ${item.leadSource}` : ''}</small><em>{item.phone || item.email || '-'}</em></div></div></td>
            <td><div className="tracking-trip"><b>{item.packageName || '-'}</b><small>{item.travelStartDate ? formatDate(item.travelStartDate, language) : '-'}</small><em>{item.passengerCount} {th ? 'ท่าน' : 'pax'} · {item.hotelCategory}</em></div></td>
            <td><div className="tracking-money"><b>{formatTHB(item.totalAmount, language)}</b><small>{formatTHB(item.sellingPricePerPerson, language)} / {th ? 'ท่าน' : 'pax'}</small><em>{th ? 'กำไร' : 'Profit'} {formatTHB(item.profitAmount, language)}</em></div></td>
            <td><PaymentCell amount={item.depositAmount} due={item.depositDueDate} status={item.depositStatus} th={th} language={language} onInvoice={() => issueInvoice(item, 'deposit')}/></td>
            <td><PaymentCell amount={item.balanceAmount} due={item.balanceDueDate} status={item.balanceStatus} th={th} language={language} onInvoice={() => issueInvoice(item, 'balance')}/></td>
            <td><div className="tracking-status-stack"><StatusBadge status={item.status} th={th}/><PaymentBadge status={paymentSummary(item)} th={th}/><small>{item.salesOwnerName || '-'}</small></div></td>
            <td><div className="tracking-row-actions"><button onClick={() => setEditing(item)} title={th ? 'แก้ไข' : 'Edit'}><Edit3/></button><button className="danger" onClick={() => window.confirm(th ? 'ยืนยันการลบรายการนี้?' : 'Delete this record?') && props.onDeleteTracking(item.id)} title={th ? 'ลบ' : 'Delete'}><Trash2/></button></div></td>
          </tr>)}</tbody>
        </table></div> : <EmptyState title={th ? 'ยังไม่มีข้อมูลที่ตรงกับตัวกรอง' : 'No matching records'} detail={th ? 'กด “เพิ่มลูกค้า / โอกาสขาย” เพื่อเริ่มใช้งาน' : 'Add a new opportunity to get started.'}/>} 
      </section>
    </main>

    <TrackingEditor open={Boolean(editing)} item={editing} settings={props.settings} packages={props.packages} users={props.users} currentUser={props.currentUser} onClose={() => setEditing(null)} onSave={async (item) => { await props.onSaveTracking(item); setEditing(null); }}/>
    <InvoicePreview value={invoicePreview} language={language} onClose={() => setInvoicePreview(null)} onSaveInvoice={props.onSaveInvoice} onSaveTracking={props.onSaveTracking}/>
  </div>;
}

function TrackingStat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="tracking-stat"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div></div>;
}
function trackingStatusLabel(status: TrackingStatus, th: boolean) {
  const labels = th ? { new: 'ลูกค้าใหม่', following: 'กำลังติดตาม', quote_sent: 'ส่งใบเสนอราคาแล้ว', won: 'Close Won', lost: 'Close Lost', completed: 'เดินทางเสร็จสิ้น' } : { new: 'New lead', following: 'Following', quote_sent: 'Quote sent', won: 'Close won', lost: 'Close lost', completed: 'Trip completed' };
  return labels[status];
}
function paymentStatusLabel(status: PaymentStageStatus, th: boolean) {
  const labels = th ? { pending: 'รอดำเนินการ', invoiced: 'ออก Invoice แล้ว', paid: 'ชำระแล้ว', overdue: 'เกินกำหนด', cancelled: 'ยกเลิก' } : { pending: 'Pending', invoiced: 'Invoiced', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' };
  return labels[status];
}
function StatusBadge({ status, th }: { status: TrackingStatus; th: boolean }) { return <span className={`tracking-badge sales-${status}`}>{trackingStatusLabel(status, th)}</span>; }
function PaymentBadge({ status, th }: { status: ReturnType<typeof paymentSummary>; th: boolean }) {
  const labels = th ? { pending: 'ยังไม่ออก Invoice', invoiced: 'ออก Invoice แล้ว', partial: 'ชำระบางส่วน', paid: 'ชำระครบ', overdue: 'เกินกำหนด' } : { pending: 'Not invoiced', invoiced: 'Invoiced', partial: 'Partially paid', paid: 'Paid', overdue: 'Overdue' };
  return <span className={`tracking-badge pay-${status}`}>{labels[status]}</span>;
}
function PaymentCell({ amount, due, status, onInvoice, th, language }: { amount: number; due: string; status: PaymentStageStatus; onInvoice: () => void; th: boolean; language: 'th' | 'en' }) {
  const effective = effectiveStageStatus(status, due);
  return <div className="payment-cell"><b>{formatTHB(amount, language)}</b><small>{th ? 'ครบกำหนด' : 'Due'}: {due ? formatDate(due, language) : '-'}</small><span className={`payment-mini ${effective}`}>{paymentStatusLabel(effective, th)}</span><button onClick={onInvoice}><ReceiptText/>Invoice</button></div>;
}

function TrackingEditor({ open, item, settings, packages, users, currentUser, onClose, onSave }: {
  open: boolean; item: CustomerTracking | null; settings: GlobalSettings; packages: TourPackage[]; users: User[]; currentUser: User;
  onClose: () => void; onSave: (item: CustomerTracking) => Promise<void>;
}) {
  const { language } = useI18n();
  const th = language === 'th';
  const [form, setForm] = useState<CustomerTracking | null>(item);
  React.useEffect(() => setForm(item), [item]);
  if (!form) return null;
  const currentForm = form;

  const set = <K extends keyof CustomerTracking>(key: K, value: CustomerTracking[K]) => setForm((current) => current ? ({ ...current, [key]: value }) : current);
  const selectedPackage = packages.find((x) => x.id === currentForm.packageId);
  function syncDates(start: string, packageNights = selectedPackage?.nights || 0) {
    setForm((current) => current ? ({ ...current, travelStartDate: start, travelEndDate: start ? addDays(start, packageNights) : '', balanceDueDate: start ? minusOneMonth(start) : '' }) : current);
  }
  function syncPackage(id: string) {
    const pkg = packages.find((x) => x.id === id);
    setForm((current) => current ? ({ ...current, packageId: id, packageName: pkg?.name || '', travelEndDate: current.travelStartDate ? addDays(current.travelStartDate, pkg?.nights || 0) : current.travelEndDate }) : current);
  }
  function calculateFromPricing() {
    if (!currentForm.packageId) return;
    const result = calculatePrice({ channel: currentForm.channel, packageId: currentForm.packageId, passengerCount: Math.max(1, currentForm.passengerCount), hotelCategory: currentForm.hotelCategory, travelDate: currentForm.travelStartDate, businessUpgradeCount: 0 }, settings, packages);
    if (!result) return;
    const ticketAmount = result.airTicketPerPerson * result.passengerCount;
    const airportTaxAmount = result.airportTaxPerPerson * result.passengerCount;
    const landPayment = (result.groundCostTHBPerPerson + result.visaTHBPerPerson) * result.passengerCount;
    const depositAmount = ticketAmount + airportTaxAmount;
    setForm((current) => current ? ({
      ...current,
      packageName: result.packageName,
      sellingPricePerPerson: result.sellingPricePerPerson,
      totalAmount: result.groupTotal,
      ticketAmount,
      airportTaxAmount,
      landPayment,
      profitAmount: Math.max(0, result.groupTotal - ticketAmount - airportTaxAmount - landPayment),
      depositAmount,
      balanceAmount: Math.max(0, result.groupTotal - depositAmount),
      balanceDueDate: current.travelStartDate ? minusOneMonth(current.travelStartDate) : current.balanceDueDate,
    }) : current);
  }
  function normalizeBeforeSave(): CustomerTracking {
    const ticket = Math.max(0, currentForm.ticketAmount);
    const tax = Math.max(0, currentForm.airportTaxAmount);
    const total = Math.max(0, currentForm.totalAmount);
    const deposit = ticket + tax;
    const balance = Math.max(0, total - deposit);
    const profit = total - ticket - tax - Math.max(0, currentForm.landPayment);
    const owner = users.find((x) => x.id === currentForm.salesOwnerId);
    return { ...currentForm, passengerCount: Math.max(1, Math.round(currentForm.passengerCount)), depositAmount: deposit, balanceAmount: balance, profitAmount: profit, salesOwnerName: owner?.name || currentForm.salesOwnerName || currentUser.name, updatedAt: new Date().toISOString() };
  }

  const deposit = Math.max(0, form.ticketAmount) + Math.max(0, form.airportTaxAmount);
  const balance = Math.max(0, form.totalAmount - deposit);
  const profit = form.totalAmount - form.ticketAmount - form.airportTaxAmount - form.landPayment;

  return <Modal open={open} title={th ? 'ฟอร์มติดตามลูกค้า / โอกาสขาย' : 'Customer tracking form'} onClose={onClose} wide>
    <div className="tracking-editor">
      <section className="editor-section"><div className="editor-section-title"><span>01</span><div><h3>{th ? 'ข้อมูลลูกค้าและแหล่งที่มา' : 'Customer & lead source'}</h3><p>{th ? 'ข้อมูลสำหรับค้นหาและติดตามการขาย' : 'Contact and sales attribution details'}</p></div></div><div className="tracking-form-grid">
        <label className="field span-2"><span>{th ? 'Opportunity Name / ชื่อรายการ' : 'Opportunity name'}</span><input value={form.opportunityName} onChange={(e) => set('opportunityName', e.target.value)} placeholder={th ? 'เช่น คุณสมชาย 5D4N เดือนตุลาคม' : 'e.g. Mr. Smith 5D4N October'}/></label>
        <label className="field"><span>{th ? 'ชื่อลูกค้า / บริษัท' : 'Customer / company'}</span><input value={form.customerName} onChange={(e) => set('customerName', e.target.value)}/></label>
        <label className="field"><span>{th ? 'Lead Source' : 'Lead source'}</span><select value={form.leadSource} onChange={(e) => set('leadSource', e.target.value as LeadSource)}>{leadSources.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="field"><span>{th ? 'เบอร์โทรศัพท์' : 'Phone'}</span><input value={form.phone} onChange={(e) => set('phone', e.target.value)}/></label>
        <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}/></label>
        <label className="field"><span>{th ? 'เจ้าของงาน / ฝ่ายขาย' : 'Sales owner'}</span><select value={form.salesOwnerId} onChange={(e) => set('salesOwnerId', e.target.value)}>{users.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="field"><span>{th ? 'สถานะการขาย' : 'Sales status'}</span><select value={form.status} onChange={(e) => set('status', e.target.value as TrackingStatus)}>{statuses.map((x) => <option key={x} value={x}>{trackingStatusLabel(x, th)}</option>)}</select></label>
      </div></section>

      <section className="editor-section"><div className="editor-section-title"><span>02</span><div><h3>{th ? 'ข้อมูลการเดินทาง' : 'Trip information'}</h3><p>{th ? 'โปรแกรม สายการบิน LAND และจำนวนผู้เดินทาง' : 'Package, airline, land supplier and passenger count'}</p></div></div><div className="tracking-form-grid">
        <label className="field span-2"><span>{th ? 'โปรแกรมทัวร์' : 'Tour package'}</span><select value={form.packageId} onChange={(e) => syncPackage(e.target.value)}><option value="">{th ? 'เลือกโปรแกรม' : 'Select package'}</option>{packages.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="field"><span>{th ? 'ช่องทางราคา' : 'Pricing channel'}</span><select value={form.channel} onChange={(e) => set('channel', e.target.value as PricingChannel)}><option value="retail">Retail</option><option value="agent">Agent</option></select></label>
        <label className="field"><span>{th ? 'ระดับโรงแรม' : 'Hotel category'}</span><select value={form.hotelCategory} onChange={(e) => set('hotelCategory', e.target.value as HotelCategory)}><option>3 Stars</option><option>4 Stars</option><option>5 Stars</option></select></label>
        <label className="field"><span>{th ? 'สายการบิน' : 'Airline'}</span><input value={form.airline} onChange={(e) => set('airline', e.target.value)} placeholder="Bhutan Airlines / Drukair"/></label>
        <label className="field"><span>LAND / Supplier</span><input value={form.landSupplier} onChange={(e) => set('landSupplier', e.target.value)} placeholder={th ? 'เช่น จองกับ Amen / Aari Holiday' : 'e.g. Amen / Aari Holiday'}/></label>
        <label className="field"><span>{th ? 'วันเริ่มเดินทาง' : 'Travel start'}</span><input type="date" value={form.travelStartDate} onChange={(e) => syncDates(e.target.value)}/></label>
        <label className="field"><span>{th ? 'วันสิ้นสุด' : 'Travel end'}</span><input type="date" value={form.travelEndDate} onChange={(e) => set('travelEndDate', e.target.value)}/></label>
        <label className="field"><span>{th ? 'จำนวนผู้เดินทาง' : 'No. of pax'}</span><input type="number" min="1" value={form.passengerCount} onChange={(e) => set('passengerCount', Number(e.target.value))}/></label>
        <div className="tracking-calc-action"><button className="secondary-button" type="button" onClick={calculateFromPricing}><CircleDollarSign/>{th ? 'ดึงราคาจากระบบคำนวณ' : 'Calculate from pricing system'}</button></div>
      </div></section>

      <section className="editor-section"><div className="editor-section-title"><span>03</span><div><h3>{th ? 'ยอดขาย ต้นทุน และกำไร' : 'Sales, cost & profit'}</h3><p>{th ? 'กรอกยอดตามข้อมูลจริง ระบบจะคำนวณมัดจำและยอดคงเหลือให้' : 'Enter actual values; payment schedule is calculated automatically.'}</p></div></div><div className="tracking-form-grid money-grid">
        <MoneyField label={th ? 'ราคาขายต่อท่าน' : 'Selling / pax'} value={form.sellingPricePerPerson} onChange={(v) => set('sellingPricePerPerson', v)}/>
        <MoneyField label={th ? 'ยอดขายรวม' : 'Total / Baht'} value={form.totalAmount} onChange={(v) => set('totalAmount', v)}/>
        <MoneyField label={th ? 'ราคาตั๋วรวมทั้งหมด' : 'Total ticket price'} value={form.ticketAmount} onChange={(v) => set('ticketAmount', v)}/>
        <MoneyField label={th ? 'ภาษีสนามบินรวม' : 'Total airport tax'} value={form.airportTaxAmount} onChange={(v) => set('airportTaxAmount', v)}/>
        <MoneyField label={th ? 'LAND Payment' : 'Land payment'} value={form.landPayment} onChange={(v) => set('landPayment', v)}/>
        <div className={`calculated-money ${profit < 0 ? 'negative' : ''}`}><span>{th ? 'กำไรจากการขาย' : 'Profit from sales'}</span><strong>{formatTHB(profit, language)}</strong><small>{th ? 'ยอดขาย − ตั๋ว − ภาษี − LAND' : 'Sales − ticket − tax − land'}</small></div>
      </div></section>

      <section className="editor-section payment-editor-section"><div className="editor-section-title"><span>04</span><div><h3>{th ? 'แผนเรียกเก็บเงิน 2 งวด' : 'Two-stage payment schedule'}</h3><p>{th ? 'งวดแรกกำหนดวันเอง ส่วนงวดสองระบบตั้งไว้ 1 เดือนก่อนเดินทาง' : 'Set the deposit deadline; final payment defaults to one month before travel.'}</p></div></div><div className="installment-grid">
        <div className="installment-card first"><div className="installment-head"><span>1</span><div><b>{th ? 'มัดจำ: ตั๋วเครื่องบิน + ภาษีสนามบิน' : 'Deposit: air ticket + airport tax'}</b><small>{th ? 'เรียกเก็บเต็มจำนวนของตั๋วและภาษี' : 'Collect the full airfare and airport tax.'}</small></div></div><strong>{formatTHB(deposit, language)}</strong><div className="installment-fields"><label className="field"><span>{th ? 'กำหนดชำระ' : 'Due date'}</span><input type="date" value={form.depositDueDate} onChange={(e) => set('depositDueDate', e.target.value)}/></label><label className="field"><span>{th ? 'สถานะ' : 'Status'}</span><select value={form.depositStatus} onChange={(e) => set('depositStatus', e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label></div></div>
        <div className="installment-card second"><div className="installment-head"><span>2</span><div><b>{th ? 'ค่าแพ็กเกจส่วนที่เหลือ' : 'Remaining package payment'}</b><small>{th ? 'ยอดคงเหลือหลังหักมัดจำ งวดชำระ 1 เดือนก่อนเดินทาง' : 'Remaining balance, due one month before travel.'}</small></div></div><strong>{formatTHB(balance, language)}</strong><div className="installment-fields"><label className="field"><span>{th ? 'กำหนดชำระ' : 'Due date'}</span><input type="date" value={form.balanceDueDate} onChange={(e) => set('balanceDueDate', e.target.value)}/></label><label className="field"><span>{th ? 'สถานะ' : 'Status'}</span><select value={form.balanceStatus} onChange={(e) => set('balanceStatus', e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label></div></div>
      </div></section>

      <label className="field"><span>{th ? 'หมายเหตุ / สิ่งที่ต้องติดตามต่อ' : 'Notes / next action'}</span><textarea rows={3} value={form.note} onChange={(e) => set('note', e.target.value)}/></label>
      <div className="modal-actions tracking-modal-actions"><button className="ghost-button" onClick={onClose}>{th ? 'ยกเลิก' : 'Cancel'}</button><button className="primary-button" disabled={!form.opportunityName.trim() || !form.customerName.trim()} onClick={() => onSave(normalizeBeforeSave())}><BadgeCheck/>{th ? 'บันทึกข้อมูลติดตาม' : 'Save tracking record'}</button></div>
    </div>
  </Modal>;
}

function MoneyField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="field money-input"><span>{label}</span><div><input type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(Number(e.target.value))}/><em>THB</em></div></label>;
}

function InvoicePreview({ value, language, onClose, onSaveInvoice, onSaveTracking }: {
  value: { tracking: CustomerTracking; invoice: PaymentInvoice } | null; language: 'th' | 'en'; onClose: () => void;
  onSaveInvoice: (item: PaymentInvoice) => Promise<void>; onSaveTracking: (item: CustomerTracking) => Promise<void>;
}) {
  const th = language === 'th';
  const [status, setStatus] = useState<PaymentStageStatus>('invoiced');
  React.useEffect(() => setStatus(value?.invoice.status || 'invoiced'), [value]);
  if (!value) return null;
  const { tracking, invoice } = value;
  const isDeposit = invoice.installment === 'deposit';
  async function updateStatus(next: PaymentStageStatus) {
    setStatus(next);
    const now = new Date().toISOString();
    await onSaveInvoice({ ...invoice, status: next, paidAt: next === 'paid' ? isoToday() : '', updatedAt: now });
    await onSaveTracking({
      ...tracking,
      depositStatus: isDeposit ? next : tracking.depositStatus,
      balanceStatus: !isDeposit ? next : tracking.balanceStatus,
      updatedAt: now,
    });
  }
  return <Modal open title={th ? 'Invoice เรียกเก็บเงิน' : 'Payment invoice'} onClose={onClose} wide>
    <div className="invoice-toolbar no-print"><button className="ghost-button" onClick={onClose}><ArrowLeft/>{th ? 'กลับ' : 'Back'}</button><label><span>{th ? 'สถานะเอกสาร' : 'Status'}</span><select value={status} onChange={(e) => updateStatus(e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label><button className="primary-button" onClick={() => window.print()}><Download/>{th ? 'พิมพ์ / บันทึก PDF' : 'Print / Save PDF'}</button></div>
    <article className="invoice-sheet" id="invoice-print-area">
      <header className="invoice-header"><Brand/><div><span>INVOICE</span><h1>{th ? 'ใบแจ้งหนี้ / เรียกเก็บเงิน' : 'Payment Invoice'}</h1><b>{invoice.invoiceNo}</b></div></header>
      <div className="invoice-accent"/>
      <section className="invoice-meta"><div><span>{th ? 'เรียกเก็บจาก' : 'Bill to'}</span><strong>{tracking.customerName}</strong><small>{[tracking.phone, tracking.email].filter(Boolean).join(' · ') || '-'}</small></div><div><span>{th ? 'วันที่ออกเอกสาร' : 'Issue date'}</span><strong>{formatDate(invoice.issueDate, language)}</strong><small>{th ? 'ครบกำหนด' : 'Due'}: {invoice.dueDate ? formatDate(invoice.dueDate, language) : '-'}</small></div></section>
      <section className="invoice-trip-summary"><div><span>{th ? 'โปรแกรม' : 'Package'}</span><b>{tracking.packageName || '-'}</b></div><div><span>{th ? 'วันเดินทาง' : 'Travel date'}</span><b>{tracking.travelStartDate ? formatDate(tracking.travelStartDate, language) : '-'}</b></div><div><span>{th ? 'จำนวน' : 'Passengers'}</span><b>{tracking.passengerCount} {th ? 'ท่าน' : 'pax'}</b></div></section>
      <section className="invoice-item-table"><div className="invoice-table-head"><span>{th ? 'รายการ' : 'Description'}</span><span>{th ? 'งวด' : 'Stage'}</span><span>{th ? 'จำนวนเงิน (บาท)' : 'Amount (THB)'}</span></div><div className="invoice-table-row"><span><b>{isDeposit ? (th ? 'มัดจำค่าตั๋วเครื่องบินไป–กลับและภาษีสนามบินทั้งหมด' : 'Deposit for round-trip airfare and total airport tax') : (th ? 'ค่าแพ็กเกจทัวร์ส่วนที่เหลือทั้งหมด' : 'Remaining tour package balance')}</b><small>{isDeposit ? (th ? `ค่าตั๋ว ${formatTHB(tracking.ticketAmount, language)} + ภาษีสนามบิน ${formatTHB(tracking.airportTaxAmount, language)}` : `Airfare ${formatTHB(tracking.ticketAmount, language)} + airport tax ${formatTHB(tracking.airportTaxAmount, language)}`) : (th ? 'ยอดคงเหลือหลังหักเงินมัดจำงวดแรก' : 'Balance after deducting the first payment')}</small></span><span><b>{isDeposit ? '1 / 2' : '2 / 2'}</b></span><span><b>{formatNumber(invoice.amount, 2)}</b></span></div></section>
      <section className="invoice-total"><div><span>{th ? 'ยอดชำระภายในกำหนด' : 'Amount due'}</span><strong>THB {formatNumber(invoice.amount, 2)}</strong><small>{invoice.dueDate ? `${th ? 'ภายในวันที่' : 'Due by'} ${formatDate(invoice.dueDate, language)}` : '-'}</small></div></section>
      <section className="invoice-note"><h3>{th ? 'หมายเหตุการชำระเงิน' : 'Payment note'}</h3><p>{th ? 'กรุณาชำระเงินภายในกำหนด และส่งหลักฐานการโอนเงินให้เจ้าหน้าที่ผู้ดูแลรายการ การจองจะสมบูรณ์เมื่อบริษัทตรวจสอบยอดชำระเรียบร้อยแล้ว' : 'Please pay by the due date and send the transfer slip to your sales contact. The booking is confirmed after payment verification.'}</p></section>
      <footer className="invoice-footer"><div><strong>OMG Experience Co., Ltd.</strong><span>info@omgexp.com · 02 630 4600 · omgexp.com</span></div><div><span>{th ? 'ผู้จัดทำ' : 'Prepared by'}</span><b>{tracking.salesOwnerName || '-'}</b></div></footer>
    </article>
  </Modal>;
}
