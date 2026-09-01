import React, { useMemo, useState } from 'react';
import {
  ArrowRight, Banknote, CalendarDays, CheckCircle2, CircleDollarSign, Clock3,
  Coins, FileClock, Landmark, Plane, ReceiptText, TrendingUp, WalletCards,
} from 'lucide-react';
import { CustomerTracking, PaymentInvoice, PaymentTransaction, TravelerAddition } from '../types';
import { formatDate, formatNumber, formatTHB } from '../utils/format';
import { useI18n } from '../i18n';

interface Props {
  trackings: CustomerTracking[];
  invoices: PaymentInvoice[];
  payments: PaymentTransaction[];
  onOpenTracking: () => void;
}

interface JobMetrics {
  tracking: CustomerTracking;
  sales: number;
  airfare: number;
  land: number;
  otherCosts: number;
  totalCosts: number;
  profit: number;
  received: number;
  outstanding: number;
  saleDate: string;
  closedDate: string;
  closed: boolean;
}

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function positive(value: unknown) {
  return Math.max(0, Number(value || 0));
}

function activeAdditions(item: CustomerTracking) {
  return (item.travelerAdditions || []).filter((entry) => entry.status !== 'cancelled');
}

function additionPackageSales(entry: TravelerAddition, fallbackPrice: number) {
  const pax = positive(entry.passengerCount);
  const packagePrice = positive(entry.packagePricePerPerson || fallbackPrice);
  const business = positive(entry.businessUpgradeCount) * positive(entry.businessUpgradePerPerson);
  const single = positive(entry.singleRoomCount) * positive(entry.singleSupplementPerPerson);
  const extras = (entry.extraLines || []).reduce((sum, line) => sum + positive(line.totalTHB || positive(line.quantity) * positive(line.unitPriceTHB)), 0);
  return pax * packagePrice + business + single + extras;
}

function additionAirfare(entry: TravelerAddition) {
  return positive(entry.passengerCount) * (positive(entry.ticketPricePerPerson) + positive(entry.airportTaxPerPerson));
}

function additionOtherCost(entry: TravelerAddition) {
  const single = positive(entry.singleRoomCount) * positive(entry.singleSupplementCostPerPerson);
  const extras = (entry.extraLines || []).reduce((sum, line) => sum + positive(line.totalCostTHB || positive(line.quantity) * positive(line.costPerUnitTHB)), 0);
  return single + extras;
}

function activeInvoicesFor(trackingId: string, invoices: PaymentInvoice[]) {
  return invoices.filter((invoice) => invoice.trackingId === trackingId && invoice.status !== 'cancelled');
}

function travelerInvoiceIds(item: CustomerTracking) {
  return new Set(activeAdditions(item).map((entry) => entry.invoiceId).filter(Boolean));
}

function generalSupplementalInvoices(item: CustomerTracking, invoices: PaymentInvoice[]) {
  const travelerIds = travelerInvoiceIds(item);
  return activeInvoicesFor(item.id, invoices).filter((invoice) => invoice.installment === 'supplemental' && !travelerIds.has(invoice.id));
}

function totalReceived(trackingId: string, payments: PaymentTransaction[]) {
  return payments.filter((payment) => payment.trackingId === trackingId).reduce((sum, payment) => {
    if (payment.type === 'refund') return sum - Math.abs(positive(payment.amount));
    return sum + positive(payment.amount);
  }, 0);
}

