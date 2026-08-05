import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, BadgeCheck, CalendarClock, Check, ChevronDown, CircleDollarSign, ClipboardCheck,
  ClipboardList, Download, Edit3, FileCheck2, FileText, Filter, Flag, Hourglass, Landmark,
  LogOut, MessageSquareText, Plane, Plus, ReceiptText, Search, Send, Settings2, ShieldCheck,
  Sparkles, Trash2, UserRoundCheck, Users, WalletCards, Paperclip, ExternalLink, LoaderCircle, Upload, X,
} from 'lucide-react';
import {
  CustomerTracking, GlobalSettings, HotelCategory, InvoiceInstallment, JourneyStage, LeadSource,
  PaymentInvoice, PaymentStageStatus, PaymentTransaction, PaymentTransactionType, PricingChannel,
  SupplementalInvoiceLine, TourPackage, TrackingStatus, TravelerAddition, User,
} from '../types';
import { LanguageSwitch, useI18n } from '../i18n';
import { calculatePrice, normalizeAdditionalCharges } from '../utils/pricing';
import { formatDate, formatNumber, formatTHB, makeId } from '../utils/format';
import { printElementAsA4 } from '../utils/printA4';
import { Brand } from './Brand';
import { EmptyState, Modal } from './Ui';
import { AdditionalItemsEditor } from './AdditionalItemsEditor';

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
  onUploadPaymentSlip: (trackingId: string, paymentId: string, file: File) => Promise<{ path: string; fileName: string; mimeType: string; size: number }>;
  onGetPaymentSlipUrl: (path: string) => Promise<string>;
  onDeletePaymentSlip: (path: string) => Promise<void>;
}

const leadSources: LeadSource[] = ['LINE OA', 'LINE', 'Facebook', 'Call in', 'Referral', 'Walk in', 'Other'];
const statuses: TrackingStatus[] = ['new', 'following', 'quote_sent', 'won', 'lost', 'completed'];
const paymentStatuses: PaymentStageStatus[] = ['pending', 'invoiced', 'paid', 'overdue', 'cancelled'];
const paymentTypes: PaymentTransactionType[] = ['ticket_deposit', 'package_balance', 'supplemental', 'refund', 'other'];

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
function makeInvoiceNo(stage: InvoiceInstallment, sequenceNumber?: number) {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const code = stage === 'deposit' ? 'T1' : stage === 'balance' ? 'P2' : `X${sequenceNumber || 3}`;
  return `INV-BH-${y}${m}${d}-${code}-${Math.floor(100 + Math.random() * 900)}`;
}
function newSupplementalLine(): SupplementalInvoiceLine {
  return { id: makeId('xline'), description: '', quantity: 1, unitPriceTHB: 0, totalTHB: 0, costPerUnitTHB: 0, totalCostTHB: 0 };
}
function newTravelerAdditionDraft(tracking?: CustomerTracking | null): TravelerAddition {
  const now = isoToday();
  return {
    id: makeId('trav'), addedAt: now, passengerCount: 1, passengerNames: '', pnr: '', airline: tracking?.airline || 'Bhutan Airlines',
    packagePricePerPerson: Math.max(0, tracking?.sellingPricePerPerson || 0), ticketPricePerPerson: Math.max(0, tracking?.ticketPricePerPerson || 0),
    airportTaxPerPerson: Math.max(0, tracking?.airportTaxPerPerson || 0), landCostPerPerson: 0, businessUpgradeCount: 0,
    businessUpgradePerPerson: Math.max(0, tracking?.businessUpgradePerPerson || 15000), singleRoomCount: 0, singleSupplementPerPerson: 0,
    singleSupplementCostPerPerson: 0, extraLines: [], customerChargeTotal: 0, internalCostTotal: 0, invoiceId: '', note: '', status: 'active',
  };
}
function normalizeTravelerAddition(draft: TravelerAddition): TravelerAddition {
  const passengerCount = Math.max(1, Math.round(Number(draft.passengerCount || 1)));
  const businessUpgradeCount = Math.min(passengerCount, Math.max(0, Math.round(Number(draft.businessUpgradeCount || 0))));
  const singleRoomCount = Math.min(passengerCount, Math.max(0, Math.round(Number(draft.singleRoomCount || 0))));
  const extraLines = (draft.extraLines || []).map((line) => {
    const quantity = Math.max(1, Number(line.quantity || 1));
    const unitPriceTHB = Math.max(0, Number(line.unitPriceTHB || 0));
    const costPerUnitTHB = Math.max(0, Number(line.costPerUnitTHB || 0));
    return { ...line, description: line.description.trim(), quantity, unitPriceTHB, costPerUnitTHB, totalTHB: quantity * unitPriceTHB, totalCostTHB: quantity * costPerUnitTHB };
  }).filter((line) => line.description && (line.totalTHB > 0 || line.totalCostTHB > 0));
  const packagePricePerPerson = Math.max(0, Number(draft.packagePricePerPerson || 0));
  const ticketPricePerPerson = Math.max(0, Number(draft.ticketPricePerPerson || 0));
  const airportTaxPerPerson = Math.max(0, Number(draft.airportTaxPerPerson || 0));
  // LAND is settled later from the consolidated supplier invoice, so it is intentionally excluded here.
  const landCostPerPerson = 0;
  const businessUpgradePerPerson = Math.max(0, Number(draft.businessUpgradePerPerson || 0));
  const singleSupplementPerPerson = Math.max(0, Number(draft.singleSupplementPerPerson || 0));
  const singleSupplementCostPerPerson = Math.max(0, Number(draft.singleSupplementCostPerPerson || 0));
  const customerChargeTotal = packagePricePerPerson * passengerCount + businessUpgradePerPerson * businessUpgradeCount + singleSupplementPerPerson * singleRoomCount + extraLines.reduce((sum, line) => sum + line.totalTHB, 0);
  const internalCostTotal = (ticketPricePerPerson + airportTaxPerPerson) * passengerCount + singleSupplementCostPerPerson * singleRoomCount + extraLines.reduce((sum, line) => sum + line.totalCostTHB, 0);
  return { ...draft, passengerCount, businessUpgradeCount, singleRoomCount, packagePricePerPerson, ticketPricePerPerson, airportTaxPerPerson, landCostPerPerson, businessUpgradePerPerson, singleSupplementPerPerson, singleSupplementCostPerPerson, extraLines, customerChargeTotal, internalCostTotal };
}

