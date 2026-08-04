import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, BadgeCheck, CalendarClock, Check, ChevronDown, CircleDollarSign, ClipboardCheck,
  ClipboardList, Download, Edit3, FileCheck2, FileText, Filter, Flag, Hourglass, Landmark,
  LogOut, MessageSquareText, Plane, Plus, ReceiptText, Search, Send, Settings2, ShieldCheck,
  Sparkles, Trash2, UserRoundCheck, Users, WalletCards,
} from 'lucide-react';
import {
  CustomerTracking, GlobalSettings, HotelCategory, InvoiceInstallment, JourneyStage, LeadSource,
  PaymentInvoice, PaymentStageStatus, PaymentTransaction, PaymentTransactionType, PricingChannel,
  TourPackage, TrackingStatus, User,
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
  payments: PaymentTransaction[];
  onBack: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onSaveTracking: (item: CustomerTracking) => Promise<void>;
  onDeleteTracking: (id: string) => Promise<void>;
  onSaveInvoice: (item: PaymentInvoice) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onSavePayment: (item: PaymentTransaction) => Promise<void>;
  onDeletePayment: (id: string) => Promise<void>;
}

const leadSources: LeadSource[] = ['LINE OA', 'LINE', 'Facebook', 'Call in', 'Referral', 'Walk in', 'Other'];
const statuses: TrackingStatus[] = ['new', 'following', 'quote_sent', 'won', 'lost', 'completed'];
const paymentStatuses: PaymentStageStatus[] = ['pending', 'invoiced', 'paid', 'overdue', 'cancelled'];
const paymentTypes: PaymentTransactionType[] = ['ticket_deposit', 'package_balance', 'refund', 'other'];

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
  return `INV-BH-${y}${m}${d}-${stage === 'deposit' ? 'T' : 'P'}${Math.floor(100 + Math.random() * 900)}`;
}
function effectiveStageStatus(status: PaymentStageStatus, dueDate: string): PaymentStageStatus {
  if (['paid', 'cancelled'].includes(status)) return status;
  if (dueDate && dueDate < isoToday()) return 'overdue';
  return status;
}
function paymentsFor(trackingId: string, payments: PaymentTransaction[]) {
  return payments.filter((x) => x.trackingId === trackingId).sort((a, b) => (a.paidAt || '').localeCompare(b.paidAt || ''));
}
function sumPayments(items: PaymentTransaction[], type?: PaymentTransactionType) {
  return items.filter((x) => !type || x.type === type).reduce((sum, x) => sum + (x.type === 'refund' ? -Math.abs(x.amount) : x.amount), 0);
}
function ticketPaidAmount(item: CustomerTracking, payments: PaymentTransaction[]) {
  const actual = sumPayments(paymentsFor(item.id, payments), 'ticket_deposit');
  return actual > 0 ? actual : item.depositStatus === 'paid' ? item.depositAmount : 0;
}
function packagePaidAmount(item: CustomerTracking, payments: PaymentTransaction[]) {
  return sumPayments(paymentsFor(item.id, payments), 'package_balance');
}
function paymentSummary(item: CustomerTracking, payments: PaymentTransaction[]) {
  const deposit = effectiveStageStatus(item.depositStatus, item.depositDueDate);
  const balance = effectiveStageStatus(item.balanceStatus, item.balanceDueDate);
  const received = sumPayments(paymentsFor(item.id, payments));
  if (balance === 'paid' || received >= item.totalAmount && item.totalAmount > 0) return 'paid';
  if (deposit === 'overdue' || balance === 'overdue') return 'overdue';
  if (received > 0 || deposit === 'paid') return 'partial';
  if (deposit === 'invoiced' || balance === 'invoiced') return 'invoiced';
  return 'pending';
}

function getJourneyStage(item: CustomerTracking): JourneyStage {
  if (item.status === 'lost') return 'cancelled';
  if (item.closedAt) return 'closed';
  if (item.feedbackReceivedAt) return 'feedback_received';
  if (item.feedbackRequestedAt) return 'feedback_requested';
  if (item.tripReturnedAt) return 'returned';
  const today = isoToday();
  if (item.travelStartDate && item.travelEndDate && today >= item.travelStartDate && today <= item.travelEndDate) return 'traveling';
  if (item.readyToTravelAt) return 'ready_to_travel';
  if (item.itinerarySentAt) return 'itinerary_sent';
  if (item.fullPaymentReceivedAt || item.balanceStatus === 'paid') return 'full_payment_received';
  if (item.visaSentAt) return 'visa_sent';
  if (item.visaReceivedAt) return 'visa_received';
  if (item.invoice2PreparedAt || item.balanceStatus === 'invoiced') return 'invoice_2_ready';
  if (item.documentsSentToLandAt) return 'documents_sent_to_land';
  if (item.ticketSentAt) return 'ticket_sent';
  if (item.firstPaymentReceivedAt || item.depositStatus === 'paid') return 'first_payment_received';
  if (item.invoice1SentAt || item.depositStatus === 'invoiced') return 'invoice_1_sent';
  if (item.flightReservedAt || item.flightPnr) return 'flight_reserved';
  if (item.bookingConfirmedAt) return 'booking_confirmed';
  if (item.quotationSentAt || item.status === 'quote_sent') return 'quotation_sent';
  return 'lead';
}

const stageGroup: Record<JourneyStage, 'sales' | 'booking' | 'visa' | 'travel' | 'after'> = {
  lead: 'sales', quotation_sent: 'sales', booking_confirmed: 'booking', flight_reserved: 'booking', invoice_1_sent: 'booking',
  first_payment_received: 'booking', ticket_sent: 'booking', documents_sent_to_land: 'visa', invoice_2_ready: 'visa',
  visa_received: 'visa', visa_sent: 'visa', full_payment_received: 'visa', itinerary_sent: 'visa', ready_to_travel: 'travel',
  traveling: 'travel', returned: 'after', feedback_requested: 'after', feedback_received: 'after', closed: 'after', cancelled: 'after',
};