function metricFor(item: CustomerTracking, invoices: PaymentInvoice[], payments: PaymentTransaction[]): JobMetrics {
  const additions = activeAdditions(item);
  const originalSales = positive(item.totalAmount);
  const additionSales = additions.reduce((sum, entry) => sum + additionPackageSales(entry, positive(item.sellingPricePerPerson)), 0);
  const generalInvoices = generalSupplementalInvoices(item, invoices);
  const supplementalSales = generalInvoices.reduce((sum, invoice) => sum + positive(invoice.amount), 0);
  const computedSales = originalSales + additionSales + supplementalSales;
  const sales = Math.max(computedSales, positive(item.grandTotalAmount));

  const originalAirfare = positive(item.ticketAmount) + positive(item.airportTaxAmount);
  const additionAirfareTotal = additions.reduce((sum, entry) => sum + additionAirfare(entry), 0);
  const airfare = originalAirfare + additionAirfareTotal;
  const land = positive(item.landPayment);
  const additionOtherCosts = additions.reduce((sum, entry) => sum + additionOtherCost(entry), 0);
  const supplementalOtherCosts = generalInvoices.reduce((sum, invoice) => sum + positive(invoice.costAmount), 0);
  const otherCosts = additionOtherCosts + supplementalOtherCosts;
  const totalCosts = airfare + land + otherCosts;
  const profit = sales - totalCosts;
  const received = totalReceived(item.id, payments);
  const closed = Boolean(item.closedAt) || item.status === 'completed';

  return {
    tracking: item,
    sales,
    airfare,
    land,
    otherCosts,
    totalCosts,
    profit,
    received,
    outstanding: Math.max(0, sales - received),
    saleDate: item.bookingConfirmedAt || item.quotationSentAt || item.createdAt || item.travelStartDate,
    closedDate: item.closedAt || item.updatedAt || item.travelEndDate,
    closed,
  };
}

function yearOf(value: string) {
  if (!value) return 0;
  const year = Number(value.slice(0, 4));
  return Number.isFinite(year) ? year : 0;
}

function monthOf(value: string) {
  if (!value) return -1;
  const month = Number(value.slice(5, 7)) - 1;
  return month >= 0 && month <= 11 ? month : -1;
}

function journeyLabel(item: CustomerTracking, th: boolean) {
  if (item.closedAt || item.status === 'completed') return th ? 'ปิดจบงาน' : 'Closed';
  if (item.landPaidAt) return th ? 'ชำระ LAND แล้ว' : 'LAND paid';
  if (item.fullPaymentReceivedAt) return th ? 'ชำระครบแล้ว' : 'Fully paid';
  if (item.visaReceivedAt) return th ? 'ได้รับวีซ่าแล้ว' : 'Visa received';
  if (item.documentsSentToLandAt) return th ? 'ส่งเอกสารให้ LAND แล้ว' : 'Sent to LAND';
  if (item.firstPaymentReceivedAt) return th ? 'รับชำระค่าตั๋วแล้ว' : 'Ticket payment received';
  if (item.invoice1SentAt) return th ? 'ออก Invoice 1 แล้ว' : 'Invoice 1 issued';
  if (item.bookingConfirmedAt) return th ? 'ยืนยันการจอง' : 'Booking confirmed';
  if (item.quotationSentAt) return th ? 'ส่งใบเสนอราคา' : 'Quotation sent';
  return th ? 'กำลังติดตาม' : 'Following up';
}