interface TicketChangeDraft {
  changedAt: string;
  passengerCount: number;
  passengerNames: string;
  airline: string;
  originalPnr: string;
  newPnr: string;
  originalTravelDate: string;
  newTravelDate: string;
  fareDifferencePerPerson: number;
  airlineChangeFeePerPerson: number;
  serviceFeePerPerson: number;
  extraLines: SupplementalInvoiceLine[];
  note: string;
}
function newTicketChangeDraft(tracking?: CustomerTracking | null): TicketChangeDraft {
  return {
    changedAt: isoToday(), passengerCount: Math.max(1, tracking?.passengerCount || 1), passengerNames: tracking?.passengerNames || '',
    airline: tracking?.airline || 'Bhutan Airlines', originalPnr: tracking?.flightPnr || '', newPnr: '',
    originalTravelDate: tracking?.travelStartDate || '', newTravelDate: '', fareDifferencePerPerson: 0,
    airlineChangeFeePerPerson: 0, serviceFeePerPerson: 0, extraLines: [], note: '',
  };
}
function normalizeTicketChangeDraft(draft: TicketChangeDraft) {
  const passengerCount = Math.max(1, Math.round(Number(draft.passengerCount || 1)));
  const fareDifferencePerPerson = Math.max(0, Number(draft.fareDifferencePerPerson || 0));
  const airlineChangeFeePerPerson = Math.max(0, Number(draft.airlineChangeFeePerPerson || 0));
  const serviceFeePerPerson = Math.max(0, Number(draft.serviceFeePerPerson || 0));
  const extraLines = (draft.extraLines || []).map((line) => {
    const quantity = Math.max(1, Number(line.quantity || 1));
    const unitPriceTHB = Math.max(0, Number(line.unitPriceTHB || 0));
    const costPerUnitTHB = Math.max(0, Number(line.costPerUnitTHB || 0));
    return { ...line, description: line.description.trim(), quantity, unitPriceTHB, costPerUnitTHB, totalTHB: quantity * unitPriceTHB, totalCostTHB: quantity * costPerUnitTHB };
  }).filter((line) => line.description && (line.totalTHB > 0 || line.totalCostTHB > 0));
  const amount = passengerCount * (fareDifferencePerPerson + airlineChangeFeePerPerson + serviceFeePerPerson) + extraLines.reduce((sum, line) => sum + line.totalTHB, 0);
  const costAmount = passengerCount * (fareDifferencePerPerson + airlineChangeFeePerPerson) + extraLines.reduce((sum, line) => sum + line.totalCostTHB, 0);
  return { ...draft, passengerCount, fareDifferencePerPerson, airlineChangeFeePerPerson, serviceFeePerPerson, extraLines, amount, costAmount };
}
function addedPassengerCount(item: CustomerTracking) {
  return (item.travelerAdditions || []).filter((entry) => entry.status !== 'cancelled').reduce((sum, entry) => sum + Math.max(0, entry.passengerCount || 0), 0);
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
function supplementalInvoicesFor(trackingId: string, invoices: PaymentInvoice[]) {
  return invoices.filter((x) => x.trackingId === trackingId && x.installment === 'supplemental').sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}
function activeSupplementalInvoices(trackingId: string, invoices: PaymentInvoice[]) {
  return supplementalInvoicesFor(trackingId, invoices).filter((x) => x.status !== 'cancelled');
}
function supplementalInvoiceTotal(trackingId: string, invoices: PaymentInvoice[]) {
  return activeSupplementalInvoices(trackingId, invoices).reduce((sum, x) => sum + Math.max(0, x.amount || 0), 0);
}
function supplementalCostTotal(trackingId: string, invoices: PaymentInvoice[]) {
  return activeSupplementalInvoices(trackingId, invoices).reduce((sum, x) => sum + Math.max(0, x.costAmount || 0), 0);
}
function customerGrandTotal(item: CustomerTracking, invoices?: PaymentInvoice[]) {
  const extras = invoices ? supplementalInvoiceTotal(item.id, invoices) : Math.max(0, item.supplementalInvoiceTotal || 0);
  return Math.max(0, item.totalAmount || 0) + extras;
}
function invoicePaidAmount(invoiceId: string, payments: PaymentTransaction[]) {
  return payments.filter((x) => x.invoiceId === invoiceId).reduce((sum, x) => sum + (x.type === 'refund' ? -Math.abs(x.amount) : x.amount), 0);
}
function paymentSummary(item: CustomerTracking, payments: PaymentTransaction[]) {
  const deposit = effectiveStageStatus(item.depositStatus, item.depositDueDate);
  const balance = effectiveStageStatus(item.balanceStatus, item.balanceDueDate);
  const received = sumPayments(paymentsFor(item.id, payments));
  const grandTotal = Math.max(item.totalAmount || 0, item.grandTotalAmount || 0);
  if (balance === 'paid' && received >= grandTotal - 0.01 && grandTotal > 0) return 'paid';
  if (received >= grandTotal - 0.01 && grandTotal > 0) return 'paid';
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
  if (item.landPaidAt) return 'land_paid';
  if (item.fullPaymentReceivedAt || item.balanceStatus === 'paid') return 'land_payment_pending';
  if (item.visaSentAt) return 'visa_sent';
  if (item.visaReceivedAt) return 'visa_received';
  if (item.invoice2PreparedAt || item.balanceStatus === 'invoiced') return 'invoice_2_ready';
  if (item.landInvoiceReceivedAt || item.landInvoiceAmountUSD > 0) return 'land_invoice_received';
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
  first_payment_received: 'booking', ticket_sent: 'booking', documents_sent_to_land: 'visa', land_invoice_received: 'visa', invoice_2_ready: 'visa',
  visa_received: 'visa', visa_sent: 'visa', full_payment_received: 'visa', land_payment_pending: 'visa', land_paid: 'visa', itinerary_sent: 'visa', ready_to_travel: 'travel',
  traveling: 'travel', returned: 'after', feedback_requested: 'after', feedback_received: 'after', closed: 'after', cancelled: 'after',
};

function stageLabel(stage: JourneyStage, th: boolean) {
  const labels: Record<JourneyStage, [string, string]> = {
    lead: ['ลูกค้าใหม่ / รอเสนอราคา', 'New lead / quotation'], quotation_sent: ['ส่งราคาแล้ว', 'Quotation sent'],
    booking_confirmed: ['ยืนยันจอง / รอเอกสาร', 'Booking confirmed / documents'], flight_reserved: ['จองตั๋วแล้ว / มี PNR', 'Flight reserved / PNR'],
    invoice_1_sent: ['ส่ง Invoice 1 แล้ว', 'Invoice 1 sent'], first_payment_received: ['รับชำระค่าตั๋วแล้ว', 'Ticket payment received'],
    ticket_sent: ['ส่งตั๋วให้ลูกค้าแล้ว', 'Ticket sent'], documents_sent_to_land: ['ส่งเอกสารให้ Land แล้ว', 'Documents sent to land'],
    land_invoice_received: ['ได้รับ Land Invoice (USD)', 'Land invoice received (USD)'], invoice_2_ready: ['จัดทำ Invoice 2 แล้ว', 'Invoice 2 prepared'], visa_received: ['ได้รับวีซ่าแล้ว', 'Visa received'],
    visa_sent: ['ส่งวีซ่า + Invoice 2 แล้ว', 'Visa + Invoice 2 sent'], full_payment_received: ['ชำระครบแล้ว', 'Full payment received'],
    land_payment_pending: ['ชำระครบ / รอโอน LAND', 'Full payment / land transfer pending'], land_paid: ['โอน LAND แล้ว', 'Land supplier paid'],
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
    ticket_sent: ['ส่ง Passport + รูป + ตั๋วให้ Land', 'Submit passport, photo and ticket to land'], documents_sent_to_land: ['ติดตาม Land Invoice และยอด USD', 'Follow up land invoice and USD amount'],
    land_invoice_received: ['ออก Invoice 2 ค่าแพ็กเกจคงเหลือ', 'Issue Invoice 2 for package balance'], invoice_2_ready: ['ติดตามวีซ่าจาก Land', 'Follow up visa with land'], visa_received: ['ส่งวีซ่าและ Invoice 2 ให้ลูกค้า', 'Send visa and Invoice 2'],
    visa_sent: ['ติดตามชำระค่าแพ็กเกจส่วนที่เหลือ', 'Follow up final package payment'], full_payment_received: ['บันทึกอัตราแลกเปลี่ยนและโอนชำระ LAND', 'Record exchange rate and pay land supplier'],
    land_payment_pending: ['โอนชำระ LAND ตาม Invoice USD', 'Pay land supplier against USD invoice'], land_paid: ['จัดทำและส่ง Itinerary', 'Prepare and send itinerary'],
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
      const matchSearch = !q || [item.opportunityName, item.customerName, item.phone, item.email, item.packageName, item.airline, item.flightPnr, item.landSupplier, item.landInvoiceNo, item.landTransferReference, ...(item.travelerAdditions || []).flatMap((entry) => [entry.pnr, entry.passengerNames, entry.airline])]
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
      channel: 'retail', sellingPricePerPerson: 0, singleRoomCount: 0, singleSupplementPerPerson: 0, singleSupplementTotal: 0, totalAmount: 0, supplementalInvoiceTotal: 0, supplementalCostTotal: 0, grandTotalAmount: 0, travelerAdditions: [],
      ticketPricePerPerson: props.settings.ticketPriceTHB, ticketAmount: props.settings.ticketPriceTHB * 2,
      airportTaxPerPerson: props.settings.airportTaxTHB, airportTaxAmount: props.settings.airportTaxTHB * 2,
      businessUpgradeCount: 0, businessUpgradePerPerson: props.settings.businessUpgradeTHB ?? 15000, businessUpgradeTotal: 0,
      additionalItems: [], additionalItemsTotal: 0,
      landInvoiceNo: '', landInvoiceReceivedAt: '', landInvoiceAmountUSD: 0, landExchangeRate: 0, landTransferFeeTHB: 0, landPayment: 0, landPaidAt: '', landTransferReference: '', profitAmount: 0,
      depositAmount: 0, depositDueDate: '', depositStatus: 'pending', balanceAmount: 0, balanceDueDate: '', balanceStatus: 'pending',
      status: 'new', salesOwnerId: props.currentUser.id, salesOwnerName: props.currentUser.name, note: '', quotationSentAt: '', bookingConfirmedAt: '',
      passportReceivedAt: '', photoReceivedAt: '', passengerNames: '', flightPnr: '', flightReservedAt: '', invoice1SentAt: '', firstPaymentReceivedAt: '',
      ticketSentAt: '', documentsSentToLandAt: '', invoice2PreparedAt: '', visaReceivedAt: '', visaSentAt: '', fullPaymentReceivedAt: '', itinerarySentAt: '',
      readyToTravelAt: '', tripReturnedAt: '', feedbackRequestedAt: '', feedbackReceivedAt: '', feedbackNote: '', nextAction: '', nextActionDueDate: '', closedAt: '',
      createdAt: now, updatedAt: now,
    };
  }

  async function issueInvoice(tracking: CustomerTracking, installment: InvoiceInstallment) {
    if (installment === 'deposit') {
      const passengerNames = (tracking.passengerNames || '')
        .split(/\r?\n/)
        .map((name) => name.trim())
        .filter(Boolean);
      if (!tracking.flightPnr?.trim()) {
        window.alert(th ? 'กรุณากรอก PNR ก่อนออก Invoice งวดที่ 1' : 'Please enter the PNR before issuing Invoice 1.');
        return;
      }
      if (!passengerNames.length) {
        window.alert(th ? 'กรุณากรอกรายชื่อผู้เดินทางทั้งหมดก่อนออก Invoice งวดที่ 1' : 'Please enter all passenger names before issuing Invoice 1.');
        return;
      }
      if (passengerNames.length !== Math.max(1, tracking.passengerCount)) {
        const proceed = window.confirm(th
          ? `พบรายชื่อ ${passengerNames.length} รายชื่อ แต่จำนวนผู้เดินทางในระบบคือ ${tracking.passengerCount} ท่าน\nต้องการออก Invoice ต่อหรือไม่?`
          : `There are ${passengerNames.length} passenger names, while the booking has ${tracking.passengerCount} passengers.\nContinue issuing the invoice?`);
        if (!proceed) return;
      }
    }
    if (installment === 'balance' && !(tracking.landInvoiceReceivedAt || tracking.landInvoiceAmountUSD > 0)) {
      window.alert(th ? 'กรุณาบันทึก Land Invoice และยอด USD ก่อนออก Invoice 2' : 'Please record the land invoice and USD amount before issuing Invoice 2.');
      return;
    }
    const existing = props.invoices.find((x) => x.trackingId === tracking.id && x.installment === installment);
    const now = new Date().toISOString();
    const paidTicket = ticketPaidAmount(tracking, props.payments);
    const dueDate = installment === 'deposit' ? tracking.depositDueDate : tracking.balanceDueDate;
    const amount = installment === 'deposit' ? tracking.depositAmount : Math.max(0, tracking.totalAmount - paidTicket);
    const sequenceNumber = installment === 'deposit' ? 1 : 2;
    const invoice: PaymentInvoice = existing ? {
      ...existing, sequenceNumber, title: existing.title || (installment === 'deposit' ? 'ค่าตั๋วเครื่องบินและภาษีสนามบิน' : 'ค่าแพ็กเกจส่วนที่เหลือ'),
      lineItems: existing.lineItems || [], costAmount: existing.costAmount || 0,
      issueDate: existing.issueDate || isoToday(), dueDate, amount,
      status: existing.status === 'cancelled' ? 'invoiced' : existing.status, updatedAt: now,
    } : {
      id: makeId('inv'), trackingId: tracking.id, invoiceNo: makeInvoiceNo(installment, sequenceNumber), installment, sequenceNumber,
      title: installment === 'deposit' ? 'ค่าตั๋วเครื่องบินและภาษีสนามบิน' : 'ค่าแพ็กเกจส่วนที่เหลือ', lineItems: [], costAmount: 0,
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

  async function createSupplementalInvoice(tracking: CustomerTracking, draft: { title: string; dueDate: string; note: string; lineItems: SupplementalInvoiceLine[] }) {
    const lines = draft.lineItems
      .map((line) => ({
        ...line,
        description: line.description.trim(),
        quantity: Math.max(1, Number(line.quantity || 1)),
        unitPriceTHB: Math.max(0, Number(line.unitPriceTHB || 0)),
        costPerUnitTHB: Math.max(0, Number(line.costPerUnitTHB || 0)),
        totalTHB: Math.max(0, Number(line.quantity || 1)) * Math.max(0, Number(line.unitPriceTHB || 0)),
        totalCostTHB: Math.max(0, Number(line.quantity || 1)) * Math.max(0, Number(line.costPerUnitTHB || 0)),
      }))
      .filter((line) => line.description && line.totalTHB > 0);
    if (!lines.length) {
      window.alert(th ? 'กรุณาเพิ่มอย่างน้อย 1 รายการและระบุราคา ก่อนออก Invoice เพิ่มเติม' : 'Add at least one priced item before issuing a supplemental invoice.');
      return;
    }
    const fullyPaid = Boolean(tracking.fullPaymentReceivedAt) || tracking.balanceStatus === 'paid';
    if (!fullyPaid) {
      const proceed = window.confirm(th
        ? `ลูกค้ายังไม่ได้ถูกบันทึกว่า Full Payment\nต้องการออก Invoice เพิ่มเติมต่อหรือไม่?`
        : `The customer is not marked as fully paid yet.\nContinue with a supplemental invoice?`);
      if (!proceed) return;
    }
    const existingExtras = supplementalInvoicesFor(tracking.id, props.invoices);
    const sequenceNumber = Math.max(2, ...existingExtras.map((x) => x.sequenceNumber || 2)) + 1;
    const now = new Date().toISOString();
    const amount = lines.reduce((sum, x) => sum + x.totalTHB, 0);
    const costAmount = lines.reduce((sum, x) => sum + x.totalCostTHB, 0);
    const invoice: PaymentInvoice = {
      id: makeId('inv'), trackingId: tracking.id, invoiceNo: makeInvoiceNo('supplemental', sequenceNumber), installment: 'supplemental', sequenceNumber,
      title: draft.title.trim() || (th ? 'บริการเพิ่มเติมภายหลัง' : 'Additional services'), lineItems: lines, costAmount,
      issueDate: isoToday(), dueDate: draft.dueDate, amount, status: 'invoiced', paidAt: '', note: draft.note.trim(), createdAt: now, updatedAt: now,
    };
    await props.onSaveInvoice(invoice);
    const nextInvoiceList = [invoice, ...props.invoices.filter((x) => x.id !== invoice.id)];
    const extraRevenue = supplementalInvoiceTotal(tracking.id, nextInvoiceList);
    const extraCost = supplementalCostTotal(tracking.id, nextInvoiceList);
    const baseProfit = tracking.landPaidAt && tracking.landPayment > 0
      ? tracking.totalAmount - tracking.ticketAmount - tracking.airportTaxAmount - tracking.landPayment
      : 0;
    const nextTracking: CustomerTracking = {
      ...tracking,
      supplementalInvoiceTotal: extraRevenue,
      supplementalCostTotal: extraCost,
      grandTotalAmount: tracking.totalAmount + extraRevenue,
      profitAmount: baseProfit + (extraRevenue - extraCost),
      nextAction: th ? `ติดตามชำระ Invoice ${sequenceNumber}` : `Follow up Invoice ${sequenceNumber}`,
      nextActionDueDate: draft.dueDate || tracking.nextActionDueDate,
      updatedAt: now,
    };
    await props.onSaveTracking(nextTracking);
    setEditing(nextTracking);
    setInvoicePreview({ tracking: nextTracking, invoice });
  }

  async function createTravelerAdditionInvoice(tracking: CustomerTracking, rawDraft: TravelerAddition, dueDate: string) {
    const draft = normalizeTravelerAddition(rawDraft);
    const names = draft.passengerNames.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
    if (!draft.pnr.trim()) {
      window.alert(th ? 'กรุณากรอก PNR ของผู้เดินทางที่เพิ่ม' : 'Enter the PNR for the added travellers.');
      return;
    }
    if (!names.length) {
      window.alert(th ? 'กรุณากรอกรายชื่อผู้เดินทางที่เพิ่มทั้งหมด' : 'Enter all added passenger names.');
      return;
    }
    if (names.length !== draft.passengerCount) {
      const proceed = window.confirm(th
        ? `พบรายชื่อ ${names.length} รายชื่อ แต่ระบุจำนวนผู้เดินทางเพิ่ม ${draft.passengerCount} ท่าน\nต้องการดำเนินการต่อหรือไม่?`
        : `There are ${names.length} names, but ${draft.passengerCount} added travellers were entered.\nContinue?`);
      if (!proceed) return;
    }
    if (draft.packagePricePerPerson <= 0) {
      window.alert(th ? 'กรุณากรอกราคาขายแพ็กเกจต่อท่านสำหรับผู้เดินทางที่เพิ่ม' : 'Enter the package selling price per added traveller.');
      return;
    }
    if (tracking.travelStartDate && draft.addedAt >= tracking.travelStartDate) {
      window.alert(th ? 'ไม่สามารถเพิ่มผู้เดินทางในวันเริ่มเดินทางหรือหลังจากนั้นได้ กรุณาใช้เมนู “เลื่อนตั๋ว / เดินทางล่าช้า” แทน' : 'Travellers cannot be added on or after the trip start date. Use “Ticket change / delayed travel” instead.');
      return;
    }
    const existingExtras = supplementalInvoicesFor(tracking.id, props.invoices);
    const sequenceNumber = Math.max(2, ...existingExtras.map((x) => x.sequenceNumber || 2)) + 1;
    const now = new Date().toISOString();
    const lineItems: SupplementalInvoiceLine[] = [
      { id: makeId('xline'), description: th ? `แพ็กเกจ ${tracking.packageName} — ผู้เดินทางเพิ่ม` : `${tracking.packageName} — added traveller package`, quantity: draft.passengerCount, unitPriceTHB: draft.packagePricePerPerson, totalTHB: draft.passengerCount * draft.packagePricePerPerson, costPerUnitTHB: draft.ticketPricePerPerson + draft.airportTaxPerPerson, totalCostTHB: draft.passengerCount * (draft.ticketPricePerPerson + draft.airportTaxPerPerson) },
    ];
    if (draft.businessUpgradeCount > 0 && draft.businessUpgradePerPerson > 0) lineItems.push({ id: makeId('xline'), description: 'Business Class Upgrade', quantity: draft.businessUpgradeCount, unitPriceTHB: draft.businessUpgradePerPerson, totalTHB: draft.businessUpgradeCount * draft.businessUpgradePerPerson, costPerUnitTHB: 0, totalCostTHB: 0 });
    if (draft.singleRoomCount > 0 && draft.singleSupplementPerPerson > 0) lineItems.push({ id: makeId('xline'), description: th ? 'ส่วนต่างห้องพักเดี่ยว' : 'Single-room supplement', quantity: draft.singleRoomCount, unitPriceTHB: draft.singleSupplementPerPerson, totalTHB: draft.singleRoomCount * draft.singleSupplementPerPerson, costPerUnitTHB: draft.singleSupplementCostPerPerson, totalCostTHB: draft.singleRoomCount * draft.singleSupplementCostPerPerson });
    lineItems.push(...draft.extraLines);
    const invoice: PaymentInvoice = {
      id: makeId('inv'), trackingId: tracking.id, invoiceNo: makeInvoiceNo('supplemental', sequenceNumber), installment: 'supplemental', sequenceNumber,
      title: th ? `เพิ่มผู้เดินทางภายหลัง ${draft.passengerCount} ท่าน` : `Added travellers (${draft.passengerCount} pax)`, lineItems, costAmount: draft.internalCostTotal,
      issueDate: isoToday(), dueDate, amount: draft.customerChargeTotal, status: 'invoiced', paidAt: '',
      note: [draft.note, `PNR: ${draft.pnr}`, `${th ? 'ผู้เดินทาง' : 'Passengers'}: ${names.join(', ')}`].filter(Boolean).join('\n'), createdAt: now, updatedAt: now,
    };
    await props.onSaveInvoice(invoice);
    const addition: TravelerAddition = { ...draft, invoiceId: invoice.id, status: 'active' };
    const nextInvoiceList = [invoice, ...props.invoices.filter((x) => x.id !== invoice.id)];
    const extraRevenue = supplementalInvoiceTotal(tracking.id, nextInvoiceList);
    const extraCost = supplementalCostTotal(tracking.id, nextInvoiceList);
    const baseProfit = tracking.landPaidAt && tracking.landPayment > 0 ? tracking.totalAmount - tracking.ticketAmount - tracking.airportTaxAmount - tracking.landPayment : 0;
    const nextTracking: CustomerTracking = {
      ...tracking, travelerAdditions: [...(tracking.travelerAdditions || []), addition], supplementalInvoiceTotal: extraRevenue, supplementalCostTotal: extraCost,
      grandTotalAmount: tracking.totalAmount + extraRevenue, profitAmount: baseProfit + (extraRevenue - extraCost),
      nextAction: th ? `ติดตามชำระ Invoice ${sequenceNumber} สำหรับผู้เดินทางเพิ่ม` : `Follow up Invoice ${sequenceNumber} for added travellers`,
      nextActionDueDate: dueDate || tracking.nextActionDueDate, updatedAt: now,
    };
    await props.onSaveTracking(nextTracking);
    setEditing(nextTracking);
    setInvoicePreview({ tracking: nextTracking, invoice });
  }

  async function deleteSupplementalInvoice(tracking: CustomerTracking, invoice: PaymentInvoice) {
    if (invoice.installment !== 'supplemental') return;
    const linkedPayments = props.payments.filter((x) => x.invoiceId === invoice.id);
    if (linkedPayments.length) {
      window.alert(th ? 'Invoice นี้มีประวัติรับชำระแล้ว กรุณาเปลี่ยนสถานะเป็น “ยกเลิก” แทนการลบ' : 'This invoice already has payments. Mark it as cancelled instead of deleting it.');
      return;
    }
    if (!window.confirm(th ? `ลบ ${invoice.invoiceNo} ใช่หรือไม่?` : `Delete ${invoice.invoiceNo}?`)) return;
    await props.onDeleteInvoice(invoice.id);
    const nextInvoiceList = props.invoices.filter((x) => x.id !== invoice.id);
    const extraRevenue = supplementalInvoiceTotal(tracking.id, nextInvoiceList);
    const extraCost = supplementalCostTotal(tracking.id, nextInvoiceList);
    const baseProfit = tracking.landPaidAt && tracking.landPayment > 0
      ? tracking.totalAmount - tracking.ticketAmount - tracking.airportTaxAmount - tracking.landPayment
      : 0;
    const nextTracking = { ...tracking, travelerAdditions: (tracking.travelerAdditions || []).filter((entry) => entry.invoiceId !== invoice.id), supplementalInvoiceTotal: extraRevenue, supplementalCostTotal: extraCost, grandTotalAmount: tracking.totalAmount + extraRevenue, profitAmount: baseProfit + (extraRevenue - extraCost), updatedAt: new Date().toISOString() };
    await props.onSaveTracking(nextTracking);
    setEditing(nextTracking);
  }

  function openExistingInvoice(tracking: CustomerTracking, invoice: PaymentInvoice) {
    setInvoicePreview({ tracking, invoice });
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
          const remaining = Math.max(0, customerGrandTotal(item, props.invoices) - paid);
          const recommended = item.nextAction || nextRecommendedAction(item, th);
          return <article className="journey-card" key={item.id}>
            <div className="journey-card-customer"><span>{item.customerName?.[0]?.toUpperCase() || '?'}</span><div><b>{item.opportunityName || item.customerName || '-'}</b><small>{item.customerName}{item.leadSource ? ` · ${item.leadSource}` : ''}</small><em>{item.phone || item.email || '-'}</em></div></div>
            <div className="journey-card-stage"><span className={`journey-stage stage-${stageGroup[stage]}`}>{stageLabel(stage, th)}</span><small>{item.packageName || '-'} · {item.passengerCount + addedPassengerCount(item)} {th ? 'ท่าน' : 'pax'}</small><em>{item.travelStartDate ? formatDate(item.travelStartDate, language) : th ? 'ยังไม่กำหนดวันเดินทาง' : 'Travel date not set'}</em></div>
            <div className="journey-card-action"><small>{th ? 'งานถัดไป' : 'Next action'}</small><b>{recommended}</b><em className={item.nextActionDueDate && item.nextActionDueDate <= isoToday() ? 'overdue' : ''}>{item.nextActionDueDate ? `${th ? 'ภายใน' : 'Due'} ${formatDate(item.nextActionDueDate, language)}` : th ? 'ยังไม่กำหนด Deadline' : 'No deadline'}</em></div>
            <div className="journey-card-payment"><small>{th ? 'รับชำระ / ยอดคงเหลือ' : 'Paid / balance'}</small><b>{formatTHB(paid, language)} <span>/ {formatTHB(remaining, language)}</span></b><PaymentBadge status={paymentSummary(item, props.payments)} th={th}/></div>
            <div className="journey-card-actions"><button className="invoice-one" onClick={() => issueInvoice(item, 'deposit')}><ReceiptText/><span>{th ? 'Invoice 1' : 'Invoice 1'}</span></button><button className="invoice-two" onClick={() => issueInvoice(item, 'balance')}><FileText/><span>{th ? 'Invoice 2' : 'Invoice 2'}</span></button><button onClick={() => setEditing(item)} title={th ? 'เปิดรายละเอียด' : 'Open details'}><Edit3/></button><button className="danger" onClick={() => window.confirm(th ? 'ยืนยันการลบรายการนี้?' : 'Delete this record?') && props.onDeleteTracking(item.id)}><Trash2/></button></div>
          </article>;
        })}</div> : <EmptyState title={th ? 'ยังไม่มีข้อมูลที่ตรงกับตัวกรอง' : 'No matching records'} detail={th ? 'กด “เพิ่มลูกค้าใหม่” เพื่อเริ่มติดตามกระบวนการ' : 'Add a customer to start the workflow.'}/>} 
      </section>
    </main>

    <TrackingEditor open={Boolean(editing)} item={editing} settings={props.settings} packages={props.packages} users={props.users} currentUser={props.currentUser}
      payments={editing ? paymentsFor(editing.id, props.payments) : []} invoices={editing ? supplementalInvoicesFor(editing.id, props.invoices) : []}
      onClose={() => setEditing(null)} onSave={async (item) => { await props.onSaveTracking(item); setEditing(item); }}
      onSavePayment={props.onSavePayment} onDeletePayment={props.onDeletePayment} onSaveInvoice={props.onSaveInvoice} onIssueInvoice={issueInvoice}
      onCreateSupplementalInvoice={createSupplementalInvoice} onCreateTravelerAddition={createTravelerAdditionInvoice} onOpenInvoice={openExistingInvoice} onDeleteSupplementalInvoice={deleteSupplementalInvoice}
      onUploadPaymentSlip={props.onUploadPaymentSlip} onGetPaymentSlipUrl={props.onGetPaymentSlipUrl} onDeletePaymentSlip={props.onDeletePaymentSlip}/>
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
  const labels = th ? { ticket_deposit: 'ค่าตั๋ว / งวดที่ 1', package_balance: 'ค่าแพ็กเกจ / งวดที่ 2', supplemental: 'Invoice เพิ่มเติม (งวด 3+)', refund: 'คืนเงิน', other: 'อื่น ๆ' } : { ticket_deposit: 'Ticket payment / Stage 1', package_balance: 'Package payment / Stage 2', supplemental: 'Supplemental invoice (3+)', refund: 'Refund', other: 'Other' };
  return labels[type];
}