function stageLabel(stage: JourneyStage, th: boolean) {
  const labels: Record<JourneyStage, [string, string]> = {
    lead: ['ลูกค้าใหม่ / รอเสนอราคา', 'New lead / quotation'], quotation_sent: ['ส่งราคาแล้ว', 'Quotation sent'],
    booking_confirmed: ['ยืนยันจอง / รอเอกสาร', 'Booking confirmed / documents'], flight_reserved: ['จองตั๋วแล้ว / มี PNR', 'Flight reserved / PNR'],
    invoice_1_sent: ['ส่ง Invoice 1 แล้ว', 'Invoice 1 sent'], first_payment_received: ['รับชำระค่าตั๋วแล้ว', 'Ticket payment received'],
    ticket_sent: ['ส่งตั๋วให้ลูกค้าแล้ว', 'Ticket sent'], documents_sent_to_land: ['ส่งเอกสารให้ Land แล้ว', 'Documents sent to land'],
    invoice_2_ready: ['จัดทำ Invoice 2 แล้ว', 'Invoice 2 prepared'], visa_received: ['ได้รับวีซ่าแล้ว', 'Visa received'],
    visa_sent: ['ส่งวีซ่า + Invoice 2 แล้ว', 'Visa + Invoice 2 sent'], full_payment_received: ['ชำระครบแล้ว', 'Full payment received'],
    itinerary_sent: ['ส่ง Itinerary แล้ว', 'Itinerary sent'], ready_to_travel: ['พร้อมเดินทาง', 'Ready to travel'],
    traveling: ['กำลังเดินทาง', 'Traveling'], returned: ['เดินทางกลับแล้ว', 'Returned'],
    feedback_requested: ['รอ Feedback', 'Feedback requested'], feedback_received: ['ได้รับ Feedback แล้ว', 'Feedback received'],
    closed: ['ปิดจบงาน', 'Closed'], cancelled: ['ยกเลิก / Lost', 'Cancelled / lost'],
  };
  return labels[stage][th ? 0 : 1];
}
function groupLabel(group: 'all' | 'sales' | 'booking' | 'visa' | 'travel' | 'after', th: boolean) {
  const labels = th
    ? { all: 'ทั้งหมด', sales: 'เสนอราคา', booking: 'จองตั๋ว / งวด 1', visa: 'วีซ่า / งวด 2', travel: 'พร้อมเดินทาง', after: 'หลังเดินทาง' }
    : { all: 'All', sales: 'Quotation', booking: 'Flight / Payment 1', visa: 'Visa / Payment 2', travel: 'Travel ready', after: 'Post-trip' };
  return labels[group];
}
function nextRecommendedAction(item: CustomerTracking, th: boolean) {
  const stage = getJourneyStage(item);
  const map: Record<JourneyStage, [string, string]> = {
    lead: ['แจ้งราคาแพ็กเกจให้ลูกค้า', 'Send package quotation'], quotation_sent: ['ติดตามการยืนยันวันเดินทางและแพ็กเกจ', 'Follow up booking confirmation'],
    booking_confirmed: ['รับ Passport และรูปถ่ายให้ครบ', 'Collect passport and photo'], flight_reserved: ['ออกและส่ง Invoice 1 ค่าตั๋ว', 'Issue Invoice 1 for airfare'],
    invoice_1_sent: ['ติดตามชำระค่าตั๋วตาม Deadline', 'Follow up ticket payment'], first_payment_received: ['ส่งตั๋วเครื่องบินให้ลูกค้า', 'Send flight tickets'],
    ticket_sent: ['ส่ง Passport + รูป + ตั๋วให้ Land', 'Submit passport, photo and ticket to land'], documents_sent_to_land: ['จัดทำ Invoice 2 ค่าแพ็กเกจคงเหลือ', 'Prepare Invoice 2 for package balance'],
    invoice_2_ready: ['ติดตามวีซ่าจาก Land', 'Follow up visa with land'], visa_received: ['ส่งวีซ่าและ Invoice 2 ให้ลูกค้า', 'Send visa and Invoice 2'],
    visa_sent: ['ติดตามชำระค่าแพ็กเกจส่วนที่เหลือ', 'Follow up final package payment'], full_payment_received: ['จัดทำและส่ง Itinerary', 'Prepare and send itinerary'],
    itinerary_sent: ['ตรวจเอกสารทั้งหมดและทำสถานะพร้อมเดินทาง', 'Verify documents and mark ready'], ready_to_travel: ['ติดตามจนถึงวันเดินทาง', 'Monitor until departure'],
    traveling: ['ดูแลระหว่างเดินทาง', 'Support during trip'], returned: ['ขอ Feedback จากลูกค้า', 'Request customer feedback'],
    feedback_requested: ['ติดตาม Feedback', 'Follow up feedback'], feedback_received: ['ปิดจบงาน', 'Close the case'], closed: ['ดำเนินการครบแล้ว', 'Workflow complete'], cancelled: ['รายการยกเลิก', 'Cancelled'],
  };
  return map[stage][th ? 0 : 1];
}

