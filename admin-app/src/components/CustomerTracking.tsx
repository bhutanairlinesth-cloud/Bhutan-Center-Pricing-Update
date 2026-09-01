import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, BadgeCheck, CalendarClock, Check, ChevronDown, CircleDollarSign, ClipboardCheck,
  ClipboardList, Download, Edit3, FileCheck2, FileText, Filter, Flag, Hourglass, Landmark,
  LogOut, MessageSquareText, Plane, Plus, ReceiptText, Search, Send, Settings2, ShieldCheck,
  Sparkles, Trash2, UserRoundCheck, Users, WalletCards, Paperclip, ExternalLink, LoaderCircle, Upload, X,
} from 'lucide-react';
import {
  CustomerTracking, GlobalSettings, HotelCategory, InvoiceDeductionSnapshot, InvoiceDocumentSnapshot,
  InvoiceInstallment, InvoicePackageLineSnapshot, InvoiceTicketBatchSnapshot, JourneyStage, LeadSource,
  PaymentAccountType, PaymentInvoice, PaymentStageStatus, PaymentTransaction, PaymentTransactionType, PricingChannel, QuotationRecord,
  SupplementalInvoiceLine, TourPackage, TrackingStatus, TravelerAddition, User,
} from '../types';
import { LanguageSwitch, useI18n } from '../i18n';
import { calculateGroupTLBreakdown, calculatePrice, normalizeAdditionalCharges } from '../utils/pricing';
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
  quotations: QuotationRecord[];
  onSaveQuotation: (item: QuotationRecord) => Promise<void>;
  onDeleteQuotation: (id: string) => Promise<void>;
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

function paymentAccountSnapshot(settings: GlobalSettings, type: PaymentAccountType) {
  if (type === 'owner') return {
    paymentAccountType: 'owner' as const,
    paymentBankName: settings.ownerBankName ?? 'ธนาคารไทยพาณิชย์',
    paymentAccountName: settings.ownerAccountName ?? 'นายศิเวก สัจเดว',
    paymentAccountNumber: settings.ownerAccountNumber ?? '203-215366-9',
    paymentQrUrl: settings.ownerPaymentQrUrl ?? '',
  };
  return {
    paymentAccountType: 'company' as const,
    paymentBankName: settings.companyBankName ?? 'ธนาคารกสิกรไทย',
    paymentAccountName: settings.companyAccountName ?? 'บริษัท OMG Experience Co., Ltd.',
    paymentAccountNumber: settings.companyAccountNumber ?? '051-2-51692-0',
    paymentQrUrl: settings.companyPaymentQrUrl ?? '',
  };
}
function roundMoney(value: number) { return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100; }
const paymentTypes: PaymentTransactionType[] = ['ticket_deposit', 'package_balance', 'full_payment', 'supplemental', 'refund', 'other'];

const TRACKING_DRAFT_PREFIX = 'bhutan_customer_tracking_draft_v1:';
const NEW_TRACKING_DRAFT_KEY = `${TRACKING_DRAFT_PREFIX}new`;
interface TrackingDraftEnvelope {
  data: CustomerTracking;
  savedAt: string;
  mode: 'new' | 'edit';
}
function trackingDraftKey(id: string, isNew: boolean) {
  return isNew ? NEW_TRACKING_DRAFT_KEY : `${TRACKING_DRAFT_PREFIX}${id}`;
}
function readTrackingDraft(key: string): TrackingDraftEnvelope | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrackingDraftEnvelope;
    return parsed?.data?.id ? parsed : null;
  } catch { return null; }
}
function writeTrackingDraft(key: string, data: CustomerTracking, mode: 'new' | 'edit'): string {
  const savedAt = new Date().toISOString();
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(key, JSON.stringify({ data, savedAt, mode } satisfies TrackingDraftEnvelope)); } catch {}
  }
  return savedAt;
}
function clearTrackingDraft(key: string) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(key); } catch {}
}
function formatDraftTime(value: string, th: boolean) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(th ? 'th-TH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

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
  const code = stage === 'deposit' ? 'T1' : stage === 'balance' ? 'P2' : stage === 'full' ? 'FULL' : `X${sequenceNumber || 3}`;
  return `INV-BH-${y}${m}${d}-${code}-${Math.floor(100 + Math.random() * 900)}`;
}
function makeAddedTravelerInvoice1No(batchNumber: number) {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `INV-BH-${y}${m}${d}-T1A${Math.max(1, batchNumber)}-${Math.floor(100 + Math.random() * 900)}`;
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
    singleSupplementCostPerPerson: 0, extraLines: [], customerChargeTotal: 0, ticketDepositTotal: 0, internalCostTotal: 0, invoiceId: '', note: '', status: 'active',
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
  const ticketDepositTotal = (ticketPricePerPerson + airportTaxPerPerson) * passengerCount;
  const internalCostTotal = ticketDepositTotal + singleSupplementCostPerPerson * singleRoomCount + extraLines.reduce((sum, line) => sum + line.totalCostTHB, 0);
  return { ...draft, passengerCount, businessUpgradeCount, singleRoomCount, packagePricePerPerson, ticketPricePerPerson, airportTaxPerPerson, landCostPerPerson, businessUpgradePerPerson, singleSupplementPerPerson, singleSupplementCostPerPerson, extraLines, customerChargeTotal, ticketDepositTotal, internalCostTotal };
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
  // ชุดแรกของ Invoice 1 ไม่ผูก invoiceId ส่วนผู้เดินทางเพิ่มจะผูก Invoice 1 ย่อยเป็นรายชุด
  const actual = paymentsFor(item.id, payments)
    .filter((payment) => payment.type === 'ticket_deposit' && !payment.invoiceId)
    .reduce((sum, payment) => sum + Math.max(0, payment.amount || 0), 0);
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
function activeTravelerAdditions(item: CustomerTracking) {
  return (item.travelerAdditions || []).filter((entry) => entry.status !== 'cancelled');
}
function travelerAdditionInvoiceIds(item: CustomerTracking) {
  return new Set(activeTravelerAdditions(item).map((entry) => entry.invoiceId).filter(Boolean));
}
function travelerTicketInvoicesFor(item: CustomerTracking, invoices: PaymentInvoice[]) {
  const ids = travelerAdditionInvoiceIds(item);
  return invoices.filter((invoice) => ids.has(invoice.id)).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
}
function travelerAdditionPackageValue(entry: TravelerAddition, fallbackPackagePricePerPerson = 0) {
  const passengerCount = Math.max(0, Number(entry.passengerCount || 0));
  const packagePricePerPerson = Math.max(0, Number(entry.packagePricePerPerson || fallbackPackagePricePerPerson || 0));
  return packagePricePerPerson * passengerCount
    + travelerAdditionBusinessUpgradeValue(entry)
    + travelerAdditionSingleSupplementValue(entry)
    + travelerAdditionExtrasValue(entry);
}
function travelerAdditionBasePackageValue(entry: TravelerAddition, fallbackPackagePricePerPerson = 0) {
  const passengerCount = Math.max(0, Number(entry.passengerCount || 0));
  const packagePricePerPerson = Math.max(0, Number(entry.packagePricePerPerson || fallbackPackagePricePerPerson || 0));
  return passengerCount * packagePricePerPerson;
}
function travelerAdditionBusinessUpgradeValue(entry: TravelerAddition) {
  return Math.max(0, Number(entry.businessUpgradeCount || 0)) * Math.max(0, Number(entry.businessUpgradePerPerson || 0));
}
function travelerAdditionSingleSupplementValue(entry: TravelerAddition) {
  return Math.max(0, Number(entry.singleRoomCount || 0)) * Math.max(0, Number(entry.singleSupplementPerPerson || 0));
}
function travelerAdditionExtrasValue(entry: TravelerAddition) {
  return (entry.extraLines || []).reduce((sum, line) => {
    const quantity = Math.max(0, Number(line.quantity || 0));
    const unitPrice = Math.max(0, Number(line.unitPriceTHB || 0));
    return sum + (Number(line.totalTHB) > 0 ? Number(line.totalTHB) : quantity * unitPrice);
  }, 0);
}
function travelerAdditionInternalCostValue(entry: TravelerAddition) {
  const ticketDeposit = travelerAdditionTicketDepositTotal(entry);
  const singleRoomCost = Math.max(0, Number(entry.singleRoomCount || 0)) * Math.max(0, Number(entry.singleSupplementCostPerPerson || 0));
  const extrasCost = (entry.extraLines || []).reduce((sum, line) => {
    const quantity = Math.max(0, Number(line.quantity || 0));
    const unitCost = Math.max(0, Number(line.costPerUnitTHB || 0));
    return sum + (Number(line.totalCostTHB) > 0 ? Number(line.totalCostTHB) : quantity * unitCost);
  }, 0);
  return ticketDeposit + singleRoomCost + extrasCost;
}
function travelerAdditionPackageTotal(item: CustomerTracking) {
  return activeTravelerAdditions(item).reduce((sum, entry) => sum + travelerAdditionPackageValue(entry, item.sellingPricePerPerson), 0);
}
function travelerAdditionInternalCostTotal(item: CustomerTracking) {
  return activeTravelerAdditions(item).reduce((sum, entry) => sum + travelerAdditionInternalCostValue(entry), 0);
}
function travelerAdditionTicketDepositTotal(entry: TravelerAddition) {
  return Math.max(0, entry.ticketDepositTotal ?? ((entry.ticketPricePerPerson + entry.airportTaxPerPerson) * entry.passengerCount));
}
function generalSupplementalInvoices(item: CustomerTracking, invoices: PaymentInvoice[]) {
  const travelerInvoiceIds = travelerAdditionInvoiceIds(item);
  return activeSupplementalInvoices(item.id, invoices).filter((invoice) => !travelerInvoiceIds.has(invoice.id));
}
function customerSupplementalSalesTotal(item: CustomerTracking, invoices: PaymentInvoice[]) {
  return travelerAdditionPackageTotal(item) + generalSupplementalInvoices(item, invoices).reduce((sum, invoice) => sum + Math.max(0, invoice.amount || 0), 0);
}
function customerSupplementalCostTotal(item: CustomerTracking, invoices: PaymentInvoice[]) {
  return travelerAdditionInternalCostTotal(item) + generalSupplementalInvoices(item, invoices).reduce((sum, invoice) => sum + Math.max(0, invoice.costAmount || 0), 0);
}
function packageSalesTotal(item: CustomerTracking) {
  return Math.max(0, item.totalAmount || 0) + travelerAdditionPackageTotal(item);
}
function originalChargeablePassengerCount(item: CustomerTracking) {
  const actual = Math.max(1, Math.round(Number(item.passengerCount || 1)));
  if (item.pricingMode !== 'group_tl') return actual;
  return Math.min(actual, Math.max(1, Math.round(Number(item.chargeablePassengerCount || actual))));
}
function totalPackagePassengerCount(item: CustomerTracking) {
  return Math.max(0, item.passengerCount || 0) + addedPassengerCount(item);
}
function addedTravelerAirfareTotal(item: CustomerTracking) {
  return activeTravelerAdditions(item).reduce((sum, entry) => sum + Math.max(0, entry.ticketPricePerPerson || 0) * Math.max(0, entry.passengerCount || 0), 0);
}
function addedTravelerAirportTaxTotal(item: CustomerTracking) {
  return activeTravelerAdditions(item).reduce((sum, entry) => sum + Math.max(0, entry.airportTaxPerPerson || 0) * Math.max(0, entry.passengerCount || 0), 0);
}
function totalAirfareAndTaxCost(item: CustomerTracking) {
  return Math.max(0, item.ticketAmount || 0) + Math.max(0, item.airportTaxAmount || 0)
    + addedTravelerAirfareTotal(item) + addedTravelerAirportTaxTotal(item);
}
function addedTravelerTicketPaidAmount(item: CustomerTracking, invoices: PaymentInvoice[], payments: PaymentTransaction[]) {
  const invoiceMap = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  return activeTravelerAdditions(item).reduce((sum, entry) => {
    const invoice = invoiceMap.get(entry.invoiceId);
    if (!invoice || invoice.status === 'cancelled') return sum;
    const paid = invoicePaidAmount(invoice.id, payments);
    if (paid > 0) return sum + Math.min(invoice.amount, paid);
    return sum + (invoice.status === 'paid' ? invoice.amount : 0);
  }, 0);
}
function allTicketPaymentsReceived(item: CustomerTracking, invoices: PaymentInvoice[], payments: PaymentTransaction[]) {
  if ((item.paymentPlan || 'installments') === 'full_payment') {
    const fullInvoice = invoices.find((invoice) => invoice.trackingId === item.id && invoice.installment === 'full' && invoice.status !== 'cancelled');
    if (!fullInvoice) return false;
    return fullInvoice.status === 'paid' || invoicePaidAmount(fullInvoice.id, payments) >= fullInvoice.amount - 0.01;
  }
  const originalPaid = ticketPaidAmount(item, payments) >= Math.max(0, item.depositAmount || 0) - 0.01;
  const invoiceMap = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const addedPaid = activeTravelerAdditions(item).every((entry) => {
    const invoice = invoiceMap.get(entry.invoiceId);
    if (!invoice || invoice.status === 'cancelled') return false;
    return invoice.status === 'paid' || invoicePaidAmount(invoice.id, payments) >= invoice.amount - 0.01;
  });
  return originalPaid && addedPaid;
}
function pendingTravelerTicketInvoices(item: CustomerTracking, invoices: PaymentInvoice[], payments: PaymentTransaction[]) {
  const invoiceMap = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  return activeTravelerAdditions(item).filter((entry) => {
    const invoice = invoiceMap.get(entry.invoiceId);
    if (!invoice || invoice.status === 'cancelled') return true;
    return invoice.status !== 'paid' && invoicePaidAmount(invoice.id, payments) < invoice.amount - 0.01;
  });
}
function totalTicketPaymentsReceived(item: CustomerTracking, invoices: PaymentInvoice[], payments: PaymentTransaction[]) {
  return ticketPaidAmount(item, payments) + addedTravelerTicketPaidAmount(item, invoices, payments);
}
function customerGrandTotal(item: CustomerTracking, invoices?: PaymentInvoice[]) {
  const extras = invoices ? customerSupplementalSalesTotal(item, invoices) : Math.max(0, item.supplementalInvoiceTotal || 0);
  return Math.max(0, item.totalAmount || 0) + extras;
}
/**
 * Internal costs carried by supplemental flows, excluding added-traveller airfare/tax.
 * Added-traveller airfare/tax is already included in totalAirfareAndTaxCost(), so it
 * must not be deducted twice when calculating realized profit.
 */
function supplementalNonTicketCostTotal(item: CustomerTracking, invoices: PaymentInvoice[]) {
  const allSupplementalCosts = customerSupplementalCostTotal(item, invoices);
  const addedTravellerAirfareAndTax = addedTravelerAirfareTotal(item) + addedTravelerAirportTaxTotal(item);
  return Math.max(0, allSupplementalCosts - addedTravellerAirfareAndTax);
}
function realizedGrossProfit(item: CustomerTracking, invoices: PaymentInvoice[], landPayment = item.landPayment) {
  return customerGrandTotal(item, invoices)
    - totalAirfareAndTaxCost(item)
    - Math.max(0, landPayment || 0)
    - supplementalNonTicketCostTotal(item, invoices);
}
function mergeInvoicePackageLines(lines: InvoicePackageLineSnapshot[]) {
  const merged = new Map<string, InvoicePackageLineSnapshot>();
  for (const line of lines) {
    if (!line.totalTHB && !line.unitPriceTHB) continue;
    const key = [line.descriptionTh, line.descriptionEn, line.detailTh, line.detailEn, line.ptc, line.unitPriceTHB].join('|');
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += line.quantity;
      existing.totalTHB += line.totalTHB;
    } else {
      merged.set(key, { ...line });
    }
  }
  return Array.from(merged.values());
}

function buildPackageSnapshotRows(item: CustomerTracking): InvoicePackageLineSnapshot[] {
  const rows: InvoicePackageLineSnapshot[] = [];
  const add = (line: Omit<InvoicePackageLineSnapshot, 'id'>) => rows.push({ id: makeId('pkgrow'), ...line });
  const isGroupTL = item.pricingMode === 'group_tl';
  const billedPax = originalChargeablePassengerCount(item);
  const tlCount = Math.max(0, Math.max(1, item.passengerCount || 1) - billedPax);
  const childCount = !isGroupTL ? Math.min(billedPax, Math.max(0, Math.round(Number(item.childPassengerCount || 0)))) : 0;
  const adultBilledPax = Math.max(0, billedPax - childCount);
  if (adultBilledPax > 0) add({
    descriptionTh: item.packageName || 'แพ็กเกจทัวร์', descriptionEn: item.packageName || 'Tour package',
    detailTh: isGroupTL ? `${item.hotelCategory} · เดินทางจริง ${item.passengerCount} ท่าน · เรียกเก็บ ${billedPax}+${tlCount} TL` : `${item.hotelCategory}`,
    detailEn: isGroupTL ? `${item.hotelCategory} · ${item.passengerCount} actual travellers · billed ${billedPax}+${tlCount} TL` : `${item.hotelCategory}`,
    ptc: 'ADT', quantity: adultBilledPax, unitPriceTHB: Math.max(0, item.sellingPricePerPerson || 0),
    totalTHB: adultBilledPax * Math.max(0, item.sellingPricePerPerson || 0),
  });
  if (childCount > 0) add({
    descriptionTh: `${item.packageName || 'แพ็กเกจทัวร์'} — เด็ก`, descriptionEn: `${item.packageName || 'Tour package'} — Child`,
    detailTh: item.hotelCategory, detailEn: item.hotelCategory, ptc: 'CHD', quantity: childCount,
    unitPriceTHB: Math.max(0, item.childSellingPricePerPerson || item.sellingPricePerPerson || 0),
    totalTHB: childCount * Math.max(0, item.childSellingPricePerPerson || item.sellingPricePerPerson || 0),
  });
  if (item.businessUpgradeCount > 0 && item.businessUpgradePerPerson > 0) add({
    descriptionTh: 'อัปเกรด Business Class', descriptionEn: 'Business Class Upgrade',
    detailTh: isGroupTL ? `${item.businessUpgradeCount} ท่าน จากผู้เดินทางจริง ${item.passengerCount} ท่าน` : 'ส่วนเพิ่มราคาขายของผู้โดยสารที่อัปเกรด', detailEn: isGroupTL ? `${item.businessUpgradeCount} of ${item.passengerCount} actual travellers` : 'Selling surcharge for upgraded passengers', ptc: 'ADT',
    quantity: item.businessUpgradeCount, unitPriceTHB: item.businessUpgradePerPerson,
    totalTHB: item.businessUpgradeCount * item.businessUpgradePerPerson,
  });
  if (item.singleRoomCount > 0 && item.singleSupplementPerPerson > 0) add({
    descriptionTh: 'พักเดี่ยว', descriptionEn: 'Single-room supplement', detailTh: item.hotelCategory, detailEn: item.hotelCategory, ptc: 'SGL',
    quantity: item.singleRoomCount, unitPriceTHB: item.singleSupplementPerPerson,
    totalTHB: item.singleRoomCount * item.singleSupplementPerPerson,
  });
  for (const extra of item.additionalItems || []) add({
    descriptionTh: extra.description || 'รายการเพิ่มเติม', descriptionEn: extra.description || 'Additional service',
    detailTh: extra.basis === 'per_person' ? 'ต่อท่าน' : extra.basis === 'per_group' ? 'เหมาทั้งกลุ่ม' : 'จำนวนกำหนดเอง',
    detailEn: extra.basis === 'per_person' ? 'Per person' : extra.basis === 'per_group' ? 'Per group' : 'Custom quantity', ptc: 'SRV',
    quantity: Math.max(1, extra.quantity || 1), unitPriceTHB: Math.max(0, extra.unitPriceTHB || 0), totalTHB: Math.max(0, extra.totalTHB || 0),
  });
  activeTravelerAdditions(item).forEach((entry, index) => {
    add({
      descriptionTh: item.packageName || `แพ็กเกจผู้เดินทางเพิ่ม ชุดที่ ${index + 1}`, descriptionEn: item.packageName || `Added-traveller package ${index + 1}`,
      detailTh: `${item.hotelCategory}`, detailEn: `${item.hotelCategory}`, ptc: 'ADT',
      quantity: entry.passengerCount, unitPriceTHB: entry.packagePricePerPerson > 0 ? entry.packagePricePerPerson : item.sellingPricePerPerson,
      totalTHB: entry.passengerCount * (entry.packagePricePerPerson > 0 ? entry.packagePricePerPerson : item.sellingPricePerPerson),
    });
    if (entry.businessUpgradeCount > 0 && entry.businessUpgradePerPerson > 0) add({
      descriptionTh: 'อัปเกรด Business Class', descriptionEn: 'Business Class Upgrade', detailTh: 'ผู้เดินทางเพิ่ม', detailEn: 'Added travellers', ptc: 'BC',
      quantity: entry.businessUpgradeCount, unitPriceTHB: entry.businessUpgradePerPerson,
      totalTHB: entry.businessUpgradeCount * entry.businessUpgradePerPerson,
    });
    if (entry.singleRoomCount > 0 && entry.singleSupplementPerPerson > 0) add({
      descriptionTh: 'พักเดี่ยว', descriptionEn: 'Single-room supplement', detailTh: 'ผู้เดินทางเพิ่ม', detailEn: 'Added travellers', ptc: 'SGL',
      quantity: entry.singleRoomCount, unitPriceTHB: entry.singleSupplementPerPerson,
      totalTHB: entry.singleRoomCount * entry.singleSupplementPerPerson,
    });
    for (const line of entry.extraLines || []) add({
      descriptionTh: line.description || 'รายการเพิ่มเติม', descriptionEn: line.description || 'Additional service', detailTh: 'ผู้เดินทางเพิ่ม', detailEn: 'Added travellers', ptc: 'SRV',
      quantity: Math.max(1, line.quantity || 1), unitPriceTHB: Math.max(0, line.unitPriceTHB || 0), totalTHB: Math.max(0, line.totalTHB || 0),
    });
  });
  const merged = mergeInvoicePackageLines(rows);
  const current = merged.reduce((sum, row) => sum + row.totalTHB, 0);
  const expected = packageSalesTotal(item);
  const difference = Math.round((expected - current) * 100) / 100;
  if (Math.abs(difference) > 0.01) merged.push({
    id: makeId('pkgrow'), descriptionTh: 'ปรับยอดแพ็กเกจ', descriptionEn: 'Package adjustment', detailTh: 'ยอดปรับปรุงในระบบ', detailEn: 'System package adjustment', ptc: 'ADJ',
    quantity: 1, unitPriceTHB: difference, totalTHB: difference,
  });
  return merged;
}

function buildOriginalTicketSnapshot(item: CustomerTracking): InvoiceTicketBatchSnapshot {
  const names = (item.passengerNames || '').split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  const pax = Math.max(1, Math.round(Number(item.passengerCount || 1)));
  const childCount = item.pricingMode === 'group_tl' ? 0 : Math.min(pax, Math.max(0, Math.round(Number(item.childPassengerCount || 0))));
  const adultCount = Math.max(0, pax - childCount);
  const businessCount = Math.min(adultCount, Math.max(0, Math.round(Number(item.businessUpgradeCount || 0))));
  const adultEconomyCount = Math.max(0, adultCount - businessCount);
  const adultFare = Math.max(0, Number(item.ticketPricePerPerson || 0));
  const adultTax = Math.max(0, Number(item.airportTaxPerPerson || 0));
  const childFare = Math.max(0, Number(item.childTicketPricePerPerson || adultFare));
  const childTax = Math.max(0, Number(item.childAirportTaxPerPerson || adultTax));
  const businessFare = adultFare + Math.max(0, Number(item.businessUpgradePerPerson || 0));
  const fareLines = [
    ...(adultEconomyCount > 0 ? [{ ptc: 'ADT' as const, cabinClass: 'Economy' as const, passengerCount: adultEconomyCount, farePerPersonTHB: adultFare, airportTaxPerPersonTHB: adultTax, totalPerPersonTHB: adultFare + adultTax, totalTHB: adultEconomyCount * (adultFare + adultTax) }] : []),
    ...(businessCount > 0 ? [{ ptc: 'ADT' as const, cabinClass: 'Business' as const, passengerCount: businessCount, farePerPersonTHB: businessFare, airportTaxPerPersonTHB: adultTax, totalPerPersonTHB: businessFare + adultTax, totalTHB: businessCount * (businessFare + adultTax) }] : []),
    ...(childCount > 0 ? [{ ptc: 'CHD' as const, cabinClass: 'Economy' as const, passengerCount: childCount, farePerPersonTHB: childFare, airportTaxPerPersonTHB: childTax, totalPerPersonTHB: childFare + childTax, totalTHB: childCount * (childFare + childTax) }] : []),
  ];
  const cabinClass = businessCount >= adultCount && adultCount > 0 ? 'Business' : businessCount > 0 ? 'Mixed Economy / Business' : 'Economy';
  const fareTotalTHB = fareLines.reduce((sum, line) => sum + line.farePerPersonTHB * line.passengerCount, 0);
  const airportTaxTotalTHB = fareLines.reduce((sum, line) => sum + line.airportTaxPerPersonTHB * line.passengerCount, 0);
  return {
    batchLabelTh: 'ผู้เดินทางชุดแรก', batchLabelEn: 'Original traveller group', passengerCount: pax,
    passengerNames: names, pnr: item.flightPnr || '', airline: item.airline || '', cabinClass,
    farePerPersonTHB: adultFare, airportTaxPerPersonTHB: adultTax,
    fareTotalTHB, airportTaxTotalTHB, totalDueTHB: fareTotalTHB + airportTaxTotalTHB,
    fareLines: fareLines.length > 1 || childCount > 0 || businessCount > 0 ? fareLines : undefined,
  };
}