function TrackingEditor({ open, item, settings, packages, users, currentUser, payments, invoices, onClose, onSave, onSavePayment, onDeletePayment, onSaveInvoice, onIssueInvoice, onCreateSupplementalInvoice, onCreateTravelerAddition, onOpenInvoice, onDeleteSupplementalInvoice, onUploadPaymentSlip, onGetPaymentSlipUrl, onDeletePaymentSlip }: {
  open: boolean; item: CustomerTracking | null; settings: GlobalSettings; packages: TourPackage[]; users: User[]; currentUser: User; payments: PaymentTransaction[]; invoices: PaymentInvoice[];
  onClose: () => void; onSave: (item: CustomerTracking) => Promise<void>; onSavePayment: (item: PaymentTransaction) => Promise<void>; onDeletePayment: (id: string) => Promise<void>; onSaveInvoice: (item: PaymentInvoice) => Promise<void>;
  onIssueInvoice: (tracking: CustomerTracking, installment: InvoiceInstallment) => Promise<void>;
  onCreateSupplementalInvoice: (tracking: CustomerTracking, draft: { title: string; dueDate: string; note: string; lineItems: SupplementalInvoiceLine[] }) => Promise<void>;
  onCreateTravelerAddition: (tracking: CustomerTracking, draft: TravelerAddition, dueDate: string) => Promise<void>;
  onOpenInvoice: (tracking: CustomerTracking, invoice: PaymentInvoice) => void;
  onDeleteSupplementalInvoice: (tracking: CustomerTracking, invoice: PaymentInvoice) => Promise<void>;
  onUploadPaymentSlip: (trackingId: string, paymentId: string, file: File) => Promise<{ path: string; fileName: string; mimeType: string; size: number }>;
  onGetPaymentSlipUrl: (path: string) => Promise<string>;
  onDeletePaymentSlip: (path: string) => Promise<void>;
}) {
  const { language } = useI18n();
  const th = language === 'th';
  const [form, setForm] = useState<CustomerTracking | null>(item);
  const [paymentDraft, setPaymentDraft] = useState<{ type: PaymentTransactionType; invoiceId: string; amount: number; paidAt: string; reference: string; note: string; slipFile: File | null }>({ type: 'ticket_deposit', invoiceId: '', amount: 0, paidAt: isoToday(), reference: '', note: '', slipFile: null });
  const [supplementalDraft, setSupplementalDraft] = useState<{ title: string; dueDate: string; note: string; lineItems: SupplementalInvoiceLine[] }>({ title: '', dueDate: '', note: '', lineItems: [newSupplementalLine()] });
  const [supplementalBusy, setSupplementalBusy] = useState(false);
  const [travelerDraft, setTravelerDraft] = useState<TravelerAddition>(newTravelerAdditionDraft(item));
  const [travelerDueDate, setTravelerDueDate] = useState('');
  const [travelerBusy, setTravelerBusy] = useState(false);
  const [travelerPanelOpen, setTravelerPanelOpen] = useState(false);
  const [ticketChangeDraft, setTicketChangeDraft] = useState<TicketChangeDraft>(newTicketChangeDraft(item));
  const [ticketChangeDueDate, setTicketChangeDueDate] = useState('');
  const [ticketChangeBusy, setTicketChangeBusy] = useState(false);
  const [ticketChangePanelOpen, setTicketChangePanelOpen] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState<string>('');
  const [slipInputKey, setSlipInputKey] = useState(0);
  React.useEffect(() => { setForm(item ? { ...item, travelerAdditions: item.travelerAdditions || [] } : item); setSupplementalDraft({ title: '', dueDate: '', note: '', lineItems: [newSupplementalLine()] }); setTravelerDraft(newTravelerAdditionDraft(item)); setTravelerDueDate(''); setTravelerPanelOpen(false); setTicketChangeDraft(newTicketChangeDraft(item)); setTicketChangeDueDate(''); setTicketChangePanelOpen(false); }, [item]);
  if (!form) return null;
  const currentForm = form;
  const set = <K extends keyof CustomerTracking>(key: K, value: CustomerTracking[K]) => setForm((current) => current ? ({ ...current, [key]: value }) : current);

  function recalculateFinancials(current: CustomerTracking, patch: Partial<CustomerTracking> = {}): CustomerTracking {
    const next = { ...current, ...patch };
    const pax = Math.max(1, Math.round(Number(next.passengerCount || 1)));
    const singleRoomCount = Math.min(pax, Math.max(0, Math.round(Number(next.singleRoomCount || 0))));
    const singleSupplementPerPerson = Math.max(0, Number(next.singleSupplementPerPerson || 0));
    const singleSupplementTotal = singleRoomCount * singleSupplementPerPerson;
    const additionalItems = normalizeAdditionalCharges(next.additionalItems || [], pax);
    const additionalItemsTotal = additionalItems.reduce((sum, item) => sum + item.totalTHB, 0);
    const sellingPricePerPerson = Math.max(0, Number(next.sellingPricePerPerson || 0));
    const ticketPricePerPerson = Math.max(0, Number(next.ticketPricePerPerson || (next.ticketAmount && next.ticketAmount / pax) || 0));
    const airportTaxPerPerson = Math.max(0, Number(next.airportTaxPerPerson || (next.airportTaxAmount && next.airportTaxAmount / pax) || 0));
    const businessUpgradeCount = Math.min(pax, Math.max(0, Math.round(Number(next.businessUpgradeCount || 0))));
    const businessUpgradePerPerson = Math.max(0, Number(next.businessUpgradePerPerson || 0));
    const businessUpgradeTotal = businessUpgradeCount * businessUpgradePerPerson;
    const packageBaseTotal = sellingPricePerPerson * pax;
    const totalAmount = packageBaseTotal + singleSupplementTotal + businessUpgradeTotal + additionalItemsTotal;
    const ticketAmount = ticketPricePerPerson * pax;
    const airportTaxAmount = airportTaxPerPerson * pax;
    const depositAmount = ticketAmount + airportTaxAmount;
    const paidTicket = ticketPaidAmount({ ...next, depositAmount } as CustomerTracking, payments);
    const balanceAmount = Math.max(0, totalAmount - paidTicket);
    const landPayment = Math.max(0, Number(next.landPayment || 0));
    const supplementalInvoiceTotalValue = Math.max(0, Number(next.supplementalInvoiceTotal || 0));
    const supplementalCostTotalValue = Math.max(0, Number(next.supplementalCostTotal || 0));
    const grandTotalAmount = totalAmount + supplementalInvoiceTotalValue;
    const baseProfit = next.landPaidAt && landPayment > 0
      ? totalAmount - ticketAmount - airportTaxAmount - landPayment
      : 0;
    const profitAmount = baseProfit + (supplementalInvoiceTotalValue - supplementalCostTotalValue);
    return {
      ...next,
      passengerCount: pax,
      sellingPricePerPerson,
      singleRoomCount,
      singleSupplementPerPerson,
      singleSupplementTotal,
      additionalItems,
      additionalItemsTotal,
      totalAmount,
      supplementalInvoiceTotal: supplementalInvoiceTotalValue,
      supplementalCostTotal: supplementalCostTotalValue,
      grandTotalAmount,
      ticketPricePerPerson,
      ticketAmount,
      airportTaxPerPerson,
      airportTaxAmount,
      businessUpgradeCount,
      businessUpgradePerPerson,
      businessUpgradeTotal,
      depositAmount,
      balanceAmount,
      profitAmount,
    };
  }

  function updatePricingFields(patch: Partial<CustomerTracking>) {
    setForm((current) => current ? recalculateFinancials(current, patch) : current);
  }

  function updateSingleRoomDetails(nextCount: number, nextPerPerson: number) {
    updatePricingFields({ singleRoomCount: nextCount, singleSupplementPerPerson: nextPerPerson });
  }
  const selectedPackage = packages.find((x) => x.id === currentForm.packageId);
  const currentStage = getJourneyStage(currentForm);
  const travelHasStarted = !!currentForm.travelStartDate && isoToday() >= currentForm.travelStartDate;

  function updateLandFinancials(patch: Partial<Pick<CustomerTracking, 'landInvoiceAmountUSD' | 'landExchangeRate' | 'landTransferFeeTHB'>>) {
    setForm((current) => {
      if (!current) return current;
      const base = recalculateFinancials(current, patch);
      const usd = Math.max(0, base.landInvoiceAmountUSD || 0);
      const rate = Math.max(0, base.landExchangeRate || 0);
      const fee = Math.max(0, base.landTransferFeeTHB || 0);
      const landPayment = usd > 0 && rate > 0 ? Math.round((usd * rate + fee) * 100) / 100 : 0;
      const baseProfit = base.landPaidAt && landPayment > 0
        ? base.totalAmount - base.ticketAmount - base.airportTaxAmount - landPayment
        : 0;
      const profitAmount = baseProfit + Math.max(0, base.supplementalInvoiceTotal || 0) - Math.max(0, base.supplementalCostTotal || 0);
      return { ...base, landPayment, profitAmount };
    });
  }

  function syncDates(start: string, packageNights = selectedPackage?.nights || 0) {
    setForm((current) => current ? ({ ...current, travelStartDate: start, travelEndDate: start ? addDays(start, packageNights) : '', balanceDueDate: start ? minusOneMonth(start) : '' }) : current);
  }
  function syncPackage(id: string) {
    const pkg = packages.find((x) => x.id === id);
    setForm((current) => current ? recalculateFinancials(current, {
      packageId: id,
      packageName: pkg?.name || '',
      travelEndDate: current.travelStartDate ? addDays(current.travelStartDate, pkg?.nights || 0) : current.travelEndDate,
      singleSupplementPerPerson: 0,
      singleRoomCount: 0,
    }) : current);
  }
  function syncHotelCategory(category: HotelCategory) {
    updatePricingFields({ hotelCategory: category, singleSupplementPerPerson: 0, singleRoomCount: 0 });
  }
  function calculateFromPricing() {
    if (!currentForm.packageId) return;
    const result = calculatePrice({
      channel: currentForm.channel,
      packageId: currentForm.packageId,
      passengerCount: Math.max(1, currentForm.passengerCount),
      hotelCategory: currentForm.hotelCategory,
      travelDate: currentForm.travelStartDate,
      businessUpgradeCount: currentForm.businessUpgradeCount || 0,
      businessUpgradePriceOverrideTHB: currentForm.businessUpgradePerPerson > 0 ? currentForm.businessUpgradePerPerson : null,
      singleRoomCount: Math.min(Math.max(0, currentForm.singleRoomCount || 0), Math.max(1, currentForm.passengerCount)),
      singleSupplementOverrideTHB: currentForm.singleSupplementPerPerson > 0 ? currentForm.singleSupplementPerPerson : null,
      additionalItems: currentForm.additionalItems || [],
    }, settings, packages);
    if (!result) return;
    setForm((current) => current ? recalculateFinancials(current, {
      packageName: result.packageName,
      sellingPricePerPerson: result.sellingPricePerPerson,
      singleRoomCount: result.singleRoomCount,
      singleSupplementPerPerson: result.singleSupplementPerPerson,
      ticketPricePerPerson: result.airTicketPerPerson,
      airportTaxPerPerson: result.airportTaxPerPerson,
      businessUpgradeCount: result.businessUpgradeCount,
      businessUpgradePerPerson: result.businessUpgradePerPerson,
      additionalItems: result.additionalItems,
      balanceDueDate: current.travelStartDate ? minusOneMonth(current.travelStartDate) : current.balanceDueDate,
    }) : current);
  }
  function normalizeBeforeSave(): CustomerTracking {
    const recalculated = recalculateFinancials(currentForm);
    const computedLandPayment = recalculated.landInvoiceAmountUSD > 0 && recalculated.landExchangeRate > 0
      ? Math.max(0, recalculated.landInvoiceAmountUSD * recalculated.landExchangeRate + Math.max(0, recalculated.landTransferFeeTHB || 0))
      : Math.max(0, recalculated.landPayment || 0);
    const owner = users.find((x) => x.id === recalculated.salesOwnerId);
    let status = recalculated.status;
    if (recalculated.closedAt) status = 'completed';
    else if (recalculated.bookingConfirmedAt && status !== 'lost') status = 'won';
    else if (recalculated.quotationSentAt && ['new', 'following'].includes(status)) status = 'quote_sent';
    return {
      ...recalculated,
      landInvoiceAmountUSD: Math.max(0, recalculated.landInvoiceAmountUSD || 0),
      landExchangeRate: Math.max(0, recalculated.landExchangeRate || 0),
      landTransferFeeTHB: Math.max(0, recalculated.landTransferFeeTHB || 0),
      landPayment: computedLandPayment,
      grandTotalAmount: recalculated.totalAmount + Math.max(0, recalculated.supplementalInvoiceTotal || 0),
      profitAmount: (recalculated.landPaidAt && computedLandPayment > 0
        ? recalculated.totalAmount - recalculated.ticketAmount - recalculated.airportTaxAmount - computedLandPayment
        : 0) + Math.max(0, recalculated.supplementalInvoiceTotal || 0) - Math.max(0, recalculated.supplementalCostTotal || 0),
      status,
      salesOwnerName: owner?.name || recalculated.salesOwnerName || currentUser.name,
      updatedAt: new Date().toISOString(),
    };
  }
  async function saveAndStay() { const normalized = normalizeBeforeSave(); setForm(normalized); await onSave(normalized); }
  async function markToday(key: keyof CustomerTracking) {
    let next = { ...currentForm, [key]: isoToday() } as CustomerTracking;
    if (key === 'landPaidAt') {
      const landPayment = next.landInvoiceAmountUSD > 0 && next.landExchangeRate > 0
        ? Math.max(0, next.landInvoiceAmountUSD * next.landExchangeRate + Math.max(0, next.landTransferFeeTHB || 0))
        : Math.max(0, next.landPayment || 0);
      next = { ...next, landPayment, grandTotalAmount: next.totalAmount + Math.max(0, next.supplementalInvoiceTotal || 0), profitAmount: (landPayment > 0 ? next.totalAmount - next.ticketAmount - next.airportTaxAmount - landPayment : 0) + Math.max(0, next.supplementalInvoiceTotal || 0) - Math.max(0, next.supplementalCostTotal || 0) };
    }
    setForm(next);
    await onSave({ ...next, updatedAt: new Date().toISOString() });
  }
  async function addPayment() {
    if (paymentDraft.amount <= 0 || !paymentDraft.paidAt || paymentBusy) return;
    if (paymentDraft.type === 'supplemental' && !paymentDraft.invoiceId) { window.alert(th ? 'กรุณาเลือก Invoice เพิ่มเติมที่รับชำระ' : 'Select the supplemental invoice being paid.'); return; }
    const now = new Date().toISOString();
    const paymentId = makeId('pay');
    setPaymentBusy(paymentId);
    try {
      let slip = { path: '', fileName: '', mimeType: '', size: 0 };
      if (paymentDraft.slipFile) slip = await onUploadPaymentSlip(currentForm.id, paymentId, paymentDraft.slipFile);
      const transaction: PaymentTransaction = {
        id: paymentId,
        trackingId: currentForm.id,
        invoiceId: paymentDraft.type === 'supplemental' ? paymentDraft.invoiceId : '',
        type: paymentDraft.type,
        amount: paymentDraft.amount,
        paidAt: paymentDraft.paidAt,
        reference: paymentDraft.reference,
        note: paymentDraft.note,
        slipPath: slip.path,
        slipFileName: slip.fileName,
        slipMimeType: slip.mimeType,
        slipSize: slip.size,
        createdAt: now,
        updatedAt: now,
      };
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
      if (paymentDraft.type === 'supplemental' && paymentDraft.invoiceId) {
        const targetInvoice = invoices.find((x) => x.id === paymentDraft.invoiceId);
        if (targetInvoice) {
          const previousPaid = invoicePaidAmount(targetInvoice.id, payments);
          const fullyPaid = previousPaid + paymentDraft.amount >= targetInvoice.amount - 0.01;
          await onSaveInvoice({ ...targetInvoice, status: fullyPaid ? 'paid' : 'invoiced', paidAt: fullyPaid ? paymentDraft.paidAt : targetInvoice.paidAt, updatedAt: now });
        }
      }
      setForm(next);
      await onSave({ ...next, updatedAt: now });
      setPaymentDraft({ type: 'ticket_deposit', invoiceId: '', amount: 0, paidAt: isoToday(), reference: '', note: '', slipFile: null });
      setSlipInputKey((key) => key + 1);
    } finally {
      setPaymentBusy('');
    }
  }

  async function viewPaymentSlip(payment: PaymentTransaction) {
    if (!payment.slipPath || paymentBusy) return;
    const previewWindow = window.open('', '_blank');
    setPaymentBusy(payment.id);
    try {
      const url = await onGetPaymentSlipUrl(payment.slipPath);
      if (previewWindow) {
        previewWindow.opener = null;
        previewWindow.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (error) {
      previewWindow?.close();
      throw error;
    } finally {
      setPaymentBusy('');
    }
  }

  async function replacePaymentSlip(payment: PaymentTransaction, file: File) {
    if (!file || paymentBusy) return;
    setPaymentBusy(payment.id);
    try {
      const previousPath = payment.slipPath;
      const slip = await onUploadPaymentSlip(currentForm.id, payment.id, file);
      await onSavePayment({ ...payment, slipPath: slip.path, slipFileName: slip.fileName, slipMimeType: slip.mimeType, slipSize: slip.size, updatedAt: new Date().toISOString() });
      if (previousPath && previousPath !== slip.path) await onDeletePaymentSlip(previousPath);
    } finally {
      setPaymentBusy('');
    }
  }

  async function submitSupplementalInvoice() {
    if (supplementalBusy) return;
    setSupplementalBusy(true);
    try {
      const normalized = normalizeBeforeSave();
      await onSave(normalized);
      await onCreateSupplementalInvoice(normalized, supplementalDraft);
      setSupplementalDraft({ title: '', dueDate: '', note: '', lineItems: [newSupplementalLine()] });
    } finally {
      setSupplementalBusy(false);
    }
  }

  async function submitTravelerAddition() {
    if (travelerBusy) return;
    setTravelerBusy(true);
    try {
      const normalized = normalizeBeforeSave();
      await onSave(normalized);
      await onCreateTravelerAddition(normalized, travelerDraft, travelerDueDate);
      setTravelerDraft(newTravelerAdditionDraft(normalized));
      setTravelerDueDate('');
      setTravelerPanelOpen(false);
    } finally {
      setTravelerBusy(false);
    }
  }

  async function submitTicketChange() {
    if (ticketChangeBusy) return;
    const calculated = normalizeTicketChangeDraft(ticketChangeDraft);
    const names = calculated.passengerNames.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
    if (!calculated.originalPnr.trim()) { window.alert(th ? 'กรุณากรอก PNR เดิม' : 'Enter the original PNR.'); return; }
    if (!calculated.newTravelDate) { window.alert(th ? 'กรุณาระบุวันเดินทางใหม่' : 'Enter the new travel date.'); return; }
    if (calculated.amount <= 0) { window.alert(th ? 'กรุณากรอกค่าธรรมเนียมหรือส่วนต่างที่ต้องเรียกเก็บ' : 'Enter the fees or fare difference to charge.'); return; }
    if (names.length && names.length !== calculated.passengerCount) {
      const proceed = window.confirm(th ? `พบรายชื่อ ${names.length} รายชื่อ แต่ระบุผู้โดยสาร ${calculated.passengerCount} ท่าน\nต้องการดำเนินการต่อหรือไม่?` : `There are ${names.length} names but ${calculated.passengerCount} passengers.\nContinue?`);
      if (!proceed) return;
    }
    setTicketChangeBusy(true);
    try {
      const normalized = normalizeBeforeSave();
      await onSave(normalized);
      const lines: SupplementalInvoiceLine[] = [];
      if (calculated.fareDifferencePerPerson > 0) lines.push({ id: makeId('xline'), description: th ? 'ส่วนต่างค่าตั๋วเครื่องบิน' : 'Airfare difference', quantity: calculated.passengerCount, unitPriceTHB: calculated.fareDifferencePerPerson, totalTHB: calculated.passengerCount * calculated.fareDifferencePerPerson, costPerUnitTHB: calculated.fareDifferencePerPerson, totalCostTHB: calculated.passengerCount * calculated.fareDifferencePerPerson });
      if (calculated.airlineChangeFeePerPerson > 0) lines.push({ id: makeId('xline'), description: th ? 'ค่าธรรมเนียมเปลี่ยนเที่ยวบิน / ออกตั๋วใหม่' : 'Flight change / reissue fee', quantity: calculated.passengerCount, unitPriceTHB: calculated.airlineChangeFeePerPerson, totalTHB: calculated.passengerCount * calculated.airlineChangeFeePerPerson, costPerUnitTHB: calculated.airlineChangeFeePerPerson, totalCostTHB: calculated.passengerCount * calculated.airlineChangeFeePerPerson });
      if (calculated.serviceFeePerPerson > 0) lines.push({ id: makeId('xline'), description: th ? 'ค่าบริการดำเนินการเปลี่ยนตั๋ว' : 'Ticket-change service fee', quantity: calculated.passengerCount, unitPriceTHB: calculated.serviceFeePerPerson, totalTHB: calculated.passengerCount * calculated.serviceFeePerPerson, costPerUnitTHB: 0, totalCostTHB: 0 });
      lines.push(...calculated.extraLines);
      const note = [
        `${th ? 'สายการบิน' : 'Airline'}: ${calculated.airline || '-'}`,
        `${th ? 'PNR เดิม' : 'Original PNR'}: ${calculated.originalPnr}`,
        calculated.newPnr ? `${th ? 'PNR ใหม่' : 'New PNR'}: ${calculated.newPnr}` : '',
        `${th ? 'วันเดินทางเดิม' : 'Original travel date'}: ${calculated.originalTravelDate || '-'}`,
        `${th ? 'วันเดินทางใหม่' : 'New travel date'}: ${calculated.newTravelDate}`,
        names.length ? `${th ? 'ผู้โดยสาร' : 'Passengers'}: ${names.join(', ')}` : '',
        calculated.note,
      ].filter(Boolean).join('\n');
      await onCreateSupplementalInvoice(normalized, {
        title: th ? `เลื่อนตั๋ว / เดินทางล่าช้า (${calculated.passengerCount} ท่าน)` : `Ticket change / delayed travel (${calculated.passengerCount} pax)`,
        dueDate: ticketChangeDueDate, note, lineItems: lines,
      });
      setTicketChangeDraft(newTicketChangeDraft(normalized));
      setTicketChangeDueDate('');
      setTicketChangePanelOpen(false);
    } finally {
      setTicketChangeBusy(false);
    }
  }

  const deposit = Math.max(0, form.ticketAmount) + Math.max(0, form.airportTaxAmount);
  const paidTicket = ticketPaidAmount(form, payments); const paidPackage = packagePaidAmount(form, payments); const totalPaid = sumPayments(payments);
  const supplementalRevenue = Math.max(form.supplementalInvoiceTotal || 0, invoices.filter((x) => x.status !== 'cancelled').reduce((sum, x) => sum + x.amount, 0));
  const supplementalCosts = Math.max(form.supplementalCostTotal || 0, invoices.filter((x) => x.status !== 'cancelled').reduce((sum, x) => sum + x.costAmount, 0));
  const grandTotal = form.totalAmount + supplementalRevenue;
  const balance = Math.max(0, grandTotal - totalPaid);
  const hasLandConversion = form.landPayment > 0 && form.landInvoiceAmountUSD > 0 && form.landExchangeRate > 0;
  const calculatedProfit = hasLandConversion ? form.totalAmount - form.ticketAmount - form.airportTaxAmount - form.landPayment + supplementalRevenue - supplementalCosts : null;
  const profit = form.landPaidAt && calculatedProfit !== null ? calculatedProfit : null;

  return <Modal open={open} title={th ? 'Customer Journey — รายละเอียดและขั้นตอนดำเนินงาน' : 'Customer Journey — workflow details'} onClose={onClose} wide>
    <div className="journey-editor">
      <div className="journey-editor-summary"><div><span>{th ? 'สถานะปัจจุบัน' : 'Current stage'}</span><strong>{stageLabel(currentStage, th)}</strong><small>{form.opportunityName || form.customerName || '-'}</small></div><div><span>{th ? 'งานถัดไป' : 'Next action'}</span><strong>{form.nextAction || nextRecommendedAction(form, th)}</strong><small>{form.nextActionDueDate ? formatDate(form.nextActionDueDate, language) : th ? 'ยังไม่กำหนด Deadline' : 'No deadline'}</small></div><div><span>{th ? 'ยอดรับชำระ / คงเหลือ' : 'Paid / remaining'}</span><strong>{formatTHB(totalPaid, language)} / {formatTHB(Math.max(0, grandTotal - totalPaid), language)}</strong><small>{form.passengerCount + addedPassengerCount(form)} {th ? 'ท่านรวม' : 'total pax'}</small></div></div>

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
          <label className="field"><span>{th ? 'ระดับโรงแรม' : 'Hotel category'}</span><select value={form.hotelCategory} onChange={(e) => syncHotelCategory(e.target.value as HotelCategory)}><option>3 Stars</option><option>4 Stars</option><option>5 Stars</option></select></label>
          <label className="field"><span>{th ? 'วันเริ่มเดินทาง' : 'Travel start'}</span><input type="date" value={form.travelStartDate} onChange={(e) => syncDates(e.target.value)}/></label>
          <label className="field"><span>{th ? 'วันสิ้นสุด' : 'Travel end'}</span><input type="date" value={form.travelEndDate} onChange={(e) => set('travelEndDate', e.target.value)}/></label>
          <label className="field"><span>{th ? 'จำนวนผู้เดินทาง' : 'No. of pax'}</span><input type="number" min="1" value={form.passengerCount} onChange={(e) => updatePricingFields({ passengerCount: Math.max(1, Number(e.target.value)) })}/></label>
          <label className="field"><span>{th ? 'จำนวนผู้พักเดี่ยว' : 'Single-room travellers'}</span><input type="number" min="0" max={Math.max(1, form.passengerCount)} value={form.singleRoomCount} onChange={(e) => updateSingleRoomDetails(Number(e.target.value), form.singleSupplementPerPerson)}/></label>
          <div className="tracking-calc-action"><button className="secondary-button" type="button" onClick={calculateFromPricing}><CircleDollarSign/>{th ? 'ดึงราคามาตรฐานจากระบบ' : 'Load standard pricing'}</button></div>
        </div>
        <div className="traveler-addition-inline-action">
          <div className="traveler-addition-inline-copy">
            <span className="traveler-addition-inline-icon"><Users/></span>
            <div>
              <b>{travelHasStarted ? (th ? 'หลังวันเริ่มเดินทาง' : 'After trip start') : (th ? 'มีผู้เดินทางเพิ่มภายหลัง?' : 'Travellers joining later?')}</b>
              <small>{travelHasStarted
                ? (th ? 'ปิดการเพิ่มผู้เดินทางแล้ว หากมีเหตุเดินทางช้ากว่าเดิมให้ใช้ปุ่มเลื่อนตั๋ว' : 'Adding travellers is closed. Use ticket change when someone must travel later.')
                : (th ? 'เพิ่มได้ก่อนวันเริ่มเดินทางเท่านั้น และ LAND จะสรุปผู้เดินทางทั้งหมดใน Invoice ภายหลัง' : 'Available only before the trip starts. LAND will consolidate all travellers in its later invoice.')}</small>
            </div>
          </div>
          <div className="traveler-addition-inline-stats">
            {addedPassengerCount(form) > 0 && <span>{th ? `เพิ่มแล้ว ${addedPassengerCount(form)} ท่าน` : `${addedPassengerCount(form)} added`}</span>}
            <button type="button" className="secondary-button traveler-addition-open-button" disabled={travelHasStarted} onClick={() => setTravelerPanelOpen(true)}><Plus/>{th ? 'เพิ่มผู้เดินทาง' : 'Add travellers'}</button>
            <button type="button" className="secondary-button traveler-addition-open-button" onClick={() => setTicketChangePanelOpen(true)}><CalendarClock/>{th ? 'เลื่อนตั๋ว / เดินทางล่าช้า' : 'Ticket change / delayed travel'}</button>
          </div>
        </div>
        <div className="tracking-form-grid money-grid journey-money-grid pricing-input-grid">
          <MoneyField label={th ? 'ราคาขายแพ็กเกจ / ท่าน' : 'Package selling price / pax'} value={form.sellingPricePerPerson} onChange={(v) => updatePricingFields({ sellingPricePerPerson: v })}/>
          <MoneyField label={th ? 'ราคาตั๋วเครื่องบิน / ท่าน' : 'Airfare / pax'} value={form.ticketPricePerPerson} onChange={(v) => updatePricingFields({ ticketPricePerPerson: v })}/>
          <MoneyField label={th ? 'ภาษีสนามบิน / ท่าน' : 'Airport tax / pax'} value={form.airportTaxPerPerson} onChange={(v) => updatePricingFields({ airportTaxPerPerson: v })}/>
          <MoneyField label={th ? 'ส่วนเพิ่มราคาขาย Business Class / ท่าน' : 'Business Class selling surcharge / pax'} value={form.businessUpgradePerPerson} onChange={(v) => updatePricingFields({ businessUpgradePerPerson: v })}/>
          <label className="field"><span>{th ? 'จำนวนผู้โดยสาร Business Class' : 'Business Class passengers'}</span><input type="number" min="0" max={form.passengerCount} value={form.businessUpgradeCount} onChange={(e) => updatePricingFields({ businessUpgradeCount: Math.min(form.passengerCount, Math.max(0, Number(e.target.value))) })}/></label>
          <MoneyField label={th ? 'ส่วนต่างพักเดี่ยว / ท่าน' : 'Single supplement / pax'} value={form.singleSupplementPerPerson} onChange={(v) => updateSingleRoomDetails(form.singleRoomCount, v)}/>
        </div>
        <AdditionalItemsEditor compact items={form.additionalItems || []} passengerCount={form.passengerCount} language={language} onChange={(items) => updatePricingFields({ additionalItems: items })}/>
        <div className="automatic-totals-panel">
          <div className="automatic-totals-head"><div><b>{th ? 'สรุปราคาอัตโนมัติ' : 'Automatic price summary'}</b><span>{th ? 'กรอกเฉพาะราคาต่อหน่วย ระบบคูณจำนวนผู้เดินทางและรวมยอดให้เอง' : 'Enter unit prices only; the system multiplies quantities and totals automatically.'}</span></div><strong>{formatTHB(form.totalAmount, language)}</strong></div>
          <div className="automatic-totals-grid">
            <AutoTotal label={th ? 'แพ็กเกจพื้นฐาน' : 'Base package'} formula={`${formatTHB(form.sellingPricePerPerson, language)} × ${form.passengerCount}`} value={form.sellingPricePerPerson * form.passengerCount} language={language}/>
            <AutoTotal label={th ? 'ส่วนเพิ่ม Business Class ในแพ็กเกจ' : 'Business Class package surcharge'} formula={`${form.businessUpgradeCount} × ${formatTHB(form.businessUpgradePerPerson, language)}`} value={form.businessUpgradeTotal} language={language}/>
            <AutoTotal label={th ? 'พักเดี่ยวรวม' : 'Single supplement'} formula={`${form.singleRoomCount} × ${formatTHB(form.singleSupplementPerPerson, language)}`} value={form.singleSupplementTotal} language={language}/>
            <AutoTotal label={th ? 'รายการเพิ่มเติมรวม' : 'Additional services'} formula={`${form.additionalItems?.length || 0} ${th ? 'รายการ' : 'items'}`} value={form.additionalItemsTotal} language={language}/>
            <AutoTotal featured label={th ? 'ยอดแพ็กเกจทั้งหมด' : 'Total package amount'} formula={th ? 'แพ็กเกจ + Business + พักเดี่ยว + รายการเพิ่มเติม' : 'Package + Business + single rooms + additional services'} value={form.totalAmount} language={language}/>
            <AutoTotal label={th ? 'ค่าตั๋วเครื่องบินทั้งหมด' : 'Total airfare'} formula={`${formatTHB(form.ticketPricePerPerson, language)} × ${form.passengerCount}`} value={form.ticketAmount} language={language}/>
            <AutoTotal label={th ? 'ภาษีสนามบินทั้งหมด' : 'Total airport tax'} formula={`${formatTHB(form.airportTaxPerPerson, language)} × ${form.passengerCount}`} value={form.airportTaxAmount} language={language}/>
            <AutoTotal featured label={th ? 'ยอด Invoice 1' : 'Invoice 1 total'} formula={th ? 'ค่าตั๋วตาม PNR + ภาษีสนามบิน (ไม่รวมส่วนเพิ่ม BC)' : 'PNR airfare + airport tax (excludes BC selling surcharge)'} value={deposit} language={language}/>
            <div className="calculated-money land-cost-pending"><span>{th ? 'ต้นทุน LAND จริง' : 'Actual land cost'}</span><strong>{form.landPayment > 0 ? formatTHB(form.landPayment, language) : (th ? 'รอ Land Invoice' : 'Awaiting land invoice')}</strong><small>{th ? 'บันทึกยอด USD และอัตราแลกเปลี่ยนใน Step 4–6' : 'Record the USD invoice and actual exchange rate in Steps 4–6.'}</small></div>
            <div className={`calculated-money ${profit !== null && profit < 0 ? 'negative' : ''}`}><span>{th ? 'กำไรจริงจากการขาย' : 'Realized sales profit'}</span><strong>{profit === null ? (th ? 'รอชำระ LAND' : 'Pending land payment') : formatTHB(profit, language)}</strong><small>{th ? 'ยอดขาย − ค่าตั๋วจริง − ภาษี − LAND ที่โอนจริง (ส่วนเพิ่ม BC เป็นรายได้)' : 'Sales − actual airfare − tax − actual land transfer (BC surcharge is revenue)'}</small></div>
          </div>
        </div>
      </WorkflowSection>

      <WorkflowSection number="03" icon={<Plane/>} title={th ? 'จองตั๋วและ Invoice งวดที่ 1' : 'Flight reservation & Invoice 1'} subtitle={th ? 'รับเอกสารลูกค้า จองตั๋ว บันทึก PNR และเก็บค่าตั๋วทั้งหมด' : 'Collect documents, reserve flights, record PNR and collect full airfare.'}>
        <div className="journey-check-grid">
          <MilestoneField label={th ? 'ได้รับหน้า Passport ครบ' : 'Passports received'} value={form.passportReceivedAt} onChange={(v) => set('passportReceivedAt', v)} onToday={() => markToday('passportReceivedAt')} th={th}/><MilestoneField label={th ? 'ได้รับรูปถ่ายครบ' : 'Photos received'} value={form.photoReceivedAt} onChange={(v) => set('photoReceivedAt', v)} onToday={() => markToday('photoReceivedAt')} th={th}/><MilestoneField label={th ? 'วันที่จองตั๋ว / ได้ PNR' : 'Flight reserved / PNR date'} value={form.flightReservedAt} onChange={(v) => set('flightReservedAt', v)} onToday={() => markToday('flightReservedAt')} th={th}/><MilestoneField label={th ? 'วันที่ส่งตั๋วให้ลูกค้า' : 'Ticket sent to customer'} value={form.ticketSentAt} onChange={(v) => set('ticketSentAt', v)} onToday={() => markToday('ticketSentAt')} th={th}/>
        </div>
        <div className="tracking-form-grid"><label className="field"><span>{th ? 'สายการบิน' : 'Airline'}</span><input value={form.airline} onChange={(e) => set('airline', e.target.value)}/></label><label className="field"><span>PNR</span><input value={form.flightPnr} onChange={(e) => set('flightPnr', e.target.value)} placeholder="ABC123"/></label><label className="field span-2"><span>{th ? 'รายชื่อผู้เดินทางทั้งหมด (1 คนต่อ 1 บรรทัด)' : 'Passenger names (one per line)'}</span><textarea rows={5} value={form.passengerNames} onChange={(e) => set('passengerNames', e.target.value)} placeholder={'1. SURNAME/FIRSTNAME MR\n2. SURNAME/FIRSTNAME MS'}/></label></div>
        <div className="installment-card first journey-invoice-card"><div className="installment-head"><span>1</span><div><b>{th ? 'Invoice 1 — ค่าตั๋วเครื่องบินทั้งหมด + ภาษีสนามบิน' : 'Invoice 1 — full airfare + airport tax'}</b><small>{th ? 'กำหนด Deadline เอง และส่งตั๋วหลังตรวจสอบยอดชำระ' : 'Set the deadline and send tickets after payment verification.'}</small></div></div><strong>{formatTHB(deposit, language)}</strong><div className="installment-fields"><label className="field"><span>{th ? 'กำหนดชำระ' : 'Due date'}</span><input type="date" value={form.depositDueDate} onChange={(e) => set('depositDueDate', e.target.value)}/></label><label className="field"><span>{th ? 'สถานะงวด 1' : 'Payment 1 status'}</span><select value={form.depositStatus} onChange={(e) => set('depositStatus', e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label><MilestoneField label={th ? 'วันที่ส่ง Invoice 1' : 'Invoice 1 sent'} value={form.invoice1SentAt} onChange={(v) => set('invoice1SentAt', v)} onToday={() => markToday('invoice1SentAt')} th={th}/><MilestoneField label={th ? 'วันที่รับชำระงวด 1' : 'Payment 1 received'} value={form.firstPaymentReceivedAt} onChange={(v) => set('firstPaymentReceivedAt', v)} onToday={() => markToday('firstPaymentReceivedAt')} th={th}/></div><button className="secondary-button" type="button" onClick={() => onIssueInvoice(normalizeBeforeSave(), 'deposit')}><ReceiptText/>{th ? 'เปิด / ออก Invoice 1' : 'Open / issue Invoice 1'}</button></div>
      </WorkflowSection>

      <WorkflowSection number="04" icon={<ShieldCheck/>} title={th ? 'ส่งเอกสารให้ Land รับ Invoice USD และออก Invoice 2' : 'Submit to land, receive USD invoice & issue Invoice 2'} subtitle={th ? 'เมื่อ Land สรุปราคาเป็น USD ให้บันทึกเลข Invoice และยอด USD ก่อนออก Invoice 2 ให้ลูกค้า' : 'Record the supplier invoice number and USD amount before issuing Invoice 2 to the customer.'}>
        <div className="tracking-form-grid">
          <label className="field"><span>LAND / Supplier</span><input value={form.landSupplier} onChange={(e) => set('landSupplier', e.target.value)} placeholder={th ? 'เช่น Aari Holiday / Amen' : 'e.g. Aari Holiday / Amen'}/></label>
          <MilestoneField label={th ? 'ส่ง Passport + รูป + ตั๋วให้ Land' : 'Documents sent to land'} value={form.documentsSentToLandAt} onChange={(v) => set('documentsSentToLandAt', v)} onToday={() => markToday('documentsSentToLandAt')} th={th}/>
          <MilestoneField label={th ? 'วันที่ได้รับ Land Invoice' : 'Land invoice received'} value={form.landInvoiceReceivedAt} onChange={(v) => set('landInvoiceReceivedAt', v)} onToday={() => markToday('landInvoiceReceivedAt')} th={th}/>
          <label className="field"><span>{th ? 'เลขที่ Land Invoice' : 'Land invoice no.'}</span><input value={form.landInvoiceNo} onChange={(e) => set('landInvoiceNo', e.target.value)} placeholder="LAND-INV-001"/></label>
          <label className="field money-input"><span>{th ? 'ยอดตาม Land Invoice' : 'Land invoice amount'}</span><div><input type="number" min="0" step="0.01" value={form.landInvoiceAmountUSD} onChange={(e) => updateLandFinancials({ landInvoiceAmountUSD: Number(e.target.value) })}/><em>USD</em></div></label>
          <MilestoneField label={th ? 'จัดทำ Invoice 2 แล้ว' : 'Invoice 2 prepared'} value={form.invoice2PreparedAt} onChange={(v) => set('invoice2PreparedAt', v)} onToday={() => markToday('invoice2PreparedAt')} th={th}/>
          <MilestoneField label={th ? 'ได้รับวีซ่าจาก Land' : 'Visa received'} value={form.visaReceivedAt} onChange={(v) => set('visaReceivedAt', v)} onToday={() => markToday('visaReceivedAt')} th={th}/>
          <MilestoneField label={th ? 'ส่งวีซ่า + Invoice 2 ให้ลูกค้า' : 'Visa + Invoice 2 sent'} value={form.visaSentAt} onChange={(v) => set('visaSentAt', v)} onToday={() => markToday('visaSentAt')} th={th}/>
          <MilestoneField label={th ? 'รับชำระค่าแพ็กเกจครบ' : 'Full package payment received'} value={form.fullPaymentReceivedAt} onChange={(v) => set('fullPaymentReceivedAt', v)} onToday={() => markToday('fullPaymentReceivedAt')} th={th}/>
        </div>
        <div className="land-invoice-summary">
          <div><span>{th ? 'Land Invoice' : 'Land invoice'}</span><strong>{form.landInvoiceNo || '-'}</strong></div>
          <div><span>{th ? 'ยอดเรียกเก็บจาก Land' : 'Supplier invoice amount'}</span><strong>{form.landInvoiceAmountUSD > 0 ? `USD ${formatNumber(form.landInvoiceAmountUSD, 2)}` : '-'}</strong></div>
          <div><span>{th ? 'สถานะการแปลงเป็นบาท' : 'THB conversion status'}</span><strong>{form.landPayment > 0 ? formatTHB(form.landPayment, language) : (th ? 'รออัตราแลกเปลี่ยนวันโอน' : 'Awaiting transfer-day FX rate')}</strong></div>
        </div>
        <div className="installment-card second journey-invoice-card"><div className="installment-head"><span>2</span><div><b>{th ? 'Invoice 2 — ค่าแพ็กเกจส่วนที่เหลือ' : 'Invoice 2 — remaining package balance'}</b><small>{th ? 'ยอดแพ็กเกจทั้งหมด หักยอดค่าตั๋วที่ลูกค้าชำระแล้ว' : 'Full package total less ticket payments already received.'}</small></div></div><strong>{formatTHB(Math.max(0, form.totalAmount - paidTicket), language)}</strong><div className="installment-fields"><label className="field"><span>{th ? 'กำหนดชำระ' : 'Due date'}</span><input type="date" value={form.balanceDueDate} onChange={(e) => set('balanceDueDate', e.target.value)}/></label><label className="field"><span>{th ? 'สถานะงวด 2' : 'Payment 2 status'}</span><select value={form.balanceStatus} onChange={(e) => set('balanceStatus', e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label></div><button className="secondary-button" type="button" disabled={!form.landInvoiceAmountUSD} onClick={() => onIssueInvoice(normalizeBeforeSave(), 'balance')}><FileText/>{th ? 'เปิด / ออก Invoice 2' : 'Open / issue Invoice 2'}</button>{!form.landInvoiceAmountUSD && <small className="invoice-requirement-note">{th ? 'กรอกยอด Land Invoice (USD) ก่อนออก Invoice 2' : 'Enter the land invoice amount in USD before issuing Invoice 2.'}</small>}</div>
      </WorkflowSection>

      <WorkflowSection number="05" icon={<WalletCards/>} title={th ? 'ประวัติรับชำระเงิน' : 'Payment transactions'} subtitle={th ? 'บันทึกการรับชำระและแนบสลิปแยกตามแต่ละรายการ เพื่อใช้ตรวจสอบย้อนหลัง' : 'Record each payment and attach its slip for future verification.'}>
        <div className="payment-entry-form payment-entry-form-with-slip">
          <label className="field"><span>{th ? 'ประเภทรายการ' : 'Payment type'}</span><select value={paymentDraft.type} onChange={(e) => { const type = e.target.value as PaymentTransactionType; const firstExtra = invoices.find((x) => x.status !== 'cancelled'); setPaymentDraft({ ...paymentDraft, type, invoiceId: type === 'supplemental' ? (firstExtra?.id || '') : '', amount: type === 'supplemental' ? Math.max(0, (firstExtra?.amount || 0) - (firstExtra ? invoicePaidAmount(firstExtra.id, payments) : 0)) : paymentDraft.amount }); }}>{paymentTypes.map((x) => <option key={x} value={x}>{paymentTypeLabel(x, th)}</option>)}</select></label>
          {paymentDraft.type === 'supplemental' && <label className="field payment-invoice-link"><span>{th ? 'เลือก Invoice เพิ่มเติม' : 'Supplemental invoice'}</span><select value={paymentDraft.invoiceId} onChange={(e) => { const invoiceId = e.target.value; const target = invoices.find((x) => x.id === invoiceId); setPaymentDraft({ ...paymentDraft, invoiceId, amount: target ? Math.max(0, target.amount - invoicePaidAmount(target.id, payments)) : 0 }); }}><option value="">{th ? '— เลือก Invoice —' : '— Select invoice —'}</option>{invoices.filter((x) => x.status !== 'cancelled').map((x) => <option key={x.id} value={x.id}>{`Invoice ${x.sequenceNumber} · ${x.invoiceNo} · ${formatTHB(Math.max(0, x.amount - invoicePaidAmount(x.id, payments)), language)}`}</option>)}</select></label>}
          <MoneyField label={th ? 'จำนวนเงิน' : 'Amount'} value={paymentDraft.amount} onChange={(amount) => setPaymentDraft({ ...paymentDraft, amount })}/>
          <label className="field"><span>{th ? 'วันที่รับชำระ' : 'Paid date'}</span><input type="date" value={paymentDraft.paidAt} onChange={(e) => setPaymentDraft({ ...paymentDraft, paidAt: e.target.value })}/></label>
          <label className="field"><span>{th ? 'เลขอ้างอิง / ผู้ชำระ' : 'Reference / payer'}</span><input value={paymentDraft.reference} onChange={(e) => setPaymentDraft({ ...paymentDraft, reference: e.target.value })}/></label>
          <label className="field payment-note"><span>{th ? 'หมายเหตุ' : 'Note'}</span><input value={paymentDraft.note} onChange={(e) => setPaymentDraft({ ...paymentDraft, note: e.target.value })}/></label>
          <label className={`payment-slip-picker ${paymentDraft.slipFile ? 'selected' : ''}`}>
            <input key={slipInputKey} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(e) => setPaymentDraft({ ...paymentDraft, slipFile: e.target.files?.[0] || null })}/>
            <span><Paperclip/></span>
            <div><b>{paymentDraft.slipFile ? paymentDraft.slipFile.name : (th ? 'แนบสลิปการโอน' : 'Attach payment slip')}</b><small>{paymentDraft.slipFile ? `${(paymentDraft.slipFile.size / 1024 / 1024).toFixed(2)} MB` : (th ? 'PNG, JPG, WEBP หรือ PDF ไม่เกิน 10 MB' : 'PNG, JPG, WEBP or PDF, max 10 MB')}</small></div>
            <em>{paymentDraft.slipFile ? (th ? 'เปลี่ยนไฟล์' : 'Change') : (th ? 'เลือกไฟล์' : 'Choose')}</em>
          </label>
          <button className="primary-button payment-add-button" type="button" disabled={paymentDraft.amount <= 0 || Boolean(paymentBusy)} onClick={addPayment}>{paymentBusy ? <LoaderCircle className="spin"/> : <Plus/>}{th ? 'บันทึกรับชำระ' : 'Record payment'}</button>
        </div>

        <div className="payment-ledger">
          <div className="payment-ledger-head payment-ledger-head-with-slip"><span>{th ? 'วันที่' : 'Date'}</span><span>{th ? 'รายการ' : 'Type'}</span><span>{th ? 'อ้างอิง' : 'Reference'}</span><span>{th ? 'จำนวนเงิน' : 'Amount'}</span><span>{th ? 'สลิป' : 'Slip'}</span><span/></div>
          {payments.length ? payments.map((payment) => <div className="payment-ledger-row payment-ledger-row-with-slip" key={payment.id}>
            <span>{payment.paidAt ? formatDate(payment.paidAt, language) : '-'}</span>
            <span>{paymentTypeLabel(payment.type, th)}{payment.invoiceId ? <small className="payment-linked-invoice">{invoices.find((x) => x.id === payment.invoiceId)?.invoiceNo || ''}</small> : null}</span>
            <span>{payment.reference || payment.note || '-'}</span>
            <strong className={payment.type === 'refund' ? 'negative' : ''}>{payment.type === 'refund' ? '-' : ''}{formatTHB(Math.abs(payment.amount), language)}</strong>
            <div className="payment-slip-actions">
              {payment.slipPath ? <button type="button" className="slip-view-button" disabled={paymentBusy === payment.id} onClick={() => viewPaymentSlip(payment)}>{paymentBusy === payment.id ? <LoaderCircle className="spin"/> : <ExternalLink/>}<span>{th ? 'ดูสลิป' : 'View'}</span></button> : <span className="no-slip">{th ? 'ยังไม่มีสลิป' : 'No slip'}</span>}
              <label className="slip-upload-mini" title={th ? 'แนบหรือเปลี่ยนสลิป' : 'Attach or replace slip'}><input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" disabled={Boolean(paymentBusy)} onChange={(e) => { const file = e.target.files?.[0]; if (file) void replacePaymentSlip(payment, file); e.currentTarget.value = ''; }}/><Upload/><span>{payment.slipPath ? (th ? 'เปลี่ยน' : 'Replace') : (th ? 'แนบ' : 'Attach')}</span></label>
              {payment.slipFileName && <small title={payment.slipFileName}>{payment.slipFileName}</small>}
            </div>
            <button className="danger" disabled={Boolean(paymentBusy)} onClick={() => window.confirm(th ? 'ลบรายการรับชำระนี้และไฟล์สลิป?' : 'Delete this payment and its slip?') && onDeletePayment(payment.id)}><Trash2/></button>
          </div>) : <div className="payment-ledger-empty">{th ? 'ยังไม่มีประวัติรับชำระ' : 'No payment transactions yet'}</div>}
          <div className="payment-ledger-total"><span>{th ? 'รับชำระรวม' : 'Total received'}</span><strong>{formatTHB(totalPaid, language)}</strong><span>{th ? 'ยอดคงเหลือ' : 'Balance'}</span><strong>{formatTHB(Math.max(0, grandTotal - totalPaid), language)}</strong></div>
        </div>
      </WorkflowSection>

      <SupplementalInvoiceManager
        tracking={form}
        invoices={invoices}
        payments={payments}
        language={language}
        draft={supplementalDraft}
        setDraft={setSupplementalDraft}
        busy={supplementalBusy}
        onCreate={submitSupplementalInvoice}
        onOpen={(invoice) => onOpenInvoice(form, invoice)}
        onDelete={(invoice) => onDeleteSupplementalInvoice(form, invoice)}
      />

      <WorkflowSection number="07" icon={<Landmark/>} title={th ? 'โอนชำระ LAND และคำนวณกำไรจริง' : 'Pay land supplier & calculate realized profit'} subtitle={th ? 'หลังรับชำระ Invoice 2 จากลูกค้า ให้ใส่อัตราแลกเปลี่ยน ณ วันโอน ระบบจะแปลง USD เป็นบาทและคำนวณกำไรจริง' : 'After receiving Payment 2, enter the transfer-day FX rate. The system converts USD to THB and calculates realized profit.'}>
        {!form.fullPaymentReceivedAt && form.balanceStatus !== 'paid' && <div className="land-payment-warning"><Hourglass/><div><b>{th ? 'ยังไม่ควรโอน LAND' : 'Land transfer not ready'}</b><span>{th ? 'ตาม Workflow ให้รับชำระค่าแพ็กเกจจากลูกค้าครบก่อน แล้วจึงโอนตาม Land Invoice' : 'Receive the customer’s full package payment before paying the land supplier.'}</span></div></div>}
        <div className="tracking-form-grid">
          <label className="field money-input"><span>{th ? 'ยอด Land Invoice' : 'Land invoice amount'}</span><div><input type="number" min="0" step="0.01" value={form.landInvoiceAmountUSD} onChange={(e) => updateLandFinancials({ landInvoiceAmountUSD: Number(e.target.value) })}/><em>USD</em></div></label>
          <label className="field money-input"><span>{th ? 'อัตราแลกเปลี่ยน ณ วันโอน' : 'FX rate on transfer date'}</span><div><input type="number" min="0" step="0.0001" value={form.landExchangeRate} onChange={(e) => updateLandFinancials({ landExchangeRate: Number(e.target.value) })}/><em>THB/USD</em></div></label>
          <MoneyField label={th ? 'ค่าธรรมเนียมโอน (ถ้ามี)' : 'Transfer fee (optional)'} value={form.landTransferFeeTHB} onChange={(v) => updateLandFinancials({ landTransferFeeTHB: v })}/>
          <div className="calculated-money land-payment-total"><span>{th ? 'ยอด LAND ที่ตัดเป็นเงินบาท' : 'Actual land payment in THB'}</span><strong>{form.landPayment > 0 ? formatTHB(form.landPayment, language) : '-'}</strong><small>{form.landInvoiceAmountUSD > 0 && form.landExchangeRate > 0 ? `USD ${formatNumber(form.landInvoiceAmountUSD, 2)} × ${formatNumber(form.landExchangeRate, 4)}${form.landTransferFeeTHB > 0 ? ` + ${formatNumber(form.landTransferFeeTHB, 2)}` : ''}` : (th ? 'กรอกยอด USD และอัตราแลกเปลี่ยน' : 'Enter USD amount and FX rate')}</small></div>
          <MilestoneField label={th ? 'วันที่โอนชำระ LAND' : 'Land payment date'} value={form.landPaidAt} onChange={(v) => set('landPaidAt', v)} onToday={() => markToday('landPaidAt')} th={th}/>
          <label className="field"><span>{th ? 'เลขอ้างอิงการโอน LAND' : 'Land transfer reference'}</span><input value={form.landTransferReference} onChange={(e) => set('landTransferReference', e.target.value)} placeholder={th ? 'เลขที่รายการ / SWIFT / หมายเหตุ' : 'Transaction / SWIFT reference'}/></label>
        </div>
        <div className="land-profit-breakdown">
          <div><span>{th ? 'ยอดขายแพ็กเกจทั้งหมด' : 'Total package sales'}</span><b>{formatTHB(form.totalAmount, language)}</b></div>
          <div className="deduction"><span>{th ? 'หัก ค่าตั๋วตาม PNR + ภาษีสนามบิน' : 'Less PNR airfare + airport taxes'}</span><b>-{formatTHB(form.ticketAmount + form.airportTaxAmount, language)}</b></div>
          <div><span>{th ? 'ยอดค่าแพ็กเกจหลังหักค่าตั๋วและภาษี' : 'Package balance after airfare and tax'}</span><b>{formatTHB(form.totalAmount - form.ticketAmount - form.airportTaxAmount, language)}</b></div>
          <div className="deduction"><span>{th ? 'หัก LAND Payment (เงินบาท)' : 'Less land payment (THB)'}</span><b>{form.landPayment > 0 ? `-${formatTHB(form.landPayment, language)}` : '-'}</b></div>
          <div className={`land-profit-total ${calculatedProfit !== null && calculatedProfit < 0 ? 'negative' : ''}`}><span>{form.landPaidAt ? (th ? 'กำไรขั้นต้นจริง' : 'Realized gross profit') : (th ? 'กำไรคาดการณ์ตามอัตรานี้' : 'Projected profit at this rate')}</span><strong>{calculatedProfit === null ? (th ? 'กรอกยอด USD และอัตราแลกเปลี่ยน' : 'Enter USD and FX rate') : formatTHB(calculatedProfit, language)}</strong></div>
        </div>
      </WorkflowSection>

      <WorkflowSection number="08" icon={<FileCheck2/>} title={th ? 'Itinerary และความพร้อมเดินทาง' : 'Itinerary & travel readiness'} subtitle={th ? 'หลังชำระครบ ส่งกำหนดการ ตรวจเอกสาร และทำสถานะพร้อมเดินทาง' : 'After full payment, send itinerary, verify documents and mark ready.'}>
        <div className="journey-check-grid"><MilestoneField label={th ? 'ส่ง Itinerary แล้ว' : 'Itinerary sent'} value={form.itinerarySentAt} onChange={(v) => set('itinerarySentAt', v)} onToday={() => markToday('itinerarySentAt')} th={th}/><MilestoneField label={th ? 'ตรวจครบและพร้อมเดินทาง' : 'Ready to travel'} value={form.readyToTravelAt} onChange={(v) => set('readyToTravelAt', v)} onToday={() => markToday('readyToTravelAt')} th={th}/></div>
      </WorkflowSection>

      <WorkflowSection number="09" icon={<Flag/>} title={th ? 'หลังเดินทางและ Feedback' : 'Post-trip & feedback'} subtitle={th ? 'ติดตามหลังลูกค้ากลับ ขอความคิดเห็น และปิดจบงาน' : 'Follow up after the trip, request feedback and close the case.'}>
        <div className="journey-check-grid"><MilestoneField label={th ? 'ลูกค้าเดินทางกลับแล้ว' : 'Customer returned'} value={form.tripReturnedAt} onChange={(v) => set('tripReturnedAt', v)} onToday={() => markToday('tripReturnedAt')} th={th}/><MilestoneField label={th ? 'ส่งคำขอ Feedback' : 'Feedback requested'} value={form.feedbackRequestedAt} onChange={(v) => set('feedbackRequestedAt', v)} onToday={() => markToday('feedbackRequestedAt')} th={th}/><MilestoneField label={th ? 'ได้รับ Feedback' : 'Feedback received'} value={form.feedbackReceivedAt} onChange={(v) => set('feedbackReceivedAt', v)} onToday={() => markToday('feedbackReceivedAt')} th={th}/><MilestoneField label={th ? 'ปิดจบงาน' : 'Closed'} value={form.closedAt} onChange={(v) => set('closedAt', v)} onToday={() => markToday('closedAt')} th={th}/></div><label className="field"><span>{th ? 'Feedback / ความคิดเห็นลูกค้า' : 'Customer feedback'}</span><textarea rows={4} value={form.feedbackNote} onChange={(e) => set('feedbackNote', e.target.value)}/></label>
      </WorkflowSection>

      <WorkflowSection number="10" icon={<CalendarClock/>} title={th ? 'งานถัดไปและหมายเหตุภายใน' : 'Next action & internal notes'} subtitle={th ? 'กำหนดสิ่งที่ต้องทำต่อและ Deadline เพื่อไม่ให้หลุดการติดตาม' : 'Set the next action and deadline so nothing is missed.'}>
        <div className="tracking-form-grid"><label className="field span-2"><span>{th ? 'งานถัดไป' : 'Next action'}</span><input value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)} placeholder={nextRecommendedAction(form, th)}/></label><label className="field"><span>{th ? 'Deadline งานถัดไป' : 'Next action deadline'}</span><input type="date" value={form.nextActionDueDate} onChange={(e) => set('nextActionDueDate', e.target.value)}/></label><label className="field"><span>{th ? 'สถานะ Workflow ปัจจุบัน' : 'Current workflow stage'}</span><input value={stageLabel(currentStage, th)} readOnly/></label><label className="field span-2"><span>{th ? 'หมายเหตุภายใน' : 'Internal note'}</span><textarea rows={4} value={form.note} onChange={(e) => set('note', e.target.value)}/></label></div>
      </WorkflowSection>

      <div className="modal-actions tracking-modal-actions"><button className="ghost-button" onClick={onClose}>{th ? 'ปิด' : 'Close'}</button><button className="primary-button" disabled={!form.opportunityName.trim() || !form.customerName.trim()} onClick={saveAndStay}><BadgeCheck/>{th ? 'บันทึก Customer Journey' : 'Save customer journey'}</button></div>

      {travelerPanelOpen && <div className="journey-submodal-layer" role="dialog" aria-modal="true" aria-label={th ? 'เพิ่มผู้เดินทาง' : 'Add travellers'}>
        <button type="button" className="journey-submodal-backdrop" onClick={() => setTravelerPanelOpen(false)} aria-label={th ? 'ปิด' : 'Close'}/>
        <section className="journey-submodal-card">
          <header className="journey-submodal-header">
            <div><span><Users/></span><div><h2>{th ? 'เพิ่มผู้เดินทางภายหลัง' : 'Add travellers after ticketing'}</h2><p>{th ? 'กรอก PNR รายชื่อ และราคาของผู้เดินทางชุดใหม่ ระบบจะออก Invoice 3+ แยกจากชุดเดิม' : 'Enter the new PNR, passenger names and pricing. The system issues a separate Invoice 3+.'}</p></div></div>
            <button type="button" onClick={() => setTravelerPanelOpen(false)} aria-label={th ? 'ปิด' : 'Close'}><X/></button>
          </header>
          <div className="journey-submodal-body">
            <TravelerAdditionManager
              tracking={form}
              invoices={invoices}
              language={language}
              draft={travelerDraft}
              setDraft={setTravelerDraft}
              dueDate={travelerDueDate}
              setDueDate={setTravelerDueDate}
              busy={travelerBusy}
              onCreate={submitTravelerAddition}
              onOpen={(invoice) => onOpenInvoice(form, invoice)}
            />
          </div>
        </section>
      </div>}

      {ticketChangePanelOpen && <div className="journey-submodal-layer" role="dialog" aria-modal="true" aria-label={th ? 'เลื่อนตั๋ว / เดินทางล่าช้า' : 'Ticket change / delayed travel'}>
        <button type="button" className="journey-submodal-backdrop" onClick={() => setTicketChangePanelOpen(false)} aria-label={th ? 'ปิด' : 'Close'}/>
        <section className="journey-submodal-card">
          <header className="journey-submodal-header">
            <div><span><CalendarClock/></span><div><h2>{th ? 'เลื่อนตั๋ว / เดินทางล่าช้า' : 'Ticket change / delayed travel'}</h2><p>{th ? 'ใช้เมื่อออกตั๋วแล้วและผู้โดยสารต้องเปลี่ยนวันเดินทาง ระบบจะออก Invoice เพิ่มเติมแยกจากแพ็กเกจเดิม' : 'Use after ticketing when passengers must change their travel date. A separate supplemental invoice will be issued.'}</p></div></div>
            <button type="button" onClick={() => setTicketChangePanelOpen(false)} aria-label={th ? 'ปิด' : 'Close'}><X/></button>
          </header>
          <div className="journey-submodal-body">
            <TicketChangeManager language={language} draft={ticketChangeDraft} setDraft={setTicketChangeDraft} dueDate={ticketChangeDueDate} setDueDate={setTicketChangeDueDate} busy={ticketChangeBusy} onCreate={submitTicketChange}/>
          </div>
        </section>
      </div>}
    </div>
  </Modal>;
}

function SupplementalLineEditor({ lines, onChange, language, compact = false }: { lines: SupplementalInvoiceLine[]; onChange: (lines: SupplementalInvoiceLine[]) => void; language: 'th' | 'en'; compact?: boolean }) {
  const th = language === 'th';
  const update = (id: string, patch: Partial<SupplementalInvoiceLine>) => onChange(lines.map((line) => {
    if (line.id !== id) return line;
    const next = { ...line, ...patch };
    const quantity = Math.max(1, Number(next.quantity || 1));
    const unitPriceTHB = Math.max(0, Number(next.unitPriceTHB || 0));
    const costPerUnitTHB = Math.max(0, Number(next.costPerUnitTHB || 0));
    return { ...next, quantity, unitPriceTHB, costPerUnitTHB, totalTHB: quantity * unitPriceTHB, totalCostTHB: quantity * costPerUnitTHB };
  }));
  const add = () => onChange([...lines, newSupplementalLine()]);
  const remove = (id: string) => onChange(lines.length > 1 ? lines.filter((line) => line.id !== id) : [newSupplementalLine()]);
  return <div className={`supplemental-line-editor ${compact ? 'compact' : ''}`}>
    <div className="supplemental-line-head"><span>{th ? 'รายละเอียด' : 'Description'}</span><span>{th ? 'จำนวน' : 'Qty'}</span><span>{th ? 'ราคาขาย / หน่วย' : 'Sell / unit'}</span><span>{th ? 'ต้นทุน / หน่วย' : 'Cost / unit'}</span><span>{th ? 'ยอดขาย' : 'Revenue'}</span><span/></div>
    {lines.map((line) => <div className="supplemental-line-row" key={line.id}>
      <input value={line.description} onChange={(e) => update(line.id, { description: e.target.value })} placeholder={th ? 'เช่น อัปเกรดโรงแรม / รถขนกระเป๋า' : 'e.g. hotel upgrade / baggage vehicle'}/>
      <input type="number" min="1" step="1" value={line.quantity} onChange={(e) => update(line.id, { quantity: Number(e.target.value) })}/>
      <input type="number" min="0" step="0.01" value={line.unitPriceTHB} onChange={(e) => update(line.id, { unitPriceTHB: Number(e.target.value) })}/>
      <input type="number" min="0" step="0.01" value={line.costPerUnitTHB} onChange={(e) => update(line.id, { costPerUnitTHB: Number(e.target.value) })}/>
      <strong>{formatTHB(Math.max(1, line.quantity || 1) * Math.max(0, line.unitPriceTHB || 0), language)}</strong>
      <button type="button" className="danger" onClick={() => remove(line.id)} title={th ? 'ลบรายการ' : 'Remove'}><Trash2/></button>
    </div>)}
    <button type="button" className="ghost-button supplemental-add-line" onClick={add}><Plus/>{th ? 'เพิ่มบรรทัด' : 'Add line'}</button>
  </div>;
}

function TravelerAdditionManager({ tracking, invoices, language, draft, setDraft, dueDate, setDueDate, busy, onCreate, onOpen }: {
  tracking: CustomerTracking; invoices: PaymentInvoice[]; language: 'th' | 'en'; draft: TravelerAddition; setDraft: React.Dispatch<React.SetStateAction<TravelerAddition>>;
  dueDate: string; setDueDate: (value: string) => void; busy: boolean; onCreate: () => Promise<void>; onOpen: (invoice: PaymentInvoice) => void;
}) {
  const th = language === 'th';
  const calculated = normalizeTravelerAddition(draft);
  const additions = (tracking.travelerAdditions || []).slice().sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));
  const invoiceMap = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const activeAdded = additions.filter((entry) => entry.status !== 'cancelled').reduce((sum, entry) => sum + entry.passengerCount, 0);
  const update = <K extends keyof TravelerAddition>(key: K, value: TravelerAddition[K]) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className="traveler-addition-manager">
    <div className="traveler-addition-summary">
      <div><span>{th ? 'ผู้เดินทางเดิม' : 'Original travellers'}</span><strong>{tracking.passengerCount}</strong></div>
      <div><span>{th ? 'เพิ่มภายหลัง' : 'Added later'}</span><strong>{activeAdded}</strong></div>
      <div className="featured"><span>{th ? 'ผู้เดินทางรวม' : 'Total travellers'}</span><strong>{tracking.passengerCount + activeAdded}</strong></div>
      <div><span>{th ? 'ยอด Invoice เพิ่มเติมสะสม' : 'Supplemental invoices'}</span><strong>{formatTHB(tracking.supplementalInvoiceTotal || 0, language)}</strong></div>
    </div>
    {additions.length > 0 && <div className="traveler-addition-history">
      {additions.map((entry) => {
        const invoice = invoiceMap.get(entry.invoiceId);
        const names = entry.passengerNames.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
        return <article key={entry.id} className={`traveler-addition-card ${entry.status === 'cancelled' || invoice?.status === 'cancelled' ? 'cancelled' : ''}`}>
          <div><span>{entry.addedAt ? formatDate(entry.addedAt, language) : '-'}</span><strong>{th ? `เพิ่ม ${entry.passengerCount} ท่าน` : `Added ${entry.passengerCount} pax`}</strong><small>PNR {entry.pnr || '-'} · {entry.airline || '-'}</small></div>
          <div><span>{th ? 'รายชื่อ' : 'Names'}</span><strong>{names.join(', ') || '-'}</strong><small>{invoice ? `${invoice.invoiceNo} · ${paymentStatusLabel(invoice.status, th)}` : (th ? 'ไม่พบ Invoice' : 'Invoice not found')}</small></div>
          <div><span>{th ? 'ยอดเรียกเก็บ / ต้นทุน' : 'Revenue / cost'}</span><strong>{formatTHB(entry.customerChargeTotal, language)}</strong><small>{th ? `ต้นทุน ${formatTHB(entry.internalCostTotal, language)}` : `Cost ${formatTHB(entry.internalCostTotal, language)}`}</small></div>
          {invoice && <button type="button" className="secondary-button" onClick={() => onOpen(invoice)}><FileText/>{th ? `เปิด Invoice ${invoice.sequenceNumber}` : `Open Invoice ${invoice.sequenceNumber}`}</button>}
        </article>;
      })}
    </div>}
    <div className="traveler-addition-form traveler-addition-form-open">
      <div className="traveler-addition-form-title"><span><Plus/>{th ? 'ข้อมูลผู้เดินทางชุดใหม่' : 'New traveller details'}</span><small>{th ? 'กรอกเฉพาะครั้งที่มีผู้เดินทางเพิ่ม ระบบจะไม่เปลี่ยนข้อมูลผู้เดินทางชุดเดิม' : 'Complete only when new travellers join. Original traveller data remains unchanged.'}</small></div>
      <div className="tracking-form-grid traveler-identity-grid">
        <label className="field"><span>{th ? 'วันที่เพิ่มผู้เดินทาง' : 'Added date'}</span><input type="date" max={tracking.travelStartDate ? addDays(tracking.travelStartDate, -1) : undefined} value={draft.addedAt} onChange={(e) => update('addedAt', e.target.value)}/><small>{tracking.travelStartDate ? (th ? `เพิ่มได้ไม่เกิน ${formatDate(addDays(tracking.travelStartDate, -1), language)}` : `Must be before ${formatDate(tracking.travelStartDate, language)}`) : ''}</small></label>
        <label className="field"><span>{th ? 'จำนวนผู้เดินทางเพิ่ม' : 'Added travellers'}</span><input type="number" min="1" step="1" value={draft.passengerCount} onChange={(e) => update('passengerCount', Math.max(1, Number(e.target.value)))}/></label>
        <label className="field"><span>{th ? 'สายการบิน' : 'Airline'}</span><input value={draft.airline} onChange={(e) => update('airline', e.target.value)}/></label>
        <label className="field"><span>PNR</span><input value={draft.pnr} onChange={(e) => update('pnr', e.target.value.toUpperCase())} placeholder="ABC123"/></label>
        <label className="field span-2"><span>{th ? 'รายชื่อผู้เดินทางเพิ่ม (1 คนต่อ 1 บรรทัด)' : 'Added passenger names (one per line)'}</span><textarea rows={4} value={draft.passengerNames} onChange={(e) => update('passengerNames', e.target.value)} placeholder={'1. SURNAME/FIRSTNAME MR\n2. SURNAME/FIRSTNAME MS'}/></label>
      </div>
      <div className="tracking-form-grid money-grid traveler-pricing-grid">
        <MoneyField label={th ? 'ราคาขายแพ็กเกจ / ท่าน' : 'Package selling / pax'} value={draft.packagePricePerPerson} onChange={(v) => update('packagePricePerPerson', v)}/>
        <MoneyField label={th ? 'ราคาตั๋วจริงตาม PNR / ท่าน' : 'Actual PNR airfare / pax'} value={draft.ticketPricePerPerson} onChange={(v) => update('ticketPricePerPerson', v)}/>
        <MoneyField label={th ? 'ภาษีสนามบิน / ท่าน' : 'Airport tax / pax'} value={draft.airportTaxPerPerson} onChange={(v) => update('airportTaxPerPerson', v)}/>
        <label className="field"><span>{th ? 'จำนวนอัปเกรด Business' : 'Business upgrades'}</span><input type="number" min="0" max={draft.passengerCount} value={draft.businessUpgradeCount} onChange={(e) => update('businessUpgradeCount', Math.min(draft.passengerCount, Math.max(0, Number(e.target.value))))}/></label>
        <MoneyField label={th ? 'ส่วนเพิ่ม Business / ท่าน' : 'Business surcharge / pax'} value={draft.businessUpgradePerPerson} onChange={(v) => update('businessUpgradePerPerson', v)}/>
        <label className="field"><span>{th ? 'จำนวนพักเดี่ยว' : 'Single rooms'}</span><input type="number" min="0" max={draft.passengerCount} value={draft.singleRoomCount} onChange={(e) => update('singleRoomCount', Math.min(draft.passengerCount, Math.max(0, Number(e.target.value))))}/></label>
        <MoneyField label={th ? 'ราคาขายพักเดี่ยว / ท่าน' : 'Single supplement sell / pax'} value={draft.singleSupplementPerPerson} onChange={(v) => update('singleSupplementPerPerson', v)}/>
        <MoneyField label={th ? 'ต้นทุนพักเดี่ยว / ท่าน' : 'Single supplement cost / pax'} value={draft.singleSupplementCostPerPerson} onChange={(v) => update('singleSupplementCostPerPerson', v)}/>
      </div>
      <div className="traveler-extra-lines"><div className="mini-section-title"><b>{th ? 'บริการเพิ่มเฉพาะผู้เดินทางชุดนี้' : 'Extra services for these travellers'}</b><span>{th ? 'กรอกทั้งราคาขายและต้นทุนเพื่อใช้ทำรายงานกำไรภายหลัง' : 'Enter both selling price and cost for future margin reports.'}</span></div><SupplementalLineEditor compact lines={draft.extraLines.length ? draft.extraLines : [newSupplementalLine()]} onChange={(lines) => update('extraLines', lines)} language={language}/></div>
      <div className="traveler-addition-totals">
        <AutoTotal label={th ? 'ยอดเรียกเก็บลูกค้า' : 'Customer charge'} formula={th ? 'แพ็กเกจ + BC + พักเดี่ยว + บริการเพิ่ม' : 'Package + BC + single room + extras'} value={calculated.customerChargeTotal} language={language} featured/>
        <AutoTotal label={th ? 'ต้นทุนรวมโดยประมาณ' : 'Estimated total cost'} formula={th ? 'ตั๋ว + ภาษี + ต้นทุนอื่น (LAND รวมภายหลัง)' : 'Airfare + tax + other costs (LAND consolidated later)'} value={calculated.internalCostTotal} language={language}/>
        <AutoTotal label={th ? 'กำไรขั้นต้นของรายการเพิ่ม' : 'Added-item gross profit'} formula={th ? 'ยอดเรียกเก็บ − ต้นทุน' : 'Revenue − cost'} value={calculated.customerChargeTotal - calculated.internalCostTotal} language={language}/>
      </div>
      <div className="tracking-form-grid traveler-invoice-meta">
        <label className="field"><span>{th ? 'กำหนดชำระ Invoice' : 'Invoice due date'}</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}/></label>
        <label className="field span-2"><span>{th ? 'หมายเหตุ' : 'Note'}</span><input value={draft.note} onChange={(e) => update('note', e.target.value)}/></label>
      </div>
      <div className="traveler-addition-actions"><button type="button" className="primary-button" disabled={busy || calculated.customerChargeTotal <= 0} onClick={() => void onCreate()}>{busy ? <LoaderCircle className="spin"/> : <ReceiptText/>}{th ? 'บันทึกและออก Invoice 3+' : 'Save and issue Invoice 3+'}</button></div>
    </div>
  </div>;
}