export function SalesDashboard({ trackings, invoices, payments, onOpenTracking }: Props) {
  const { language } = useI18n();
  const th = language === 'th';
  const metrics = useMemo(
    () => trackings.filter((item) => item.status !== 'lost').map((item) => metricFor(item, invoices, payments)),
    [trackings, invoices, payments],
  );
  const nowYear = new Date().getFullYear();
  const years = useMemo(() => {
    const set = new Set<number>([nowYear]);
    metrics.forEach((item) => {
      const sale = yearOf(item.saleDate);
      const closed = yearOf(item.closedDate);
      if (sale) set.add(sale);
      if (closed) set.add(closed);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [metrics, nowYear]);
  const [year, setYear] = useState(years[0] || nowYear);

  const soldThisYear = metrics.filter((item) => yearOf(item.saleDate) === year);
  const openThisYear = soldThisYear.filter((item) => !item.closed);
  const closedThisYear = metrics.filter((item) => item.closed && yearOf(item.closedDate) === year);

  const allSales = soldThisYear.reduce((sum, item) => sum + item.sales, 0);
  const openSales = openThisYear.reduce((sum, item) => sum + item.sales, 0);
  const closedSales = closedThisYear.reduce((sum, item) => sum + item.sales, 0);
  const closedAirfare = closedThisYear.reduce((sum, item) => sum + item.airfare, 0);
  const closedLand = closedThisYear.reduce((sum, item) => sum + item.land, 0);
  const closedOther = closedThisYear.reduce((sum, item) => sum + item.otherCosts, 0);
  const closedExpenses = closedAirfare + closedLand + closedOther;
  const closedProfit = closedThisYear.reduce((sum, item) => sum + item.profit, 0);
  const allAirfare = soldThisYear.reduce((sum, item) => sum + item.airfare, 0);
  const allLand = soldThisYear.reduce((sum, item) => sum + item.land, 0);
  const allOther = soldThisYear.reduce((sum, item) => sum + item.otherCosts, 0);
  const allExpenses = allAirfare + allLand + allOther;
  const openReceived = openThisYear.reduce((sum, item) => sum + item.received, 0);
  const openOutstanding = openThisYear.reduce((sum, item) => sum + item.outstanding, 0);

  const months = (th ? MONTHS_TH : MONTHS_EN).map((label, index) => {
    const sold = soldThisYear.filter((item) => monthOf(item.saleDate) === index);
    const closed = closedThisYear.filter((item) => monthOf(item.closedDate) === index);
    return {
      label,
      sales: sold.reduce((sum, item) => sum + item.sales, 0),
      closedSales: closed.reduce((sum, item) => sum + item.sales, 0),
      expenses: closed.reduce((sum, item) => sum + item.totalCosts, 0),
      profit: closed.reduce((sum, item) => sum + item.profit, 0),
      count: sold.length,
      closedCount: closed.length,
    };
  });
  const maxMonthValue = Math.max(1, ...months.flatMap((month) => [month.sales, month.expenses, Math.max(0, month.profit)]));

  return <div className="sales-dashboard admin-stack">
    <section className="sales-dashboard-head">
      <div>
        <span className="eyebrow"><TrendingUp/> {th ? 'ภาพรวมธุรกิจ' : 'BUSINESS OVERVIEW'}</span>
        <h2>{th ? 'Dashboard ยอดขาย ค่าใช้จ่าย และกำไร' : 'Sales, expense and profit dashboard'}</h2>
        <p>{th ? 'กำไรจะแสดงเฉพาะงานที่ปิดจบแล้วเท่านั้น งานที่ยังดำเนินการจะแสดงเป็นยอดขายและยอดคงเหลือ' : 'Profit is recognized only after a customer case is closed. Open work shows sales and outstanding amounts only.'}</p>
      </div>
      <div className="dashboard-head-actions">
        <label><span>{th ? 'ปีรายงาน' : 'Report year'}</span><select value={year} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setYear(Number(event.target.value))}>{years.map((item) => <option key={item} value={item}>{th ? item + 543 : item}</option>)}</select></label>
        <button className="primary-button" onClick={onOpenTracking}><ReceiptText/>{th ? 'เปิดติดตามลูกค้า' : 'Open customer tracking'}<ArrowRight/></button>
      </div>
    </section>

    <section className="dashboard-kpi-grid">
      <Kpi icon={CircleDollarSign} tone="green" label={th ? 'ยอดขายที่สร้างในปี' : 'Sales booked this year'} value={formatTHB(allSales, language)} note={`${soldThisYear.length} ${th ? 'งาน' : 'jobs'}`}/>
      <Kpi icon={Plane} tone="blue" label={th ? 'ค่าตั๋วและภาษีทั้งหมด' : 'Total airfare and tax'} value={formatTHB(allAirfare, language)} note={th ? 'รวมผู้เดินทางทุกชุด' : 'All passenger batches'}/>
      <Kpi icon={Landmark} tone="purple" label={th ? 'ค่า LAND ที่บันทึกแล้ว' : 'Recorded LAND payments'} value={formatTHB(allLand, language)} note={th ? 'แปลงเป็นเงินบาท ณ วันโอน' : 'THB at actual transfer rate'}/>
      <Kpi icon={WalletCards} tone="coral" label={th ? 'จ่ายออก / ต้นทุนรวม' : 'Total recorded expenses'} value={formatTHB(allExpenses, language)} note={th ? 'ตั๋ว + LAND + ต้นทุนอื่น' : 'Airfare + LAND + other costs'}/>
      <Kpi icon={Clock3} tone="amber" label={th ? 'ยอดงานที่ยังไม่ปิด' : 'Open job value'} value={formatTHB(openSales, language)} note={`${openThisYear.length} ${th ? 'งาน · ยังไม่รับรู้กำไร' : 'jobs · profit not recognized'}`}/>
      <Kpi icon={Coins} tone="emerald" label={th ? 'กำไรจริงจากงานที่ปิดแล้ว' : 'Realized profit'} value={formatTHB(closedProfit, language)} note={closedSales > 0 ? `${formatNumber((closedProfit / closedSales) * 100, 1)}% ${th ? 'ของยอดขายปิดงาน' : 'closed-job margin'}` : (th ? 'ยังไม่มีงานปิดในปีนี้' : 'No closed jobs this year')}/>
    </section>

    <section className="dashboard-two-column dashboard-finance-row">
      <div className="dashboard-panel expense-breakdown-panel">
        <div className="dashboard-panel-head"><div><span>{th ? 'ค่าใช้จ่ายที่บันทึกในปี' : 'YEAR EXPENSE BREAKDOWN'}</span><h3>{formatTHB(allExpenses, language)}</h3></div><WalletCards/></div>
        <div className="expense-breakdown-list">
          <ExpenseRow icon={Plane} label={th ? 'ค่าตั๋วเครื่องบินและภาษี' : 'Airfare and airport tax'} value={allAirfare} total={allExpenses} language={language}/>
          <ExpenseRow icon={Landmark} label={th ? 'ค่า LAND ที่โอนจริง' : 'Actual LAND payment'} value={allLand} total={allExpenses} language={language}/>
          <ExpenseRow icon={ReceiptText} label={th ? 'ต้นทุนบริการเพิ่มเติม' : 'Other service costs'} value={allOther} total={allExpenses} language={language}/>
        </div>
        <div className="dashboard-profit-equation"><span>{th ? 'ยอดขายปิดงาน' : 'Closed sales'}<b>{formatTHB(closedSales, language)}</b></span><i>−</i><span>{th ? 'จ่ายออกทั้งหมด' : 'Total expenses'}<b>{formatTHB(closedExpenses, language)}</b></span><i>=</i><span className="profit"><em>{th ? 'กำไรจริง' : 'Realized profit'}</em><strong>{formatTHB(closedProfit, language)}</strong></span></div>
      </div>
      <div className="dashboard-panel open-cash-panel">
        <div className="dashboard-panel-head"><div><span>{th ? 'กระแสเงินของงานที่ยังดำเนินการ' : 'OPEN-WORK CASH FLOW'}</span><h3>{formatTHB(openSales, language)}</h3></div><FileClock/></div>
        <div className="open-cash-grid"><div><small>{th ? 'รับชำระแล้ว' : 'Received'}</small><strong>{formatTHB(openReceived, language)}</strong></div><div><small>{th ? 'ยอดคงเหลือเรียกเก็บ' : 'Outstanding'}</small><strong>{formatTHB(openOutstanding, language)}</strong></div><div><small>{th ? 'ค่าตั๋วที่บันทึกแล้ว' : 'Recorded airfare'}</small><strong>{formatTHB(openThisYear.reduce((sum, item) => sum + item.airfare, 0), language)}</strong></div><div><small>{th ? 'LAND ที่บันทึกแล้ว' : 'Recorded LAND'}</small><strong>{formatTHB(openThisYear.reduce((sum, item) => sum + item.land, 0), language)}</strong></div></div>
        <div className="dashboard-info-note"><Clock3/><span>{th ? 'ส่วนนี้ยังไม่แสดงกำไร แม้ระบบจะมีต้นทุนบางส่วนแล้ว กำไรจะย้ายไปส่วน “กำไรจริง” เมื่อกดปิดจบงานเท่านั้น' : 'Profit is intentionally hidden here even when some costs are known. It moves to realized profit only after the case is closed.'}</span></div>
      </div>
    </section>

    <section className="dashboard-panel monthly-dashboard-panel">
      <div className="dashboard-panel-head"><div><span>{th ? 'แยกตามเดือน' : 'MONTHLY VIEW'}</span><h3>{th ? `ยอดขายและกำไร ปี ${year + 543}` : `Sales and profit ${year}`}</h3></div><CalendarDays/></div>
      <div className="monthly-legend"><span><i className="sales"/>{th ? 'ยอดขายที่สร้าง' : 'Booked sales'}</span><span><i className="expense"/>{th ? 'ค่าใช้จ่ายงานปิด' : 'Closed expenses'}</span><span><i className="profit"/>{th ? 'กำไรงานปิด' : 'Closed profit'}</span></div>
      <div className="monthly-chart">{months.map((month) => <div className="month-chart-row" key={month.label}>
        <span className="month-label">{month.label}</span>
        <div className="month-bars">
          <div className="month-bar sales" style={{ width: `${Math.max(month.sales > 0 ? 2 : 0, (month.sales / maxMonthValue) * 100)}%` }}><span>{month.sales > 0 ? formatNumber(month.sales, 0) : ''}</span></div>
          <div className="month-bar expense" style={{ width: `${Math.max(month.expenses > 0 ? 2 : 0, (month.expenses / maxMonthValue) * 100)}%` }}><span>{month.expenses > 0 ? formatNumber(month.expenses, 0) : ''}</span></div>
          <div className="month-bar profit" style={{ width: `${Math.max(month.profit > 0 ? 2 : 0, (Math.max(0, month.profit) / maxMonthValue) * 100)}%` }}><span>{month.profit > 0 ? formatNumber(month.profit, 0) : ''}</span></div>
        </div>
        <span className="month-count">{month.count} / {month.closedCount}</span>
      </div>)}</div>
      <div className="monthly-chart-foot"><span>{th ? 'ตัวเลขท้ายแถว: งานขาย / งานปิด' : 'End values: booked jobs / closed jobs'}</span></div>
    </section>

    <section className="dashboard-panel dashboard-table-panel">
      <div className="dashboard-panel-head"><div><span>{th ? 'รายการปิดจบแล้ว' : 'CLOSED JOBS'}</span><h3>{th ? 'กำไรจริงรายลูกค้า' : 'Realized profit by customer'}</h3></div><CheckCircle2/></div>
      {closedThisYear.length === 0 ? <DashboardEmpty text={th ? 'ยังไม่มีงานที่ปิดจบในปีนี้' : 'No closed jobs in this year'}/> : <div className="dashboard-table-scroll"><table className="dashboard-table"><thead><tr><th>{th ? 'ลูกค้า / โปรแกรม' : 'Customer / package'}</th><th>{th ? 'ปิดงาน' : 'Closed'}</th><th>{th ? 'ยอดขาย' : 'Sales'}</th><th>{th ? 'ตั๋ว+ภาษี' : 'Airfare+tax'}</th><th>LAND</th><th>{th ? 'ต้นทุนอื่น' : 'Other costs'}</th><th>{th ? 'กำไรจริง' : 'Profit'}</th></tr></thead><tbody>{closedThisYear.sort((a, b) => (b.closedDate || '').localeCompare(a.closedDate || '')).map((item) => <tr key={item.tracking.id}><td><b>{item.tracking.customerName || item.tracking.opportunityName}</b><small>{item.tracking.packageName} · {item.tracking.passengerCount + activeAdditions(item.tracking).reduce((sum, entry) => sum + positive(entry.passengerCount), 0)} {th ? 'ท่าน' : 'pax'}</small></td><td>{formatDate(item.closedDate, language)}</td><td>{formatTHB(item.sales, language)}</td><td>{formatTHB(item.airfare, language)}</td><td>{formatTHB(item.land, language)}</td><td>{formatTHB(item.otherCosts, language)}</td><td className={item.profit >= 0 ? 'positive' : 'negative'}><strong>{formatTHB(item.profit, language)}</strong></td></tr>)}</tbody></table></div>}
    </section>

    <section className="dashboard-panel dashboard-table-panel open-jobs-panel">
      <div className="dashboard-panel-head"><div><span>{th ? 'รายการที่ยังไม่ปิดจบ' : 'OPEN JOBS'}</span><h3>{th ? 'ยอดขายคงค้างและงานถัดไป' : 'Open sales and next actions'}</h3></div><Clock3/></div>
      {openThisYear.length === 0 ? <DashboardEmpty text={th ? 'ไม่มีงานค้างในปีนี้' : 'No open jobs in this year'}/> : <div className="dashboard-table-scroll"><table className="dashboard-table"><thead><tr><th>{th ? 'ลูกค้า / โปรแกรม' : 'Customer / package'}</th><th>{th ? 'สถานะ' : 'Status'}</th><th>{th ? 'วันเดินทาง' : 'Travel date'}</th><th>{th ? 'ยอดขาย' : 'Sales'}</th><th>{th ? 'รับแล้ว' : 'Received'}</th><th>{th ? 'คงเหลือ' : 'Outstanding'}</th><th>{th ? 'งานถัดไป' : 'Next action'}</th></tr></thead><tbody>{openThisYear.sort((a, b) => (a.tracking.travelStartDate || '9999').localeCompare(b.tracking.travelStartDate || '9999')).map((item) => <tr key={item.tracking.id}><td><b>{item.tracking.customerName || item.tracking.opportunityName}</b><small>{item.tracking.packageName} · {item.tracking.passengerCount + activeAdditions(item.tracking).reduce((sum, entry) => sum + positive(entry.passengerCount), 0)} {th ? 'ท่าน' : 'pax'}</small></td><td><span className="dashboard-status-pill">{journeyLabel(item.tracking, th)}</span></td><td>{formatDate(item.tracking.travelStartDate, language)}</td><td>{formatTHB(item.sales, language)}</td><td>{formatTHB(item.received, language)}</td><td><strong>{formatTHB(item.outstanding, language)}</strong></td><td><b>{item.tracking.nextAction || (th ? 'ตรวจสอบขั้นตอนถัดไป' : 'Review next step')}</b><small>{item.tracking.nextActionDueDate ? formatDate(item.tracking.nextActionDueDate, language) : (th ? 'ยังไม่กำหนด Deadline' : 'No deadline')}</small></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function Kpi({ icon: Icon, tone, label, value, note }: { icon: React.ComponentType<any>; tone: string; label: string; value: string; note: string }) {
  return <article className={`dashboard-kpi ${tone}`}><span className="dashboard-kpi-icon"><Icon/></span><div><small>{label}</small><strong>{value}</strong><em>{note}</em></div></article>;
}

function ExpenseRow({ icon: Icon, label, value, total, language }: { icon: React.ComponentType<any>; label: string; value: number; total: number; language: 'th' | 'en' }) {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return <div className="expense-row"><span className="expense-row-icon"><Icon/></span><div><span><b>{label}</b><strong>{formatTHB(value, language)}</strong></span><div><i style={{ width: `${percent}%` }}/></div></div></div>;
}

function DashboardEmpty({ text }: { text: string }) {
  return <div className="dashboard-empty"><Banknote/><span>{text}</span></div>;
}