function buildAddedTicketSnapshot(entry: TravelerAddition, batchNumber: number): InvoiceTicketBatchSnapshot {
  const names = (entry.passengerNames || '').split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
  const cabinClass = entry.businessUpgradeCount >= entry.passengerCount && entry.passengerCount > 0 ? 'Business' : entry.businessUpgradeCount > 0 ? 'Mixed Economy / Business' : 'Economy';
  return {
    batchLabelTh: `ผู้เดินทางเพิ่ม ชุดที่ ${batchNumber}`, batchLabelEn: `Added traveller group ${batchNumber}`,
    passengerCount: entry.passengerCount, passengerNames: names, pnr: entry.pnr || '', airline: entry.airline || '', cabinClass,
    farePerPersonTHB: entry.ticketPricePerPerson, airportTaxPerPersonTHB: entry.airportTaxPerPerson,
    fareTotalTHB: entry.ticketPricePerPerson * entry.passengerCount,
    airportTaxTotalTHB: entry.airportTaxPerPerson * entry.passengerCount,
    totalDueTHB: travelerAdditionTicketDepositTotal(entry),
  };
}

function buildTicketDeductionSnapshot(item: CustomerTracking, invoices: PaymentInvoice[], payments: PaymentTransaction[]): InvoiceDeductionSnapshot[] {
  const deductions: InvoiceDeductionSnapshot[] = [];
  const originalPayments = paymentsFor(item.id, payments).filter((payment) => payment.type === 'ticket_deposit' && !payment.invoiceId && payment.amount > 0);
  if (originalPayments.length) originalPayments.forEach((payment, index) => deductions.push({
    id: payment.id, labelTh: `ค่าตั๋วเครื่องบินชุดแรกที่ชำระแล้ว${originalPayments.length > 1 ? ` ครั้งที่ ${index + 1}` : ''}`,
    labelEn: `Paid original-group airfare${originalPayments.length > 1 ? ` payment ${index + 1}` : ''}`,
    amountTHB: payment.amount, reference: payment.reference || '',
  }));
  else if (item.depositStatus === 'paid' || item.firstPaymentReceivedAt) deductions.push({
    id: 'original-ticket', labelTh: 'ค่าตั๋วเครื่องบินชุดแรกที่ชำระแล้ว', labelEn: 'Paid original-group airfare',
    amountTHB: item.depositAmount, reference: '',
  });
  const invoiceMap = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  activeTravelerAdditions(item).forEach((entry, index) => {
    const linked = invoiceMap.get(entry.invoiceId);
    if (!linked || linked.status === 'cancelled') return;
    const paid = invoicePaidAmount(linked.id, payments);
    const amount = paid > 0 ? Math.min(paid, linked.amount) : linked.status === 'paid' ? linked.amount : 0;
    if (amount <= 0) return;
    deductions.push({ id: linked.id, labelTh: `ค่าตั๋วผู้เดินทางเพิ่ม ชุดที่ ${index + 1}${entry.pnr ? ` — PNR ${entry.pnr}` : ''} ที่ชำระแล้ว`, labelEn: `Paid added-traveller airfare group ${index + 1}${entry.pnr ? ` — PNR ${entry.pnr}` : ''}`, amountTHB: amount, reference: '' });
  });
  return deductions;
}

function buildInvoiceSnapshot(item: CustomerTracking, kind: InvoiceDocumentSnapshot['kind'], options?: { ticketBatch?: InvoiceTicketBatchSnapshot; invoices?: PaymentInvoice[]; payments?: PaymentTransaction[] }): InvoiceDocumentSnapshot {
  const packageRows = buildPackageSnapshotRows(item);
  const packageTotalTHB = packageRows.reduce((sum, row) => sum + row.totalTHB, 0);
  const deductions = kind === 'package_balance' ? buildTicketDeductionSnapshot(item, options?.invoices || [], options?.payments || []) : undefined;
  const deducted = deductions?.reduce((sum, row) => sum + row.amountTHB, 0) || 0;
  return {
    version: 1, kind, packageRows, packageTotalTHB, totalPassengerCount: item.passengerCount + addedPassengerCount(item),
    ticketBatch: options?.ticketBatch, deductions, balanceDueTHB: kind === 'package_balance' ? Math.max(0, packageTotalTHB - deducted) : undefined,
    capturedAt: new Date().toISOString(),
  };
}