function TicketChangeManager({ language, draft, setDraft, dueDate, setDueDate, busy, onCreate }: {
  language: 'th' | 'en'; draft: TicketChangeDraft; setDraft: React.Dispatch<React.SetStateAction<TicketChangeDraft>>;
  dueDate: string; setDueDate: (value: string) => void; busy: boolean; onCreate: () => Promise<void>;
}) {
  const th = language === 'th';
  const calculated = normalizeTicketChangeDraft(draft);
  const update = <K extends keyof TicketChangeDraft>(key: K, value: TicketChangeDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className="traveler-addition-manager">
    <div className="traveler-addition-form traveler-addition-form-open">
      <div className="traveler-addition-form-title"><span><CalendarClock/>{th ? 'ข้อมูลการเปลี่ยนวันเดินทาง' : 'Travel-date change details'}</span><small>{th ? 'สำหรับผู้โดยสารที่ออกตั๋วแล้วและต้องเดินทางช้ากว่าเดิม ไม่ใช่การเพิ่มผู้เดินทางใหม่' : 'For already-ticketed passengers who must travel later; this is not for adding new travellers.'}</small></div>
      <div className="tracking-form-grid traveler-identity-grid">
        <label className="field"><span>{th ? 'วันที่แจ้งเปลี่ยน' : 'Change requested on'}</span><input type="date" value={draft.changedAt} onChange={(e) => update('changedAt', e.target.value)}/></label>
        <label className="field"><span>{th ? 'จำนวนผู้โดยสารที่เปลี่ยน' : 'Passengers changing'}</span><input type="number" min="1" step="1" value={draft.passengerCount} onChange={(e) => update('passengerCount', Math.max(1, Number(e.target.value)))}/></label>
        <label className="field"><span>{th ? 'สายการบิน' : 'Airline'}</span><input value={draft.airline} onChange={(e) => update('airline', e.target.value)}/></label>
        <label className="field"><span>{th ? 'PNR เดิม' : 'Original PNR'}</span><input value={draft.originalPnr} onChange={(e) => update('originalPnr', e.target.value.toUpperCase())}/></label>
        <label className="field"><span>{th ? 'PNR ใหม่ (ถ้ามี)' : 'New PNR (optional)'}</span><input value={draft.newPnr} onChange={(e) => update('newPnr', e.target.value.toUpperCase())}/></label>
        <label className="field"><span>{th ? 'วันเดินทางเดิม' : 'Original travel date'}</span><input type="date" value={draft.originalTravelDate} onChange={(e) => update('originalTravelDate', e.target.value)}/></label>
        <label className="field"><span>{th ? 'วันเดินทางใหม่' : 'New travel date'}</span><input type="date" value={draft.newTravelDate} onChange={(e) => update('newTravelDate', e.target.value)}/></label>
        <label className="field span-2"><span>{th ? 'รายชื่อผู้โดยสารที่เปลี่ยน (1 คนต่อ 1 บรรทัด)' : 'Passenger names (one per line)'}</span><textarea rows={4} value={draft.passengerNames} onChange={(e) => update('passengerNames', e.target.value)} placeholder={'1. SURNAME/FIRSTNAME MR\n2. SURNAME/FIRSTNAME MS'}/></label>
      </div>
      <div className="tracking-form-grid money-grid traveler-pricing-grid">
        <MoneyField label={th ? 'ส่วนต่างค่าตั๋ว / ท่าน' : 'Fare difference / pax'} value={draft.fareDifferencePerPerson} onChange={(v) => update('fareDifferencePerPerson', v)}/>
        <MoneyField label={th ? 'ค่าธรรมเนียมสายการบิน / ท่าน' : 'Airline change fee / pax'} value={draft.airlineChangeFeePerPerson} onChange={(v) => update('airlineChangeFeePerPerson', v)}/>
        <MoneyField label={th ? 'ค่าบริการของบริษัท / ท่าน' : 'Company service fee / pax'} value={draft.serviceFeePerPerson} onChange={(v) => update('serviceFeePerPerson', v)}/>
      </div>
      <div className="traveler-extra-lines"><div className="mini-section-title"><b>{th ? 'ค่าใช้จ่ายอื่นจากการเลื่อนตั๋ว' : 'Other ticket-change charges'}</b><span>{th ? 'เพิ่มได้ เช่น ค่าโรงแรมเพิ่ม รถรับส่ง หรือค่าใช้จ่ายที่เกิดจากการเดินทางล่าช้า' : 'Add hotel, transfer, or other costs caused by the delayed travel.'}</span></div><SupplementalLineEditor compact lines={draft.extraLines.length ? draft.extraLines : [newSupplementalLine()]} onChange={(lines) => update('extraLines', lines)} language={language}/></div>
      <div className="traveler-addition-totals">
        <AutoTotal label={th ? 'ยอด Invoice เพิ่มเติม' : 'Supplemental invoice total'} formula={th ? 'ส่วนต่างตั๋ว + ค่าธรรมเนียม + ค่าบริการ + รายการอื่น' : 'Fare difference + fees + service + extras'} value={calculated.amount} language={language} featured/>
        <AutoTotal label={th ? 'ต้นทุนรวม' : 'Total internal cost'} formula={th ? 'ส่วนต่างตั๋ว + ค่าธรรมเนียมสายการบิน + ต้นทุนรายการอื่น' : 'Fare difference + airline fee + other costs'} value={calculated.costAmount} language={language}/>
        <AutoTotal label={th ? 'กำไรขั้นต้น' : 'Gross profit'} formula={th ? 'ยอดเรียกเก็บ − ต้นทุน' : 'Revenue − cost'} value={calculated.amount - calculated.costAmount} language={language}/>
      </div>
      <div className="tracking-form-grid traveler-invoice-meta">
        <label className="field"><span>{th ? 'กำหนดชำระ Invoice' : 'Invoice due date'}</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}/></label>
        <label className="field span-2"><span>{th ? 'หมายเหตุ' : 'Note'}</span><input value={draft.note} onChange={(e) => update('note', e.target.value)}/></label>
      </div>
      <div className="traveler-addition-actions"><button type="button" className="primary-button" disabled={busy || calculated.amount <= 0} onClick={() => void onCreate()}>{busy ? <LoaderCircle className="spin"/> : <ReceiptText/>}{th ? 'บันทึกและออก Invoice เพิ่มเติม' : 'Save and issue supplemental invoice'}</button></div>
    </div>
  </div>;
}