export function CustomerTrackingWorkspace(props: Props) {
  const { language } = useI18n();
  const th = language === 'th';
  const [editing, setEditing] = useState<CustomerTracking | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<{ tracking: CustomerTracking; invoice: PaymentInvoice } | null>(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'sales' | 'booking' | 'visa' | 'travel' | 'after'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | ReturnType<typeof paymentSummary>>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return props.trackings.filter((item) => {
      const stage = getJourneyStage(item);
      const matchSearch = !q || [item.opportunityName, item.customerName, item.phone, item.email, item.packageName, item.airline, item.flightPnr, item.landSupplier]
        .join(' ').toLowerCase().includes(q);
      const matchGroup = groupFilter === 'all' || stageGroup[stage] === groupFilter;
      const matchPayment = paymentFilter === 'all' || paymentSummary(item, props.payments) === paymentFilter;
      return matchSearch && matchGroup && matchPayment;
    });
  }, [props.trackings, props.payments, search, groupFilter, paymentFilter]);

  const totals = useMemo(() => ({
    all: props.trackings.length,
    action: props.trackings.filter((x) => !['closed', 'cancelled'].includes(getJourneyStage(x))).length,
    due: props.trackings.filter((x) => x.nextActionDueDate && x.nextActionDueDate <= isoToday() && !['closed', 'cancelled'].includes(getJourneyStage(x))).length,
    ready: props.trackings.filter((x) => ['ready_to_travel', 'traveling'].includes(getJourneyStage(x))).length,
  }), [props.trackings]);

  function newTracking(): CustomerTracking {
    const first = props.packages[0];
    const now = new Date().toISOString();
    return {
      id: makeId('crm'), opportunityName: '', customerName: '', phone: '', email: '', leadSource: 'LINE OA', landSupplier: '', airline: 'Bhutan Airlines',
      travelStartDate: '', travelEndDate: '', packageId: first?.id || '', packageName: first?.name || '', hotelCategory: '3 Stars', passengerCount: 2,
      channel: 'retail', sellingPricePerPerson: 0, totalAmount: 0, ticketAmount: 0, airportTaxAmount: props.settings.airportTaxTHB * 2,
      landPayment: 0, profitAmount: 0, depositAmount: 0, depositDueDate: '', depositStatus: 'pending', balanceAmount: 0, balanceDueDate: '', balanceStatus: 'pending',
      status: 'new', salesOwnerId: props.currentUser.id, salesOwnerName: props.currentUser.name, note: '', quotationSentAt: '', bookingConfirmedAt: '',
      passportReceivedAt: '', photoReceivedAt: '', passengerNames: '', flightPnr: '', flightReservedAt: '', invoice1SentAt: '', firstPaymentReceivedAt: '',
      ticketSentAt: '', documentsSentToLandAt: '', invoice2PreparedAt: '', visaReceivedAt: '', visaSentAt: '', fullPaymentReceivedAt: '', itinerarySentAt: '',
      readyToTravelAt: '', tripReturnedAt: '', feedbackRequestedAt: '', feedbackReceivedAt: '', feedbackNote: '', nextAction: '', nextActionDueDate: '', closedAt: '',
      createdAt: now, updatedAt: now,
    };
  }

  async function issueInvoice(tracking: CustomerTracking, installment: InvoiceInstallment) {
    const existing = props.invoices.find((x) => x.trackingId === tracking.id && x.installment === installment);
    const now = new Date().toISOString();
    const paidTicket = ticketPaidAmount(tracking, props.payments);
    const dueDate = installment === 'deposit' ? tracking.depositDueDate : tracking.balanceDueDate;
    const amount = installment === 'deposit' ? tracking.depositAmount : Math.max(0, tracking.totalAmount - paidTicket);
    const invoice: PaymentInvoice = existing ? {
      ...existing, issueDate: existing.issueDate || isoToday(), dueDate, amount,
      status: existing.status === 'cancelled' ? 'invoiced' : existing.status, updatedAt: now,
    } : {
      id: makeId('inv'), trackingId: tracking.id, invoiceNo: makeInvoiceNo(installment), installment,
      issueDate: isoToday(), dueDate, amount, status: 'invoiced', paidAt: '', note: '', createdAt: now, updatedAt: now,
    };
    await props.onSaveInvoice(invoice);
    const nextTracking: CustomerTracking = {
      ...tracking,
      depositStatus: installment === 'deposit' ? 'invoiced' : tracking.depositStatus,
      balanceStatus: installment === 'balance' ? 'invoiced' : tracking.balanceStatus,
      invoice1SentAt: installment === 'deposit' ? (tracking.invoice1SentAt || isoToday()) : tracking.invoice1SentAt,
      invoice2PreparedAt: installment === 'balance' ? (tracking.invoice2PreparedAt || isoToday()) : tracking.invoice2PreparedAt,
      updatedAt: now,
    };
    await props.onSaveTracking(nextTracking);
    setInvoicePreview({ tracking: nextTracking, invoice });
  }

  return <div className="tracking-shell journey-shell">
    <header className="tracking-header">
      <Brand/>
      <div className="tracking-header-actions"><LanguageSwitch compact/><button className="ghost-button" onClick={props.onBack}><ArrowLeft/>{th ? 'หน้าคำนวณราคา' : 'Price calculator'}</button>{props.currentUser.role === 'admin' && <button className="ghost-button desktop-only" onClick={props.onOpenAdmin}><Settings2/>{th ? 'หลังบ้าน' : 'Back office'}</button>}<button className="icon-button" onClick={props.onLogout}><LogOut/></button></div>
    </header>

    <main className="tracking-main journey-main">
      <section className="tracking-page-head journey-page-head">
        <div><span className="eyebrow"><Sparkles/> CUSTOMER JOURNEY</span><h1>{th ? 'ติดตามลูกค้าตั้งแต่เสนอราคา ถึงปิดจบทริป' : 'Track every customer from quotation to trip closure'}</h1><p>{th ? 'เห็นขั้นตอนปัจจุบัน งานถัดไป เอกสาร การชำระเงิน วีซ่า และ Feedback ในหน้าจอเดียว' : 'Manage next actions, documents, payments, visas, travel readiness and feedback in one workspace.'}</p></div>
        <button className="primary-button tracking-add" onClick={() => setEditing(newTracking())}><Plus/>{th ? 'เพิ่มลูกค้าใหม่' : 'Add customer'}</button>
      </section>

      <section className="tracking-stats journey-stats">
        <TrackingStat icon={<Users/>} label={th ? 'ลูกค้าทั้งหมด' : 'All customers'} value={totals.all.toString()} note={th ? 'รายการในระบบ' : 'records'}/>
        <TrackingStat icon={<ClipboardCheck/>} label={th ? 'กำลังดำเนินการ' : 'Active journeys'} value={totals.action.toString()} note={th ? 'ยังไม่ปิดงาน' : 'open workflows'}/>
        <TrackingStat icon={<Hourglass/>} label={th ? 'งานครบกำหนดวันนี้' : 'Action due'} value={totals.due.toString()} note={th ? 'ต้องติดตามทันที' : 'need attention'}/>
        <TrackingStat icon={<Plane/>} label={th ? 'พร้อม / กำลังเดินทาง' : 'Ready / traveling'} value={totals.ready.toString()} note={th ? 'เตรียมออกเดินทาง' : 'travel stage'}/>
      </section>

      <section className="journey-filter-tabs">
        {(['all', 'sales', 'booking', 'visa', 'travel', 'after'] as const).map((group) => <button key={group} className={groupFilter === group ? 'active' : ''} onClick={() => setGroupFilter(group)}>{groupLabel(group, th)}</button>)}
      </section>

      <section className="tracking-panel journey-panel">
        <div className="tracking-toolbar journey-toolbar">
          <div className="tracking-search"><Search/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={th ? 'ค้นหาลูกค้า PNR โปรแกรม Land หรือเบอร์โทร...' : 'Search customer, PNR, package, land or phone...'}/></div>
          <label className="tracking-filter"><Filter/><select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)}><option value="all">{th ? 'ทุกสถานะชำระเงิน' : 'All payment status'}</option><option value="pending">{th ? 'ยังไม่ออก Invoice' : 'Not invoiced'}</option><option value="invoiced">{th ? 'ออก Invoice แล้ว' : 'Invoiced'}</option><option value="partial">{th ? 'ชำระบางส่วน' : 'Partially paid'}</option><option value="paid">{th ? 'ชำระครบ' : 'Paid'}</option><option value="overdue">{th ? 'เกินกำหนด' : 'Overdue'}</option></select><ChevronDown/></label>
        </div>

        {filtered.length ? <div className="journey-list">{filtered.map((item) => {
          const stage = getJourneyStage(item);
          const itemPayments = paymentsFor(item.id, props.payments);
          const paid = sumPayments(itemPayments);
          const remaining = Math.max(0, item.totalAmount - paid);
          const recommended = item.nextAction || nextRecommendedAction(item, th);
          return <article className="journey-card" key={item.id}>
            <div className="journey-card-customer"><span>{item.customerName?.[0]?.toUpperCase() || '?'}</span><div><b>{item.opportunityName || item.customerName || '-'}</b><small>{item.customerName}{item.leadSource ? ` · ${item.leadSource}` : ''}</small><em>{item.phone || item.email || '-'}</em></div></div>
            <div className="journey-card-stage"><span className={`journey-stage stage-${stageGroup[stage]}`}>{stageLabel(stage, th)}</span><small>{item.packageName || '-'}</small><em>{item.travelStartDate ? formatDate(item.travelStartDate, language) : th ? 'ยังไม่กำหนดวันเดินทาง' : 'Travel date not set'}</em></div>
            <div className="journey-card-action"><small>{th ? 'งานถัดไป' : 'Next action'}</small><b>{recommended}</b><em className={item.nextActionDueDate && item.nextActionDueDate <= isoToday() ? 'overdue' : ''}>{item.nextActionDueDate ? `${th ? 'ภายใน' : 'Due'} ${formatDate(item.nextActionDueDate, language)}` : th ? 'ยังไม่กำหนด Deadline' : 'No deadline'}</em></div>
            <div className="journey-card-payment"><small>{th ? 'รับชำระ / ยอดคงเหลือ' : 'Paid / balance'}</small><b>{formatTHB(paid, language)} <span>/ {formatTHB(remaining, language)}</span></b><PaymentBadge status={paymentSummary(item, props.payments)} th={th}/></div>
            <div className="journey-card-actions"><button className="invoice-one" onClick={() => issueInvoice(item, 'deposit')}><ReceiptText/><span>{th ? 'Invoice 1' : 'Invoice 1'}</span></button><button className="invoice-two" onClick={() => issueInvoice(item, 'balance')}><FileText/><span>{th ? 'Invoice 2' : 'Invoice 2'}</span></button><button onClick={() => setEditing(item)} title={th ? 'เปิดรายละเอียด' : 'Open details'}><Edit3/></button><button className="danger" onClick={() => window.confirm(th ? 'ยืนยันการลบรายการนี้?' : 'Delete this record?') && props.onDeleteTracking(item.id)}><Trash2/></button></div>
          </article>;
        })}</div> : <EmptyState title={th ? 'ยังไม่มีข้อมูลที่ตรงกับตัวกรอง' : 'No matching records'} detail={th ? 'กด “เพิ่มลูกค้าใหม่” เพื่อเริ่มติดตามกระบวนการ' : 'Add a customer to start the workflow.'}/>} 
      </section>
    </main>

    <TrackingEditor open={Boolean(editing)} item={editing} settings={props.settings} packages={props.packages} users={props.users} currentUser={props.currentUser}
      payments={editing ? paymentsFor(editing.id, props.payments) : []} onClose={() => setEditing(null)} onSave={async (item) => { await props.onSaveTracking(item); setEditing(item); }}
      onSavePayment={props.onSavePayment} onDeletePayment={props.onDeletePayment} onIssueInvoice={issueInvoice}/>
    <InvoicePreview value={invoicePreview} language={language} payments={invoicePreview ? paymentsFor(invoicePreview.tracking.id, props.payments) : []} onClose={() => setInvoicePreview(null)} onSaveInvoice={props.onSaveInvoice} onSaveTracking={props.onSaveTracking}/>
  </div>;
}