function invoicePaidAmount(invoiceId: string, payments: PaymentTransaction[]) {
  return payments.filter((x) => x.invoiceId === invoiceId).reduce((sum, x) => sum + (x.type === 'refund' ? -Math.abs(x.amount) : x.amount), 0);
}
function paymentSummary(item: CustomerTracking, payments: PaymentTransaction[]) {
  const deposit = effectiveStageStatus(item.depositStatus, item.depositDueDate);
  const balance = effectiveStageStatus(item.balanceStatus, item.balanceDueDate);
  const received = sumPayments(paymentsFor(item.id, payments));
  const grandTotal = Math.max(packageSalesTotal(item), item.grandTotalAmount || 0);
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
  const [editingIsNew, setEditingIsNew] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState<{ tracking: CustomerTracking; invoice: PaymentInvoice } | null>(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'sales' | 'booking' | 'visa' | 'travel' | 'after'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | ReturnType<typeof paymentSummary>>('all');
  const [quotationArchiveOpen, setQuotationArchiveOpen] = useState(false);
  const [quotationSearch, setQuotationSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = isoToday();
    const todayTs = new Date(`${today}T00:00:00`).getTime();

    const rows = props.trackings.filter((item) => {
      const stage = getJourneyStage(item);
      const matchSearch = !q || [item.opportunityName, item.customerName, item.phone, item.email, item.packageName, item.airline, item.flightPnr, item.landSupplier, item.landInvoiceNo, item.landTransferReference, ...(item.travelerAdditions || []).flatMap((entry) => [entry.pnr, entry.passengerNames, entry.airline])]
        .join(' ').toLowerCase().includes(q);
      const matchGroup = groupFilter === 'all' || stageGroup[stage] === groupFilter;
      const matchPayment = paymentFilter === 'all' || paymentSummary(item, props.payments) === paymentFilter;
      return matchSearch && matchGroup && matchPayment;
    });

    // Priority for the working list:
    // 1) active trips that are coming up, nearest departure first
    // 2) active trips whose departure date has already passed, most recent first
    // 3) active records without a travel date
    // 4) closed/cancelled records, kept at the bottom
    return [...rows].sort((a, b) => {
      const priority = (item: CustomerTracking) => {
        const stage = getJourneyStage(item);
        const isClosed = stage === 'closed' || stage === 'cancelled';
        const travelTs = item.travelStartDate ? new Date(`${item.travelStartDate}T00:00:00`).getTime() : Number.NaN;
        const hasTravelDate = Number.isFinite(travelTs);

        if (isClosed) return { bucket: 3, order: hasTravelDate ? -travelTs : 0 };
        if (hasTravelDate && travelTs >= todayTs) return { bucket: 0, order: travelTs };
        if (hasTravelDate) return { bucket: 1, order: -travelTs };
        return { bucket: 2, order: -(new Date(item.createdAt || item.updatedAt || 0).getTime() || 0) };
      };

      const ap = priority(a);
      const bp = priority(b);
      if (ap.bucket !== bp.bucket) return ap.bucket - bp.bucket;
      if (ap.order !== bp.order) return ap.order - bp.order;
      return (a.customerName || a.opportunityName || '').localeCompare(b.customerName || b.opportunityName || '', language === 'th' ? 'th' : 'en');
    });
  }, [props.trackings, props.payments, search, groupFilter, paymentFilter, language]);

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
      id: makeId('crm'), sourceQuotationId: '', sourceQuotationNo: '', opportunityName: '', customerName: '', phone: '', email: '', invoiceAddress: '', leadSource: 'LINE OA', landSupplier: '', airline: 'Bhutan Airlines',
      travelStartDate: '', travelEndDate: '', packageId: first?.id || '', packageName: first?.name || '', hotelCategory: '3 Stars', passengerCount: 2,
      chargeablePassengerCount: 2, tourLeaderCount: 0, pricingMode: 'standard', channel: 'retail', paymentPlan: 'installments', childPassengerCount: 0, childSellingPricePerPerson: 0, childTicketPricePerPerson: 0, childAirportTaxPerPerson: props.settings.airportTaxTHB, sellingPricePerPerson: 0,
      regularLandCostPerPerson: 0, tourLeaderLandCostPerPerson: 0, groupMarginPerTraveler: props.settings.marginTHB, groupSellingPriceOverridePerPerson: 0, groupPricingCostTotal: 0,
      singleRoomCount: 0, singleSupplementPerPerson: 0, singleSupplementTotal: 0, totalAmount: 0, supplementalInvoiceTotal: 0, supplementalCostTotal: 0, grandTotalAmount: 0, travelerAdditions: [],
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

  function trackingFromQuotation(quotation: QuotationRecord): CustomerTracking {
    const base = newTracking();
    const result = quotation.pricingResult;
    const now = new Date().toISOString();
    const travelStartDate = quotation.travelDate || result.travelDate || '';
    const ticketAndTax = Math.max(0, Number(result.flightTotal || 0)) + Math.max(0, Number(result.airportTaxTotal || 0));
    const totalAmount = Math.max(0, Number(quotation.totalAmount || result.groupTotal || 0));
    return {
      ...base,
      id: makeId('crm'),
      sourceQuotationId: quotation.id,
      sourceQuotationNo: quotation.quotationNo,
      opportunityName: quotation.customerName || quotation.quotationNo,
      customerName: quotation.customerName,
      phone: quotation.phone,
      email: quotation.email,
      invoiceAddress: quotation.invoiceAddress,
      packageId: quotation.packageId || quotation.pricingInput.packageId || '',
      packageName: quotation.packageName || result.packageName || '',
      hotelCategory: quotation.hotelCategory || result.hotelCategory || '3 Stars',
      travelStartDate,
      travelEndDate: travelStartDate ? addDays(travelStartDate, Math.max(0, Number(result.nights || 0))) : '',
      passengerCount: Math.max(1, Number(quotation.passengerCount || result.passengerCount || 1)),
      chargeablePassengerCount: Math.max(1, Number(quotation.chargeablePassengerCount || result.chargeablePassengerCount || quotation.passengerCount || 1)),
      tourLeaderCount: Math.max(0, Number(quotation.tourLeaderCount || result.tourLeaderCount || 0)),
      pricingMode: quotation.pricingMode || result.pricingMode || 'standard',
      channel: quotation.channel || result.channel || 'retail',
      childPassengerCount: Math.max(0, Number(quotation.childPassengerCount ?? result.childPassengerCount ?? 0)),
      childSellingPricePerPerson: Math.max(0, Number(quotation.childSellingPricePerPerson ?? result.childSellingPricePerPerson ?? 0)),
      childTicketPricePerPerson: Math.max(0, Number(result.childTicketPricePerPerson || 0)),
      childAirportTaxPerPerson: Math.max(0, Number(result.childAirportTaxPerPerson || 0)),
      sellingPricePerPerson: Math.max(0, Number(quotation.sellingPricePerPerson || result.sellingPricePerPerson || 0)),
      regularLandCostPerPerson: Math.max(0, Number(result.regularLandCostPerPerson || 0)),
      tourLeaderLandCostPerPerson: Math.max(0, Number(result.tourLeaderLandCostPerPerson || 0)),
      groupMarginPerTraveler: Math.max(0, Number(result.groupMarginPerTraveler || 0)),
      groupSellingPriceOverridePerPerson: result.pricingMode === 'group_tl' ? Math.max(0, Number(result.sellingPricePerPerson || 0)) : 0,
      groupPricingCostTotal: Math.max(0, Number(result.operatingCostTotal || 0)),
      singleRoomCount: Math.max(0, Number(result.singleRoomCount || 0)),
      singleSupplementPerPerson: Math.max(0, Number(result.singleSupplementPerPerson || 0)),
      singleSupplementTotal: Math.max(0, Number(result.singleSupplementTotal || 0)),
      totalAmount,
      grandTotalAmount: totalAmount,
      ticketPricePerPerson: Math.max(0, Number(result.airTicketPerPerson || 0)),
      ticketAmount: Math.max(0, Number(result.flightTotal || 0)),
      airportTaxPerPerson: Math.max(0, Number(result.airportTaxPerPerson || 0)),
      airportTaxAmount: Math.max(0, Number(result.airportTaxTotal || 0)),
      businessUpgradeCount: Math.max(0, Number(result.businessUpgradeCount || 0)),
      businessUpgradePerPerson: Math.max(0, Number(result.businessUpgradePerPerson || 0)),
      businessUpgradeTotal: Math.max(0, Number(result.businessUpgradeTotal || 0)),
      additionalItems: (result.additionalItems || []).map((item) => ({ ...item })),
      additionalItemsTotal: Math.max(0, Number(result.additionalItemsTotal || 0)),
      depositAmount: ticketAndTax,
      balanceAmount: Math.max(0, totalAmount - ticketAndTax),
      status: 'won',
      note: quotation.note || '',
      quotationSentAt: (quotation.createdAt || now).slice(0, 10),
      bookingConfirmedAt: isoToday(),
      nextAction: th ? 'รับ Passport และรูปถ่ายของผู้เดินทางให้ครบ' : 'Collect passport and traveller photos',
      createdAt: now,
      updatedAt: now,
    };
  }

  async function confirmQuotationAndStartJourney(quotation: QuotationRecord) {
    if (quotation.convertedTrackingId) {
      const existing = props.trackings.find((item) => item.id === quotation.convertedTrackingId);
      if (existing) { setQuotationArchiveOpen(false); setEditingIsNew(false); setEditing(existing); return; }
    }
    const ok = window.confirm(th
      ? `ยืนยันว่าลูกค้าคอนเฟิร์ม ${quotation.quotationNo} และเริ่ม Customer Journey ใช่หรือไม่?`
      : `Confirm ${quotation.quotationNo} and start the Customer Journey?`);
    if (!ok) return;
    const tracking = trackingFromQuotation(quotation);
    await props.onSaveTracking(tracking);
    await props.onSaveQuotation({ ...quotation, status: 'converted', confirmedAt: new Date().toISOString(), convertedTrackingId: tracking.id, updatedAt: new Date().toISOString() });
    setQuotationArchiveOpen(false);
    setEditingIsNew(false);
    setEditing(tracking);
  }

  function openConvertedQuotation(quotation: QuotationRecord) {
    const existing = props.trackings.find((item) => item.id === quotation.convertedTrackingId);
    if (!existing) return;
    setQuotationArchiveOpen(false);
    setEditingIsNew(false);
    setEditing(existing);
  }

  async function issueInvoice(tracking: CustomerTracking, installment: InvoiceInstallment) {
    const needsTicketVerification = installment === 'deposit' || installment === 'full';
    if (needsTicketVerification) {
      const passengerNames = (tracking.passengerNames || '')
        .split(/\r?\n/)
        .map((name) => name.trim())
        .filter(Boolean);
      if (!tracking.flightPnr?.trim()) {
        window.alert(th
          ? (installment === 'full' ? 'กรุณากรอก PNR ก่อนออก Invoice ชำระเต็มจำนวน' : 'กรุณากรอก PNR ก่อนออก Invoice งวดที่ 1')
          : (installment === 'full' ? 'Please enter the PNR before issuing the full-payment invoice.' : 'Please enter the PNR before issuing Invoice 1.'));
        return;
      }
      if (!passengerNames.length) {
        window.alert(th ? 'กรุณากรอกรายชื่อผู้เดินทางทั้งหมดก่อนออก Invoice' : 'Please enter all passenger names before issuing the invoice.');
        return;
      }
      if (passengerNames.length !== Math.max(1, tracking.passengerCount)) {
        const proceed = window.confirm(th
          ? `พบรายชื่อ ${passengerNames.length} รายชื่อ แต่จำนวนผู้เดินทางในระบบคือ ${tracking.passengerCount} ท่าน\nต้องการออก Invoice ต่อหรือไม่?`
          : `There are ${passengerNames.length} passenger names, while the booking has ${tracking.passengerCount} passengers.\nContinue issuing the invoice?`);
        if (!proceed) return;
      }
    }

    if (installment === 'balance' && !allTicketPaymentsReceived(tracking, props.invoices, props.payments)) {
      window.alert(th
        ? 'ยังรับชำระค่าตั๋วไม่ครบทุกชุด กรุณารับชำระ Invoice ค่าตั๋วของผู้เดินทางเดิมและผู้เดินทางเพิ่มให้ครบก่อนยื่นวีซ่าและออก Invoice 2'
        : 'Ticket payments are still incomplete. Receive all original and added-traveller ticket invoices before visa submission and Invoice 2.');
      return;
    }
    if (installment === 'balance' && !(tracking.landInvoiceReceivedAt || tracking.landInvoiceAmountUSD > 0)) {
      window.alert(th ? 'กรุณาบันทึก Land Invoice และยอด USD ก่อนออก Invoice 2' : 'Please record the land invoice and USD amount before issuing Invoice 2.');
      return;
    }

    const existing = props.invoices.find((x) => x.trackingId === tracking.id && x.installment === installment && x.status !== 'cancelled');
    const now = new Date().toISOString();
    const dueDate = installment === 'balance' ? tracking.balanceDueDate : tracking.depositDueDate;
    const documentData = installment === 'deposit'
      ? buildInvoiceSnapshot(tracking, 'ticket_original', { ticketBatch: buildOriginalTicketSnapshot(tracking) })
      : installment === 'full'
        ? buildInvoiceSnapshot(tracking, 'full_payment', { ticketBatch: buildOriginalTicketSnapshot(tracking), invoices: props.invoices, payments: props.payments })
        : buildInvoiceSnapshot(tracking, 'package_balance', { invoices: props.invoices, payments: props.payments });

    const subtotalAmount = installment === 'deposit'
      ? documentData.ticketBatch?.totalDueTHB || tracking.depositAmount
      : installment === 'full'
        ? customerGrandTotal(tracking, props.invoices)
        : documentData.balanceDueTHB ?? Math.max(0, packageSalesTotal(tracking) - totalTicketPaymentsReceived(tracking, props.invoices, props.payments));

    const sequenceNumber = installment === 'balance' ? 2 : 1;
    const vatEnabled = installment === 'balance' || installment === 'full' ? Boolean(existing?.vatEnabled) : false;
    const vatRatePercent = Math.max(0, Number(existing?.vatRatePercent ?? props.settings.vatRatePercent ?? 7));
    const ticketComponent = installment === 'full'
      ? Math.min(subtotalAmount, Math.max(0, tracking.depositAmount || 0))
      : 0;
    const vatBaseAmount = installment === 'full' ? Math.max(0, subtotalAmount - ticketComponent) : subtotalAmount;
    const vatAmount = vatEnabled ? roundMoney(vatBaseAmount * vatRatePercent / 100) : 0;
    const amount = roundMoney(subtotalAmount + vatAmount);
    const preferredAccountType: PaymentAccountType = vatEnabled
      ? 'company'
      : (existing?.paymentAccountType || (installment === 'balance' ? 'owner' : 'company'));
    const account = (existing?.paymentBankName && existing?.paymentAccountNumber && existing?.paymentAccountType === preferredAccountType)
      ? { paymentAccountType: preferredAccountType, paymentBankName: existing.paymentBankName, paymentAccountName: existing.paymentAccountName, paymentAccountNumber: existing.paymentAccountNumber, paymentQrUrl: existing.paymentQrUrl || '' }
      : paymentAccountSnapshot(props.settings, preferredAccountType);

    const defaultTitle = installment === 'deposit'
      ? 'ค่าตั๋วเครื่องบินและภาษีสนามบิน'
      : installment === 'balance'
        ? 'ค่าแพ็กเกจส่วนที่เหลือ'
        : 'Full Payment — ค่าแพ็กเกจทั้งหมด';

    const invoice: PaymentInvoice = existing ? {
      ...existing,
      sequenceNumber,
      title: existing.title || defaultTitle,
      lineItems: existing.lineItems || [],
      costAmount: existing.costAmount || 0,
      documentData,
      issueDate: existing.issueDate || isoToday(),
      dueDate,
      subtotalAmount,
      vatEnabled,
      vatRatePercent,
      vatAmount,
      amount,
      ...account,
      status: existing.status === 'cancelled' ? 'invoiced' : existing.status,
      updatedAt: now,
    } : {
      id: makeId('inv'),
      trackingId: tracking.id,
      invoiceNo: makeInvoiceNo(installment, sequenceNumber),
      installment,
      sequenceNumber,
      title: defaultTitle,
      lineItems: [],
      costAmount: 0,
      documentData,
      issueDate: isoToday(),
      dueDate,
      subtotalAmount,
      vatEnabled,
      vatRatePercent,
      vatAmount,
      amount,
      ...account,
      status: 'invoiced',
      paidAt: '',
      note: '',
      createdAt: now,
      updatedAt: now,
    };

    // Ensure the parent Customer Journey row exists in Supabase before inserting
    // payment_invoices, which has a foreign-key relationship to customer_tracking.
    await props.onSaveTracking({ ...tracking, updatedAt: now });
    await props.onSaveInvoice(invoice);
    const nextTracking: CustomerTracking = {
      ...tracking,
      paymentPlan: installment === 'full' ? 'full_payment' : (tracking.paymentPlan || 'installments'),
      depositStatus: installment === 'deposit' || installment === 'full' ? 'invoiced' : tracking.depositStatus,
      balanceStatus: installment === 'balance' || installment === 'full' ? 'invoiced' : tracking.balanceStatus,
      invoice1SentAt: installment === 'deposit' ? (tracking.invoice1SentAt || isoToday()) : tracking.invoice1SentAt,
      invoice2PreparedAt: installment === 'balance' ? (tracking.invoice2PreparedAt || isoToday()) : tracking.invoice2PreparedAt,
      nextAction: installment === 'full'
        ? (th ? 'ติดตามชำระ Full Payment ตามกำหนด' : 'Follow up the one-time full payment deadline')
        : tracking.nextAction,
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
      issueDate: isoToday(), dueDate: draft.dueDate, subtotalAmount: amount, vatEnabled: false, vatRatePercent: props.settings.vatRatePercent ?? 7, vatAmount: 0, amount, ...paymentAccountSnapshot(props.settings, 'company'), status: 'invoiced', paidAt: '', note: draft.note.trim(), createdAt: now, updatedAt: now,
    };
    // Persist the parent journey first so the invoice foreign key always has a valid target.
    await props.onSaveTracking({ ...tracking, updatedAt: now });
    await props.onSaveInvoice(invoice);
    const nextInvoiceList = [invoice, ...props.invoices.filter((x) => x.id !== invoice.id)];
    const extraRevenue = customerSupplementalSalesTotal(tracking, nextInvoiceList);
    const extraCost = customerSupplementalCostTotal(tracking, nextInvoiceList);
    const nextTrackingBase: CustomerTracking = {
      ...tracking,
      supplementalInvoiceTotal: extraRevenue,
      supplementalCostTotal: extraCost,
      grandTotalAmount: customerGrandTotal(tracking, nextInvoiceList),
    };
    const nextTracking: CustomerTracking = {
      ...nextTrackingBase,
      profitAmount: tracking.landPaidAt && tracking.landPayment > 0
        ? realizedGrossProfit(nextTrackingBase, nextInvoiceList, tracking.landPayment)
        : 0,
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
    if (tracking.documentsSentToLandAt || tracking.visaReceivedAt || tracking.readyToTravelAt || tracking.tripReturnedAt || tracking.closedAt) {
      window.alert(th
        ? 'รายการนี้ผ่านขั้นตอนส่งเอกสารยื่นวีซ่าหรือปิดทริปแล้ว หากเป็นการเปลี่ยนวันเดินทางให้ใช้เมนู “เลื่อนตั๋ว / เดินทางล่าช้า”'
        : 'This booking has already moved to visa submission or trip closure. Use “Ticket change / delayed travel” for date changes.');
      return false;
    }
    if (!draft.pnr.trim()) {
      window.alert(th ? 'กรุณากรอก PNR ของผู้เดินทางที่เพิ่ม' : 'Enter the PNR for the added travellers.');
      return false;
    }
    if (!names.length) {
      window.alert(th ? 'กรุณากรอกรายชื่อผู้เดินทางที่เพิ่มทั้งหมด' : 'Enter all added passenger names.');
      return false;
    }
    if (names.length !== draft.passengerCount) {
      const proceed = window.confirm(th
        ? `พบรายชื่อ ${names.length} รายชื่อ แต่ระบุจำนวนผู้เดินทางเพิ่ม ${draft.passengerCount} ท่าน\nต้องการดำเนินการต่อหรือไม่?`
        : `There are ${names.length} names, but ${draft.passengerCount} added travellers were entered.\nContinue?`);
      if (!proceed) return false;
    }
    if (draft.packagePricePerPerson <= 0) {
      window.alert(th ? 'กรุณากรอกราคาขายแพ็กเกจต่อท่านสำหรับผู้เดินทางที่เพิ่ม' : 'Enter the package selling price per added traveller.');
      return false;
    }
    if ((draft.ticketDepositTotal || 0) <= 0) {
      window.alert(th ? 'กรุณากรอกราคาตั๋วตาม PNR และภาษีสนามบิน เพื่อออก Invoice ค่าตั๋วของผู้เดินทางเพิ่ม' : 'Enter the PNR airfare and airport tax to issue the added-traveller ticket invoice.');
      return false;
    }
    if (!dueDate) {
      window.alert(th ? 'กรุณากำหนดวันครบกำหนดชำระ Invoice ค่าตั๋วของผู้เดินทางเพิ่ม' : 'Set the due date for the added-traveller ticket invoice.');
      return false;
    }
    const addedBatchNumber = activeTravelerAdditions(tracking).length + 1;
    const sequenceNumber = 1;
    const now = new Date().toISOString();
    const invoiceId = makeId('inv');
    const addition: TravelerAddition = { ...draft, ticketDepositTotal: draft.ticketDepositTotal || 0, invoiceId, status: 'active' };
    const trackingWithAddition: CustomerTracking = { ...tracking, travelerAdditions: [...(tracking.travelerAdditions || []), addition] };
    const lineItems: SupplementalInvoiceLine[] = [
      { id: makeId('xline'), description: th ? 'ค่าตั๋วเครื่องบินผู้เดินทางเพิ่ม ตาม PNR' : 'Added-traveller airfare per PNR', quantity: draft.passengerCount, unitPriceTHB: draft.ticketPricePerPerson, totalTHB: draft.passengerCount * draft.ticketPricePerPerson, costPerUnitTHB: draft.ticketPricePerPerson, totalCostTHB: draft.passengerCount * draft.ticketPricePerPerson },
      { id: makeId('xline'), description: th ? 'ภาษีสนามบินผู้เดินทางเพิ่ม' : 'Added-traveller airport tax', quantity: draft.passengerCount, unitPriceTHB: draft.airportTaxPerPerson, totalTHB: draft.passengerCount * draft.airportTaxPerPerson, costPerUnitTHB: draft.airportTaxPerPerson, totalCostTHB: draft.passengerCount * draft.airportTaxPerPerson },
    ].filter((line) => line.totalTHB > 0);
    const documentData = buildInvoiceSnapshot(trackingWithAddition, 'ticket_added', { ticketBatch: buildAddedTicketSnapshot(addition, addedBatchNumber) });
    const invoice: PaymentInvoice = {
      id: invoiceId, trackingId: tracking.id, invoiceNo: makeAddedTravelerInvoice1No(addedBatchNumber), installment: 'supplemental', sequenceNumber,
      title: th ? `Invoice 1 — ค่าตั๋วผู้เดินทางเพิ่ม ชุดที่ ${addedBatchNumber} (${draft.passengerCount} ท่าน)` : `Invoice 1 — added-traveller tickets, batch ${addedBatchNumber} (${draft.passengerCount} pax)`, lineItems, costAmount: draft.ticketDepositTotal || 0, documentData,
      issueDate: isoToday(), dueDate, subtotalAmount: draft.ticketDepositTotal || 0, vatEnabled: false, vatRatePercent: props.settings.vatRatePercent ?? 7, vatAmount: 0, amount: draft.ticketDepositTotal || 0, ...paymentAccountSnapshot(props.settings, 'company'), status: 'invoiced', paidAt: '',
      note: [
        draft.note,
        `PNR: ${draft.pnr}`,
        `${th ? 'ผู้เดินทาง' : 'Passengers'}: ${names.join(', ')}`,
        th
          ? `เอกสารนี้เป็นส่วนหนึ่งของ Invoice 1 สำหรับค่าตั๋วและภาษีของผู้เดินทางที่เพิ่ม ส่วนมูลค่าแพ็กเกจเพิ่ม ${formatTHB(draft.customerChargeTotal, language)} จะรวมกับผู้เดินทางชุดแรกและเรียกเก็บยอดคงเหลือทั้งหมดใน Invoice 2`
          : `This document is part of Invoice 1 for the added travellers' airfare and tax. Their added package value of ${formatTHB(draft.customerChargeTotal, language)} will be consolidated with the original group and collected as the total remaining balance in Invoice 2.`,
      ].filter(Boolean).join('\n'), createdAt: now, updatedAt: now,
    };
    // Ensure the Customer Journey parent row exists before inserting the added-traveller invoice.
    await props.onSaveTracking({ ...tracking, updatedAt: now });
    await props.onSaveInvoice(invoice);
    const nextInvoiceList = [invoice, ...props.invoices.filter((x) => x.id !== invoice.id)];
    const extraRevenue = customerSupplementalSalesTotal(trackingWithAddition, nextInvoiceList);
    const extraCost = customerSupplementalCostTotal(trackingWithAddition, nextInvoiceList);
    const combinedPackageTotal = packageSalesTotal(trackingWithAddition);
    const projectedTicketReceived = totalTicketPaymentsReceived(trackingWithAddition, nextInvoiceList, props.payments);
    const nextTrackingBase: CustomerTracking = {
      ...trackingWithAddition,
      supplementalInvoiceTotal: extraRevenue,
      supplementalCostTotal: extraCost,
      grandTotalAmount: customerGrandTotal(trackingWithAddition, nextInvoiceList),
      balanceAmount: Math.max(0, combinedPackageTotal - projectedTicketReceived),
    };
    const nextTracking: CustomerTracking = {
      ...nextTrackingBase,
      profitAmount: tracking.landPaidAt && tracking.landPayment > 0
        ? realizedGrossProfit(nextTrackingBase, nextInvoiceList, tracking.landPayment)
        : 0,
      nextAction: th ? `ติดตามชำระ Invoice 1 ค่าตั๋วผู้เดินทางเพิ่ม ชุดที่ ${addedBatchNumber} ก่อนส่งเอกสารยื่นวีซ่า` : `Collect Invoice 1 for added-traveller ticket batch ${addedBatchNumber} before visa submission`,
      nextActionDueDate: dueDate || tracking.nextActionDueDate, updatedAt: now,
    };
    await props.onSaveTracking(nextTracking);
    setEditing(nextTracking);
    setInvoicePreview({ tracking: nextTracking, invoice });
    return true;
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
    const trackingWithoutInvoice = { ...tracking, travelerAdditions: (tracking.travelerAdditions || []).filter((entry) => entry.invoiceId !== invoice.id) };
    const extraRevenue = customerSupplementalSalesTotal(trackingWithoutInvoice, nextInvoiceList);
    const extraCost = customerSupplementalCostTotal(trackingWithoutInvoice, nextInvoiceList);
    const nextTrackingBase = { ...trackingWithoutInvoice, supplementalInvoiceTotal: extraRevenue, supplementalCostTotal: extraCost, grandTotalAmount: customerGrandTotal(trackingWithoutInvoice, nextInvoiceList), updatedAt: new Date().toISOString() } as CustomerTracking;
    const nextTracking = { ...nextTrackingBase, profitAmount: tracking.landPaidAt && tracking.landPayment > 0 ? realizedGrossProfit(nextTrackingBase, nextInvoiceList, tracking.landPayment) : 0 };
    await props.onSaveTracking(nextTracking);
    setEditing(nextTracking);
  }

  function openExistingInvoice(tracking: CustomerTracking, invoice: PaymentInvoice) {
    setInvoicePreview({ tracking, invoice });
  }

  const pendingNewDraft = readTrackingDraft(NEW_TRACKING_DRAFT_KEY);
  function startNewTracking() {
    if (pendingNewDraft) {
      const startFresh = window.confirm(th
        ? 'มี Draft ลูกค้าที่ยังไม่ได้บันทึกอยู่ หากเริ่มรายการใหม่ Draft เดิมจะถูกลบ\n\nกด ตกลง = เริ่มรายการใหม่\nกด ยกเลิก = กลับไปทำ Draft เดิมต่อ'
        : 'An unsaved customer draft exists. Starting a new record will remove that draft.\n\nOK = start fresh\nCancel = resume the draft');
      if (!startFresh) {
        setEditingIsNew(true);
        setEditing({ ...pendingNewDraft.data });
        return;
      }
      clearTrackingDraft(NEW_TRACKING_DRAFT_KEY);
    }
    setEditingIsNew(true);
    setEditing(newTracking());
  }
  function resumeNewDraft() {
    const draft = readTrackingDraft(NEW_TRACKING_DRAFT_KEY);
    if (!draft) return;
    setEditingIsNew(true);
    setEditing({ ...draft.data });
  }

  return <div className="tracking-shell journey-shell">
    <header className="tracking-header">
      <Brand/>
      <div className="tracking-header-actions"><LanguageSwitch compact/><button className="ghost-button" onClick={props.onBack}><ArrowLeft/>{th ? 'หน้าคำนวณราคา' : 'Price calculator'}</button>{props.currentUser.role === 'admin' && <button className="ghost-button desktop-only" onClick={props.onOpenAdmin}><Settings2/>{th ? 'หลังบ้าน' : 'Back office'}</button>}<button className="icon-button" onClick={props.onLogout}><LogOut/></button></div>
    </header>

    <main className="tracking-main journey-main">
      <section className="tracking-page-head journey-page-head">
        <div><span className="eyebrow"><Sparkles/> CUSTOMER JOURNEY</span><h1>{th ? 'ติดตามลูกค้าตั้งแต่เสนอราคา ถึงปิดจบทริป' : 'Track every customer from quotation to trip closure'}</h1><p>{th ? 'เห็นขั้นตอนปัจจุบัน งานถัดไป เอกสาร การชำระเงิน วีซ่า และ Feedback ในหน้าจอเดียว' : 'Manage next actions, documents, payments, visas, travel readiness and feedback in one workspace.'}</p></div>
        <div className="tracking-head-actions">
          {pendingNewDraft && <button className="ghost-button tracking-draft-resume" onClick={resumeNewDraft}><FileCheck2/><span>{th ? 'Draft ล่าสุด' : 'Latest draft'}</span><small>{formatDraftTime(pendingNewDraft.savedAt, th)}</small></button>}
          <button className="ghost-button quotation-archive-trigger" onClick={() => setQuotationArchiveOpen(true)}><FileText/><span>{th ? 'ใบเสนอราคาที่บันทึก' : 'Saved quotations'}</span><b>{props.quotations.filter((q) => q.status !== 'converted' && q.status !== 'lost').length}</b></button>
          <button className="primary-button tracking-add" onClick={startNewTracking}><Plus/>{th ? 'เพิ่มลูกค้าใหม่' : 'Add customer'}</button>
        </div>
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
          const localDraft = readTrackingDraft(trackingDraftKey(item.id, false));
          const hasNewerLocalDraft = Boolean(localDraft && new Date(localDraft.savedAt).getTime() > new Date(item.updatedAt || item.createdAt || 0).getTime());
          return <article className="journey-card" key={item.id}>
            <div className="journey-card-customer"><span>{item.customerName?.[0]?.toUpperCase() || '?'}</span><div><b>{item.opportunityName || item.customerName || '-'}</b><small>{item.customerName}{item.leadSource ? ` · ${item.leadSource}` : ''}</small><em>{item.phone || item.email || '-'}</em></div></div>
            <div className="journey-card-stage"><div className="journey-stage-line"><span className={`journey-stage stage-${stageGroup[stage]}`}>{stageLabel(stage, th)}</span>{hasNewerLocalDraft && <span className="local-draft-badge"><FileCheck2/>Draft</span>}</div><small>{item.packageName || '-'} · {item.passengerCount + addedPassengerCount(item)} {th ? 'ท่าน' : 'pax'}</small><em>{item.travelStartDate ? formatDate(item.travelStartDate, language) : th ? 'ยังไม่กำหนดวันเดินทาง' : 'Travel date not set'}</em></div>
            <div className="journey-card-action"><small>{th ? 'งานถัดไป' : 'Next action'}</small><b>{recommended}</b><em className={item.nextActionDueDate && item.nextActionDueDate <= isoToday() ? 'overdue' : ''}>{item.nextActionDueDate ? `${th ? 'ภายใน' : 'Due'} ${formatDate(item.nextActionDueDate, language)}` : th ? 'ยังไม่กำหนด Deadline' : 'No deadline'}</em></div>
            <div className="journey-card-payment"><small>{th ? `แพ็กเกจรวม ${totalPackagePassengerCount(item)} ท่าน` : `Package total — ${totalPackagePassengerCount(item)} pax`}</small><b>{formatTHB(packageSalesTotal(item), language)}</b><em>{th ? `รับแล้ว ${formatTHB(paid, language)} · คงเหลือ ${formatTHB(remaining, language)}` : `Paid ${formatTHB(paid, language)} · Balance ${formatTHB(remaining, language)}`}</em><PaymentBadge status={paymentSummary(item, props.payments)} th={th}/></div>
            <div className="journey-card-actions"><button className="invoice-one" onClick={() => issueInvoice(item, 'deposit')}><ReceiptText/><span>{th ? 'Invoice 1' : 'Invoice 1'}</span></button><button className="invoice-two" onClick={() => issueInvoice(item, 'balance')}><FileText/><span>{th ? 'Invoice 2' : 'Invoice 2'}</span></button><button onClick={() => { setEditingIsNew(false); setEditing(item); }} title={th ? 'เปิดรายละเอียด' : 'Open details'}><Edit3/></button><button className="danger" onClick={() => window.confirm(th ? 'ยืนยันการลบรายการนี้?' : 'Delete this record?') && props.onDeleteTracking(item.id)}><Trash2/></button></div>
          </article>;
        })}</div> : <EmptyState title={th ? 'ยังไม่มีข้อมูลที่ตรงกับตัวกรอง' : 'No matching records'} detail={th ? 'กด “เพิ่มลูกค้าใหม่” เพื่อเริ่มติดตามกระบวนการ' : 'Add a customer to start the workflow.'}/>} 
      </section>
    </main>

    <Modal open={quotationArchiveOpen} title={th ? 'ประวัติใบเสนอราคา' : 'Quotation archive'} onClose={() => setQuotationArchiveOpen(false)} wide>
      <div className="quotation-archive">
        <div className="quotation-archive-intro">
          <div><FileText/><span><b>{th ? 'ใบเสนอราคาทุกใบถูกบันทึกไว้ที่นี่' : 'Every quotation is saved here'}</b><small>{th ? 'เมื่อลูกค้าคอนเฟิร์ม กด “เริ่มติดตามลูกค้า” ระบบจะดึงราคาและข้อมูลทั้งหมดเข้า Customer Journey อัตโนมัติ' : 'When the customer confirms, start tracking to copy all pricing and customer details into Customer Journey.'}</small></span></div>
          <div className="tracking-search quotation-search"><Search/><input value={quotationSearch} onChange={(e) => setQuotationSearch(e.target.value)} placeholder={th ? 'ค้นหาเลขที่ใบเสนอราคา ชื่อลูกค้า โปรแกรม...' : 'Search quotation no., customer, package...'}/></div>
        </div>
        <div className="quotation-archive-list">
          {props.quotations.filter((quotation) => {
            const q = quotationSearch.trim().toLowerCase();
            return !q || [quotation.quotationNo, quotation.customerName, quotation.phone, quotation.email, quotation.packageName].join(' ').toLowerCase().includes(q);
          }).map((quotation) => {
            const converted = Boolean(quotation.convertedTrackingId);
            return <article className={`quotation-archive-card ${converted ? 'converted' : ''}`} key={quotation.id}>
              <div className="quotation-archive-main"><span className="quotation-no">{quotation.quotationNo}</span><b>{quotation.customerName || '-'}</b><small>{quotation.packageName || '-'} · {quotation.childPassengerCount > 0 ? (th ? `${quotation.passengerCount - quotation.childPassengerCount} ADT + ${quotation.childPassengerCount} CHD` : `${quotation.passengerCount - quotation.childPassengerCount} ADT + ${quotation.childPassengerCount} CHD`) : `${quotation.passengerCount} ${th ? 'ท่าน' : 'pax'}`} · {quotation.hotelCategory}</small><em>{quotation.travelDate ? formatDate(quotation.travelDate, language) : (th ? 'ยังไม่ระบุวันเดินทาง' : 'Travel date not set')}</em></div>
              <div className="quotation-archive-price"><small>{th ? 'ยอดเสนอราคา' : 'Quoted total'}</small><b>{formatTHB(quotation.totalAmount, language)}</b><em>{quotation.channel === 'agent' ? 'AGENT' : 'RETAIL'} · {formatDate(quotation.createdAt, language)}</em></div>
              <div className="quotation-archive-status"><span className={`quote-status quote-${quotation.status}`}>{converted ? (th ? 'สร้าง Customer Journey แล้ว' : 'Journey created') : quotation.status === 'lost' ? (th ? 'ไม่ได้ไปต่อ' : 'Lost') : (th ? 'รอลูกค้าคอนเฟิร์ม' : 'Awaiting confirmation')}</span></div>
              <div className="quotation-archive-actions">
                {converted ? <button className="ghost-button" onClick={() => openConvertedQuotation(quotation)}><ExternalLink/>{th ? 'เปิด Customer Journey' : 'Open journey'}</button> : <>
                  <button className="primary-button" onClick={() => { void confirmQuotationAndStartJourney(quotation); }}><UserRoundCheck/>{th ? 'ลูกค้าคอนเฟิร์ม → เริ่มติดตาม' : 'Confirmed → Start tracking'}</button>
                  <button className="ghost-button" onClick={() => { void props.onSaveQuotation({ ...quotation, status: quotation.status === 'lost' ? 'sent' : 'lost', updatedAt: new Date().toISOString() }); }}>{quotation.status === 'lost' ? (th ? 'นำกลับมาติดตาม' : 'Restore') : (th ? 'ไม่ได้ไปต่อ' : 'Mark lost')}</button>
                </>}
              </div>
            </article>;
          })}
          {!props.quotations.length && <EmptyState title={th ? 'ยังไม่มีใบเสนอราคาที่บันทึก' : 'No saved quotations yet'} detail={th ? 'สร้างใบเสนอราคาจากหน้าคำนวณราคา แล้วรายการจะเข้ามาอยู่ที่นี่อัตโนมัติ' : 'Create a quotation from the pricing page and it will appear here automatically.'}/>}
        </div>
      </div>
    </Modal>

    <TrackingEditor open={Boolean(editing)} item={editing} isNewRecord={editingIsNew} settings={props.settings} packages={props.packages} users={props.users} currentUser={props.currentUser}
      payments={editing ? paymentsFor(editing.id, props.payments) : []} invoices={editing ? supplementalInvoicesFor(editing.id, props.invoices) : []}
      onClose={() => { setEditing(null); setEditingIsNew(false); }} onSave={async (item) => { await props.onSaveTracking(item); setEditingIsNew(false); setEditing(item); }}
      onSavePayment={props.onSavePayment} onDeletePayment={props.onDeletePayment} onSaveInvoice={props.onSaveInvoice} onIssueInvoice={issueInvoice}
      onCreateSupplementalInvoice={createSupplementalInvoice} onCreateTravelerAddition={createTravelerAdditionInvoice} onOpenInvoice={openExistingInvoice} onDeleteSupplementalInvoice={deleteSupplementalInvoice}
      onUploadPaymentSlip={props.onUploadPaymentSlip} onGetPaymentSlipUrl={props.onGetPaymentSlipUrl} onDeletePaymentSlip={props.onDeletePaymentSlip}/>
    <InvoicePreview value={invoicePreview} settings={props.settings} language={language} payments={invoicePreview ? paymentsFor(invoicePreview.tracking.id, props.payments) : []} invoices={invoicePreview ? props.invoices.filter((invoice) => invoice.trackingId === invoicePreview.tracking.id) : []} onClose={() => setInvoicePreview(null)} onSaveInvoice={props.onSaveInvoice} onSaveTracking={props.onSaveTracking}/>
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
  const labels = th ? { ticket_deposit: 'ค่าตั๋ว / งวดที่ 1', package_balance: 'ค่าแพ็กเกจ / งวดที่ 2', full_payment: 'ชำระเต็มจำนวนครั้งเดียว', supplemental: 'Invoice เพิ่มเติม (งวด 3+)', refund: 'คืนเงิน', other: 'อื่น ๆ' } : { ticket_deposit: 'Ticket payment / Stage 1', package_balance: 'Package payment / Stage 2', full_payment: 'One-time full payment', supplemental: 'Supplemental invoice (3+)', refund: 'Refund', other: 'Other' };
  return labels[type];
}