function SupplementalInvoiceManager({ tracking, invoices, payments, language, draft, setDraft, busy, onCreate, onOpen, onDelete }: {
  tracking: CustomerTracking; invoices: PaymentInvoice[]; payments: PaymentTransaction[]; language: 'th' | 'en';
  draft: { title: string; dueDate: string; note: string; lineItems: SupplementalInvoiceLine[] };
  setDraft: React.Dispatch<React.SetStateAction<{ title: string; dueDate: string; note: string; lineItems: SupplementalInvoiceLine[] }>>;
  busy: boolean; onCreate: () => Promise<void>; onOpen: (invoice: PaymentInvoice) => void; onDelete: (invoice: PaymentInvoice) => void;
}) {
  const th = language === 'th';
  const active = invoices.filter((invoice) => invoice.status !== 'cancelled');
  const draftRevenue = draft.lineItems.reduce((sum, line) => sum + Math.max(1, Number(line.quantity || 1)) * Math.max(0, Number(line.unitPriceTHB || 0)), 0);
  const draftCost = draft.lineItems.reduce((sum, line) => sum + Math.max(1, Number(line.quantity || 1)) * Math.max(0, Number(line.costPerUnitTHB || 0)), 0);
  return <WorkflowSection number="06B" icon={<ReceiptText/>} title={th ? 'Invoice เพิ่มเติม (งวด 3 เป็นต้นไป)' : 'Supplemental invoices (Invoice 3+)'} subtitle={th ? 'ใช้เรียกเก็บบริการที่ลูกค้าขอเพิ่มภายหลัง และยอดจะถูกรวมในยอดขายหลักกับกำไรทันที' : 'Charge later additions; the amount is included in the customer grand total and margin.'}>
    <div className="supplemental-overview">
      <div><span>{th ? 'มูลค่าแพ็กเกจเดิม' : 'Original package'}</span><strong>{formatTHB(tracking.totalAmount, language)}</strong></div>
      <div><span>{th ? 'Invoice เพิ่มเติมสะสม' : 'Supplemental total'}</span><strong>{formatTHB(tracking.supplementalInvoiceTotal || 0, language)}</strong></div>
      <div className="featured"><span>{th ? 'ยอดขายรวมลูกค้า' : 'Customer grand total'}</span><strong>{formatTHB(tracking.grandTotalAmount || tracking.totalAmount, language)}</strong></div>
    </div>
    {invoices.length > 0 && <div className="supplemental-invoice-list">{invoices.map((invoice) => {
      const paid = invoicePaidAmount(invoice.id, payments);
      const remaining = Math.max(0, invoice.amount - paid);
      return <article key={invoice.id} className={invoice.status === 'cancelled' ? 'cancelled' : ''}>
        <div><span>Invoice {invoice.sequenceNumber}</span><strong>{invoice.title || (th ? 'บริการเพิ่มเติม' : 'Additional services')}</strong><small>{invoice.invoiceNo} · {paymentStatusLabel(effectiveStageStatus(invoice.status, invoice.dueDate), th)}</small></div>
        <div><span>{th ? 'ยอด / รับแล้ว / คงเหลือ' : 'Amount / paid / balance'}</span><strong>{formatTHB(invoice.amount, language)}</strong><small>{formatTHB(paid, language)} / {formatTHB(remaining, language)}</small></div>
        <div className="supplemental-invoice-actions"><button type="button" className="secondary-button" onClick={() => onOpen(invoice)}><FileText/>{th ? 'เปิดเอกสาร' : 'Open'}</button><button type="button" className="danger" disabled={invoice.status === 'paid'} onClick={() => onDelete(invoice)}><Trash2/></button></div>
      </article>;
    })}</div>}
    <details className="supplemental-create-form">
      <summary><span><Plus/>{th ? 'สร้าง Invoice เพิ่มเติมทั่วไป' : 'Create a general supplemental invoice'}</span><small>{th ? 'เช่น อัปเกรดโรงแรม ระบำหน้ากาก รถขนกระเป๋า หรือบริการอื่น' : 'Hotel upgrade, mask dance, baggage vehicle, or any later service.'}</small></summary>
      <div className="tracking-form-grid">
        <label className="field span-2"><span>{th ? 'ชื่อ Invoice / เหตุผลที่เรียกเก็บเพิ่ม' : 'Invoice title / reason'}</span><input value={draft.title} onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))} placeholder={th ? 'เช่น บริการเพิ่มเติมตามคำขอลูกค้า' : 'e.g. Additional services requested by customer'}/></label>
        <label className="field"><span>{th ? 'กำหนดชำระ' : 'Due date'}</span><input type="date" value={draft.dueDate} onChange={(e) => setDraft((current) => ({ ...current, dueDate: e.target.value }))}/></label>
        <label className="field span-2"><span>{th ? 'หมายเหตุบน Invoice' : 'Invoice note'}</span><input value={draft.note} onChange={(e) => setDraft((current) => ({ ...current, note: e.target.value }))}/></label>
      </div>
      <SupplementalLineEditor lines={draft.lineItems} onChange={(lineItems) => setDraft((current) => ({ ...current, lineItems }))} language={language}/>
      <div className="supplemental-draft-total"><div><span>{th ? 'ยอดเรียกเก็บ' : 'Revenue'}</span><strong>{formatTHB(draftRevenue, language)}</strong></div><div><span>{th ? 'ต้นทุนภายใน' : 'Internal cost'}</span><strong>{formatTHB(draftCost, language)}</strong></div><div className="featured"><span>{th ? 'กำไรขั้นต้น' : 'Gross profit'}</span><strong>{formatTHB(draftRevenue - draftCost, language)}</strong></div></div>
      <div className="supplemental-create-actions"><button type="button" className="primary-button" disabled={busy || draftRevenue <= 0} onClick={() => void onCreate()}>{busy ? <LoaderCircle className="spin"/> : <ReceiptText/>}{th ? 'ออก Invoice เพิ่มเติม' : 'Issue supplemental invoice'}</button></div>
    </details>
  </WorkflowSection>;
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