function TrackingStat({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="tracking-stat"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div></div>;
}
function trackingStatusLabel(status: TrackingStatus, th: boolean) {
  const labels = th ? { new: 'ลูกค้าใหม่', following: 'กำลังติดตาม', quote_sent: 'ส่งใบเสนอราคาแล้ว', won: 'ยืนยันจอง', lost: 'ยกเลิก / Lost', completed: 'ปิดจบงาน' } : { new: 'New lead', following: 'Following', quote_sent: 'Quote sent', won: 'Booking confirmed', lost: 'Lost / cancelled', completed: 'Closed' };
  return labels[status];
}
function paymentStatusLabel(status: PaymentStageStatus, th: boolean) {
  const labels = th ? { pending: 'รอดำเนินการ', invoiced: 'ออก Invoice แล้ว', paid: 'ชำระแล้ว', overdue: 'เกินกำหนด', cancelled: 'ยกเลิก' } : { pending: 'Pending', invoiced: 'Invoiced', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' };
  return labels[status];
}
function PaymentBadge({ status, th }: { status: ReturnType<typeof paymentSummary>; th: boolean }) {
  const labels = th ? { pending: 'ยังไม่ออก Invoice', invoiced: 'ออก Invoice แล้ว', partial: 'ชำระบางส่วน', paid: 'ชำระครบ', overdue: 'เกินกำหนด' } : { pending: 'Not invoiced', invoiced: 'Invoiced', partial: 'Partially paid', paid: 'Paid', overdue: 'Overdue' };
  return <span className={`tracking-badge pay-${status}`}>{labels[status]}</span>;
}
function paymentTypeLabel(type: PaymentTransactionType, th: boolean) {
  const labels = th ? { ticket_deposit: 'ค่าตั๋ว / งวดที่ 1', package_balance: 'ค่าแพ็กเกจ / งวดที่ 2', refund: 'คืนเงิน', other: 'อื่น ๆ' } : { ticket_deposit: 'Ticket payment / Stage 1', package_balance: 'Package payment / Stage 2', refund: 'Refund', other: 'Other' };
  return labels[type];
}

function TrackingEditor({ open, item, settings, packages, users, currentUser, payments, onClose, onSave, onSavePayment, onDeletePayment, onIssueInvoice }: {
  open: boolean; item: CustomerTracking | null; settings: GlobalSettings; packages: TourPackage[]; users: User[]; currentUser: User; payments: PaymentTransaction[];
  onClose: () => void; onSave: (item: CustomerTracking) => Promise<void>; onSavePayment: (item: PaymentTransaction) => Promise<void>; onDeletePayment: (id: string) => Promise<void>;
  onIssueInvoice: (tracking: CustomerTracking, installment: InvoiceInstallment) => Promise<void>;
}) {
  const { language } = useI18n();
  const th = language === 'th';
  const [form, setForm] = useState<CustomerTracking | null>(item);
  const [paymentDraft, setPaymentDraft] = useState<{ type: PaymentTransactionType; amount: number; paidAt: string; reference: string; note: string }>({ type: 'ticket_deposit', amount: 0, paidAt: isoToday(), reference: '', note: '' });
  React.useEffect(() => setForm(item), [item]);
  if (!form) return null;
  const currentForm = form;
  const set = <K extends keyof CustomerTracking>(key: K, value: CustomerTracking[K]) => setForm((current) => current ? ({ ...current, [key]: value }) : current);
  const selectedPackage = packages.find((x) => x.id === currentForm.packageId);
  const currentStage = getJourneyStage(currentForm);

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
    setForm((current) => current ? ({ ...current, packageName: result.packageName, sellingPricePerPerson: result.sellingPricePerPerson, totalAmount: result.groupTotal, ticketAmount, airportTaxAmount, landPayment, profitAmount: Math.max(0, result.groupTotal - ticketAmount - airportTaxAmount - landPayment), depositAmount, balanceAmount: Math.max(0, result.groupTotal - depositAmount), balanceDueDate: current.travelStartDate ? minusOneMonth(current.travelStartDate) : current.balanceDueDate }) : current);
  }
  function normalizeBeforeSave(): CustomerTracking {
    const ticket = Math.max(0, currentForm.ticketAmount); const tax = Math.max(0, currentForm.airportTaxAmount); const total = Math.max(0, currentForm.totalAmount);
    const deposit = ticket + tax; const paidTicket = ticketPaidAmount(currentForm, payments); const balance = Math.max(0, total - paidTicket); const profit = total - ticket - tax - Math.max(0, currentForm.landPayment);
    const owner = users.find((x) => x.id === currentForm.salesOwnerId);
    let status = currentForm.status;
    if (currentForm.closedAt) status = 'completed'; else if (currentForm.bookingConfirmedAt && status !== 'lost') status = 'won'; else if (currentForm.quotationSentAt && ['new', 'following'].includes(status)) status = 'quote_sent';
    return { ...currentForm, passengerCount: Math.max(1, Math.round(currentForm.passengerCount)), depositAmount: deposit, balanceAmount: balance, profitAmount: profit, status, salesOwnerName: owner?.name || currentForm.salesOwnerName || currentUser.name, updatedAt: new Date().toISOString() };
  }
  async function saveAndStay() { const normalized = normalizeBeforeSave(); setForm(normalized); await onSave(normalized); }
  async function markToday(key: keyof CustomerTracking) { const next = { ...currentForm, [key]: isoToday() } as CustomerTracking; setForm(next); await onSave({ ...next, updatedAt: new Date().toISOString() }); }
  async function addPayment() {
    if (paymentDraft.amount <= 0 || !paymentDraft.paidAt) return;
    const now = new Date().toISOString();
    const transaction: PaymentTransaction = { id: makeId('pay'), trackingId: currentForm.id, ...paymentDraft, createdAt: now, updatedAt: now };
    await onSavePayment(transaction);
    let next = currentForm;
    if (paymentDraft.type === 'ticket_deposit') {
      const receivedAfter = paidTicket + paymentDraft.amount;
      const fullyPaid = receivedAfter >= deposit - 0.01;
      next = { ...next, depositStatus: fullyPaid ? 'paid' : (next.depositStatus === 'pending' ? 'invoiced' : next.depositStatus), firstPaymentReceivedAt: fullyPaid ? (next.firstPaymentReceivedAt || paymentDraft.paidAt) : next.firstPaymentReceivedAt };
    }
    if (paymentDraft.type === 'package_balance') {
      const packageReceivedAfter = paidPackage + paymentDraft.amount;
      const packageDue = Math.max(0, currentForm.totalAmount - paidTicket);
      const fullyPaid = packageReceivedAfter >= packageDue - 0.01;
      next = { ...next, balanceStatus: fullyPaid ? 'paid' : (next.balanceStatus === 'pending' ? 'invoiced' : next.balanceStatus), fullPaymentReceivedAt: fullyPaid ? (next.fullPaymentReceivedAt || paymentDraft.paidAt) : next.fullPaymentReceivedAt };
    }
    setForm(next); await onSave({ ...next, updatedAt: now });
    setPaymentDraft({ type: 'ticket_deposit', amount: 0, paidAt: isoToday(), reference: '', note: '' });
  }

  const deposit = Math.max(0, form.ticketAmount) + Math.max(0, form.airportTaxAmount);
  const paidTicket = ticketPaidAmount(form, payments); const paidPackage = packagePaidAmount(form, payments); const totalPaid = sumPayments(payments);
  const balance = Math.max(0, form.totalAmount - paidTicket - paidPackage); const profit = form.totalAmount - form.ticketAmount - form.airportTaxAmount - form.landPayment;

  return <Modal open={open} title={th ? 'Customer Journey — รายละเอียดและขั้นตอนดำเนินงาน' : 'Customer Journey — workflow details'} onClose={onClose} wide>
    <div className="journey-editor">
      <div className="journey-editor-summary"><div><span>{th ? 'สถานะปัจจุบัน' : 'Current stage'}</span><strong>{stageLabel(currentStage, th)}</strong><small>{form.opportunityName || form.customerName || '-'}</small></div><div><span>{th ? 'งานถัดไป' : 'Next action'}</span><strong>{form.nextAction || nextRecommendedAction(form, th)}</strong><small>{form.nextActionDueDate ? formatDate(form.nextActionDueDate, language) : th ? 'ยังไม่กำหนด Deadline' : 'No deadline'}</small></div><div><span>{th ? 'ยอดรับชำระ / คงเหลือ' : 'Paid / remaining'}</span><strong>{formatTHB(totalPaid, language)} / {formatTHB(Math.max(0, form.totalAmount - totalPaid), language)}</strong><small>{form.passengerCount} {th ? 'ท่าน' : 'pax'}</small></div></div>

      <WorkflowSection number="01" icon={<MessageSquareText/>} title={th ? 'เสนอราคาและยืนยันการจอง' : 'Quotation & booking confirmation'} subtitle={th ? 'เริ่มจากแจ้งราคา จนลูกค้ายืนยันวันเดินทางและแพ็กเกจ' : 'From quotation to confirmed travel dates and package.'}>
        <div className="tracking-form-grid">
          <label className="field span-2"><span>{th ? 'Opportunity Name / ชื่อรายการ' : 'Opportunity name'}</span><input value={form.opportunityName} onChange={(e) => set('opportunityName', e.target.value)} placeholder={th ? 'เช่น คุณสมชาย 5D4N เดือนตุลาคม' : 'e.g. Mr. Smith 5D4N October'}/></label>
          <label className="field"><span>{th ? 'ชื่อลูกค้า / บริษัท' : 'Customer / company'}</span><input value={form.customerName} onChange={(e) => set('customerName', e.target.value)}/></label>
          <label className="field"><span>{th ? 'Lead Source' : 'Lead source'}</span><select value={form.leadSource} onChange={(e) => set('leadSource', e.target.value as LeadSource)}>{leadSources.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="field"><span>{th ? 'เบอร์โทร' : 'Phone'}</span><input value={form.phone} onChange={(e) => set('phone', e.target.value)}/></label>
          <label className="field"><span>Email</span><input value={form.email} onChange={(e) => set('email', e.target.value)}/></label>
          <label className="field"><span>{th ? 'พนักงานผู้ดูแล' : 'Sales owner'}</span><select value={form.salesOwnerId} onChange={(e) => set('salesOwnerId', e.target.value)}>{users.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="field"><span>{th ? 'สถานะการขาย' : 'Sales status'}</span><select value={form.status} onChange={(e) => set('status', e.target.value as TrackingStatus)}>{statuses.map((x) => <option key={x} value={x}>{trackingStatusLabel(x, th)}</option>)}</select></label>
          <MilestoneField label={th ? 'วันที่ส่งราคาให้ลูกค้า' : 'Quotation sent'} value={form.quotationSentAt} onChange={(v) => set('quotationSentAt', v)} onToday={() => markToday('quotationSentAt')} th={th}/>
          <MilestoneField label={th ? 'วันที่ลูกค้ายืนยันจอง' : 'Booking confirmed'} value={form.bookingConfirmedAt} onChange={(v) => set('bookingConfirmedAt', v)} onToday={() => markToday('bookingConfirmedAt')} th={th}/>
        </div>
      </WorkflowSection>

      <WorkflowSection number="02" icon={<ClipboardList/>} title={th ? 'ข้อมูลการเดินทางและราคาที่ตกลง' : 'Trip details & agreed price'} subtitle={th ? 'ข้อมูลนี้ใช้คำนวณราคา ออก Invoice และติดตาม Deadline' : 'Used for pricing, invoices and deadline tracking.'}>
        <div className="tracking-form-grid">
          <label className="field span-2"><span>{th ? 'โปรแกรมทัวร์' : 'Tour package'}</span><select value={form.packageId} onChange={(e) => syncPackage(e.target.value)}>{packages.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <label className="field"><span>{th ? 'ช่องทางราคา' : 'Pricing channel'}</span><select value={form.channel} onChange={(e) => set('channel', e.target.value as PricingChannel)}><option value="retail">Retail / Customer</option><option value="agent">Agent / Partner</option></select></label>
          <label className="field"><span>{th ? 'ระดับโรงแรม' : 'Hotel category'}</span><select value={form.hotelCategory} onChange={(e) => set('hotelCategory', e.target.value as HotelCategory)}><option>3 Stars</option><option>4 Stars</option><option>5 Stars</option></select></label>
          <label className="field"><span>{th ? 'วันเริ่มเดินทาง' : 'Travel start'}</span><input type="date" value={form.travelStartDate} onChange={(e) => syncDates(e.target.value)}/></label>
          <label className="field"><span>{th ? 'วันสิ้นสุด' : 'Travel end'}</span><input type="date" value={form.travelEndDate} onChange={(e) => set('travelEndDate', e.target.value)}/></label>
          <label className="field"><span>{th ? 'จำนวนผู้เดินทาง' : 'No. of pax'}</span><input type="number" min="1" value={form.passengerCount} onChange={(e) => set('passengerCount', Number(e.target.value))}/></label>
          <div className="tracking-calc-action"><button className="secondary-button" type="button" onClick={calculateFromPricing}><CircleDollarSign/>{th ? 'ดึงราคาจากระบบคำนวณ' : 'Calculate from pricing system'}</button></div>
        </div>
        <div className="tracking-form-grid money-grid journey-money-grid">
          <MoneyField label={th ? 'ราคาขายต่อท่าน' : 'Selling / pax'} value={form.sellingPricePerPerson} onChange={(v) => set('sellingPricePerPerson', v)}/><MoneyField label={th ? 'ยอดแพ็กเกจทั้งหมด' : 'Total package amount'} value={form.totalAmount} onChange={(v) => set('totalAmount', v)}/><MoneyField label={th ? 'ราคาตั๋วรวมทั้งหมด' : 'Total ticket price'} value={form.ticketAmount} onChange={(v) => set('ticketAmount', v)}/><MoneyField label={th ? 'ภาษีสนามบินรวม' : 'Total airport tax'} value={form.airportTaxAmount} onChange={(v) => set('airportTaxAmount', v)}/><MoneyField label="LAND Payment" value={form.landPayment} onChange={(v) => set('landPayment', v)}/><div className={`calculated-money ${profit < 0 ? 'negative' : ''}`}><span>{th ? 'กำไรจากการขาย' : 'Profit from sales'}</span><strong>{formatTHB(profit, language)}</strong><small>{th ? 'ยอดขาย − ตั๋ว − ภาษี − LAND' : 'Sales − ticket − tax − land'}</small></div>
        </div>
      </WorkflowSection>

      <WorkflowSection number="03" icon={<Plane/>} title={th ? 'จองตั๋วและ Invoice งวดที่ 1' : 'Flight reservation & Invoice 1'} subtitle={th ? 'รับเอกสารลูกค้า จองตั๋ว บันทึก PNR และเก็บค่าตั๋วทั้งหมด' : 'Collect documents, reserve flights, record PNR and collect full airfare.'}>
        <div className="journey-check-grid">
          <MilestoneField label={th ? 'ได้รับหน้า Passport ครบ' : 'Passports received'} value={form.passportReceivedAt} onChange={(v) => set('passportReceivedAt', v)} onToday={() => markToday('passportReceivedAt')} th={th}/><MilestoneField label={th ? 'ได้รับรูปถ่ายครบ' : 'Photos received'} value={form.photoReceivedAt} onChange={(v) => set('photoReceivedAt', v)} onToday={() => markToday('photoReceivedAt')} th={th}/><MilestoneField label={th ? 'วันที่จองตั๋ว / ได้ PNR' : 'Flight reserved / PNR date'} value={form.flightReservedAt} onChange={(v) => set('flightReservedAt', v)} onToday={() => markToday('flightReservedAt')} th={th}/><MilestoneField label={th ? 'วันที่ส่งตั๋วให้ลูกค้า' : 'Ticket sent to customer'} value={form.ticketSentAt} onChange={(v) => set('ticketSentAt', v)} onToday={() => markToday('ticketSentAt')} th={th}/>
        </div>
        <div className="tracking-form-grid"><label className="field"><span>{th ? 'สายการบิน' : 'Airline'}</span><input value={form.airline} onChange={(e) => set('airline', e.target.value)}/></label><label className="field"><span>PNR</span><input value={form.flightPnr} onChange={(e) => set('flightPnr', e.target.value)} placeholder="ABC123"/></label><label className="field span-2"><span>{th ? 'รายชื่อผู้เดินทางทั้งหมด (1 คนต่อ 1 บรรทัด)' : 'Passenger names (one per line)'}</span><textarea rows={5} value={form.passengerNames} onChange={(e) => set('passengerNames', e.target.value)} placeholder={'1. SURNAME/FIRSTNAME MR\n2. SURNAME/FIRSTNAME MS'}/></label></div>
        <div className="installment-card first journey-invoice-card"><div className="installment-head"><span>1</span><div><b>{th ? 'Invoice 1 — ค่าตั๋วเครื่องบินทั้งหมด + ภาษีสนามบิน' : 'Invoice 1 — full airfare + airport tax'}</b><small>{th ? 'กำหนด Deadline เอง และส่งตั๋วหลังตรวจสอบยอดชำระ' : 'Set the deadline and send tickets after payment verification.'}</small></div></div><strong>{formatTHB(deposit, language)}</strong><div className="installment-fields"><label className="field"><span>{th ? 'กำหนดชำระ' : 'Due date'}</span><input type="date" value={form.depositDueDate} onChange={(e) => set('depositDueDate', e.target.value)}/></label><label className="field"><span>{th ? 'สถานะงวด 1' : 'Payment 1 status'}</span><select value={form.depositStatus} onChange={(e) => set('depositStatus', e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label><MilestoneField label={th ? 'วันที่ส่ง Invoice 1' : 'Invoice 1 sent'} value={form.invoice1SentAt} onChange={(v) => set('invoice1SentAt', v)} onToday={() => markToday('invoice1SentAt')} th={th}/><MilestoneField label={th ? 'วันที่รับชำระงวด 1' : 'Payment 1 received'} value={form.firstPaymentReceivedAt} onChange={(v) => set('firstPaymentReceivedAt', v)} onToday={() => markToday('firstPaymentReceivedAt')} th={th}/></div><button className="secondary-button" type="button" onClick={() => onIssueInvoice(normalizeBeforeSave(), 'deposit')}><ReceiptText/>{th ? 'เปิด / ออก Invoice 1' : 'Open / issue Invoice 1'}</button></div>
      </WorkflowSection>

      <WorkflowSection number="04" icon={<ShieldCheck/>} title={th ? 'ยื่นวีซ่าและ Invoice งวดที่ 2' : 'Visa submission & Invoice 2'} subtitle={th ? 'ส่งเอกสารให้ Land จัดทำ Invoice 2 และส่งวีซ่าให้ลูกค้า' : 'Submit documents to land, prepare Invoice 2 and send the visa to the customer.'}>
        <div className="tracking-form-grid"><label className="field"><span>LAND / Supplier</span><input value={form.landSupplier} onChange={(e) => set('landSupplier', e.target.value)} placeholder={th ? 'เช่น Aari Holiday / Amen' : 'e.g. Aari Holiday / Amen'}/></label><MilestoneField label={th ? 'ส่ง Passport + รูป + ตั๋วให้ Land' : 'Documents sent to land'} value={form.documentsSentToLandAt} onChange={(v) => set('documentsSentToLandAt', v)} onToday={() => markToday('documentsSentToLandAt')} th={th}/><MilestoneField label={th ? 'จัดทำ Invoice 2 แล้ว' : 'Invoice 2 prepared'} value={form.invoice2PreparedAt} onChange={(v) => set('invoice2PreparedAt', v)} onToday={() => markToday('invoice2PreparedAt')} th={th}/><MilestoneField label={th ? 'ได้รับวีซ่าจาก Land' : 'Visa received'} value={form.visaReceivedAt} onChange={(v) => set('visaReceivedAt', v)} onToday={() => markToday('visaReceivedAt')} th={th}/><MilestoneField label={th ? 'ส่งวีซ่า + Invoice 2 ให้ลูกค้า' : 'Visa + Invoice 2 sent'} value={form.visaSentAt} onChange={(v) => set('visaSentAt', v)} onToday={() => markToday('visaSentAt')} th={th}/><MilestoneField label={th ? 'รับชำระค่าแพ็กเกจครบ' : 'Full package payment received'} value={form.fullPaymentReceivedAt} onChange={(v) => set('fullPaymentReceivedAt', v)} onToday={() => markToday('fullPaymentReceivedAt')} th={th}/></div>
        <div className="installment-card second journey-invoice-card"><div className="installment-head"><span>2</span><div><b>{th ? 'Invoice 2 — ค่าแพ็กเกจส่วนที่เหลือ' : 'Invoice 2 — remaining package balance'}</b><small>{th ? 'ยอดแพ็กเกจทั้งหมด หักยอดค่าตั๋วที่ชำระแล้ว' : 'Full package total less ticket payments already received.'}</small></div></div><strong>{formatTHB(Math.max(0, form.totalAmount - paidTicket), language)}</strong><div className="installment-fields"><label className="field"><span>{th ? 'กำหนดชำระ' : 'Due date'}</span><input type="date" value={form.balanceDueDate} onChange={(e) => set('balanceDueDate', e.target.value)}/></label><label className="field"><span>{th ? 'สถานะงวด 2' : 'Payment 2 status'}</span><select value={form.balanceStatus} onChange={(e) => set('balanceStatus', e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label></div><button className="secondary-button" type="button" onClick={() => onIssueInvoice(normalizeBeforeSave(), 'balance')}><FileText/>{th ? 'เปิด / ออก Invoice 2' : 'Open / issue Invoice 2'}</button></div>
      </WorkflowSection>

      <WorkflowSection number="05" icon={<WalletCards/>} title={th ? 'ประวัติรับชำระเงิน' : 'Payment transactions'} subtitle={th ? 'รองรับลูกค้าทยอยชำระค่าตั๋วหลายครั้ง และใช้หักใน Invoice งวดที่ 2' : 'Supports multiple ticket payments and deducts them from Invoice 2.'}>
        <div className="payment-entry-form"><label className="field"><span>{th ? 'ประเภทรายการ' : 'Payment type'}</span><select value={paymentDraft.type} onChange={(e) => setPaymentDraft({ ...paymentDraft, type: e.target.value as PaymentTransactionType })}>{paymentTypes.map((x) => <option key={x} value={x}>{paymentTypeLabel(x, th)}</option>)}</select></label><MoneyField label={th ? 'จำนวนเงิน' : 'Amount'} value={paymentDraft.amount} onChange={(amount) => setPaymentDraft({ ...paymentDraft, amount })}/><label className="field"><span>{th ? 'วันที่รับชำระ' : 'Paid date'}</span><input type="date" value={paymentDraft.paidAt} onChange={(e) => setPaymentDraft({ ...paymentDraft, paidAt: e.target.value })}/></label><label className="field"><span>{th ? 'เลขอ้างอิง / ผู้ชำระ' : 'Reference / payer'}</span><input value={paymentDraft.reference} onChange={(e) => setPaymentDraft({ ...paymentDraft, reference: e.target.value })}/></label><label className="field payment-note"><span>{th ? 'หมายเหตุ' : 'Note'}</span><input value={paymentDraft.note} onChange={(e) => setPaymentDraft({ ...paymentDraft, note: e.target.value })}/></label><button className="primary-button payment-add-button" type="button" disabled={paymentDraft.amount <= 0} onClick={addPayment}><Plus/>{th ? 'บันทึกรับชำระ' : 'Record payment'}</button></div>
        <div className="payment-ledger"><div className="payment-ledger-head"><span>{th ? 'วันที่' : 'Date'}</span><span>{th ? 'รายการ' : 'Type'}</span><span>{th ? 'อ้างอิง' : 'Reference'}</span><span>{th ? 'จำนวนเงิน' : 'Amount'}</span><span/></div>{payments.length ? payments.map((payment) => <div className="payment-ledger-row" key={payment.id}><span>{payment.paidAt ? formatDate(payment.paidAt, language) : '-'}</span><span>{paymentTypeLabel(payment.type, th)}</span><span>{payment.reference || payment.note || '-'}</span><strong className={payment.type === 'refund' ? 'negative' : ''}>{payment.type === 'refund' ? '-' : ''}{formatTHB(Math.abs(payment.amount), language)}</strong><button className="danger" onClick={() => window.confirm(th ? 'ลบรายการรับชำระนี้?' : 'Delete this payment?') && onDeletePayment(payment.id)}><Trash2/></button></div>) : <div className="payment-ledger-empty">{th ? 'ยังไม่มีประวัติรับชำระ' : 'No payment transactions yet'}</div>}<div className="payment-ledger-total"><span>{th ? 'รับชำระรวม' : 'Total received'}</span><strong>{formatTHB(totalPaid, language)}</strong><span>{th ? 'ยอดคงเหลือ' : 'Balance'}</span><strong>{formatTHB(Math.max(0, form.totalAmount - totalPaid), language)}</strong></div></div>
      </WorkflowSection>

      <WorkflowSection number="06" icon={<FileCheck2/>} title={th ? 'Itinerary และความพร้อมเดินทาง' : 'Itinerary & travel readiness'} subtitle={th ? 'หลังชำระครบ ส่งกำหนดการ ตรวจเอกสาร และทำสถานะพร้อมเดินทาง' : 'After full payment, send itinerary, verify documents and mark ready.'}>
        <div className="journey-check-grid"><MilestoneField label={th ? 'ส่ง Itinerary แล้ว' : 'Itinerary sent'} value={form.itinerarySentAt} onChange={(v) => set('itinerarySentAt', v)} onToday={() => markToday('itinerarySentAt')} th={th}/><MilestoneField label={th ? 'ตรวจครบและพร้อมเดินทาง' : 'Ready to travel'} value={form.readyToTravelAt} onChange={(v) => set('readyToTravelAt', v)} onToday={() => markToday('readyToTravelAt')} th={th}/></div>
      </WorkflowSection>

      <WorkflowSection number="07" icon={<Flag/>} title={th ? 'หลังเดินทางและ Feedback' : 'Post-trip & feedback'} subtitle={th ? 'ติดตามหลังลูกค้ากลับ ขอความคิดเห็น และปิดจบงาน' : 'Follow up after the trip, request feedback and close the case.'}>
        <div className="journey-check-grid"><MilestoneField label={th ? 'ลูกค้าเดินทางกลับแล้ว' : 'Customer returned'} value={form.tripReturnedAt} onChange={(v) => set('tripReturnedAt', v)} onToday={() => markToday('tripReturnedAt')} th={th}/><MilestoneField label={th ? 'ส่งคำขอ Feedback' : 'Feedback requested'} value={form.feedbackRequestedAt} onChange={(v) => set('feedbackRequestedAt', v)} onToday={() => markToday('feedbackRequestedAt')} th={th}/><MilestoneField label={th ? 'ได้รับ Feedback' : 'Feedback received'} value={form.feedbackReceivedAt} onChange={(v) => set('feedbackReceivedAt', v)} onToday={() => markToday('feedbackReceivedAt')} th={th}/><MilestoneField label={th ? 'ปิดจบงาน' : 'Closed'} value={form.closedAt} onChange={(v) => set('closedAt', v)} onToday={() => markToday('closedAt')} th={th}/></div><label className="field"><span>{th ? 'Feedback / ความคิดเห็นลูกค้า' : 'Customer feedback'}</span><textarea rows={4} value={form.feedbackNote} onChange={(e) => set('feedbackNote', e.target.value)}/></label>
      </WorkflowSection>

      <WorkflowSection number="08" icon={<CalendarClock/>} title={th ? 'งานถัดไปและหมายเหตุภายใน' : 'Next action & internal notes'} subtitle={th ? 'กำหนดสิ่งที่ต้องทำต่อและ Deadline เพื่อไม่ให้หลุดการติดตาม' : 'Set the next action and deadline so nothing is missed.'}>
        <div className="tracking-form-grid"><label className="field span-2"><span>{th ? 'งานถัดไป' : 'Next action'}</span><input value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)} placeholder={nextRecommendedAction(form, th)}/></label><label className="field"><span>{th ? 'Deadline งานถัดไป' : 'Next action deadline'}</span><input type="date" value={form.nextActionDueDate} onChange={(e) => set('nextActionDueDate', e.target.value)}/></label><label className="field"><span>{th ? 'สถานะ Workflow ปัจจุบัน' : 'Current workflow stage'}</span><input value={stageLabel(currentStage, th)} readOnly/></label><label className="field span-2"><span>{th ? 'หมายเหตุภายใน' : 'Internal note'}</span><textarea rows={4} value={form.note} onChange={(e) => set('note', e.target.value)}/></label></div>
      </WorkflowSection>

      <div className="modal-actions tracking-modal-actions"><button className="ghost-button" onClick={onClose}>{th ? 'ปิด' : 'Close'}</button><button className="primary-button" disabled={!form.opportunityName.trim() || !form.customerName.trim()} onClick={saveAndStay}><BadgeCheck/>{th ? 'บันทึก Customer Journey' : 'Save customer journey'}</button></div>
    </div>
  </Modal>;
}

function WorkflowSection({ number, icon, title, subtitle, children }: { number: string; icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="editor-section journey-workflow-section"><div className="editor-section-title journey-section-title"><span>{number}</span><i>{icon}</i><div><h3>{title}</h3><p>{subtitle}</p></div></div>{children}</section>;
}
function MilestoneField({ label, value, onChange, onToday, th }: { label: string; value: string; onChange: (value: string) => void; onToday: () => void; th: boolean }) {
  return <div className={`milestone-field ${value ? 'done' : ''}`}><div><span className="milestone-check">{value ? <Check/> : <Hourglass/>}</span><label><b>{label}</b><input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)}/></label></div><button type="button" onClick={onToday}>{value ? (th ? 'อัปเดตวันนี้' : 'Update today') : (th ? 'ทำเครื่องหมายวันนี้' : 'Mark today')}</button></div>;
}
function MoneyField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="field money-input"><span>{label}</span><div><input type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(Number(e.target.value))}/><em>THB</em></div></label>;
}

function InvoicePreview({ value, language, payments, onClose, onSaveInvoice, onSaveTracking }: {
  value: { tracking: CustomerTracking; invoice: PaymentInvoice } | null; language: 'th' | 'en'; payments: PaymentTransaction[]; onClose: () => void;
  onSaveInvoice: (item: PaymentInvoice) => Promise<void>; onSaveTracking: (item: CustomerTracking) => Promise<void>;
}) {
  const th = language === 'th';
  const [status, setStatus] = useState<PaymentStageStatus>('invoiced');
  React.useEffect(() => setStatus(value?.invoice.status || 'invoiced'), [value]);
  if (!value) return null;
  const { tracking, invoice } = value; const isDeposit = invoice.installment === 'deposit';
  const ticketPayments = payments.filter((x) => x.type === 'ticket_deposit');
  const paidTicket = ticketPaidAmount(tracking, payments);
  const balanceDue = Math.max(0, tracking.totalAmount - paidTicket);
  async function updateStatus(next: PaymentStageStatus) {
    setStatus(next); const now = new Date().toISOString();
    await onSaveInvoice({ ...invoice, status: next, paidAt: next === 'paid' ? isoToday() : '', updatedAt: now });
    await onSaveTracking({ ...tracking, depositStatus: isDeposit ? next : tracking.depositStatus, balanceStatus: !isDeposit ? next : tracking.balanceStatus, firstPaymentReceivedAt: isDeposit && next === 'paid' ? (tracking.firstPaymentReceivedAt || isoToday()) : tracking.firstPaymentReceivedAt, fullPaymentReceivedAt: !isDeposit && next === 'paid' ? (tracking.fullPaymentReceivedAt || isoToday()) : tracking.fullPaymentReceivedAt, updatedAt: now });
  }
  return <Modal open title={th ? `Invoice งวดที่ ${isDeposit ? '1' : '2'}` : `Invoice ${isDeposit ? '1' : '2'}`} onClose={onClose} wide>
    <div className="invoice-toolbar no-print"><button className="ghost-button" onClick={onClose}><ArrowLeft/>{th ? 'กลับ' : 'Back'}</button><label><span>{th ? 'สถานะเอกสาร' : 'Status'}</span><select value={status} onChange={(e) => updateStatus(e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label><button className="primary-button" onClick={() => window.print()}><Download/>{th ? 'พิมพ์ / บันทึก PDF' : 'Print / Save PDF'}</button></div>
    <article className="invoice-sheet journey-invoice-sheet" id="invoice-print-area">
      <header className="invoice-header"><Brand/><div><span>INVOICE</span><h1>{th ? 'เอกสารเรียกเก็บเงิน' : 'Payment Invoice'}</h1><b>{invoice.invoiceNo}</b></div></header><div className="invoice-accent"/>
      <section className="invoice-meta"><div><span>{th ? 'เรียกเก็บจาก' : 'Bill to'}</span><strong>{tracking.customerName}</strong><small>{[tracking.phone, tracking.email].filter(Boolean).join(' · ') || '-'}</small></div><div><span>{th ? 'วันที่ออกเอกสาร' : 'Issue date'}</span><strong>{formatDate(invoice.issueDate, language)}</strong><small>{th ? 'ครบกำหนด' : 'Due'}: {invoice.dueDate ? formatDate(invoice.dueDate, language) : '-'}</small></div></section>
      <section className="invoice-trip-summary"><div><span>{th ? 'โปรแกรม' : 'Package'}</span><b>{tracking.packageName || '-'}</b></div><div><span>{th ? 'วันเดินทาง' : 'Travel date'}</span><b>{tracking.travelStartDate ? formatDate(tracking.travelStartDate, language) : '-'}</b></div><div><span>{th ? 'จำนวน' : 'Passengers'}</span><b>{tracking.passengerCount} {th ? 'ท่าน' : 'pax'}</b></div></section>
      <section className="journey-invoice-package"><h3>{th ? 'มูลค่าแพ็กเกจทั้งหมด' : 'Full package value'}</h3><div className="journey-invoice-package-head"><span>{th ? 'รายการ' : 'Passenger / Service'}</span><span>PTC</span><span>QTY</span><span>{th ? 'ราคาต่อท่าน' : 'Selling / Pax'}</span><span>{th ? 'รวม (บาท)' : 'Total (THB)'}</span></div><div className="journey-invoice-package-row"><span><b>{tracking.packageName}</b><small>{tracking.hotelCategory} · {tracking.travelStartDate && tracking.travelEndDate ? `${formatDate(tracking.travelStartDate, language)} – ${formatDate(tracking.travelEndDate, language)}` : ''}</small></span><span>ADT</span><span>{tracking.passengerCount}</span><span>{formatNumber(tracking.sellingPricePerPerson, 2)}</span><span>{formatNumber(tracking.totalAmount, 2)}</span></div></section>
      {isDeposit ? <section className="journey-payment-breakdown"><h3>{th ? 'การชำระงวดที่ 1 — ค่าตั๋วเครื่องบินทั้งหมด' : 'Payment 1 — full airfare deposit'}</h3><div><span>{th ? 'ค่าตั๋วเครื่องบินไป–กลับ ชั้น Economy' : 'Round-trip Economy Class airfare'}</span><b>{formatNumber(tracking.ticketAmount, 2)}</b></div><div><span>{th ? 'ภาษีสนามบินทั้งหมด' : 'Total airport taxes'}</span><b>{formatNumber(tracking.airportTaxAmount, 2)}</b></div><div className="journey-payment-due"><span>{th ? 'ยอดชำระงวดที่ 1' : 'Payment 1 amount due'}</span><strong>{formatNumber(tracking.depositAmount, 2)}</strong></div></section> : <section className="journey-payment-breakdown"><h3>{th ? 'การชำระงวดที่ 2 — ค่าแพ็กเกจส่วนที่เหลือ' : 'Payment 2 — remaining package balance'}</h3><div><span>{th ? 'ค่าแพ็กเกจทั้งหมด' : 'Full package amount'}</span><b>{formatNumber(tracking.totalAmount, 2)}</b></div>{ticketPayments.length ? ticketPayments.map((payment, index) => <div key={payment.id} className="deduction"><span>{th ? `หัก ค่าตั๋วเครื่องบินที่ชำระแล้ว ครั้งที่ ${index + 1}` : `Less ticket payment ${index + 1}`} {payment.reference ? `(${payment.reference})` : ''}</span><b>-{formatNumber(payment.amount, 2)}</b></div>) : <div className="deduction"><span>{th ? 'หัก ค่าตั๋วเครื่องบินที่ชำระแล้ว' : 'Less ticket payment received'}</span><b>-{formatNumber(paidTicket, 2)}</b></div>}<div className="journey-payment-due"><span>{th ? 'ยอดชำระงวดที่ 2' : 'Payment 2 amount due'}</span><strong>{formatNumber(balanceDue, 2)}</strong></div></section>}
      <section className="invoice-total"><div><span>{th ? `ยอดชำระงวดที่ ${isDeposit ? '1' : '2'}` : `Payment ${isDeposit ? '1' : '2'} due`}</span><strong>THB {formatNumber(isDeposit ? tracking.depositAmount : balanceDue, 2)}</strong><small>{invoice.dueDate ? `${th ? 'ภายในวันที่' : 'Due by'} ${formatDate(invoice.dueDate, language)}` : '-'}</small></div></section>
      <section className="invoice-note"><h3>{th ? 'หมายเหตุการชำระเงิน' : 'Payment note'}</h3><p>{isDeposit ? (th ? 'เมื่อบริษัทตรวจสอบยอดชำระงวดที่ 1 เรียบร้อยแล้ว เจ้าหน้าที่จะส่งตั๋วเครื่องบินให้ลูกค้า' : 'Flight tickets will be sent after Payment 1 is verified.') : (th ? 'หลังชำระค่าแพ็กเกจครบ บริษัทจะจัดทำและส่ง Itinerary พร้อมเอกสารเตรียมเดินทาง' : 'The itinerary and pre-departure documents will be sent after full payment.')}</p></section>
      <footer className="invoice-footer"><div><strong>OMG Experience Co., Ltd.</strong><span>info@omgexp.com · 02 630 4600 · omgexp.com</span></div><div><span>{th ? 'ผู้จัดทำ' : 'Prepared by'}</span><b>{tracking.salesOwnerName || '-'}</b></div></footer>
    </article>
  </Modal>;
}