function TrackingEditor({ open, item, isNewRecord, settings, packages, users, currentUser, payments, invoices, onClose, onSave, onSavePayment, onDeletePayment, onSaveInvoice, onIssueInvoice, onCreateSupplementalInvoice, onCreateTravelerAddition, onOpenInvoice, onDeleteSupplementalInvoice, onUploadPaymentSlip, onGetPaymentSlipUrl, onDeletePaymentSlip }: {
  open: boolean; item: CustomerTracking | null; isNewRecord: boolean; settings: GlobalSettings; packages: TourPackage[]; users: User[]; currentUser: User; payments: PaymentTransaction[]; invoices: PaymentInvoice[];
  onClose: () => void; onSave: (item: CustomerTracking) => Promise<void>; onSavePayment: (item: PaymentTransaction) => Promise<void>; onDeletePayment: (id: string) => Promise<void>; onSaveInvoice: (item: PaymentInvoice) => Promise<void>;
  onIssueInvoice: (tracking: CustomerTracking, installment: InvoiceInstallment) => Promise<void>;
  onCreateSupplementalInvoice: (tracking: CustomerTracking, draft: { title: string; dueDate: string; note: string; lineItems: SupplementalInvoiceLine[] }) => Promise<void>;
  onCreateTravelerAddition: (tracking: CustomerTracking, draft: TravelerAddition, dueDate: string) => Promise<boolean>;
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
  const [supplementalPanelOpen, setSupplementalPanelOpen] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState<string>('');
  const [slipInputKey, setSlipInputKey] = useState(0);
  const [draftSavedAt, setDraftSavedAt] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const baselineRef = React.useRef('');
  const draftKey = item ? trackingDraftKey(item.id, isNewRecord) : NEW_TRACKING_DRAFT_KEY;
  React.useEffect(() => {
    const normalizedItem = item ? { ...item, travelerAdditions: item.travelerAdditions || [] } : item;
    const savedDraft = item ? readTrackingDraft(trackingDraftKey(item.id, isNewRecord)) : null;
    const itemUpdatedAt = item?.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    const draftUpdatedAt = savedDraft?.savedAt ? new Date(savedDraft.savedAt).getTime() : 0;
    const shouldRestore = Boolean(savedDraft && (isNewRecord || draftUpdatedAt > itemUpdatedAt));
    const initialForm = shouldRestore ? { ...savedDraft!.data, travelerAdditions: savedDraft!.data.travelerAdditions || [] } : normalizedItem;
    setForm(initialForm);
    baselineRef.current = normalizedItem ? JSON.stringify(normalizedItem) : '';
    setDraftSavedAt(savedDraft?.savedAt || '');
    setDraftRestored(shouldRestore);
    setHasUnsavedChanges(Boolean(initialForm && baselineRef.current && JSON.stringify(initialForm) !== baselineRef.current));
    setSupplementalDraft({ title: '', dueDate: '', note: '', lineItems: [newSupplementalLine()] }); setSupplementalPanelOpen(false); setTravelerDraft(newTravelerAdditionDraft(item)); setTravelerDueDate(''); setTravelerPanelOpen(false); setTicketChangeDraft(newTicketChangeDraft(item)); setTicketChangeDueDate(''); setTicketChangePanelOpen(false); }, [item, isNewRecord]);
  React.useEffect(() => {
    if (!open || !form) return;
    const serialized = JSON.stringify(form);
    const dirty = Boolean(baselineRef.current && serialized !== baselineRef.current);
    setHasUnsavedChanges(dirty);
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      const savedAt = writeTrackingDraft(draftKey, form, isNewRecord ? 'new' : 'edit');
      setDraftSavedAt(savedAt);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [form, open, draftKey, isNewRecord]);

  React.useEffect(() => {
    if (!open || !hasUnsavedChanges) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [open, hasUnsavedChanges]);

  // Keep every React hook above this guard. TrackingEditor stays mounted while
  // closed (item=null), so returning before later hooks caused React to throw
  // "Rendered more hooks than during the previous render" when Add customer
  // changed item from null to a new record.
  if (!form) return null;
  const currentForm = form;
  const set = <K extends keyof CustomerTracking>(key: K, value: CustomerTracking[K]) => setForm((current) => current ? ({ ...current, [key]: value }) : current);

  function saveDraftNow() {
    if (!form) return;
    const savedAt = writeTrackingDraft(draftKey, form, isNewRecord ? 'new' : 'edit');
    setDraftSavedAt(savedAt);
    setDraftRestored(true);
  }
  function requestClose() {
    if (hasUnsavedChanges && form) {
      saveDraftNow();
      const closeAnyway = window.confirm(th
        ? 'มีข้อมูลที่ยังไม่ได้กดบันทึก\nระบบเก็บ Draft ล่าสุดไว้ให้แล้ว หากปิดตอนนี้สามารถกลับมาเปิดต่อได้\n\nต้องการปิดหน้าต่างหรือไม่?'
        : 'You have unsaved changes.\nThe latest draft has been saved automatically and can be resumed later.\n\nClose this window?');
      if (!closeAnyway) return;
    }
    onClose();
  }

  function recalculateFinancials(current: CustomerTracking, patch: Partial<CustomerTracking> = {}): CustomerTracking {
    const next = { ...current, ...patch };
    const pax = Math.max(1, Math.round(Number(next.passengerCount || 1)));
    const pricingMode = next.pricingMode === 'group_tl' ? 'group_tl' : 'standard';
    const childPassengerCount = pricingMode === 'standard' ? Math.min(pax, Math.max(0, Math.round(Number(next.childPassengerCount || 0)))) : 0;
    const adultPassengerCount = Math.max(0, pax - childPassengerCount);
    const chargeablePassengerCount = pricingMode === 'group_tl'
      ? Math.min(pax, Math.max(1, Math.round(Number(next.chargeablePassengerCount || pax))))
      : pax;
    const tourLeaderCount = pricingMode === 'group_tl' ? Math.max(0, pax - chargeablePassengerCount) : 0;
    const singleRoomCount = Math.min(pax, Math.max(0, Math.round(Number(next.singleRoomCount || 0))));
    const singleSupplementPerPerson = Math.max(0, Number(next.singleSupplementPerPerson || 0));
    const singleSupplementTotal = singleRoomCount * singleSupplementPerPerson;
    const additionalItems = normalizeAdditionalCharges(next.additionalItems || [], pax);
    const additionalItemsTotal = additionalItems.reduce((sum, item) => sum + item.totalTHB, 0);
    const ticketPricePerPerson = Math.max(0, Number(next.ticketPricePerPerson || (next.ticketAmount && next.ticketAmount / pax) || 0));
    const airportTaxPerPerson = Math.max(0, Number(next.airportTaxPerPerson || (next.airportTaxAmount && next.airportTaxAmount / pax) || 0));
    const businessUpgradeCount = Math.min(pricingMode === 'standard' ? adultPassengerCount : pax, Math.max(0, Math.round(Number(next.businessUpgradeCount || 0))));
    const businessUpgradePerPerson = Math.max(0, Number(next.businessUpgradePerPerson || 0));
    const businessUpgradeTotal = businessUpgradeCount * businessUpgradePerPerson;
    const regularLandCostPerPerson = Math.max(0, Number(next.regularLandCostPerPerson || 0));
    const tourLeaderLandCostPerPerson = Math.max(0, Number(next.tourLeaderLandCostPerPerson || 0));
    const groupMarginPerTraveler = Math.max(0, Number(next.groupMarginPerTraveler || 0));
    const groupSellingPriceOverridePerPerson = Math.max(0, Number(next.groupSellingPriceOverridePerPerson || 0));
    const childSellingPricePerPerson = pricingMode === 'standard' && childPassengerCount > 0 ? Math.max(0, Number(next.childSellingPricePerPerson || next.sellingPricePerPerson || 0)) : 0;
    const childTicketPricePerPerson = pricingMode === 'standard' && childPassengerCount > 0 ? Math.max(0, Number(next.childTicketPricePerPerson || ticketPricePerPerson || 0)) : 0;
    const childAirportTaxPerPerson = pricingMode === 'standard' && childPassengerCount > 0 ? Math.max(0, Number(next.childAirportTaxPerPerson || airportTaxPerPerson || 0)) : 0;

    let sellingPricePerPerson = Math.max(0, Number(next.sellingPricePerPerson || 0));
    let totalAmount = 0;
    let groupPricingCostTotal = Math.max(0, Number(next.groupPricingCostTotal || 0));

    if (pricingMode === 'group_tl') {
      const group = calculateGroupTLBreakdown({
        actualPassengerCount: pax,
        chargeablePassengerCount,
        regularLandCostPerPerson,
        tourLeaderLandCostPerPerson,
        ticketPerTraveler: ticketPricePerPerson,
        airportTaxPerTraveler: airportTaxPerPerson,
        marginPerTraveler: groupMarginPerTraveler,
        businessUpgradeTotal,
        singleSupplementTotal,
        additionalItemsTotal,
      });
      sellingPricePerPerson = groupSellingPriceOverridePerPerson > 0 ? groupSellingPriceOverridePerPerson : group.sellingPricePerChargeablePerson;
      totalAmount = sellingPricePerPerson * chargeablePassengerCount
        + businessUpgradeTotal
        + singleSupplementTotal
        + additionalItemsTotal;
      groupPricingCostTotal = group.totalBeforeAverage;
    } else {
      totalAmount = sellingPricePerPerson * adultPassengerCount + childSellingPricePerPerson * childPassengerCount + singleSupplementTotal + businessUpgradeTotal + additionalItemsTotal;
    }

    const travelerAdditions = (next.travelerAdditions || []).map((entry) => normalizeTravelerAddition({
      ...entry,
      packagePricePerPerson: Math.max(0, Number(entry.packagePricePerPerson || sellingPricePerPerson || 0)),
    }));
    const baseTicketAmount = ticketPricePerPerson * adultPassengerCount + childTicketPricePerPerson * childPassengerCount;
    const businessFareDifferenceTotal = pricingMode === 'group_tl' ? businessUpgradeTotal : 0;
    const ticketAmount = baseTicketAmount + businessFareDifferenceTotal;
    const airportTaxAmount = airportTaxPerPerson * adultPassengerCount + childAirportTaxPerPerson * childPassengerCount;
    const depositAmount = ticketAmount + airportTaxAmount;
    const recalculatedTracking = {
      ...next,
      pricingMode,
      passengerCount: pax,
      chargeablePassengerCount,
      tourLeaderCount,
      childPassengerCount,
      childSellingPricePerPerson,
      childTicketPricePerPerson,
      childAirportTaxPerPerson,
      sellingPricePerPerson,
      regularLandCostPerPerson,
      tourLeaderLandCostPerPerson,
      groupMarginPerTraveler,
      groupSellingPriceOverridePerPerson,
      groupPricingCostTotal,
      travelerAdditions,
      totalAmount,
      depositAmount,
    } as CustomerTracking;
    const paidTicket = totalTicketPaymentsReceived(recalculatedTracking, invoices, payments);
    const balanceAmount = Math.max(0, packageSalesTotal(recalculatedTracking) - paidTicket);
    const landPayment = Math.max(0, Number(next.landPayment || 0));
    const supplementalInvoiceTotalValue = customerSupplementalSalesTotal(recalculatedTracking, invoices);
    const supplementalCostTotalValue = customerSupplementalCostTotal(recalculatedTracking, invoices);
    const grandTotalAmount = customerGrandTotal(recalculatedTracking, invoices);
    const profitAmount = next.landPaidAt && landPayment > 0
      ? realizedGrossProfit(recalculatedTracking, invoices, landPayment)
      : 0;
    return {
      ...next,
      pricingMode,
      passengerCount: pax,
      chargeablePassengerCount,
      tourLeaderCount,
      childPassengerCount,
      childSellingPricePerPerson,
      childTicketPricePerPerson,
      childAirportTaxPerPerson,
      sellingPricePerPerson,
      regularLandCostPerPerson,
      tourLeaderLandCostPerPerson,
      groupMarginPerTraveler,
      groupSellingPriceOverridePerPerson,
      groupPricingCostTotal,
      singleRoomCount,
      singleSupplementPerPerson,
      singleSupplementTotal,
      additionalItems,
      additionalItemsTotal,
      totalAmount,
      travelerAdditions,
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
  const travelerAdditionLocked = Boolean(currentForm.documentsSentToLandAt || currentForm.visaReceivedAt || currentForm.readyToTravelAt || currentForm.tripReturnedAt || currentForm.closedAt);
  const pendingAddedTicketInvoices = pendingTravelerTicketInvoices(currentForm, invoices, payments);
  const addedInvoice1Documents = travelerTicketInvoicesFor(currentForm, invoices);
  const fullPaymentInvoice = invoices.find((invoice) => invoice.trackingId === currentForm.id && invoice.installment === 'full' && invoice.status !== 'cancelled');
  const fullPaymentPaidInFull = Boolean(fullPaymentInvoice) && (fullPaymentInvoice!.status === 'paid' || invoicePaidAmount(fullPaymentInvoice!.id, payments) >= fullPaymentInvoice!.amount - 0.01);
  const originalTicketPaidInFull = (currentForm.paymentPlan || 'installments') === 'full_payment'
    ? fullPaymentPaidInFull
    : ticketPaidAmount(currentForm, payments) >= Math.max(0, currentForm.depositAmount || 0) - 0.01;
  const canProceedToVisa = (currentForm.paymentPlan || 'installments') === 'full_payment'
    ? fullPaymentPaidInFull
    : originalTicketPaidInFull && pendingAddedTicketInvoices.length === 0;

  function updateLandFinancials(patch: Partial<Pick<CustomerTracking, 'landInvoiceAmountUSD' | 'landExchangeRate' | 'landTransferFeeTHB'>>) {
    setForm((current) => {
      if (!current) return current;
      const base = recalculateFinancials(current, patch);
      const usd = Math.max(0, base.landInvoiceAmountUSD || 0);
      const rate = Math.max(0, base.landExchangeRate || 0);
      const fee = Math.max(0, base.landTransferFeeTHB || 0);
      const landPayment = usd > 0 && rate > 0 ? Math.round((usd * rate + fee) * 100) / 100 : 0;
      const profitAmount = base.landPaidAt && landPayment > 0
        ? realizedGrossProfit(base, invoices, landPayment)
        : 0;
      return { ...base, landPayment, grandTotalAmount: customerGrandTotal(base, invoices), profitAmount };
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
      pricingMode: currentForm.pricingMode || 'standard',
      packageId: currentForm.packageId,
      passengerCount: Math.max(1, currentForm.passengerCount),
      chargeablePassengerCount: Math.min(Math.max(1, currentForm.chargeablePassengerCount || currentForm.passengerCount), Math.max(1, currentForm.passengerCount)),
      hotelCategory: currentForm.hotelCategory,
      travelDate: currentForm.travelStartDate,
      businessUpgradeCount: currentForm.businessUpgradeCount || 0,
      businessUpgradePriceOverrideTHB: currentForm.businessUpgradePerPerson > 0 ? currentForm.businessUpgradePerPerson : null,
      singleRoomCount: Math.min(Math.max(0, currentForm.singleRoomCount || 0), Math.max(1, currentForm.passengerCount)),
      singleSupplementOverrideTHB: currentForm.singleSupplementPerPerson > 0 ? currentForm.singleSupplementPerPerson : null,
      additionalItems: currentForm.additionalItems || [],
      childPassengerCount: currentForm.pricingMode === 'standard' ? Math.min(currentForm.passengerCount, Math.max(0, currentForm.childPassengerCount || 0)) : 0,
      childSellingPricePerPersonTHB: currentForm.childSellingPricePerPerson > 0 ? currentForm.childSellingPricePerPerson : null,
      childTicketPricePerPersonTHB: currentForm.childTicketPricePerPerson > 0 ? currentForm.childTicketPricePerPerson : null,
      childAirportTaxPerPersonTHB: currentForm.childAirportTaxPerPerson > 0 ? currentForm.childAirportTaxPerPerson : null,
      regularLandCostPerPersonOverrideTHB: currentForm.regularLandCostPerPerson > 0 ? currentForm.regularLandCostPerPerson : null,
      tourLeaderLandCostPerPersonTHB: currentForm.tourLeaderLandCostPerPerson,
      groupTicketPriceOverrideTHB: currentForm.ticketPricePerPerson > 0 ? currentForm.ticketPricePerPerson : null,
      groupAirportTaxOverrideTHB: currentForm.airportTaxPerPerson > 0 ? currentForm.airportTaxPerPerson : null,
      groupMarginPerTravelerOverrideTHB: currentForm.groupMarginPerTraveler > 0 ? currentForm.groupMarginPerTraveler : null,
      groupSellingPriceOverrideTHB: currentForm.groupSellingPriceOverridePerPerson > 0 ? currentForm.groupSellingPriceOverridePerPerson : null,
    }, settings, packages);
    if (!result) return;
    setForm((current) => current ? recalculateFinancials(current, {
      packageName: result.packageName,
      pricingMode: result.pricingMode,
      chargeablePassengerCount: result.chargeablePassengerCount,
      tourLeaderCount: result.tourLeaderCount,
      childPassengerCount: result.childPassengerCount,
      childSellingPricePerPerson: result.childSellingPricePerPerson,
      childTicketPricePerPerson: result.childTicketPricePerPerson,
      childAirportTaxPerPerson: result.childAirportTaxPerPerson,
      sellingPricePerPerson: result.sellingPricePerPerson,
      regularLandCostPerPerson: result.regularLandCostPerPerson,
      tourLeaderLandCostPerPerson: result.tourLeaderLandCostPerPerson,
      groupMarginPerTraveler: result.groupMarginPerTraveler,
      groupSellingPriceOverridePerPerson: current.groupSellingPriceOverridePerPerson,
      groupPricingCostTotal: result.totalBeforeAverage,
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
    const supplementalInvoiceTotal = customerSupplementalSalesTotal(recalculated, invoices);
    const supplementalCostTotal = customerSupplementalCostTotal(recalculated, invoices);
    return {
      ...recalculated,
      landInvoiceAmountUSD: Math.max(0, recalculated.landInvoiceAmountUSD || 0),
      landExchangeRate: Math.max(0, recalculated.landExchangeRate || 0),
      landTransferFeeTHB: Math.max(0, recalculated.landTransferFeeTHB || 0),
      landPayment: computedLandPayment,
      supplementalInvoiceTotal,
      supplementalCostTotal,
      grandTotalAmount: customerGrandTotal(recalculated, invoices),
      profitAmount: recalculated.landPaidAt && computedLandPayment > 0
        ? realizedGrossProfit(recalculated, invoices, computedLandPayment)
        : 0,
      status,
      salesOwnerName: owner?.name || recalculated.salesOwnerName || currentUser.name,
      updatedAt: new Date().toISOString(),
    };
  }
  async function saveAndStay() {
    const normalized = normalizeBeforeSave();
    setForm(normalized);
    await onSave(normalized);
    baselineRef.current = JSON.stringify(normalized);
    setHasUnsavedChanges(false);
    setDraftSavedAt('');
    setDraftRestored(false);
    clearTrackingDraft(draftKey);
    if (isNewRecord) clearTrackingDraft(NEW_TRACKING_DRAFT_KEY);
  }
  async function markToday(key: keyof CustomerTracking) {
    let next = { ...currentForm, [key]: isoToday() } as CustomerTracking;
    if (key === 'landPaidAt') {
      const landPayment = next.landInvoiceAmountUSD > 0 && next.landExchangeRate > 0
        ? Math.max(0, next.landInvoiceAmountUSD * next.landExchangeRate + Math.max(0, next.landTransferFeeTHB || 0))
        : Math.max(0, next.landPayment || 0);
      const supplementalInvoiceTotal = customerSupplementalSalesTotal(next, invoices);
      const supplementalCostTotal = customerSupplementalCostTotal(next, invoices);
      next = { ...next, landPayment, supplementalInvoiceTotal, supplementalCostTotal, grandTotalAmount: customerGrandTotal(next, invoices), profitAmount: landPayment > 0 ? realizedGrossProfit(next, invoices, landPayment) : 0 };
    }
    setForm(next);
    await onSave({ ...next, updatedAt: new Date().toISOString() });
  }
  function validatePaymentSlipFile(file: File): string {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) return th ? 'รองรับเฉพาะ PNG, JPG, WEBP หรือ PDF' : 'Only PNG, JPG, WEBP or PDF files are supported.';
    if (file.size > 10 * 1024 * 1024) return th ? 'ไฟล์สลิปต้องมีขนาดไม่เกิน 10 MB' : 'Slip file must be 10 MB or smaller.';
    return '';
  }

  function choosePaymentSlipFile(file?: File | null) {
    if (!file) { setPaymentDraft((current) => ({ ...current, slipFile: null })); return; }
    const error = validatePaymentSlipFile(file);
    if (error) { window.alert(error); setSlipInputKey((key) => key + 1); return; }
    setPaymentDraft((current) => ({ ...current, slipFile: file }));
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
        invoiceId: paymentDraft.type === 'package_balance'
          ? (invoices.find((invoice) => invoice.trackingId === currentForm.id && invoice.installment === 'balance' && invoice.status !== 'cancelled')?.id || '')
          : paymentDraft.type === 'full_payment'
            ? (invoices.find((invoice) => invoice.trackingId === currentForm.id && invoice.installment === 'full' && invoice.status !== 'cancelled')?.id || '')
            : ['supplemental', 'ticket_deposit'].includes(paymentDraft.type) ? paymentDraft.invoiceId : '',
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
        if (paymentDraft.invoiceId) {
          const targetInvoice = invoices.find((invoice) => invoice.id === paymentDraft.invoiceId);
          if (targetInvoice) {
            const previousPaid = invoicePaidAmount(targetInvoice.id, payments);
            const fullyPaid = previousPaid + paymentDraft.amount >= targetInvoice.amount - 0.01;
            const updatedInvoice = { ...targetInvoice, status: fullyPaid ? 'paid' as const : 'invoiced' as const, paidAt: fullyPaid ? paymentDraft.paidAt : targetInvoice.paidAt, updatedAt: now };
            await onSaveInvoice(updatedInvoice);
            const projectedInvoices = invoices.map((invoice) => invoice.id === updatedInvoice.id ? updatedInvoice : invoice);
            const projectedPayments = [...payments, transaction];
            const allPaid = allTicketPaymentsReceived(next, projectedInvoices, projectedPayments);
            next = { ...next, nextAction: allPaid
              ? (th ? 'Invoice 1 ค่าตั๋วครบทุกชุดแล้ว — ออกตั๋วและส่งเอกสารผู้เดินทางทั้งหมดให้ Land เพื่อยื่นวีซ่า' : 'All Invoice 1 ticket payments are complete — issue tickets and submit every traveller to land for visa processing')
              : (th ? 'ติดตามชำระ Invoice 1 ของผู้เดินทางเพิ่มให้ครบก่อนยื่นวีซ่า' : 'Collect all added-traveller Invoice 1 payments before visa submission'), nextActionDueDate: allPaid ? '' : next.nextActionDueDate };
          }
        } else {
          const receivedAfter = paidTicket + paymentDraft.amount;
          const fullyPaid = receivedAfter >= deposit - 0.01;
          next = { ...next, depositStatus: fullyPaid ? 'paid' : (next.depositStatus === 'pending' ? 'invoiced' : next.depositStatus), firstPaymentReceivedAt: fullyPaid ? (next.firstPaymentReceivedAt || paymentDraft.paidAt) : next.firstPaymentReceivedAt };
        }
      }
      if (paymentDraft.type === 'package_balance') {
        const balanceInvoice = invoices.find((invoice) => invoice.trackingId === currentForm.id && invoice.installment === 'balance' && invoice.status !== 'cancelled');
        const previousBalancePaid = balanceInvoice ? invoicePaidAmount(balanceInvoice.id, payments) : paidPackage;
        const packageReceivedAfter = previousBalancePaid + paymentDraft.amount;
        const packageDue = balanceInvoice?.amount ?? Math.max(0, packageSalesTotal(currentForm) - totalTicketPaymentsReceived(currentForm, invoices, payments));
        const fullyPaid = packageReceivedAfter >= packageDue - 0.01;
        if (balanceInvoice) await onSaveInvoice({ ...balanceInvoice, status: fullyPaid ? 'paid' : 'invoiced', paidAt: fullyPaid ? paymentDraft.paidAt : balanceInvoice.paidAt, updatedAt: now });
        next = { ...next, balanceStatus: fullyPaid ? 'paid' : (next.balanceStatus === 'pending' ? 'invoiced' : next.balanceStatus), fullPaymentReceivedAt: fullyPaid ? (next.fullPaymentReceivedAt || paymentDraft.paidAt) : next.fullPaymentReceivedAt };
      }
      if (paymentDraft.type === 'full_payment') {
        const fullInvoice = invoices.find((invoice) => invoice.trackingId === currentForm.id && invoice.installment === 'full' && invoice.status !== 'cancelled');
        if (fullInvoice) {
          const previousPaid = invoicePaidAmount(fullInvoice.id, payments);
          const fullyPaid = previousPaid + paymentDraft.amount >= fullInvoice.amount - 0.01;
          await onSaveInvoice({ ...fullInvoice, status: fullyPaid ? 'paid' : 'invoiced', paidAt: fullyPaid ? paymentDraft.paidAt : fullInvoice.paidAt, updatedAt: now });
          next = {
            ...next,
            paymentPlan: 'full_payment',
            depositStatus: fullyPaid ? 'paid' : 'invoiced',
            balanceStatus: fullyPaid ? 'paid' : 'invoiced',
            firstPaymentReceivedAt: fullyPaid ? (next.firstPaymentReceivedAt || paymentDraft.paidAt) : next.firstPaymentReceivedAt,
            fullPaymentReceivedAt: fullyPaid ? (next.fullPaymentReceivedAt || paymentDraft.paidAt) : next.fullPaymentReceivedAt,
            nextAction: fullyPaid
              ? (th ? 'รับชำระ Full Payment ครบแล้ว — ออกตั๋วและส่งเอกสารให้ Land ยื่นวีซ่า' : 'Full payment received — issue tickets and submit documents to land for visa processing')
              : next.nextAction,
          };
        }
      }
      if (paymentDraft.type === 'supplemental' && paymentDraft.invoiceId) {
        const targetInvoice = generalSupplementalInvoices(currentForm, invoices).find((x) => x.id === paymentDraft.invoiceId);
        if (targetInvoice) {
          const previousPaid = invoicePaidAmount(targetInvoice.id, payments);
          const fullyPaid = previousPaid + paymentDraft.amount >= targetInvoice.amount - 0.01;
          const updatedInvoice = { ...targetInvoice, status: fullyPaid ? 'paid' as const : 'invoiced' as const, paidAt: fullyPaid ? paymentDraft.paidAt : targetInvoice.paidAt, updatedAt: now };
          await onSaveInvoice(updatedInvoice);
          const isAddedTravelerTicket = activeTravelerAdditions(currentForm).some((entry) => entry.invoiceId === targetInvoice.id);
          if (isAddedTravelerTicket) {
            const projectedInvoices = invoices.map((invoice) => invoice.id === updatedInvoice.id ? updatedInvoice : invoice);
            const projectedPayments = [...payments, transaction];
            const allPaid = allTicketPaymentsReceived(next, projectedInvoices, projectedPayments);
            next = {
              ...next,
              nextAction: allPaid
                ? (th ? 'ค่าตั๋วผู้เดินทางทุกชุดชำระครบแล้ว — ส่ง Passport + รูป + ตั๋วทั้งหมดให้ Land เพื่อยื่นวีซ่า' : 'All ticket invoices are paid — submit every passport, photo and ticket to land for visa processing')
                : (th ? 'ติดตามชำระค่าตั๋วของผู้เดินทางเพิ่มให้ครบก่อนยื่นวีซ่า' : 'Collect all added-traveller ticket payments before visa submission'),
              nextActionDueDate: allPaid ? '' : next.nextActionDueDate,
            };
          }
        }
      }
      setForm(next);
      await onSave({ ...next, updatedAt: now });
      setPaymentDraft({ type: (next.paymentPlan || 'installments') === 'full_payment' ? 'full_payment' : 'ticket_deposit', invoiceId: '', amount: 0, paidAt: isoToday(), reference: '', note: '', slipFile: null });
      setSlipInputKey((key) => key + 1);
    } catch (error) {
      // App-level callbacks already show a toast. Contain the rejected promise
      // here so a failed Storage upload can never tear down the React screen.
      console.error('Payment upload/save failed', error);
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
        // Never navigate the current app away to a Storage URL. If the browser
        // blocks a new tab, copy/opening can be retried without losing work.
        window.alert(th ? 'เบราว์เซอร์บล็อกหน้าต่างดูสลิป กรุณาอนุญาต Pop-up แล้วลองอีกครั้ง' : 'The browser blocked the slip preview. Allow pop-ups and try again.');
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
    const validationError = validatePaymentSlipFile(file);
    if (validationError) { window.alert(validationError); return; }
    setPaymentBusy(payment.id);
    try {
      const previousPath = payment.slipPath;
      const slip = await onUploadPaymentSlip(currentForm.id, payment.id, file);
      await onSavePayment({ ...payment, slipPath: slip.path, slipFileName: slip.fileName, slipMimeType: slip.mimeType, slipSize: slip.size, updatedAt: new Date().toISOString() });
      if (previousPath && previousPath !== slip.path) await onDeletePaymentSlip(previousPath);
    } catch (error) {
      console.error('Slip replacement failed', error);
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
      const created = await onCreateTravelerAddition(normalized, travelerDraft, travelerDueDate);
      if (!created) return;
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
  const supplementalRevenue = customerSupplementalSalesTotal(form, invoices);
  const supplementalCosts = customerSupplementalCostTotal(form, invoices);
  const activeAdditions = activeTravelerAdditions(form);
  const addedPackageRevenue = travelerAdditionPackageTotal(form);
  const addedBasePackageRevenue = activeAdditions.reduce((sum, entry) => sum + travelerAdditionBasePackageValue(entry, form.sellingPricePerPerson), 0);
  const addedBusinessUpgradeRevenue = activeAdditions.reduce((sum, entry) => sum + travelerAdditionBusinessUpgradeValue(entry), 0);
  const addedSingleSupplementRevenue = activeAdditions.reduce((sum, entry) => sum + travelerAdditionSingleSupplementValue(entry), 0);
  const addedExtrasRevenue = activeAdditions.reduce((sum, entry) => sum + travelerAdditionExtrasValue(entry), 0);
  const generalSupplementalRevenue = generalSupplementalInvoices(form, invoices).reduce((sum, invoice) => sum + Math.max(0, invoice.amount || 0), 0);
  const combinedPackageTotal = packageSalesTotal(form);
  const combinedPassengerCount = totalPackagePassengerCount(form);
  const originalBilledPax = originalChargeablePassengerCount(form);
  const originalBasePackageTotal = Math.max(0, (form.totalAmount || 0) - (form.businessUpgradeTotal || 0) - (form.singleSupplementTotal || 0) - (form.additionalItemsTotal || 0));
  const combinedBasePackageTotal = originalBasePackageTotal + addedBasePackageRevenue;
  const combinedBusinessUpgradeTotal = Math.max(0, form.businessUpgradeTotal || 0) + addedBusinessUpgradeRevenue;
  const combinedSingleSupplementTotal = Math.max(0, form.singleSupplementTotal || 0) + addedSingleSupplementRevenue;
  const combinedAdditionalItemsTotal = Math.max(0, form.additionalItemsTotal || 0) + addedExtrasRevenue;
  const combinedAirfareTotal = Math.max(0, form.ticketAmount || 0) + addedTravelerAirfareTotal(form);
  const combinedAirportTaxTotal = Math.max(0, form.airportTaxAmount || 0) + addedTravelerAirportTaxTotal(form);
  const combinedTicketAndTaxTotal = combinedAirfareTotal + combinedAirportTaxTotal;
  const grandTotal = combinedPackageTotal + generalSupplementalRevenue;
  const supplementalNonTicketCosts = supplementalNonTicketCostTotal(form, invoices);
  const balance = Math.max(0, grandTotal - totalPaid);
  const availablePaymentTypes: PaymentTransactionType[] = (form.paymentPlan || 'installments') === 'full_payment'
    ? ['full_payment', 'supplemental', 'refund', 'other']
    : paymentTypes.filter((type) => type !== 'full_payment');
  const hasLandConversion = form.landPayment > 0 && form.landInvoiceAmountUSD > 0 && form.landExchangeRate > 0;
  const calculatedProfit = hasLandConversion ? realizedGrossProfit(form, invoices, form.landPayment) : null;
  const profit = form.landPaidAt && calculatedProfit !== null ? calculatedProfit : null;
  const groupTLBreakdown = form.pricingMode === 'group_tl' ? calculateGroupTLBreakdown({
    actualPassengerCount: form.passengerCount,
    chargeablePassengerCount: originalChargeablePassengerCount(form),
    regularLandCostPerPerson: form.regularLandCostPerPerson,
    tourLeaderLandCostPerPerson: form.tourLeaderLandCostPerPerson,
    ticketPerTraveler: form.ticketPricePerPerson,
    airportTaxPerTraveler: form.airportTaxPerPerson,
    marginPerTraveler: form.groupMarginPerTraveler,
    businessUpgradeTotal: form.businessUpgradeTotal,
    singleSupplementTotal: form.singleSupplementTotal,
    additionalItemsTotal: form.additionalItemsTotal,
  }) : null;

  return <Modal open={open} title={th ? 'Customer Journey — รายละเอียดและขั้นตอนดำเนินงาน' : 'Customer Journey — workflow details'} onClose={requestClose} wide closeOnBackdrop={false} closeOnEscape={false}>
    <div className={`tracking-draft-status ${hasUnsavedChanges || draftRestored ? 'active' : ''}`}>
      <div className="tracking-draft-status-icon"><FileCheck2/></div>
      <div className="tracking-draft-status-copy">
        <b>{hasUnsavedChanges ? (th ? 'กำลังบันทึก Draft อัตโนมัติ' : 'Auto-saving draft') : draftRestored ? (th ? 'กู้ Draft ล่าสุดกลับมาแล้ว' : 'Latest draft restored') : (th ? 'Draft พร้อมใช้งาน' : 'Draft protection ready')}</b>
        <span>{draftSavedAt ? `${th ? 'บันทึกล่าสุด' : 'Last saved'} ${formatDraftTime(draftSavedAt, th)}` : (th ? 'ข้อมูลที่แก้ไขจะถูกเก็บอัตโนมัติใน Browser เครื่องนี้' : 'Changes are automatically kept in this browser')}</span>
      </div>
      <button type="button" className="ghost-button tracking-save-draft" onClick={saveDraftNow}><FileText/>{th ? 'บันทึก Draft ตอนนี้' : 'Save draft now'}</button>
    </div>
    <div className="journey-editor">
      <div className="journey-editor-summary"><div><span>{th ? 'สถานะปัจจุบัน' : 'Current stage'}</span><strong>{stageLabel(currentStage, th)}</strong><small>{form.opportunityName || form.customerName || '-'}</small></div><div><span>{th ? 'งานถัดไป' : 'Next action'}</span><strong>{form.nextAction || nextRecommendedAction(form, th)}</strong><small>{form.nextActionDueDate ? formatDate(form.nextActionDueDate, language) : th ? 'ยังไม่กำหนด Deadline' : 'No deadline'}</small></div><div><span>{th ? 'ยอดรับชำระ / คงเหลือ' : 'Paid / remaining'}</span><strong>{formatTHB(totalPaid, language)} / {formatTHB(Math.max(0, grandTotal - totalPaid), language)}</strong><small>{form.passengerCount + addedPassengerCount(form)} {th ? 'ท่านรวม' : 'total pax'}</small></div></div>

      <WorkflowSection number="01" icon={<MessageSquareText/>} title={th ? 'เสนอราคาและยืนยันการจอง' : 'Quotation & booking confirmation'} subtitle={th ? 'เริ่มจากแจ้งราคา จนลูกค้ายืนยันวันเดินทางและแพ็กเกจ' : 'From quotation to confirmed travel dates and package.'}>
        <div className="tracking-form-grid">
          <label className="field span-2"><span>{th ? 'Opportunity Name / ชื่อรายการ' : 'Opportunity name'}</span><input value={form.opportunityName} onChange={(e) => set('opportunityName', e.target.value)} placeholder={th ? 'เช่น คุณสมชาย 5D4N เดือนตุลาคม' : 'e.g. Mr. Smith 5D4N October'}/></label>
          <label className="field"><span>{th ? 'ชื่อลูกค้า / บริษัท' : 'Customer / company'}</span><input value={form.customerName} onChange={(e) => set('customerName', e.target.value)}/></label>
          <label className="field"><span>{th ? 'Lead Source' : 'Lead source'}</span><select value={form.leadSource} onChange={(e) => set('leadSource', e.target.value as LeadSource)}>{leadSources.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="field"><span>{th ? 'เบอร์โทร' : 'Phone'}</span><input value={form.phone} onChange={(e) => set('phone', e.target.value)}/></label>
          <label className="field"><span>Email</span><input value={form.email} onChange={(e) => set('email', e.target.value)}/></label>
          <label className="field span-2"><span>{th ? 'ที่อยู่สำหรับออก Invoice / Quotation (ไม่บังคับ)' : 'Billing address for invoices / quotations (optional)'}</span><textarea rows={3} value={form.invoiceAddress || ''} onChange={(e) => set('invoiceAddress', e.target.value)} placeholder={th ? 'ชื่อบริษัท ที่อยู่ เลขประจำตัวผู้เสียภาษี หรือเว้นว่างได้' : 'Company, address, tax ID, or leave blank'}/></label>
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
          <label className="field"><span>{th ? 'รูปแบบการชำระเงิน' : 'Payment plan'}</span><select value={form.paymentPlan || 'installments'} onChange={(e) => {
            const paymentPlan = e.target.value as CustomerTracking['paymentPlan'];
            setForm((current) => current ? ({ ...current, paymentPlan }) : current);
            setPaymentDraft((current) => ({ ...current, type: paymentPlan === 'full_payment' ? 'full_payment' : 'ticket_deposit', invoiceId: '', amount: 0 }));
          }}><option value="installments">{th ? '2 งวด — ค่าตั๋ว + ค่าแพ็กเกจส่วนที่เหลือ' : '2 stages — airfare + package balance'}</option><option value="full_payment">{th ? 'ชำระทั้งหมดครั้งเดียว — Full Payment' : 'One-time full payment'}</option><option value="custom">{th ? 'กำหนดเอง / เคสพิเศษ' : 'Custom / special case'}</option></select><small>{(form.paymentPlan || 'installments') === 'full_payment' ? (th ? 'ใช้สำหรับจองกระชั้นหรือเรียกเก็บยอดทั้งหมดใน Invoice เดียว' : 'Use for urgent bookings or a single all-in invoice.') : (form.paymentPlan || 'installments') === 'custom' ? (th ? 'ใช้ Invoice เพิ่มเติมเพื่อจัดรายการตามเคสจริง' : 'Use supplemental invoices for a case-specific collection plan.') : (th ? 'Workflow มาตรฐาน: Invoice 1 ค่าตั๋ว → Invoice 2 ค่าแพ็กเกจคงเหลือ' : 'Standard workflow: Invoice 1 airfare → Invoice 2 package balance.')}</small></label>
          <label className="field"><span>{th ? 'รูปแบบการคิดราคา' : 'Pricing model'}</span><select value={form.pricingMode || 'standard'} onChange={(e) => updatePricingFields({ pricingMode: e.target.value as CustomerTracking['pricingMode'], chargeablePassengerCount: e.target.value === 'group_tl' ? Math.max(1, Math.min(form.passengerCount, form.chargeablePassengerCount || form.passengerCount - 1)) : form.passengerCount })}><option value="standard">{th ? 'กรุ๊ปปกติ — เรียกเก็บทุกท่าน' : 'Standard — bill every traveller'}</option><option value="group_tl">{th ? 'กรุ๊ปใหญ่ + Tour Leader' : 'Large group + Tour Leader'}</option></select></label>
          <label className="field"><span>{th ? 'ระดับโรงแรม' : 'Hotel category'}</span><select value={form.hotelCategory} onChange={(e) => syncHotelCategory(e.target.value as HotelCategory)}><option>3 Stars</option><option>4 Stars</option><option>5 Stars</option></select></label>
          <label className="field"><span>{th ? 'วันเริ่มเดินทาง' : 'Travel start'}</span><input type="date" value={form.travelStartDate} onChange={(e) => syncDates(e.target.value)}/></label>
          <label className="field"><span>{th ? 'วันสิ้นสุด' : 'Travel end'}</span><input type="date" value={form.travelEndDate} onChange={(e) => set('travelEndDate', e.target.value)}/></label>
          <label className="field"><span>{form.pricingMode === 'group_tl' ? (th ? 'ผู้เดินทางจริงทั้งหมด (รวม TL)' : 'Actual travellers (incl. TL)') : (th ? 'จำนวนผู้เดินทาง' : 'No. of pax')}</span><input type="number" min="1" max="99" value={form.passengerCount} onChange={(e) => updatePricingFields({ passengerCount: Math.max(1, Number(e.target.value)), chargeablePassengerCount: form.pricingMode === 'group_tl' ? Math.min(Math.max(1, form.chargeablePassengerCount || 1), Math.max(1, Number(e.target.value))) : Math.max(1, Number(e.target.value)) })}/></label>
          {form.pricingMode === 'group_tl' && <label className="field"><span>{th ? 'จำนวนผู้ชำระเงิน' : 'Chargeable travellers'}</span><input type="number" min="1" max={form.passengerCount} value={form.chargeablePassengerCount || form.passengerCount} onChange={(e) => updatePricingFields({ chargeablePassengerCount: Math.min(form.passengerCount, Math.max(1, Number(e.target.value))) })}/></label>}
          {form.pricingMode === 'group_tl' && <div className="group-tl-stat tracking-group-tl-stat"><span>Tour Leader</span><strong>{Math.max(0, form.passengerCount - (form.chargeablePassengerCount || form.passengerCount))}</strong><small>{th ? 'ฟรีเฉพาะที่พัก' : 'hotel-only complimentary'}</small></div>}
          <label className="field"><span>{th ? 'จำนวนผู้พักเดี่ยว' : 'Single-room travellers'}</span><input type="number" min="0" max={Math.max(1, form.passengerCount)} value={form.singleRoomCount} onChange={(e) => updateSingleRoomDetails(Number(e.target.value), form.singleSupplementPerPerson)}/></label>
          <div className="tracking-calc-action"><button className="secondary-button" type="button" onClick={calculateFromPricing}><CircleDollarSign/>{form.pricingMode === 'group_tl' ? (th ? 'คำนวณราคาเฉลี่ยกรุ๊ป TL' : 'Calculate TL group average') : (th ? 'ดึงราคามาตรฐานจากระบบ' : 'Load standard pricing')}</button></div>
        </div>
        <div className="traveler-addition-inline-action">
          <div className="traveler-addition-inline-copy">
            <span className="traveler-addition-inline-icon"><Users/></span>
            <div>
              <b>{th ? 'มีผู้เดินทางเพิ่มหลังออกตั๋วชุดแรก?' : 'Travellers added after the first ticket issue?'}</b>
              <small>{travelerAdditionLocked
                ? (th ? 'ปิดการเพิ่มผู้เดินทางแล้ว เพราะรายการเข้าสู่ขั้นส่งเอกสารยื่นวีซ่าหรือขั้นหลังจากนั้น' : 'Adding travellers is closed because the booking has reached visa submission or a later stage.')
                : (th ? 'กดเพิ่มเพื่อออก Invoice ค่าตั๋วของผู้เดินทางชุดใหม่ก่อน จากนั้นระบบจะรวมมูลค่าแพ็กเกจของทุกคนไว้ใน Invoice 2' : 'Create a ticket invoice for the new group first; the system then consolidates every traveller’s package value into Invoice 2.')}</small>
            </div>
          </div>
          <div className="traveler-addition-inline-stats">
            {addedPassengerCount(form) > 0 && <span>{th ? `เพิ่มแล้ว ${addedPassengerCount(form)} ท่าน` : `${addedPassengerCount(form)} added`}</span>}
            {pendingAddedTicketInvoices.length > 0 && <span className="traveler-payment-pending">{th ? `รอชำระ Invoice 1 เพิ่มผู้เดินทาง ${pendingAddedTicketInvoices.length} รายการ` : `${pendingAddedTicketInvoices.length} added Invoice 1 item(s) pending`}</span>}
            <button type="button" className="secondary-button traveler-addition-open-button" disabled={travelerAdditionLocked} onClick={() => setTravelerPanelOpen(true)}><Plus/>{th ? 'เพิ่มผู้เดินทาง' : 'Add travellers'}</button>
            <button type="button" className="secondary-button traveler-addition-open-button supplemental-open-button" onClick={() => setSupplementalPanelOpen(true)}><ReceiptText/>{th ? 'เรียกเก็บเพิ่มเติม' : 'Additional charge'}{generalSupplementalInvoices(form, invoices).filter((x) => x.status !== 'cancelled').length > 0 && <em>{generalSupplementalInvoices(form, invoices).filter((x) => x.status !== 'cancelled').length}</em>}</button>
            <button type="button" className="secondary-button traveler-addition-open-button" onClick={() => setTicketChangePanelOpen(true)}><CalendarClock/>{th ? 'เลื่อนตั๋ว / เดินทางล่าช้า' : 'Ticket change / delayed travel'}</button>
          </div>
        </div>
        {form.pricingMode === 'group_tl' && groupTLBreakdown && <section className="group-tl-pricing-panel tracking-group-tl-panel">
          <div className="group-tl-pricing-head"><div><span>{th ? 'สูตรกรุ๊ปใหญ่' : 'Large-group formula'}</span><h4>{originalBilledPax}+{form.tourLeaderCount} TL</h4><p>{th ? `เดินทางจริง ${form.passengerCount} ท่าน แต่เฉลี่ยยอดรวมให้ผู้ชำระ ${originalBilledPax} ท่าน` : `${form.passengerCount} actual travellers; all costs are averaged over ${originalBilledPax} paying travellers.`}</p></div><div className="group-tl-average-box"><small>{th ? 'ราคาขายจริง / ผู้ชำระ' : 'Final selling / paying pax'}</small><strong>{formatTHB(form.sellingPricePerPerson, language)}</strong><span>{th ? `แนะนำ ${formatTHB(groupTLBreakdown.sellingPricePerChargeablePerson, language)} · ยอดเรียกเก็บ ${formatTHB(form.totalAmount, language)}` : `Customer total ${formatTHB(form.totalAmount, language)}`}</span></div></div>
          <div className="tracking-form-grid money-grid group-tl-cost-inputs">
            <MoneyField label={th ? 'LAND ผู้เดินทางปกติ / ท่าน' : 'Regular LAND / traveller'} value={form.regularLandCostPerPerson} onChange={(v) => updatePricingFields({ regularLandCostPerPerson: v })}/>
            <MoneyField label={th ? 'LAND สำหรับ TL / ท่าน' : 'TL LAND / traveller'} value={form.tourLeaderLandCostPerPerson} onChange={(v) => updatePricingFields({ tourLeaderLandCostPerPerson: v })}/>
            <MoneyField label={th ? 'ค่าโดยสาร Economy (ไม่รวมภาษี) / ผู้เดินทางจริง' : 'Economy fare excl. tax / actual traveller'} value={form.ticketPricePerPerson} onChange={(v) => updatePricingFields({ ticketPricePerPerson: v })}/>
            <MoneyField label={th ? 'ภาษีสนามบิน / ผู้เดินทางจริง' : 'Airport tax / actual traveller'} value={form.airportTaxPerPerson} onChange={(v) => updatePricingFields({ airportTaxPerPerson: v })}/>
            <MoneyField label={th ? 'Margin / ผู้เดินทางจริง' : 'Margin / actual traveller'} value={form.groupMarginPerTraveler} onChange={(v) => updatePricingFields({ groupMarginPerTraveler: v })}/>
            <MoneyField label={th ? 'ราคาขายจริง / ผู้ชำระ (แก้ได้)' : 'Final selling / paying pax (editable)'} value={form.groupSellingPriceOverridePerPerson || form.sellingPricePerPerson} onChange={(v) => updatePricingFields({ groupSellingPriceOverridePerPerson: v })}/>
          </div>
          <div className="group-tl-cost-summary">
            <div><span>LAND {originalBilledPax} PAX</span><b>{formatTHB(groupTLBreakdown.regularLandTotal, language)}</b></div>
            <div><span>LAND {form.tourLeaderCount} TL</span><b>{formatTHB(groupTLBreakdown.tourLeaderLandTotal, language)}</b></div>
            <div><span>{th ? 'ตั๋วทั้งหมด' : 'All airfare'}</span><b>{formatTHB(groupTLBreakdown.flightTotal, language)}</b></div>
            <div><span>{th ? 'ภาษีทั้งหมด' : 'All airport tax'}</span><b>{formatTHB(groupTLBreakdown.airportTaxTotal, language)}</b></div>
            <div><span>Margin</span><b>{formatTHB(groupTLBreakdown.marginTotal, language)}</b></div>
            <div className="featured"><span>{th ? 'รวมก่อนหาร' : 'Total before average'}</span><b>{formatTHB(groupTLBreakdown.totalBeforeAverage, language)}</b></div>
            <div className="featured"><span>{th ? `หาร ${originalBilledPax} ท่าน` : `Divide by ${originalBilledPax}`}</span><b>{formatTHB(groupTLBreakdown.averageBeforeRounding, language)}</b></div>
          </div>
          <p className="group-tl-pricing-note">{th
            ? `TL ฟรีเฉพาะค่าที่พักเท่านั้น ค่าโดยสาร Economy และภาษีคิดครบผู้เดินทางจริง ${form.passengerCount} ท่าน ส่วนผู้โดยสาร Business Class ${form.businessUpgradeCount} ท่านเป็นส่วนหนึ่งของผู้เดินทางกลุ่มนี้และคิดส่วนต่างเพิ่มเฉพาะผู้ที่อัปเกรด`
            : `The TL receives complimentary accommodation only. Economy fare and tax apply to all ${form.passengerCount} actual travellers. The ${form.businessUpgradeCount} Business Class passengers are included within this group and only their fare difference is added.`}</p>
        </section>}
        {form.pricingMode === 'standard' && <section className="tracking-child-pricing-panel">
          <div className="tracking-child-pricing-title"><div><Users/><span><b>{th ? 'แยกราคาผู้ใหญ่ / เด็ก' : 'Adult / child pricing'}</b><small>{th ? 'จำนวนผู้เดินทางรวมด้านบนต้องรวมเด็กแล้ว ระบบจะใช้ราคานี้แยก ADT / CHD ใน Quotation, Invoice 1 และ Invoice 2' : 'The total traveller count above already includes children. These values are used separately for ADT / CHD on the quotation and invoices.'}</small></span></div></div>
          <div className="tracking-passenger-pricing-grid">
            <div className="tracking-passenger-price-card adult">
              <div className="tracking-passenger-price-head"><span className="ptc-badge">ADT</span><div><b>{th ? 'ราคาผู้ใหญ่' : 'Adult pricing'}</b><small>{Math.max(0, form.passengerCount - (form.childPassengerCount || 0))} {th ? 'ท่าน' : 'pax'}</small></div></div>
              <MoneyField label={th ? 'ราคาขายรวมผู้ใหญ่ / ท่าน' : 'Adult total selling / pax'} value={form.sellingPricePerPerson} onChange={(v) => updatePricingFields({ sellingPricePerPerson: v })}/>
              <MoneyField label={th ? 'ราคาตั๋วผู้ใหญ่ / ท่าน' : 'Adult airfare / pax'} value={form.ticketPricePerPerson} onChange={(v) => updatePricingFields({ ticketPricePerPerson: v })}/>
              <MoneyField label={th ? 'ภาษีสนามบินผู้ใหญ่ / ท่าน' : 'Adult airport tax / pax'} value={form.airportTaxPerPerson} onChange={(v) => updatePricingFields({ airportTaxPerPerson: v })}/>
            </div>
            <div className={`tracking-passenger-price-card child ${(form.childPassengerCount || 0) > 0 ? 'active' : ''}`}>
              <div className="tracking-passenger-price-head child-head"><span className="ptc-badge">CHD</span><div><b>{th ? 'ราคาสำหรับเด็ก' : 'Child pricing'}</b><small>{th ? 'ระบุจำนวนเด็กก่อน แล้วกรอกราคาที่ต่างจากผู้ใหญ่' : 'Set the child count, then enter the child-specific prices.'}</small></div><label><span>{th ? 'จำนวนเด็ก' : 'Children'}</span><input type="number" min="0" max={form.passengerCount} value={form.childPassengerCount || 0} onChange={(e) => { const count = Math.min(form.passengerCount, Math.max(0, Number(e.target.value))); updatePricingFields({ childPassengerCount: count, ...(count > 0 ? { childSellingPricePerPerson: form.childSellingPricePerPerson || form.sellingPricePerPerson, childTicketPricePerPerson: form.childTicketPricePerPerson || form.ticketPricePerPerson, childAirportTaxPerPerson: form.childAirportTaxPerPerson || form.airportTaxPerPerson } : {}) }); }}/></label></div>
              {(form.childPassengerCount || 0) > 0 ? <>
                <MoneyField label={th ? 'ราคาขายรวมเด็ก / ท่าน' : 'Child total selling / pax'} value={form.childSellingPricePerPerson} onChange={(v) => updatePricingFields({ childSellingPricePerPerson: v })}/>
                <MoneyField label={th ? 'ราคาตั๋วเด็ก / ท่าน' : 'Child airfare / pax'} value={form.childTicketPricePerPerson} onChange={(v) => updatePricingFields({ childTicketPricePerPerson: v })}/>
                <MoneyField label={th ? 'ภาษีสนามบินเด็ก / ท่าน' : 'Child airport tax / pax'} value={form.childAirportTaxPerPerson} onChange={(v) => updatePricingFields({ childAirportTaxPerPerson: v })}/>
                <div className="tracking-child-total-preview"><span>{th ? 'มูลค่าเด็กในแพ็กเกจ' : 'Child package value'}</span><strong>{formatTHB((form.childSellingPricePerPerson || 0) * (form.childPassengerCount || 0), language)}</strong><small>{formatTHB(form.childSellingPricePerPerson || 0, language)} × {form.childPassengerCount || 0}</small></div>
              </> : <div className="tracking-child-empty">{th ? 'ถ้ามีเด็กเดินทาง ให้ใส่จำนวนเด็ก ระบบจะแสดงช่องราคาสำหรับเด็กทันที' : 'Enter the number of children to reveal child-specific pricing fields.'}</div>}
            </div>
          </div>
        </section>}
        <div className="tracking-form-grid money-grid journey-money-grid pricing-input-grid">
          <MoneyField label={form.pricingMode === 'group_tl' ? (th ? 'ส่วนต่างค่าโดยสาร Business Class / ท่าน' : 'Business Class fare difference / pax') : (th ? 'ส่วนเพิ่มราคาขาย Business Class / ท่าน' : 'Business Class selling surcharge / pax')} value={form.businessUpgradePerPerson} onChange={(v) => updatePricingFields({ businessUpgradePerPerson: v })}/>
          <label className="field"><span>{form.pricingMode === 'group_tl'
            ? (th ? `จำนวน Business Class (จากผู้เดินทางจริง ${form.passengerCount} ท่าน)` : `Business Class pax (of ${form.passengerCount} actual travellers)`)
            : (th ? 'จำนวนผู้โดยสาร Business Class' : 'Business Class passengers')}</span><input type="number" min="0" max={form.passengerCount} value={form.businessUpgradeCount} onChange={(e) => updatePricingFields({ businessUpgradeCount: Math.min(form.passengerCount, Math.max(0, Number(e.target.value))) })}/></label>
          <MoneyField label={th ? 'ส่วนต่างพักเดี่ยว / ท่าน' : 'Single supplement / pax'} value={form.singleSupplementPerPerson} onChange={(v) => updateSingleRoomDetails(form.singleRoomCount, v)}/>
        </div>
        <AdditionalItemsEditor compact items={form.additionalItems || []} passengerCount={form.passengerCount} language={language} onChange={(items) => updatePricingFields({ additionalItems: items })}/>
        <div className="automatic-totals-panel">
          <div className="automatic-totals-head"><div><b>{th ? 'สรุปราคาอัตโนมัติ' : 'Automatic price summary'}</b><span>{th ? 'รวมผู้เดินทางชุดแรกและผู้เดินทางที่เพิ่มทุกชุดโดยอัตโนมัติ' : 'Automatically combines the original group and every added-traveller batch.'}</span></div><strong>{formatTHB(combinedPackageTotal, language)}</strong></div>
          <div className="automatic-totals-grid">
            <AutoTotal label={form.pricingMode === 'group_tl' ? (th ? `ราคาเฉลี่ยกรุ๊ป ${form.passengerCount} ท่าน (${originalBilledPax}+${form.tourLeaderCount} TL)` : `Averaged group price — ${form.passengerCount} travellers (${originalBilledPax}+${form.tourLeaderCount} TL)`) : (th ? `แพ็กเกจพื้นฐานรวม ${combinedPassengerCount} ท่าน` : `Base package — ${combinedPassengerCount} pax`)} formula={form.pricingMode === 'group_tl' ? `${formatTHB(form.sellingPricePerPerson, language)} × ${originalBilledPax}` : (addedPassengerCount(form) > 0 ? (th ? `${form.passengerCount} ท่านเดิม + ${addedPassengerCount(form)} ท่านเพิ่ม` : `${form.passengerCount} original + ${addedPassengerCount(form)} added`) : (form.childPassengerCount || 0) > 0 ? (th ? `${form.passengerCount - form.childPassengerCount} ADT + ${form.childPassengerCount} CHD` : `${form.passengerCount - form.childPassengerCount} ADT + ${form.childPassengerCount} CHD`) : `${formatTHB(form.sellingPricePerPerson, language)} × ${form.passengerCount}`)} value={combinedBasePackageTotal} language={language}/>
            {addedPassengerCount(form) > 0 && <AutoTotal label={th ? 'มูลค่าแพ็กเกจของผู้เดินทางเพิ่ม' : 'Added-traveller package value'} formula={`${addedPassengerCount(form)} ${th ? 'ท่าน' : 'pax'}`} value={addedPackageRevenue} language={language}/>} 
            {combinedBusinessUpgradeTotal > 0 && <AutoTotal label={form.pricingMode === 'group_tl' ? (th ? `Business Class ${form.businessUpgradeCount} จากผู้เดินทางจริง ${form.passengerCount} ท่าน` : `Business Class ${form.businessUpgradeCount} of ${form.passengerCount} actual travellers`) : (th ? 'ส่วนเพิ่ม Business Class รวมทุกชุด' : 'Business Class surcharge — all groups')} formula={th ? 'ชุดแรก + ผู้เดินทางเพิ่ม' : 'Original + added groups'} value={combinedBusinessUpgradeTotal} language={language}/>} 
            {combinedSingleSupplementTotal > 0 && <AutoTotal label={th ? 'พักเดี่ยวรวมทุกชุด' : 'Single supplements — all groups'} formula={th ? 'ชุดแรก + ผู้เดินทางเพิ่ม' : 'Original + added groups'} value={combinedSingleSupplementTotal} language={language}/>} 
            {combinedAdditionalItemsTotal > 0 && <AutoTotal label={th ? 'รายการเพิ่มเติมรวมทุกชุด' : 'Additional services — all groups'} formula={th ? 'ชุดแรก + ผู้เดินทางเพิ่ม' : 'Original + added groups'} value={combinedAdditionalItemsTotal} language={language}/>} 
            <AutoTotal featured label={th ? 'ยอดแพ็กเกจรวมผู้เดินทางทั้งหมด' : 'Combined package total'} formula={addedPassengerCount(form) > 0 ? (th ? `${form.passengerCount} ท่านเดิม + ${addedPassengerCount(form)} ท่านเพิ่ม = ${combinedPassengerCount} ท่าน` : `${form.passengerCount} original + ${addedPassengerCount(form)} added = ${combinedPassengerCount} pax`) : (th ? `${form.passengerCount} ท่าน` : `${form.passengerCount} pax`)} value={combinedPackageTotal} language={language}/>
            <AutoTotal label={th ? 'ค่าตั๋วเครื่องบินรวมทุกชุด' : 'Total airfare — all groups'} formula={th ? 'ชุดแรก + ผู้เดินทางเพิ่ม' : 'Original + added groups'} value={combinedAirfareTotal} language={language}/>
            <AutoTotal label={th ? 'ภาษีสนามบินรวมทุกชุด' : 'Total airport tax — all groups'} formula={th ? 'ชุดแรก + ผู้เดินทางเพิ่ม' : 'Original + added groups'} value={combinedAirportTaxTotal} language={language}/>
            <AutoTotal featured label={th ? 'ยอด Invoice 1 รวมทุกชุด' : 'Invoice 1 total — all groups'} formula={th ? 'ค่าตั๋วตาม PNR + ภาษีสนามบินของผู้เดินทางทุกชุด' : 'PNR airfare + airport tax for every traveller group'} value={combinedTicketAndTaxTotal} language={language}/>
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
        {form.pricingMode === 'standard' && (form.childPassengerCount || 0) > 0 && <section className="child-invoice-price-preview">
          <div className="child-invoice-price-preview-head"><div><ReceiptText/><span><b>{th ? 'ราคาที่จะใช้ใน Invoice 1 — ตั๋วผู้ใหญ่ / เด็ก' : 'Invoice 1 pricing — adult / child airfare'}</b><small>{th ? 'ตรวจสอบราคาก่อนออก Invoice ระบบจะแยก ADT และ CHD ในเอกสารให้อัตโนมัติ' : 'Review the prices before issuing Invoice 1. ADT and CHD will be shown as separate rows.'}</small></span></div></div>
          <div className="child-invoice-price-table">
            <div className="child-invoice-price-row head"><span>PTC</span><span>QTY</span><span>{th ? 'ค่าตั๋ว / ท่าน' : 'Fare / pax'}</span><span>{th ? 'ภาษี / ท่าน' : 'Tax / pax'}</span><span>{th ? 'รวม' : 'Total'}</span></div>
            <div className="child-invoice-price-row"><span><b>ADT</b></span><span>{Math.max(0, form.passengerCount - (form.childPassengerCount || 0))}</span><span>{formatNumber(form.ticketPricePerPerson || 0, 2)}</span><span>{formatNumber(form.airportTaxPerPerson || 0, 2)}</span><span>{formatNumber(Math.max(0, form.passengerCount - (form.childPassengerCount || 0)) * ((form.ticketPricePerPerson || 0) + (form.airportTaxPerPerson || 0)), 2)}</span></div>
            <div className="child-invoice-price-row child"><span><b>CHD</b></span><span>{form.childPassengerCount || 0}</span><span>{formatNumber(form.childTicketPricePerPerson || 0, 2)}</span><span>{formatNumber(form.childAirportTaxPerPerson || 0, 2)}</span><span>{formatNumber((form.childPassengerCount || 0) * ((form.childTicketPricePerPerson || 0) + (form.childAirportTaxPerPerson || 0)), 2)}</span></div>
          </div>
        </section>}
        {(form.paymentPlan || 'installments') === 'full_payment' ? <div className="installment-card full-payment journey-invoice-card">
          <div className="installment-head"><span>1×</span><div><b>{th ? 'Full Payment — เรียกเก็บทั้งหมดครั้งเดียว' : 'Full Payment — one-time collection'}</b><small>{th ? 'ยอดแพ็กเกจทั้งหมดอยู่ใน Invoice เดียว เหมาะสำหรับการจองกระชั้นหรือ Agent ที่ชำระครั้งเดียว' : 'The entire package is billed in one invoice for urgent bookings or one-time agent payment.'}</small></div></div>
          <strong>{formatTHB(grandTotal, language)}</strong>
          <div className="installment-fields">
            <label className="field"><span>{th ? 'กำหนดชำระ' : 'Due date'}</span><input type="date" value={form.depositDueDate} onChange={(e) => set('depositDueDate', e.target.value)}/></label>
            <label className="field"><span>{th ? 'สถานะ Full Payment' : 'Full payment status'}</span><select value={form.balanceStatus} onChange={(e) => { const status = e.target.value as PaymentStageStatus; setForm((current) => current ? ({ ...current, depositStatus: status, balanceStatus: status }) : current); }}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label>
            <MilestoneField label={th ? 'วันที่รับชำระทั้งหมด' : 'Full payment received'} value={form.fullPaymentReceivedAt} onChange={(v) => set('fullPaymentReceivedAt', v)} onToday={() => markToday('fullPaymentReceivedAt')} th={th}/>
          </div>
          <button className="primary-button" type="button" onClick={() => onIssueInvoice(normalizeBeforeSave(), 'full')}><ReceiptText/>{th ? 'เปิด / ออก Invoice Full Payment' : 'Open / issue Full Payment invoice'}</button>
          <small className="invoice-requirement-note">{th ? 'หากต้องการใบกำกับภาษี สามารถเปิด VAT ในหน้า Invoice ได้ โดย VAT จะคิดเฉพาะส่วนค่าแพ็กเกจหลังหักค่าตั๋วและภาษีสนามบิน' : 'If a tax invoice is required, enable VAT in the invoice. VAT is calculated only on the package portion after airfare and airport tax.'}</small>
        </div> : <>
          <div className="installment-card first journey-invoice-card"><div className="installment-head"><span>1</span><div><b>{th ? 'Invoice 1 — ค่าตั๋วเครื่องบินทั้งหมด + ภาษีสนามบิน' : 'Invoice 1 — full airfare + airport tax'}</b><small>{th ? 'กำหนด Deadline เอง และส่งตั๋วหลังตรวจสอบยอดชำระ' : 'Set the deadline and send tickets after payment verification.'}</small></div></div><strong>{formatTHB(deposit, language)}</strong><div className="installment-fields"><label className="field"><span>{th ? 'กำหนดชำระ' : 'Due date'}</span><input type="date" value={form.depositDueDate} onChange={(e) => set('depositDueDate', e.target.value)}/></label><label className="field"><span>{th ? 'สถานะงวด 1' : 'Payment 1 status'}</span><select value={form.depositStatus} onChange={(e) => set('depositStatus', e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label><MilestoneField label={th ? 'วันที่ส่ง Invoice 1' : 'Invoice 1 sent'} value={form.invoice1SentAt} onChange={(v) => set('invoice1SentAt', v)} onToday={() => markToday('invoice1SentAt')} th={th}/><MilestoneField label={th ? 'วันที่รับชำระงวด 1' : 'Payment 1 received'} value={form.firstPaymentReceivedAt} onChange={(v) => set('firstPaymentReceivedAt', v)} onToday={() => markToday('firstPaymentReceivedAt')} th={th}/></div><button className="secondary-button" type="button" onClick={() => onIssueInvoice(normalizeBeforeSave(), 'deposit')}><ReceiptText/>{th ? 'เปิด / ออก Invoice 1' : 'Open / issue Invoice 1'}</button></div>
          {addedInvoice1Documents.length > 0 && <div className="invoice1-added-groups">
            <div className="invoice1-added-groups-head"><div><b>{th ? 'Invoice 1 — ผู้เดินทางเพิ่ม' : 'Invoice 1 — added travellers'}</b><small>{th ? 'ค่าตั๋วและภาษีของผู้เดินทางที่เพิ่มแต่ละชุด จัดอยู่ในงวดที่ 1 ทั้งหมด' : 'Every added group’s airfare and tax remains part of Payment 1.'}</small></div><span>{addedInvoice1Documents.length} {th ? 'รายการ' : 'item(s)'}</span></div>
            {addedInvoice1Documents.map((invoice, index) => { const addition = activeTravelerAdditions(form).find((entry) => entry.invoiceId === invoice.id); const received = invoicePaidAmount(invoice.id, payments); const remaining = Math.max(0, invoice.amount - received); return <article key={invoice.id} className="invoice1-added-row"><div><span>{th ? `ชุดที่ ${index + 1}` : `Batch ${index + 1}`}</span><strong>{addition ? `${addition.passengerCount} ${th ? 'ท่าน' : 'pax'} · PNR ${addition.pnr || '-'}` : invoice.title}</strong><small>{invoice.invoiceNo} · {paymentStatusLabel(effectiveStageStatus(invoice.status, invoice.dueDate), th)}</small></div><div><span>{th ? 'ยอด / รับแล้ว / คงเหลือ' : 'Amount / paid / balance'}</span><strong>{formatTHB(invoice.amount, language)}</strong><small>{formatTHB(received, language)} / {formatTHB(remaining, language)}</small></div><button type="button" className="secondary-button" onClick={() => onOpenInvoice(form, invoice)}><FileText/>{th ? 'เปิด Invoice 1' : 'Open Invoice 1'}</button></article>; })}
          </div>}
        </>}
      </WorkflowSection>

      <WorkflowSection number="04" icon={<ShieldCheck/>} title={(form.paymentPlan || 'installments') === 'full_payment' ? (th ? 'ส่งเอกสารให้ Land และดำเนินการวีซ่า' : 'Submit to land & process visa') : (th ? 'ส่งเอกสารให้ Land รับ Invoice USD และออก Invoice 2' : 'Submit to land, receive USD invoice & issue Invoice 2')} subtitle={(form.paymentPlan || 'installments') === 'full_payment' ? (th ? 'หลังรับ Full Payment แล้ว สามารถออกตั๋ว ส่งเอกสารให้ Land และดำเนินการวีซ่าได้ทันที' : 'After full payment, issue tickets and submit documents to land for visa processing.') : (th ? 'ต้องรับชำระค่าตั๋วของผู้เดินทางเดิมและผู้เดินทางเพิ่มทุกชุดให้ครบก่อน แล้วจึงส่งเอกสารทั้งหมดให้ Land ยื่นวีซ่า' : 'Collect every original and added-traveller ticket invoice before submitting all documents to land for visa processing.')}>
        {!canProceedToVisa && <div className="visa-readiness-alert"><Hourglass/><div><b>{th ? 'ยังไป Step ยื่นวีซ่าไม่ได้' : 'Visa step is not ready'}</b><span>{(form.paymentPlan || 'installments') === 'full_payment'
          ? (th ? 'รอรับชำระ Full Payment ให้ครบก่อนออกตั๋วและส่งเอกสารให้ Land' : 'Receive the full payment before ticketing and land submission.')
          : !originalTicketPaidInFull
            ? (th ? 'Invoice 1 ของผู้เดินทางชุดแรกยังชำระไม่ครบ' : 'The original group’s Invoice 1 is not fully paid.')
            : (th ? `ยังมี Invoice ค่าตั๋วผู้เดินทางเพิ่มรอชำระ ${pendingAddedTicketInvoices.length} รายการ` : `${pendingAddedTicketInvoices.length} added-traveller ticket invoice(s) are still unpaid.`)}</span></div></div>}
        {canProceedToVisa && addedPassengerCount(form) > 0 && <div className="visa-readiness-alert ready"><BadgeCheck/><div><b>{th ? 'ค่าตั๋วครบทุกชุดแล้ว' : 'All ticket invoices are paid'}</b><span>{th ? `ส่งเอกสารของผู้เดินทางรวม ${form.passengerCount + addedPassengerCount(form)} ท่านให้ Land ได้` : `You may submit documents for all ${form.passengerCount + addedPassengerCount(form)} travellers to land.`}</span></div></div>}
        <div className="tracking-form-grid">
          <label className="field"><span>LAND / Supplier</span><input value={form.landSupplier} onChange={(e) => set('landSupplier', e.target.value)} placeholder={th ? 'เช่น Aari Holiday / Amen' : 'e.g. Aari Holiday / Amen'}/></label>
          <MilestoneField label={th ? 'ส่ง Passport + รูป + ตั๋วทั้งหมดให้ Land' : 'All documents sent to land'} value={form.documentsSentToLandAt} onChange={(v) => set('documentsSentToLandAt', v)} onToday={() => markToday('documentsSentToLandAt')} th={th} disabled={!canProceedToVisa} disabledReason={th ? 'รับชำระค่าตั๋วทุก Invoice ให้ครบก่อน' : 'Collect every ticket invoice first'}/>
          <MilestoneField label={th ? 'วันที่ได้รับ Land Invoice' : 'Land invoice received'} value={form.landInvoiceReceivedAt} onChange={(v) => set('landInvoiceReceivedAt', v)} onToday={() => markToday('landInvoiceReceivedAt')} th={th}/>
          <label className="field"><span>{th ? 'เลขที่ Land Invoice' : 'Land invoice no.'}</span><input value={form.landInvoiceNo} onChange={(e) => set('landInvoiceNo', e.target.value)} placeholder="LAND-INV-001"/></label>
          <label className="field money-input"><span>{th ? 'ยอดตาม Land Invoice' : 'Land invoice amount'}</span><div><input type="number" min="0" step="0.01" value={form.landInvoiceAmountUSD} onChange={(e) => updateLandFinancials({ landInvoiceAmountUSD: Number(e.target.value) })}/><em>USD</em></div></label>
          {(form.paymentPlan || 'installments') !== 'full_payment' && <MilestoneField label={th ? 'จัดทำ Invoice 2 แล้ว' : 'Invoice 2 prepared'} value={form.invoice2PreparedAt} onChange={(v) => set('invoice2PreparedAt', v)} onToday={() => markToday('invoice2PreparedAt')} th={th}/>}
          <MilestoneField label={th ? 'ได้รับวีซ่าจาก Land' : 'Visa received'} value={form.visaReceivedAt} onChange={(v) => set('visaReceivedAt', v)} onToday={() => markToday('visaReceivedAt')} th={th}/>
          <MilestoneField label={(form.paymentPlan || 'installments') === 'full_payment' ? (th ? 'ส่งวีซ่าให้ลูกค้า' : 'Visa sent') : (th ? 'ส่งวีซ่า + Invoice 2 ให้ลูกค้า' : 'Visa + Invoice 2 sent')} value={form.visaSentAt} onChange={(v) => set('visaSentAt', v)} onToday={() => markToday('visaSentAt')} th={th}/>
          {(form.paymentPlan || 'installments') !== 'full_payment' && <MilestoneField label={th ? 'รับชำระค่าแพ็กเกจครบ' : 'Full package payment received'} value={form.fullPaymentReceivedAt} onChange={(v) => set('fullPaymentReceivedAt', v)} onToday={() => markToday('fullPaymentReceivedAt')} th={th}/>}
        </div>
        <div className="land-invoice-summary">
          <div><span>{th ? 'Land Invoice' : 'Land invoice'}</span><strong>{form.landInvoiceNo || '-'}</strong></div>
          <div><span>{th ? 'ยอดเรียกเก็บจาก Land' : 'Supplier invoice amount'}</span><strong>{form.landInvoiceAmountUSD > 0 ? `USD ${formatNumber(form.landInvoiceAmountUSD, 2)}` : '-'}</strong></div>
          <div><span>{th ? 'สถานะการแปลงเป็นบาท' : 'THB conversion status'}</span><strong>{form.landPayment > 0 ? formatTHB(form.landPayment, language) : (th ? 'รออัตราแลกเปลี่ยนวันโอน' : 'Awaiting transfer-day FX rate')}</strong></div>
        </div>
        {(form.paymentPlan || 'installments') !== 'full_payment' && <><div className="installment-card second journey-invoice-card"><div className="installment-head"><span>2</span><div><b>{th ? 'Invoice 2 — ค่าแพ็กเกจส่วนที่เหลือของผู้เดินทางทั้งหมด' : 'Invoice 2 — remaining package balance for all travellers'}</b><small>{th ? 'รวมแพ็กเกจผู้เดินทางชุดแรกและผู้เดินทางเพิ่ม แล้วหักค่าตั๋วทุก Invoice ที่ชำระแล้ว' : 'Original and added package values, less every paid ticket invoice.'}</small></div></div><strong>{formatTHB(Math.max(0, packageSalesTotal(form) - totalTicketPaymentsReceived(form, invoices, payments)), language)}</strong><div className="installment-fields"><label className="field"><span>{th ? 'กำหนดชำระ' : 'Due date'}</span><input type="date" value={form.balanceDueDate} onChange={(e) => set('balanceDueDate', e.target.value)}/></label><label className="field"><span>{th ? 'สถานะงวด 2' : 'Payment 2 status'}</span><select value={form.balanceStatus} onChange={(e) => set('balanceStatus', e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label></div><button className="secondary-button" type="button" disabled={!form.landInvoiceAmountUSD || !canProceedToVisa} onClick={() => onIssueInvoice(normalizeBeforeSave(), 'balance')}><FileText/>{th ? 'เปิด / ออก Invoice 2' : 'Open / issue Invoice 2'}</button>{!canProceedToVisa ? <small className="invoice-requirement-note">{th ? 'รับชำระค่าตั๋วทุกชุดให้ครบก่อนออก Invoice 2' : 'Collect every ticket invoice before issuing Invoice 2.'}</small> : !form.landInvoiceAmountUSD && <small className="invoice-requirement-note">{th ? 'กรอกยอด Land Invoice (USD) ก่อนออก Invoice 2' : 'Enter the land invoice amount in USD before issuing Invoice 2.'}</small>}</div></>}

      </WorkflowSection>

      <WorkflowSection number="05" icon={<WalletCards/>} title={th ? 'ประวัติรับชำระเงิน' : 'Payment transactions'} subtitle={th ? 'บันทึกการรับชำระและแนบสลิปแยกตามแต่ละรายการ เพื่อใช้ตรวจสอบย้อนหลัง' : 'Record each payment and attach its slip for future verification.'}>
        <div className="payment-entry-form payment-entry-form-with-slip">
          <label className="field"><span>{th ? 'ประเภทรายการ' : 'Payment type'}</span><select value={availablePaymentTypes.includes(paymentDraft.type) ? paymentDraft.type : availablePaymentTypes[0]} onChange={(e) => {
            const type = e.target.value as PaymentTransactionType;
            const firstGeneral = generalSupplementalInvoices(currentForm, invoices).find((x) => x.status !== 'cancelled');
            const balanceInvoice = invoices.find((invoice) => invoice.trackingId === currentForm.id && invoice.installment === 'balance' && invoice.status !== 'cancelled');
            const fullInvoice = invoices.find((invoice) => invoice.trackingId === currentForm.id && invoice.installment === 'full' && invoice.status !== 'cancelled');
            const nextAmount = type === 'supplemental'
              ? Math.max(0, (firstGeneral?.amount || 0) - (firstGeneral ? invoicePaidAmount(firstGeneral.id, payments) : 0))
              : type === 'package_balance'
                ? Math.max(0, (balanceInvoice?.amount ?? balance) - (balanceInvoice ? invoicePaidAmount(balanceInvoice.id, payments) : paidPackage))
                : type === 'full_payment'
                  ? Math.max(0, (fullInvoice?.amount || grandTotal) - (fullInvoice ? invoicePaidAmount(fullInvoice.id, payments) : 0))
                  : paymentDraft.amount;
            setPaymentDraft({ ...paymentDraft, type, invoiceId: type === 'supplemental' ? (firstGeneral?.id || '') : type === 'package_balance' ? (balanceInvoice?.id || '') : type === 'full_payment' ? (fullInvoice?.id || '') : '', amount: nextAmount });
          }}>{availablePaymentTypes.map((x) => <option key={x} value={x}>{paymentTypeLabel(x, th)}</option>)}</select></label>
          {paymentDraft.type === 'ticket_deposit' && addedInvoice1Documents.length > 0 && <label className="field payment-invoice-link"><span>{th ? 'เลือก Invoice 1 ที่รับชำระ' : 'Invoice 1 being paid'}</span><select value={paymentDraft.invoiceId} onChange={(e) => { const invoiceId = e.target.value; const target = addedInvoice1Documents.find((x) => x.id === invoiceId); setPaymentDraft({ ...paymentDraft, invoiceId, amount: target ? Math.max(0, target.amount - invoicePaidAmount(target.id, payments)) : Math.max(0, deposit - ticketPaidAmount(currentForm, payments)) }); }}><option value="">{th ? `Invoice 1 — ผู้เดินทางชุดแรก (${formatTHB(Math.max(0, deposit - ticketPaidAmount(currentForm, payments)), language)})` : `Invoice 1 — original group (${formatTHB(Math.max(0, deposit - ticketPaidAmount(currentForm, payments)), language)})`}</option>{addedInvoice1Documents.filter((x) => x.status !== 'cancelled').map((x, index) => { const addition = activeTravelerAdditions(currentForm).find((entry) => entry.invoiceId === x.id); return <option key={x.id} value={x.id}>{`${th ? 'Invoice 1 ผู้เดินทางเพิ่ม' : 'Invoice 1 added travellers'} ${index + 1} · PNR ${addition?.pnr || '-'} · ${formatTHB(Math.max(0, x.amount - invoicePaidAmount(x.id, payments)), language)}`}</option>; })}</select></label>}
          {paymentDraft.type === 'supplemental' && <label className="field payment-invoice-link"><span>{th ? 'เลือก Invoice เพิ่มเติม' : 'Supplemental invoice'}</span><select value={paymentDraft.invoiceId} onChange={(e) => { const invoiceId = e.target.value; const target = generalSupplementalInvoices(currentForm, invoices).find((x) => x.id === invoiceId); setPaymentDraft({ ...paymentDraft, invoiceId, amount: target ? Math.max(0, target.amount - invoicePaidAmount(target.id, payments)) : 0 }); }}><option value="">{th ? '— เลือก Invoice —' : '— Select invoice —'}</option>{generalSupplementalInvoices(currentForm, invoices).filter((x) => x.status !== 'cancelled').map((x) => <option key={x.id} value={x.id}>{`Invoice ${x.sequenceNumber} · ${x.invoiceNo} · ${formatTHB(Math.max(0, x.amount - invoicePaidAmount(x.id, payments)), language)}`}</option>)}</select></label>}
          <MoneyField label={th ? 'จำนวนเงิน' : 'Amount'} value={paymentDraft.amount} onChange={(amount) => setPaymentDraft({ ...paymentDraft, amount })}/>
          <label className="field"><span>{th ? 'วันที่รับชำระ' : 'Paid date'}</span><input type="date" value={paymentDraft.paidAt} onChange={(e) => setPaymentDraft({ ...paymentDraft, paidAt: e.target.value })}/></label>
          <label className="field"><span>{th ? 'เลขอ้างอิง / ผู้ชำระ' : 'Reference / payer'}</span><input value={paymentDraft.reference} onChange={(e) => setPaymentDraft({ ...paymentDraft, reference: e.target.value })}/></label>
          <label className="field payment-note"><span>{th ? 'หมายเหตุ' : 'Note'}</span><input value={paymentDraft.note} onChange={(e) => setPaymentDraft({ ...paymentDraft, note: e.target.value })}/></label>
          <label className={`payment-slip-picker ${paymentDraft.slipFile ? 'selected' : ''}`}>
            <input key={slipInputKey} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(e) => choosePaymentSlipFile(e.target.files?.[0] || null)}/>
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
              <label className="slip-upload-mini" title={th ? 'แนบหรือเปลี่ยนสลิป' : 'Attach or replace slip'}><input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" disabled={Boolean(paymentBusy)} onChange={(e) => { const file = e.currentTarget.files?.[0] || null; e.currentTarget.value = ''; if (file) void replacePaymentSlip(payment, file); }}/><Upload/><span>{payment.slipPath ? (th ? 'เปลี่ยน' : 'Replace') : (th ? 'แนบ' : 'Attach')}</span></label>
              {payment.slipFileName && <small title={payment.slipFileName}>{payment.slipFileName}</small>}
            </div>
            <button className="danger" disabled={Boolean(paymentBusy)} onClick={() => window.confirm(th ? 'ลบรายการรับชำระนี้และไฟล์สลิป?' : 'Delete this payment and its slip?') && onDeletePayment(payment.id)}><Trash2/></button>
          </div>) : <div className="payment-ledger-empty">{th ? 'ยังไม่มีประวัติรับชำระ' : 'No payment transactions yet'}</div>}
          <div className="payment-ledger-total"><span>{th ? 'รับชำระรวม' : 'Total received'}</span><strong>{formatTHB(totalPaid, language)}</strong><span>{th ? 'ยอดคงเหลือ' : 'Balance'}</span><strong>{formatTHB(Math.max(0, grandTotal - totalPaid), language)}</strong></div>
        </div>
      </WorkflowSection>

      <section className="editor-section supplemental-compact-entry">
        <div className="supplemental-compact-copy">
          <span><ReceiptText/></span>
          <div><h3>{th ? 'รายการเรียกเก็บเพิ่มเติม' : 'Additional charges'}</h3><p>{th ? 'Invoice 3 เป็นต้นไป เช่น อัปเกรดโรงแรม ระบำหน้ากาก รถขนกระเป๋า หรือบริการที่ลูกค้าขอเพิ่มภายหลัง' : 'Invoice 3+ for hotel upgrades, mask dance, baggage vehicle or later customer requests.'}</p></div>
        </div>
        <div className="supplemental-compact-actions">
          {generalSupplementalInvoices(form, invoices).filter((x) => x.status !== 'cancelled').length > 0 && <span>{th ? `${generalSupplementalInvoices(form, invoices).filter((x) => x.status !== 'cancelled').length} Invoice` : `${generalSupplementalInvoices(form, invoices).filter((x) => x.status !== 'cancelled').length} invoice(s)`}</span>}
          <button type="button" className="primary-button" onClick={() => setSupplementalPanelOpen(true)}><Plus/>{th ? 'เพิ่มรายการเรียกเก็บ' : 'Add charge'}</button>
        </div>
      </section>

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
          <div><span>{th ? `ยอดขายแพ็กเกจรวม ${combinedPassengerCount} ท่าน` : `Combined package sales — ${combinedPassengerCount} pax`}</span><b>{formatTHB(combinedPackageTotal, language)}</b></div>
          {generalSupplementalRevenue > 0 && <div className="addition"><span>{th ? 'บวก Invoice เพิ่มเติมทั้งหมด' : 'Add all supplemental invoices'}</span><b>+{formatTHB(generalSupplementalRevenue, language)}</b></div>}
          <div className="land-sales-grand-total"><span>{th ? 'ยอดขายรวมลูกค้าทั้งหมด' : 'Customer grand sales total'}</span><b>{formatTHB(grandTotal, language)}</b></div>
          <div className="deduction"><span>{th ? 'หัก ค่าตั๋วตาม PNR + ภาษีสนามบินทุกชุด' : 'Less airfare + airport tax for every ticket batch'}</span><b>-{formatTHB(combinedTicketAndTaxTotal, language)}</b></div>
          {supplementalNonTicketCosts > 0 && <div className="deduction"><span>{th ? 'หัก ต้นทุนของ Invoice / บริการเพิ่มเติม' : 'Less supplemental service costs'}</span><b>-{formatTHB(supplementalNonTicketCosts, language)}</b></div>}
          <div><span>{th ? 'ยอดขายหลังหักค่าตั๋ว ภาษี และต้นทุนบริการเพิ่ม' : 'Sales after airfare, tax and supplemental costs'}</span><b>{formatTHB(Math.max(0, grandTotal - combinedTicketAndTaxTotal - supplementalNonTicketCosts), language)}</b></div>
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

      <div className="modal-actions tracking-modal-actions">
        <div className="tracking-modal-draft-actions"><button className="ghost-button" onClick={saveDraftNow}><FileText/>{th ? 'บันทึก Draft' : 'Save draft'}</button><button className="ghost-button" onClick={requestClose}>{th ? 'ปิด' : 'Close'}</button></div>
        <button className="primary-button" disabled={!form.opportunityName.trim() || !form.customerName.trim()} onClick={saveAndStay}><BadgeCheck/>{th ? 'บันทึก Customer Journey' : 'Save customer journey'}</button>
      </div>

      {supplementalPanelOpen && <div className="journey-submodal-layer" role="dialog" aria-modal="true" aria-label={th ? 'เรียกเก็บเพิ่มเติม' : 'Additional charge'}>
        <button type="button" className="journey-submodal-backdrop" onClick={() => setSupplementalPanelOpen(false)} aria-label={th ? 'ปิด' : 'Close'}/>
        <section className="journey-submodal-card supplemental-submodal-card">
          <header className="journey-submodal-header">
            <div><span><ReceiptText/></span><div><h2>{th ? 'เรียกเก็บเพิ่มเติม / Invoice 3+' : 'Additional charge / Invoice 3+'}</h2><p>{th ? 'เพิ่มรายการเรียกเก็บภายหลังได้ไม่จำกัด ยอดขายและต้นทุนจะถูกรวมในยอดหลักและ Dashboard อัตโนมัติ' : 'Create unlimited later charges. Revenue and cost are included in the main totals and dashboard automatically.'}</p></div></div>
            <button type="button" onClick={() => setSupplementalPanelOpen(false)} aria-label={th ? 'ปิด' : 'Close'}><X/></button>
          </header>
          <div className="journey-submodal-body">
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
          </div>
        </section>
      </div>}

      {travelerPanelOpen && <div className="journey-submodal-layer" role="dialog" aria-modal="true" aria-label={th ? 'เพิ่มผู้เดินทาง' : 'Add travellers'}>
        <button type="button" className="journey-submodal-backdrop" onClick={() => setTravelerPanelOpen(false)} aria-label={th ? 'ปิด' : 'Close'}/>
        <section className="journey-submodal-card">
          <header className="journey-submodal-header">
            <div><span><Users/></span><div><h2>{th ? 'เพิ่มผู้เดินทางหลังออกตั๋วชุดแรก' : 'Add travellers after the first ticket issue'}</h2><p>{th ? 'ออก Invoice 1 ค่าตั๋วและภาษีของผู้เดินทางชุดใหม่ เมื่อชำระครบจึงส่งเอกสารรวมทุกคนให้ Land และรวมค่าแพ็กเกจทั้งหมดไว้ใน Invoice 2' : 'Issue an additional Invoice 1 for the new group’s airfare and tax. After payment, submit all travellers to land and consolidate every package value into Invoice 2.'}</p></div></div>
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
      <div><span>{th ? 'มูลค่าแพ็กเกจที่เพิ่มสะสม' : 'Added package value'}</span><strong>{formatTHB(travelerAdditionPackageTotal(tracking), language)}</strong></div>
    </div>
    {additions.length > 0 && <div className="traveler-addition-history">
      {additions.map((entry) => {
        const invoice = invoiceMap.get(entry.invoiceId);
        const names = entry.passengerNames.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
        return <article key={entry.id} className={`traveler-addition-card ${entry.status === 'cancelled' || invoice?.status === 'cancelled' ? 'cancelled' : ''}`}>
          <div><span>{entry.addedAt ? formatDate(entry.addedAt, language) : '-'}</span><strong>{th ? `เพิ่ม ${entry.passengerCount} ท่าน` : `Added ${entry.passengerCount} pax`}</strong><small>PNR {entry.pnr || '-'} · {entry.airline || '-'}</small></div>
          <div><span>{th ? 'รายชื่อ' : 'Names'}</span><strong>{names.join(', ') || '-'}</strong><small>{invoice ? `${invoice.invoiceNo} · ${paymentStatusLabel(invoice.status, th)}` : (th ? 'ไม่พบ Invoice' : 'Invoice not found')}</small></div>
          <div><span>{th ? 'แพ็กเกจเพิ่ม / Invoice 1 ค่าตั๋ว' : 'Added package / Invoice 1 ticket'}</span><strong>{formatTHB(travelerAdditionPackageValue(entry, tracking.sellingPricePerPerson), language)}</strong><small>{th ? `Invoice 1 ค่าตั๋ว ${formatTHB(travelerAdditionTicketDepositTotal(entry), language)}` : `Invoice 1 ticket ${formatTHB(travelerAdditionTicketDepositTotal(entry), language)}`}</small></div>
          {invoice && <button type="button" className="secondary-button" onClick={() => onOpen(invoice)}><FileText/>{th ? `เปิด Invoice ${invoice.sequenceNumber}` : `Open Invoice ${invoice.sequenceNumber}`}</button>}
        </article>;
      })}
    </div>}
    <div className="traveler-addition-form traveler-addition-form-open">
      <div className="traveler-addition-form-title"><span><Plus/>{th ? 'ผู้เดินทางเพิ่มหลังออกตั๋วชุดแรก' : 'Travellers added after the first ticket issue'}</span><small>{th ? 'ระบบจะออก Invoice 1 เพิ่มเติมเฉพาะค่าตั๋วและภาษีของชุดใหม่ ส่วนมูลค่าแพ็กเกจของทุกคนจะรวมเรียกเก็บยอดคงเหลือใน Invoice 2' : 'The system issues an additional Invoice 1 for the new group’s airfare and tax; every traveller’s remaining package value is consolidated into Invoice 2.'}</small></div>
      <div className="tracking-form-grid traveler-identity-grid">
        <label className="field"><span>{th ? 'วันที่เพิ่มผู้เดินทาง' : 'Added date'}</span><input type="date" value={draft.addedAt} onChange={(e) => update('addedAt', e.target.value)}/><small>{th ? 'ใช้ได้จนกว่าจะส่งเอกสารทั้งหมดให้ Land ยื่นวีซ่า' : 'Available until all documents are submitted to land for visa processing.'}</small></label>
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
        <AutoTotal label={th ? 'มูลค่าแพ็กเกจผู้เดินทางเพิ่ม' : 'Added package value'} formula={th ? 'แพ็กเกจ + BC + พักเดี่ยว + บริการเพิ่ม (รวมใน Invoice 2)' : 'Package + BC + single room + extras (consolidated into Invoice 2)'} value={calculated.customerChargeTotal} language={language} featured/>
        <AutoTotal label={th ? 'Invoice 1 ที่ต้องเก็บสำหรับผู้เดินทางเพิ่ม' : 'Invoice 1 for added travellers'} formula={th ? 'ราคาตั๋วตาม PNR + ภาษีสนามบิน × จำนวนผู้เดินทางเพิ่ม' : 'PNR airfare + airport tax × added travellers'} value={calculated.ticketDepositTotal || 0} language={language} featured/>
        <AutoTotal label={th ? 'ต้นทุนที่บันทึกตอนนี้' : 'Cost recorded now'} formula={th ? 'ตั๋ว + ภาษี + ต้นทุนบริการอื่น (LAND รวมภายหลัง)' : 'Airfare + tax + other service costs (LAND consolidated later)'} value={calculated.internalCostTotal} language={language}/>
      </div>
      <div className="tracking-form-grid traveler-invoice-meta">
        <label className="field"><span>{th ? 'กำหนดชำระ Invoice' : 'Invoice due date'}</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}/></label>
        <label className="field span-2"><span>{th ? 'หมายเหตุ' : 'Note'}</span><input value={draft.note} onChange={(e) => update('note', e.target.value)}/></label>
      </div>
      <div className="traveler-addition-actions"><button type="button" className="primary-button" disabled={busy || (calculated.ticketDepositTotal || 0) <= 0} onClick={() => void onCreate()}>{busy ? <LoaderCircle className="spin"/> : <ReceiptText/>}{th ? 'บันทึกและออก Invoice 1 — ผู้เดินทางเพิ่ม' : 'Save and issue Invoice 1 — added travellers'}</button></div>
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
  const generalInvoices = generalSupplementalInvoices(tracking, invoices);
  const active = generalInvoices.filter((invoice) => invoice.status !== 'cancelled');
  const draftRevenue = draft.lineItems.reduce((sum, line) => sum + Math.max(1, Number(line.quantity || 1)) * Math.max(0, Number(line.unitPriceTHB || 0)), 0);
  const draftCost = draft.lineItems.reduce((sum, line) => sum + Math.max(1, Number(line.quantity || 1)) * Math.max(0, Number(line.costPerUnitTHB || 0)), 0);
  return <WorkflowSection number="06B" icon={<ReceiptText/>} title={th ? 'Invoice เพิ่มเติม (งวด 3 เป็นต้นไป)' : 'Supplemental invoices (Invoice 3+)'} subtitle={th ? 'ใช้เรียกเก็บบริการที่ลูกค้าขอเพิ่มภายหลัง และยอดจะถูกรวมในยอดขายหลักกับกำไรทันที' : 'Charge later additions; the amount is included in the customer grand total and margin.'}>
    <div className="supplemental-overview">
      <div><span>{th ? 'มูลค่าแพ็กเกจรวมผู้เดินทางทั้งหมด' : 'Package value for all travellers'}</span><strong>{formatTHB(packageSalesTotal(tracking), language)}</strong></div>
      <div><span>{th ? 'Invoice บริการเพิ่มเติมทั่วไป' : 'General supplemental invoices'}</span><strong>{formatTHB(generalSupplementalInvoices(tracking, invoices).reduce((sum, invoice) => sum + invoice.amount, 0), language)}</strong></div>
      <div className="featured"><span>{th ? 'ยอดขายรวมลูกค้า' : 'Customer grand total'}</span><strong>{formatTHB(tracking.grandTotalAmount || tracking.totalAmount, language)}</strong></div>
    </div>
    {generalInvoices.length > 0 && <div className="supplemental-invoice-list">{generalInvoices.map((invoice) => {
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
function MilestoneField({ label, value, onChange, onToday, th, disabled = false, disabledReason = '' }: { label: string; value: string; onChange: (value: string) => void; onToday: () => void; th: boolean; disabled?: boolean; disabledReason?: string }) {
  return <div className={`milestone-field ${value ? 'done' : ''} ${disabled ? 'disabled' : ''}`}><div><span className="milestone-check">{value ? <Check/> : <Hourglass/>}</span><label><b>{label}</b><input type="date" value={value || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)}/>{disabled && disabledReason && <small>{disabledReason}</small>}</label></div><button type="button" disabled={disabled} onClick={onToday}>{value ? (th ? 'อัปเดตวันนี้' : 'Update today') : (th ? 'ทำเครื่องหมายวันนี้' : 'Mark today')}</button></div>;
}
function MoneyField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="field money-input"><span>{label}</span><div><input type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(Number(e.target.value))}/><em>THB</em></div></label>;
}

function AutoTotal({ label, formula, value, language, featured = false }: { label: string; formula: string; value: number; language: 'th' | 'en'; featured?: boolean }) {
  return <div className={`auto-total-card ${featured ? 'featured' : ''}`}><span>{label}</span><strong>{formatTHB(value, language)}</strong><small>{formula}</small></div>;
}

function InvoicePreview({ value, settings, language, payments, invoices, onClose, onSaveInvoice, onSaveTracking }: {
  value: { tracking: CustomerTracking; invoice: PaymentInvoice } | null; settings: GlobalSettings; language: 'th' | 'en'; payments: PaymentTransaction[]; invoices: PaymentInvoice[]; onClose: () => void;
  onSaveInvoice: (item: PaymentInvoice) => Promise<void>; onSaveTracking: (item: CustomerTracking) => Promise<void>;
}) {
  const th = language === 'th';
  const [status, setStatus] = useState<PaymentStageStatus>(value?.invoice.status || 'invoiced');
  const [paymentAccountType, setPaymentAccountType] = useState<PaymentAccountType>(value?.invoice.paymentAccountType || (value?.invoice.installment === 'balance' ? 'owner' : 'company'));
  const [vatEnabled, setVatEnabled] = useState(Boolean(value?.invoice.vatEnabled));
  React.useEffect(() => setStatus(value?.invoice.status || 'invoiced'), [value?.invoice.id, value?.invoice.status]);
  React.useEffect(() => {
    if (!value?.invoice) return;
    setPaymentAccountType(value.invoice.paymentAccountType || (value.invoice.installment === 'balance' ? 'owner' : 'company'));
    setVatEnabled(Boolean(value.invoice.vatEnabled));
  }, [value?.invoice.id, value?.invoice.paymentAccountType, value?.invoice.vatEnabled]);
  if (!value) return null;
  const { tracking, invoice } = value;
  const isDeposit = invoice.installment === 'deposit';
  const isBalance = invoice.installment === 'balance';
  const isFull = invoice.installment === 'full';
  const isSupplemental = invoice.installment === 'supplemental';
  const travelerAddition = (tracking.travelerAdditions || []).find((entry) => entry.invoiceId === invoice.id);
  const isTravelerInvoice1 = Boolean(travelerAddition) || invoice.documentData?.kind === 'ticket_added';
  const isGeneralSupplemental = isSupplemental && !isTravelerInvoice1;
  const isInvoice1 = isDeposit || isTravelerInvoice1;
  const needsPassengerCheck = isInvoice1 || isFull;
  const snapshot = invoice.documentData || null;
  const packageRows = snapshot?.packageRows?.length ? snapshot.packageRows : buildPackageSnapshotRows(tracking);
  const packageTotal = snapshot?.packageTotalTHB ?? packageRows.reduce((sum, row) => sum + row.totalTHB, 0);
  const ticketBatch = snapshot?.ticketBatch || (isTravelerInvoice1 && travelerAddition
    ? buildAddedTicketSnapshot(travelerAddition, Math.max(1, activeTravelerAdditions(tracking).findIndex((entry) => entry.id === travelerAddition.id) + 1))
    : (isDeposit || isFull) ? buildOriginalTicketSnapshot(tracking) : undefined);
  const deductions = snapshot?.deductions || (isBalance ? buildTicketDeductionSnapshot(tracking, invoices, payments) : []);
  const deductedTotal = deductions.reduce((sum, row) => sum + row.amountTHB, 0);
  const balanceDue = snapshot?.balanceDueTHB ?? Math.max(0, packageTotal - deductedTotal);
  const baseSubtotal = isInvoice1
    ? (ticketBatch?.totalDueTHB ?? invoice.subtotalAmount ?? invoice.amount)
    : isBalance
      ? balanceDue
      : isFull
        ? (invoice.subtotalAmount ?? customerGrandTotal(tracking, invoices))
        : (invoice.subtotalAmount ?? invoice.amount);
  const currentVatRate = Math.max(0, Number(invoice.vatRatePercent ?? settings.vatRatePercent ?? 7));
  const fullPaymentVatBase = isFull
    ? Math.max(0, packageTotal - Math.max(0, ticketBatch?.totalDueTHB ?? tracking.depositAmount ?? 0))
    : 0;
  const currentVatAmount = (isBalance || isFull) && vatEnabled
    ? roundMoney((isFull ? fullPaymentVatBase : baseSubtotal) * currentVatRate / 100)
    : 0;
  const amountDue = roundMoney(baseSubtotal + currentVatAmount);
  const selectedAccount = paymentAccountSnapshot(settings, (isBalance || isFull) && vatEnabled ? 'company' : paymentAccountType);
  const paymentDetails = invoice.paymentBankName && invoice.paymentAccountNumber && invoice.paymentAccountType === selectedAccount.paymentAccountType
    ? { ...selectedAccount, paymentBankName: invoice.paymentBankName, paymentAccountName: invoice.paymentAccountName, paymentAccountNumber: invoice.paymentAccountNumber, paymentQrUrl: invoice.paymentQrUrl || selectedAccount.paymentQrUrl }
    : selectedAccount;
  const displaySequence = isInvoice1 || isFull ? 1 : (invoice.sequenceNumber || (isBalance ? 2 : 3));
  const totalTravellers = snapshot?.totalPassengerCount ?? (tracking.passengerCount + addedPassengerCount(tracking));
  const invoicePassengerNames = ticketBatch?.passengerNames || [];

  async function updateStatus(next: PaymentStageStatus) {
    const previousStatus = status;
    setStatus(next);
    const now = new Date().toISOString();
    await onSaveInvoice({ ...invoice, status: next, paidAt: next === 'paid' ? isoToday() : '', updatedAt: now });
    if (isSupplemental) {
      const wasActive = previousStatus !== 'cancelled';
      const willBeActive = next !== 'cancelled';
      const revenueValue = travelerAddition ? travelerAdditionPackageValue(travelerAddition, tracking.sellingPricePerPerson) : invoice.amount;
      const costValue = travelerAddition ? travelerAdditionInternalCostValue(travelerAddition) : invoice.costAmount;
      const revenueDelta = (willBeActive ? revenueValue : 0) - (wasActive ? revenueValue : 0);
      const costDelta = (willBeActive ? costValue : 0) - (wasActive ? costValue : 0);
      const supplementalInvoiceTotal = Math.max(0, (tracking.supplementalInvoiceTotal || 0) + revenueDelta);
      const supplementalCostTotal = Math.max(0, (tracking.supplementalCostTotal || 0) + costDelta);
      const travelerAdditions = (tracking.travelerAdditions || []).map((entry) => entry.invoiceId === invoice.id ? { ...entry, status: next === 'cancelled' ? 'cancelled' as const : 'active' as const } : entry);
      const updatedTracking = { ...tracking, travelerAdditions } as CustomerTracking;
      const projectedInvoices = invoices.map((item) => item.id === invoice.id ? { ...item, status: next, paidAt: next === 'paid' ? isoToday() : item.paidAt } : item);
      const ticketFlowComplete = travelerAddition ? allTicketPaymentsReceived(updatedTracking, projectedInvoices, payments) : false;
      const updatedTrackingFinancials = { ...updatedTracking, supplementalInvoiceTotal, supplementalCostTotal, grandTotalAmount: customerGrandTotal(updatedTracking, projectedInvoices) } as CustomerTracking;
      await onSaveTracking({
        ...updatedTrackingFinancials,
        profitAmount: tracking.landPaidAt && tracking.landPayment > 0 ? realizedGrossProfit(updatedTrackingFinancials, projectedInvoices, tracking.landPayment) : 0,
        nextAction: travelerAddition && next === 'paid'
          ? (ticketFlowComplete
            ? (th ? 'ค่าตั๋วทุกชุดครบแล้ว — ส่ง Passport + รูป + ตั๋วทั้งหมดให้ Land ยื่นวีซ่า' : 'All ticket invoices are complete — submit all passports, photos and tickets to land for visa processing')
            : (th ? 'ติดตามค่าตั๋วของผู้เดินทางชุดอื่นให้ครบก่อนยื่นวีซ่า' : 'Collect the remaining traveller ticket invoices before visa submission'))
          : tracking.nextAction,
        updatedAt: now,
      });
      return;
    }
    await onSaveTracking({
      ...tracking,
      paymentPlan: isFull ? 'full_payment' : (tracking.paymentPlan || 'installments'),
      depositStatus: isFull ? next : isDeposit ? next : tracking.depositStatus,
      balanceStatus: isFull ? next : isBalance ? next : tracking.balanceStatus,
      firstPaymentReceivedAt: (isDeposit || isFull) && next === 'paid' ? (tracking.firstPaymentReceivedAt || isoToday()) : tracking.firstPaymentReceivedAt,
      fullPaymentReceivedAt: (isBalance || isFull) && next === 'paid' ? (tracking.fullPaymentReceivedAt || isoToday()) : tracking.fullPaymentReceivedAt,
      updatedAt: now,
    });
  }

  async function updatePaymentOptions(nextAccountType: PaymentAccountType, nextVatEnabled: boolean) {
    const vatAllowed = isBalance || isFull;
    const forcedAccountType: PaymentAccountType = vatAllowed && nextVatEnabled ? 'company' : nextAccountType;
    setPaymentAccountType(forcedAccountType);
    setVatEnabled(vatAllowed ? nextVatEnabled : false);
    const account = paymentAccountSnapshot(settings, forcedAccountType);
    const vatRatePercent = Math.max(0, Number(invoice.vatRatePercent ?? settings.vatRatePercent ?? 7));
    const vatBase = isFull ? fullPaymentVatBase : baseSubtotal;
    const vatAmount = vatAllowed && nextVatEnabled ? roundMoney(vatBase * vatRatePercent / 100) : 0;
    await onSaveInvoice({
      ...invoice,
      subtotalAmount: baseSubtotal,
      vatEnabled: vatAllowed ? nextVatEnabled : false,
      vatRatePercent,
      vatAmount,
      amount: roundMoney(baseSubtotal + vatAmount),
      ...account,
      updatedAt: new Date().toISOString(),
    });
  }

  const documentTitle = isTravelerInvoice1
    ? (th ? 'Invoice 1 — ผู้เดินทางเพิ่ม' : 'Invoice 1 — added travellers')
    : isFull
      ? (th ? 'Invoice — ชำระเต็มจำนวน' : 'Invoice — Full Payment')
      : isGeneralSupplemental
        ? (th ? `Invoice เพิ่มเติม งวดที่ ${displaySequence}` : `Supplemental Invoice ${displaySequence}`)
        : (th ? `Invoice งวดที่ ${displaySequence}` : `Invoice ${displaySequence}`);

  return <Modal open title={documentTitle} onClose={onClose} wide>
    <div className="invoice-toolbar invoice-toolbar-payment no-print"><button className="ghost-button" onClick={onClose}><ArrowLeft/>{th ? 'กลับ' : 'Back'}</button><label><span>{th ? 'สถานะเอกสาร' : 'Status'}</span><select value={status} onChange={(e) => void updateStatus(e.target.value as PaymentStageStatus)}>{paymentStatuses.map((x) => <option key={x} value={x}>{paymentStatusLabel(x, th)}</option>)}</select></label><label><span>{th ? 'บัญชีรับเงิน' : 'Payment account'}</span><select value={(isBalance || isFull) && vatEnabled ? 'company' : paymentAccountType} disabled={(isBalance || isFull) && vatEnabled} onChange={(e) => void updatePaymentOptions(e.target.value as PaymentAccountType, vatEnabled)}><option value="company">{th ? 'บัญชีบริษัท · กสิกรไทย' : 'Company · Kasikornbank'}</option><option value="owner">{th ? 'บัญชีเจ้านาย · ไทยพาณิชย์' : 'Owner · SCB'}</option></select></label>{(isBalance || isFull) && <label className="invoice-vat-toggle"><span>{th ? 'ใบกำกับภาษี' : 'Tax invoice'}</span><button type="button" className={vatEnabled ? 'active' : ''} onClick={() => void updatePaymentOptions(vatEnabled ? paymentAccountType : 'company', !vatEnabled)}><BadgeCheck/>{vatEnabled ? (th ? `VAT ${formatNumber(currentVatRate, 2)}% เปิดอยู่` : `VAT ${formatNumber(currentVatRate, 2)}% on`) : (th ? 'ไม่บวก VAT' : 'No VAT')}</button></label>}<button className="primary-button" onClick={() => { void printElementAsA4('invoice-print-area', `${invoice.invoiceNo} - ${tracking.customerName}`); }}><Download/>{th ? 'พิมพ์ / บันทึก PDF A4' : 'Print / Save A4 PDF'}</button></div>
    <article className="invoice-sheet journey-invoice-sheet" id="invoice-print-area">
      <header className="invoice-header"><Brand/><div><span>INVOICE</span><h1>{isGeneralSupplemental ? (invoice.title || documentTitle) : (th ? 'เอกสารเรียกเก็บเงิน' : 'Payment Invoice')}</h1><b>{invoice.invoiceNo}</b></div></header><div className="invoice-accent"/>
      <section className="invoice-meta"><div><span>{th ? 'เรียกเก็บจาก' : 'Bill to'}</span><strong>{tracking.customerName}</strong><small>{[tracking.phone, tracking.email].filter(Boolean).join(' · ') || '-'}</small>{tracking.invoiceAddress && <small className="invoice-billing-address">{tracking.invoiceAddress}</small>}</div><div><span>{th ? 'วันที่ออกเอกสาร' : 'Issue date'}</span><strong>{formatDate(invoice.issueDate, language)}</strong><small>{th ? 'ครบกำหนด' : 'Due'}: {invoice.dueDate ? formatDate(invoice.dueDate, language) : '-'}</small></div></section>
      <section className="invoice-trip-summary"><div><span>{th ? 'โปรแกรม' : 'Package'}</span><b>{tracking.packageName || '-'}</b></div><div><span>{th ? 'วันเดินทาง' : 'Travel date'}</span><b>{tracking.travelStartDate ? formatDate(tracking.travelStartDate, language) : '-'}</b></div><div><span>{th ? 'ผู้เดินทางรวม' : 'Total travellers'}</span><b>{totalTravellers} {th ? 'ท่าน' : 'pax'}</b></div></section>

      {isGeneralSupplemental ? <>
        <section className="journey-invoice-package supplemental-document-lines">
          <h3>{th ? `รายการเรียกเก็บเพิ่มเติม — Invoice ${displaySequence}` : `Additional charges — Invoice ${displaySequence}`}</h3>
          <div className="journey-invoice-package-head"><span>{th ? 'รายการ' : 'Passenger / Service'}</span><span>PTC</span><span>QTY</span><span>{th ? 'ราคาต่อหน่วย' : 'Selling / Unit'}</span><span>{th ? 'รวม (บาท)' : 'Total (THB)'}</span></div>
          {invoice.lineItems.map((line) => <div className="journey-invoice-package-row journey-invoice-single-row" key={line.id}><span><b>{line.description}</b></span><span>SRV</span><span>{formatNumber(line.quantity, 0)}</span><span>{formatNumber(line.unitPriceTHB, 2)}</span><span>{formatNumber(line.totalTHB, 2)}</span></div>)}
          <div className="journey-invoice-package-total"><span>{th ? `รวม Invoice ${displaySequence}` : `Invoice ${displaySequence} total`}</span><strong>{formatNumber(invoice.amount, 2)}</strong></div>
        </section>
        <section className="supplemental-grand-summary"><div><span>{th ? 'แพ็กเกจหลัก' : 'Main package'}</span><b>{formatNumber(packageSalesTotal(tracking), 2)}</b></div><div><span>{th ? 'Invoice เพิ่มเติมสะสม' : 'Supplemental invoices'}</span><b>{formatNumber(tracking.supplementalInvoiceTotal || invoice.amount, 2)}</b></div><div className="featured"><span>{th ? 'ยอดขายรวมลูกค้า' : 'Customer grand total'}</span><strong>{formatNumber(tracking.grandTotalAmount || tracking.totalAmount + invoice.amount, 2)}</strong></div></section>
      </> : <>
        <section className="journey-invoice-package invoice-reference-layout">
          <h3>{th ? 'มูลค่าแพ็กเกจทั้งหมด' : 'Full package value'}</h3>
          <div className="journey-invoice-package-head"><span>{th ? 'รายการ' : 'Passenger / Service'}</span><span>PTC</span><span>QTY</span><span>{th ? 'ราคาต่อท่าน' : 'Selling / Pax'}</span><span>{th ? 'รวม (บาท)' : 'Total (THB)'}</span></div>
          {packageRows.map((row) => <div className="journey-invoice-package-row journey-invoice-single-row" key={row.id}><span><b>{th ? row.descriptionTh : row.descriptionEn}</b><small>{th ? row.detailTh : row.detailEn}</small></span><span>{row.ptc}</span><span>{formatNumber(row.quantity, 0)}</span><span>{formatNumber(row.unitPriceTHB, 2)}</span><span>{formatNumber(row.totalTHB, 2)}</span></div>)}
          <div className="journey-invoice-package-total"><span>{th ? 'รวมมูลค่าแพ็กเกจ' : 'Total package value'}</span><strong>{formatNumber(packageTotal, 2)}</strong></div>
        </section>

        {isInvoice1 && ticketBatch && <section className="journey-payment-breakdown invoice-ticket-reference">
          <h3>{th ? 'การชำระงวดที่ 1 — ค่าตั๋วเครื่องบิน' : 'Payment 1 — airfare'}</h3>
          {ticketBatch.fareLines?.length ? <div className="ticket-fare-lines">
            <div className="ticket-fare-head"><span>{th ? 'ชั้นโดยสาร' : 'Cabin'}</span><span>QTY</span><span>{th ? 'ค่าโดยสาร' : 'Fare'}</span><span>{th ? 'ภาษี' : 'Tax'}</span><span>{th ? 'รวม/ท่าน' : 'Total/pax'}</span><span>{th ? 'รวม' : 'Total'}</span></div>
            {ticketBatch.fareLines.map((line) => <div className="ticket-fare-row" key={`${line.ptc || 'ADT'}-${line.cabinClass}`}>
              <span><b>{line.ptc || 'ADT'} · {line.cabinClass}</b><small>{line.ptc === 'CHD' ? (th ? 'เด็ก' : 'Child') : line.cabinClass === 'Business' && th ? 'ผู้โดยสารที่อัปเกรดภายในกรุ๊ป' : ''}</small></span>
              <span>{line.passengerCount}</span>
              <span>{formatNumber(line.farePerPersonTHB, 2)}</span>
              <span>{formatNumber(line.airportTaxPerPersonTHB, 2)}</span>
              <span>{formatNumber(line.totalPerPersonTHB, 2)}</span>
              <span>{formatNumber(line.totalTHB, 2)}</span>
            </div>)}
          </div> : <>
            <div><span>{th ? `ชั้นโดยสาร ${ticketBatch.cabinClass}` : `${ticketBatch.cabinClass} Class`}</span><b>{ticketBatch.passengerCount} {th ? 'ท่าน' : 'pax'}</b></div>
            <div><span>{th ? 'ราคาตั๋วเครื่องบิน / ท่าน' : 'Airfare / pax'}</span><b>{formatNumber(ticketBatch.farePerPersonTHB, 2)}</b></div>
            <div><span>{th ? 'ภาษีสนามบิน / ท่าน' : 'Airport tax / pax'}</span><b>{formatNumber(ticketBatch.airportTaxPerPersonTHB, 2)}</b></div>
            <div><span>{th ? 'รวมค่าตั๋วและภาษี / ท่าน' : 'Airfare and tax / pax'}</span><b>{formatNumber(ticketBatch.farePerPersonTHB + ticketBatch.airportTaxPerPersonTHB, 2)}</b></div>
          </>}
          <div className="journey-payment-due"><span>Total Ticket Due (THB)</span><strong>{formatNumber(ticketBatch.totalDueTHB, 2)}</strong></div>
        </section>}

        {isFull && <section className="journey-payment-breakdown invoice-full-payment-reference">
          <h3>{th ? 'Full Payment — ชำระทั้งหมดครั้งเดียว' : 'Full Payment — one-time collection'}</h3>
          <div><span>{th ? 'มูลค่าแพ็กเกจทั้งหมด' : 'Full package amount'}</span><b>{formatNumber(baseSubtotal, 2)}</b></div>
          {vatEnabled && <div className="invoice-vat-row"><span>{`VAT ${formatNumber(currentVatRate, 2)}%`}</span><b>+{formatNumber(currentVatAmount, 2)}</b></div>}
          <div className="journey-payment-due"><span>{th ? 'Total Due (THB)' : 'Total Due (THB)'}</span><strong>{formatNumber(amountDue, 2)}</strong></div>
        </section>}

        {isBalance && <section className="journey-payment-breakdown invoice-balance-reference">
          <h3>{th ? 'การชำระงวดที่ 2 — ค่าแพ็กเกจส่วนที่เหลือ' : 'Payment 2 — remaining package balance'}</h3>
          <div><span>{th ? 'ค่าแพ็กเกจทั้งหมด' : 'Full package amount'}</span><b>{formatNumber(packageTotal, 2)}</b></div>
          {deductions.map((deduction) => <div key={deduction.id} className="deduction"><span>{th ? deduction.labelTh : deduction.labelEn}{deduction.reference ? ` (${deduction.reference})` : ''}</span><b>-{formatNumber(deduction.amountTHB, 2)}</b></div>)}
          {!deductions.length && <div className="deduction"><span>{th ? 'หัก ค่าตั๋วเครื่องบินที่ชำระแล้ว' : 'Less paid airfare'}</span><b>-{formatNumber(0, 2)}</b></div>}
          <div className="invoice-balance-subtotal"><span>{th ? 'ยอดแพ็กเกจส่วนที่เหลือก่อน VAT' : 'Remaining package balance before VAT'}</span><b>{formatNumber(balanceDue, 2)}</b></div>
          {vatEnabled && <div className="invoice-vat-row"><span>{`VAT ${formatNumber(currentVatRate, 2)}%`}</span><b>+{formatNumber(currentVatAmount, 2)}</b></div>}
          <div className="journey-payment-due"><span>{th ? 'Total Package Due (THB)' : 'Total Package Due (THB)'}</span><strong>{formatNumber(amountDue, 2)}</strong></div>
        </section>}

        {needsPassengerCheck && ticketBatch && <section className="invoice-passenger-check"><div className="invoice-passenger-check-title"><div><Plane/><span>{th ? 'ข้อมูลการจองตั๋วสำหรับตรวจสอบชื่อ' : 'Flight booking details for name verification'}</span></div><b>{th ? ticketBatch.batchLabelTh : ticketBatch.batchLabelEn}</b></div><div className="invoice-passenger-booking-meta"><div><span>PNR</span><strong>{ticketBatch.pnr || '-'}</strong></div><div><span>{th ? 'สายการบิน' : 'Airline'}</span><strong>{ticketBatch.airline || '-'}</strong></div><div><span>{th ? 'จำนวนรายชื่อ' : 'Names listed'}</span><strong>{invoicePassengerNames.length} / {ticketBatch.passengerCount}</strong></div></div><div className="invoice-passenger-alert"><ShieldCheck/><span>{th ? 'กรุณาตรวจสอบชื่อ–นามสกุล คำนำหน้า และการสะกดทุกตัวอักษรให้ตรงกับหนังสือเดินทาง ก่อนยืนยันให้ออกตั๋วเครื่องบิน' : 'Please verify every passenger’s full name, title and spelling against the passport before ticket issuance.'}</span></div><ol className={`invoice-passenger-list ${invoicePassengerNames.length > 6 ? 'two-columns' : ''}`}>{invoicePassengerNames.length ? invoicePassengerNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>) : <li>{th ? 'ยังไม่มีรายชื่อผู้เดินทาง' : 'No passenger names recorded'}</li>}</ol></section>}
      </>}

      <section className="invoice-total invoice-total-readable"><div><span>{isFull ? (th ? 'ยอดชำระทั้งหมด' : 'Full payment due') : isTravelerInvoice1 ? (th ? 'ยอดชำระ Invoice 1 — ผู้เดินทางเพิ่ม' : 'Invoice 1 — added travellers amount due') : isGeneralSupplemental ? (th ? `ยอดชำระ Invoice ${displaySequence}` : `Invoice ${displaySequence} amount due`) : (th ? `ยอดชำระงวดที่ ${displaySequence}` : `Payment ${displaySequence} due`)}</span><strong>THB {formatNumber(amountDue, 2)}</strong></div><aside><span>{th ? 'กำหนดชำระ' : 'PAYMENT DEADLINE'}</span><b>{invoice.dueDate ? formatDate(invoice.dueDate, language) : (th ? 'กรุณากำหนดวันชำระ' : 'Please set a due date')}</b></aside></section>
      <section className="invoice-bank-payment"><div className="invoice-bank-copy"><span>{th ? 'บัญชีสำหรับชำระเงิน' : 'PAYMENT ACCOUNT'}</span><h3>{th ? `กรุณาโอนเงินเข้าบัญชี${paymentDetails.paymentBankName}` : `Please transfer to ${paymentDetails.paymentBankName}`}</h3><dl><div><dt>{th ? 'ชื่อบัญชี' : 'Account name'}</dt><dd>{paymentDetails.paymentAccountName}</dd></div><div><dt>{th ? 'เลขที่บัญชี' : 'Account number'}</dt><dd>{paymentDetails.paymentAccountNumber}</dd></div></dl></div></section>
      <footer className="invoice-footer"><div><strong>OMG Experience Co., Ltd.</strong><span>info@omgexp.com · 02 630 4600 · omgexp.com</span></div><div><span>{th ? 'ผู้จัดทำ' : 'Prepared by'}</span><b>{tracking.salesOwnerName || '-'}</b></div></footer>
    </article>
  </Modal>;
}