function AutoTotal({ label, formula, value, language, featured = false }: { label: string; formula: string; value: number; language: 'th' | 'en'; featured?: boolean }) {
  return <div className={`auto-total-card ${featured ? 'featured' : ''}`}><span>{label}</span><strong>{formatTHB(value, language)}</strong><small>{formula}</small></div>;
}

function InvoicePreview({ value, language, payments, onClose, onSaveInvoice, onSaveTracking }: {
  value: { tracking: CustomerTracking; invoice: PaymentInvoice } | null; language: 'th' | 'en'; payments: PaymentTransaction[]; onClose: () => void;
  onSaveInvoice: (item: PaymentInvoice) => Promise<void>; onSaveTracking: (item: CustomerTracking) => Promise<void>;
}) {
  const th = language === 'th';
  const [status, setStatus] = useState<PaymentStageStatus>(value?.invoice.status || 'invoiced');
  React.useEffect(() => setStatus(value?.invoice.status || 'invoiced'), [value?.invoice.id, value?.invoice.status]);
  if (!value) return null;
  const { tracking, invoice } = value;
  const isDeposit = invoice.installment === 'deposit';
  const isBalance = invoice.installment === 'balance';
  const isSupplemental = invoice.installment === 'supplemental';
  const travelerAddition = (tracking.travelerAdditions || []).find((entry) => entry.invoiceId === invoice.id);
  const invoicePassengerNames = (isSupplemental && travelerAddition ? travelerAddition.passengerNames : tracking.passengerNames || '')
    .split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  const ticketPayments = payments.filter((x) => x.type === 'ticket_deposit');
  const paidTicket = ticketPaidAmount(tracking, payments);
  const balanceDue = Math.max(0, tracking.totalAmount - paidTicket);
  const amountDue = isDeposit ? tracking.depositAmount : isBalance ? balanceDue : invoice.amount;
  const displaySequence = invoice.sequenceNumber || (isDeposit ? 1 : isBalance ? 2 : 3);
  const totalTravellers = tracking.passengerCount + addedPassengerCount(tracking);

  async function updateStatus(next: PaymentStageStatus) {
    const previousStatus = status;
    setStatus(next);
    const now = new Date().toISOString();
    await onSaveInvoice({ ...invoice, status: next, paidAt: next === 'paid' ? isoToday() : '', updatedAt: now });
    if (isSupplemental) {
      const wasActive = previousStatus !== 'cancelled';
      const willBeActive = next !== 'cancelled';
      const revenueDelta = (willBeActive ? invoice.amount : 0) - (wasActive ? invoice.amount : 0);
      const costDelta = (willBeActive ? invoice.costAmount : 0) - (wasActive ? invoice.costAmount : 0);
      const supplementalInvoiceTotal = Math.max(0, (tracking.supplementalInvoiceTotal || 0) + revenueDelta);
      const supplementalCostTotal = Math.max(0, (tracking.supplementalCostTotal || 0) + costDelta);
      const baseProfit = tracking.landPaidAt && tracking.landPayment > 0 ? tracking.totalAmount - tracking.ticketAmount - tracking.airportTaxAmount - tracking.landPayment : 0;
      const travelerAdditions = (tracking.travelerAdditions || []).map((entry) => entry.invoiceId === invoice.id ? { ...entry, status: next === 'cancelled' ? 'cancelled' as const : 'active' as const } : entry);
      await onSaveTracking({ ...tracking, travelerAdditions, supplementalInvoiceTotal, supplementalCostTotal, grandTotalAmount: tracking.totalAmount + supplementalInvoiceTotal, profitAmount: baseProfit + supplementalInvoiceTotal - supplementalCostTotal, updatedAt: now });
      return;
    }
    await onSaveTracking({
      ...tracking,
      depositStatus: isDeposit ? next : tracking.depositStatus,
      balanceStatus: isBalance ? next : tracking.balanceStatus,
      firstPaymentReceivedAt: isDeposit && next === 'paid' ? (tracking.firstPaymentReceivedAt || isoToday()) : tracking.firstPaymentReceivedAt,
      fullPaymentReceivedAt: isBalance && next === 'paid' ? (tracking.fullPaymentReceivedAt || isoToday()) : tracking.fullPaymentReceivedAt,
      updatedAt: now,
    });
  }

  const documentTitle = isSupplemental
    ? (th ? `Invoice เพิ่มเติม งวดที่ ${displaySequence}` : `Supplemental Invoice ${displaySequence}`)
    : (th ? `Invoice งวดที่ ${displaySequence}` : `Invoice ${displaySequence}`);

  return <Modal open title={documentTitle} onClose={onClose} wide>
    <div className="invoice-toolbar no-print"><button className="ghost-button" onClick={onClose}><ArrowLeft/>{th ? 'กลับ' : 'Back'}</button><label><span>{th ? 'สถานะเอกสาร' : 'Status'}</span><select value={status} onChange={(e) => void updateStatus(e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label><button className="primary-button" onClick={() => { void printElementAsA4('invoice-print-area', `${invoice.invoiceNo} - ${tracking.customerName}`); }}><Download/>{th ? 'พิมพ์ / บันทึก PDF A4' : 'Print / Save A4 PDF'}</button></div>
    <article className="invoice-sheet journey-invoice-sheet" id="invoice-print-area">
      <header className="invoice-header"><Brand/><div><span>INVOICE</span><h1>{isSupplemental ? (invoice.title || documentTitle) : (th ? 'เอกสารเรียกเก็บเงิน' : 'Payment Invoice')}</h1><b>{invoice.invoiceNo}</b></div></header><div className="invoice-accent"/>
      <section className="invoice-meta"><div><span>{th ? 'เรียกเก็บจาก' : 'Bill to'}</span><strong>{tracking.customerName}</strong><small>{[tracking.phone, tracking.email].filter(Boolean).join(' · ') || '-'}</small></div><div><span>{th ? 'วันที่ออกเอกสาร' : 'Issue date'}</span><strong>{formatDate(invoice.issueDate, language)}</strong><small>{th ? 'ครบกำหนด' : 'Due'}: {invoice.dueDate ? formatDate(invoice.dueDate, language) : '-'}</small></div></section>
      <section className="invoice-trip-summary"><div><span>{th ? 'โปรแกรม' : 'Package'}</span><b>{tracking.packageName || '-'}</b></div><div><span>{th ? 'วันเดินทาง' : 'Travel date'}</span><b>{tracking.travelStartDate ? formatDate(tracking.travelStartDate, language) : '-'}</b></div><div><span>{th ? 'ผู้เดินทางรวม' : 'Total travellers'}</span><b>{totalTravellers} {th ? 'ท่าน' : 'pax'}</b></div></section>

      {isSupplemental ? <>
        <section className="journey-invoice-package supplemental-document-lines">
          <h3>{th ? `รายการเรียกเก็บเพิ่มเติม — Invoice ${displaySequence}` : `Additional charges — Invoice ${displaySequence}`}</h3>
          <div className="journey-invoice-package-head"><span>{th ? 'รายการ' : 'Passenger / Service'}</span><span>PTC</span><span>QTY</span><span>{th ? 'ราคาต่อหน่วย' : 'Selling / Unit'}</span><span>{th ? 'รวม (บาท)' : 'Total (THB)'}</span></div>
          {invoice.lineItems.map((line) => <div className="journey-invoice-package-row journey-invoice-single-row" key={line.id}><span><b>{line.description}</b><small>{travelerAddition && line === invoice.lineItems[0] ? (th ? `PNR ${travelerAddition.pnr}` : `PNR ${travelerAddition.pnr}`) : ''}</small></span><span>{travelerAddition && line === invoice.lineItems[0] ? 'ADT' : 'SRV'}</span><span>{formatNumber(line.quantity, 0)}</span><span>{formatNumber(line.unitPriceTHB, 2)}</span><span>{formatNumber(line.totalTHB, 2)}</span></div>)}
          <div className="journey-invoice-package-total"><span>{th ? `รวม Invoice ${displaySequence}` : `Invoice ${displaySequence} total`}</span><strong>{formatNumber(invoice.amount, 2)}</strong></div>
        </section>
        {travelerAddition && <section className="invoice-passenger-check supplemental-passenger-check">
          <div className="invoice-passenger-check-title"><div><Plane/><span>{th ? 'ผู้เดินทางเพิ่ม — ตรวจสอบชื่อก่อนออกตั๋ว' : 'Added travellers — verify names before ticketing'}</span></div><b>{th ? 'PNR ชุดใหม่' : 'New PNR'}</b></div>
          <div className="invoice-passenger-booking-meta"><div><span>PNR</span><strong>{travelerAddition.pnr || '-'}</strong></div><div><span>{th ? 'สายการบิน' : 'Airline'}</span><strong>{travelerAddition.airline || '-'}</strong></div><div><span>{th ? 'จำนวนรายชื่อ' : 'Names listed'}</span><strong>{invoicePassengerNames.length} / {travelerAddition.passengerCount}</strong></div></div>
          <div className="invoice-passenger-alert"><ShieldCheck/><span>{th ? 'กรุณาตรวจสอบชื่อ–นามสกุล คำนำหน้า และตัวสะกดให้ตรงกับหนังสือเดินทาง ก่อนยืนยันให้ออกตั๋วชุดเพิ่มเติม' : 'Verify every name, title and spelling against the passport before confirming the additional ticket issuance.'}</span></div>
          <ol className={`invoice-passenger-list ${invoicePassengerNames.length > 6 ? 'two-columns' : ''}`}>{invoicePassengerNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ol>
          <div className="supplemental-flight-cost-note"><span>{th ? 'ข้อมูลต้นทุนภายในตาม PNR (ไม่บวกซ้ำกับยอดเรียกเก็บ)' : 'Internal PNR cost details (not added again to customer charge)'}</span><b>{th ? `ตั๋ว ${formatTHB(travelerAddition.ticketPricePerPerson, language)} / ท่าน · ภาษี ${formatTHB(travelerAddition.airportTaxPerPerson, language)} / ท่าน` : `Fare ${formatTHB(travelerAddition.ticketPricePerPerson, language)} / pax · tax ${formatTHB(travelerAddition.airportTaxPerPerson, language)} / pax`}</b></div>
        </section>}
        <section className="supplemental-grand-summary"><div><span>{th ? 'แพ็กเกจเดิม' : 'Original package'}</span><b>{formatNumber(tracking.totalAmount, 2)}</b></div><div><span>{th ? 'Invoice เพิ่มเติมสะสม' : 'Supplemental invoices'}</span><b>{formatNumber(tracking.supplementalInvoiceTotal || invoice.amount, 2)}</b></div><div className="featured"><span>{th ? 'ยอดขายรวมลูกค้า' : 'Customer grand total'}</span><strong>{formatNumber(tracking.grandTotalAmount || tracking.totalAmount + invoice.amount, 2)}</strong></div></section>
      </> : <>
        <section className="journey-invoice-package">
          <h3>{th ? 'มูลค่าแพ็กเกจทั้งหมด' : 'Full package value'}</h3>
          <div className="journey-invoice-package-head"><span>{th ? 'รายการ' : 'Passenger / Service'}</span><span>PTC</span><span>QTY</span><span>{th ? 'ราคาต่อท่าน' : 'Selling / Pax'}</span><span>{th ? 'รวม (บาท)' : 'Total (THB)'}</span></div>
          <div className="journey-invoice-package-row"><span><b>{tracking.packageName}</b><small>{tracking.hotelCategory} · {tracking.travelStartDate && tracking.travelEndDate ? `${formatDate(tracking.travelStartDate, language)} – ${formatDate(tracking.travelEndDate, language)}` : ''}</small></span><span>ADT</span><span>{tracking.passengerCount}</span><span>{formatNumber(tracking.sellingPricePerPerson, 2)}</span><span>{formatNumber(tracking.sellingPricePerPerson * tracking.passengerCount, 2)}</span></div>
          {tracking.businessUpgradeCount > 0 && <div className="journey-invoice-package-row journey-invoice-single-row"><span><b>Business Class Upgrade</b><small>{th ? 'ส่วนเพิ่มราคาขาย รวมอยู่ในแพ็กเกจ' : 'Selling surcharge included in package'}</small></span><span>ADT</span><span>{tracking.businessUpgradeCount}</span><span>{formatNumber(tracking.businessUpgradePerPerson, 2)}</span><span>{formatNumber(tracking.businessUpgradeTotal, 2)}</span></div>}
          {tracking.singleRoomCount > 0 && <div className="journey-invoice-package-row journey-invoice-single-row"><span><b>{th ? 'ส่วนต่างห้องพักเดี่ยว' : 'Single-room supplement'}</b><small>{tracking.hotelCategory}</small></span><span>ADT</span><span>{tracking.singleRoomCount}</span><span>{formatNumber(tracking.singleSupplementPerPerson, 2)}</span><span>{formatNumber(tracking.singleSupplementTotal, 2)}</span></div>}
          {(tracking.additionalItems || []).map((extra) => <div className="journey-invoice-package-row journey-invoice-single-row" key={extra.id}><span><b>{extra.description || (th ? 'รายการเพิ่มเติม' : 'Additional service')}</b><small>{extra.basis === 'per_person' ? (th ? 'ต่อท่าน' : 'Per person') : extra.basis === 'per_group' ? (th ? 'เหมาทั้งกลุ่ม' : 'Per group') : (th ? 'จำนวนกำหนดเอง' : 'Custom quantity')}</small></span><span>SRV</span><span>{formatNumber(extra.quantity, 0)}</span><span>{formatNumber(extra.unitPriceTHB, 2)}</span><span>{formatNumber(extra.totalTHB, 2)}</span></div>)}
          <div className="journey-invoice-package-total"><span>{th ? 'รวมมูลค่าแพ็กเกจ' : 'Total package value'}</span><strong>{formatNumber(tracking.totalAmount, 2)}</strong></div>
        </section>
        {isDeposit ? <section className="journey-payment-breakdown"><h3>{th ? 'การชำระงวดที่ 1 — ค่าตั๋วเครื่องบินตาม PNR + ภาษีสนามบิน' : 'Payment 1 — PNR airfare + airport tax'}</h3><div><span>{tracking.businessUpgradeCount >= tracking.passengerCount && tracking.passengerCount > 0 ? (th ? 'ค่าตั๋วเครื่องบินไป–กลับ ชั้น Business ตาม PNR' : 'Round-trip Business Class airfare per PNR') : tracking.businessUpgradeCount > 0 ? (th ? 'ค่าตั๋วเครื่องบินไป–กลับ ตาม PNR (มีผู้โดยสารอัปเกรด BC)' : 'Round-trip airfare per PNR (mixed cabin)') : (th ? 'ค่าตั๋วเครื่องบินไป–กลับ ชั้น Economy ตาม PNR' : 'Round-trip Economy Class airfare per PNR')}</span><b>{formatNumber(tracking.ticketAmount, 2)}</b></div><div><span>{th ? 'ภาษีสนามบินทั้งหมด' : 'Total airport taxes'}</span><b>{formatNumber(tracking.airportTaxAmount, 2)}</b></div>{tracking.businessUpgradeTotal > 0 && <div className="invoice-info-row"><span>{th ? 'ส่วนเพิ่มราคาขาย Business Class' : 'Business Class selling surcharge'}</span><b>{th ? `รวมในมูลค่าแพ็กเกจแล้ว ${formatNumber(tracking.businessUpgradeTotal, 2)} บาท` : `Already included in package value: ${formatNumber(tracking.businessUpgradeTotal, 2)} THB`}</b></div>}<div className="journey-payment-due"><span>{th ? 'ยอดชำระงวดที่ 1' : 'Payment 1 amount due'}</span><strong>{formatNumber(tracking.depositAmount, 2)}</strong></div></section> : <section className="journey-payment-breakdown"><h3>{th ? 'การชำระงวดที่ 2 — ค่าแพ็กเกจส่วนที่เหลือ' : 'Payment 2 — remaining package balance'}</h3><div><span>{th ? 'ค่าแพ็กเกจทั้งหมด' : 'Full package amount'}</span><b>{formatNumber(tracking.totalAmount, 2)}</b></div>{ticketPayments.length ? ticketPayments.map((payment, index) => <div key={payment.id} className="deduction"><span>{th ? `หัก ค่าตั๋วเครื่องบินที่ชำระแล้ว ครั้งที่ ${index + 1}` : `Less ticket payment ${index + 1}`} {payment.reference ? `(${payment.reference})` : ''}</span><b>-{formatNumber(payment.amount, 2)}</b></div>) : <div className="deduction"><span>{th ? 'หัก ค่าตั๋วเครื่องบินที่ชำระแล้ว' : 'Less ticket payment received'}</span><b>-{formatNumber(paidTicket, 2)}</b></div>}<div className="journey-payment-due"><span>{th ? 'ยอดชำระงวดที่ 2' : 'Payment 2 amount due'}</span><strong>{formatNumber(balanceDue, 2)}</strong></div></section>}
        {isDeposit && <section className="invoice-passenger-check"><div className="invoice-passenger-check-title"><div><Plane/><span>{th ? 'ข้อมูลการจองตั๋วสำหรับตรวจสอบชื่อ' : 'Flight booking details for name verification'}</span></div><b>{th ? 'โปรดตรวจสอบก่อนออกตั๋ว' : 'Please verify before ticketing'}</b></div><div className="invoice-passenger-booking-meta"><div><span>PNR</span><strong>{tracking.flightPnr || '-'}</strong></div><div><span>{th ? 'สายการบิน' : 'Airline'}</span><strong>{tracking.airline || '-'}</strong></div><div><span>{th ? 'จำนวนรายชื่อ' : 'Names listed'}</span><strong>{invoicePassengerNames.length} / {tracking.passengerCount}</strong></div></div><div className="invoice-passenger-alert"><ShieldCheck/><span>{th ? 'กรุณาตรวจสอบชื่อ–นามสกุล คำนำหน้า และการสะกดทุกตัวอักษรให้ตรงกับหนังสือเดินทาง หากยืนยันแล้ว บริษัทจะดำเนินการออกตั๋วตามรายชื่อด้านล่าง' : 'Please verify every passenger’s full name, title and spelling against the passport. Once confirmed, tickets will be issued using the names below.'}</span></div><ol className={`invoice-passenger-list ${invoicePassengerNames.length > 6 ? 'two-columns' : ''}`}>{invoicePassengerNames.length ? invoicePassengerNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>) : <li>{th ? 'ยังไม่มีรายชื่อผู้เดินทาง' : 'No passenger names recorded'}</li>}</ol></section>}
      </>}

      <section className="invoice-total"><div><span>{isSupplemental ? (th ? `ยอดชำระ Invoice ${displaySequence}` : `Invoice ${displaySequence} amount due`) : (th ? `ยอดชำระงวดที่ ${displaySequence}` : `Payment ${displaySequence} due`)}</span><strong>THB {formatNumber(amountDue, 2)}</strong><small>{invoice.dueDate ? `${th ? 'ภายในวันที่' : 'Due by'} ${formatDate(invoice.dueDate, language)}` : '-'}</small></div></section>
      <section className="invoice-note"><h3>{th ? 'หมายเหตุการชำระเงิน' : 'Payment note'}</h3><p>{invoice.note || (isSupplemental ? (th ? 'ยอด Invoice เพิ่มเติมนี้จะถูกรวมในยอดขายรวมของลูกค้า และติดตามการรับชำระแยกจาก Invoice เดิม' : 'This supplemental invoice is included in the customer grand total and tracked separately from the original invoices.') : isDeposit ? (th ? 'เมื่อบริษัทตรวจสอบยอดชำระงวดที่ 1 เรียบร้อยแล้ว เจ้าหน้าที่จะส่งตั๋วเครื่องบินให้ลูกค้า' : 'Flight tickets will be sent after Payment 1 is verified.') : (th ? 'หลังชำระค่าแพ็กเกจครบ บริษัทจะจัดทำและส่ง Itinerary พร้อมเอกสารเตรียมเดินทาง' : 'The itinerary and pre-departure documents will be sent after full payment.'))}</p></section>
      <footer className="invoice-footer"><div><strong>OMG Experience Co., Ltd.</strong><span>info@omgexp.com · 02 630 4600 · omgexp.com</span></div><div><span>{th ? 'ผู้จัดทำ' : 'Prepared by'}</span><b>{tracking.salesOwnerName || '-'}</b></div></footer>
    </article>
  </Modal>;
}

