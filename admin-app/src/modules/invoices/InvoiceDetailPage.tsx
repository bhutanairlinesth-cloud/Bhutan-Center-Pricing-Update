import React, { useMemo, useState } from 'react';
import { FileText, LoaderCircle, Paperclip, Plus } from 'lucide-react';
import {
  applyPaymentToBooking,
  InvoicePreview,
  invoiceForPayment,
  invoiceReceivedAmount,
  paymentTypeForInstallment,
  resolvePaymentInvoiceId,
} from '../../components/CustomerTracking';
import { DetailHeader } from '../../shared/DetailHeader';
import { SectionCard, SummaryCard } from '../../shared/ui';
import { StatusBadge, statusLabel } from '../../shared/StatusBadge';
import { CustomerTracking, GlobalSettings, PaymentInvoice, PaymentTransaction } from '../../types';
import { formatDate, formatTHB, makeId } from '../../utils/format';
import { useI18n } from '../../i18n';

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  invoice: PaymentInvoice;
  tracking: CustomerTracking;
  settings: GlobalSettings;
  invoices: PaymentInvoice[];
  payments: PaymentTransaction[];
  onBack: () => void;
  onOpenBooking: (id: string) => void;
  onOpenPayment: (id: string) => void;
  onOpenLinkedInvoice?: (id: string) => void;
  onSaveTracking: (item: CustomerTracking) => Promise<void>;
  onSaveInvoice: (item: PaymentInvoice) => Promise<void>;
  onSavePayment: (item: PaymentTransaction) => Promise<void>;
  onUploadPaymentSlip: (trackingId: string, paymentId: string, file: File) => Promise<{ path: string; fileName: string; mimeType: string; size: number }>;
}

export function InvoiceDetailPage({
  invoice,
  tracking,
  settings,
  invoices,
  payments,
  onBack,
  onOpenBooking,
  onOpenPayment,
  onOpenLinkedInvoice,
  onSaveTracking,
  onSaveInvoice,
  onSavePayment,
  onUploadPaymentSlip,
}: Props) {
  const { language } = useI18n();
  const th = language === 'th';
  const bookingInvoices = useMemo(() => invoices.filter((inv) => inv.trackingId === tracking.id), [invoices, tracking.id]);
  const bookingPayments = useMemo(() => payments.filter((p) => p.trackingId === tracking.id), [payments, tracking.id]);
  const invoicePayments = useMemo(
    () => bookingPayments.filter((p) => invoiceForPayment(p, bookingInvoices)?.id === invoice.id),
    [bookingPayments, bookingInvoices, invoice.id],
  );
  const paid = invoiceReceivedAmount(invoice, bookingPayments, bookingInvoices);
  const outstanding = Math.max(0, invoice.amount - paid);
  const linkedServiceInvoice = bookingInvoices.find((inv) => inv.documentData?.agentVatLinkedInvoiceId === invoice.id && inv.status !== 'cancelled');
  const linkedMainInvoice = invoice.documentData?.agentVatLinkedInvoiceId
    ? bookingInvoices.find((inv) => inv.id === invoice.documentData?.agentVatLinkedInvoiceId)
    : undefined;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [slipInputKey, setSlipInputKey] = useState(0);
  const [paymentDraft, setPaymentDraft] = useState({
    amount: outstanding,
    paidAt: isoToday(),
    reference: '',
    note: '',
    slipFile: null as File | null,
  });

  const paymentType = paymentTypeForInstallment(invoice.installment);
  const pickedInvoiceId = invoice.installment === 'deposit' ? '' : invoice.id;

  async function recordPayment() {
    if (paymentDraft.amount <= 0 || !paymentDraft.paidAt || paymentBusy) return;
    setPaymentBusy(true);
    const now = new Date().toISOString();
    const paymentId = makeId('pay');
    try {
      let slip = { path: '', fileName: '', mimeType: '', size: 0 };
      if (paymentDraft.slipFile) slip = await onUploadPaymentSlip(tracking.id, paymentId, paymentDraft.slipFile);
      const transaction: PaymentTransaction = {
        id: paymentId,
        trackingId: tracking.id,
        invoiceId: resolvePaymentInvoiceId(tracking, bookingInvoices, paymentType, pickedInvoiceId),
        type: paymentType,
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
      const { tracking: nextTracking, invoiceUpdates } = applyPaymentToBooking(tracking, bookingInvoices, bookingPayments, transaction, th);
      for (const updated of invoiceUpdates) await onSaveInvoice(updated);
      await onSaveTracking({ ...nextTracking, updatedAt: now });
      setPaymentFormOpen(false);
      setPaymentDraft({ amount: 0, paidAt: isoToday(), reference: '', note: '', slipFile: null });
      setSlipInputKey((k) => k + 1);
    } finally {
      setPaymentBusy(false);
    }
  }

  return (
    <div className="module-detail-page bo-detail-page">
      <DetailHeader
        breadcrumb={[
          { label: th ? 'ใบแจ้งหนี้' : 'Invoices', onClick: onBack },
          { label: invoice.invoiceNo },
        ]}
        docNo={invoice.invoiceNo}
        title={invoice.title || invoice.invoiceNo}
        subtitle={`${tracking.customerName || '—'} · ${statusLabel(invoice.installment, th)}`}
        status={invoice.status}
        onBack={onBack}
        actions={
          <>
            <button type="button" className="secondary-btn" onClick={() => setPreviewOpen(true)}>
              <FileText size={16} />
              {th ? 'เปิดเอกสาร / พิมพ์' : 'Preview / print'}
            </button>
            <button type="button" className="primary-btn" onClick={() => { setPaymentDraft((d) => ({ ...d, amount: outstanding })); setPaymentFormOpen((v) => !v); }}>
              <Plus size={16} />
              {th ? 'รับชำระ' : 'Record payment'}
            </button>
          </>
        }
      />

      <div className="bo-detail-grid">
        <div className="bo-detail-main">
          <SectionCard title={th ? 'รายการ' : 'Line items'}>
            <p><strong>{invoice.title}</strong></p>
            <p className="bo-muted">{th ? 'งวด' : 'Installment'}: <StatusBadge status={invoice.installment} /></p>
            {invoice.lineItems?.length ? (
              <table className="bo-simple-table">
                <thead>
                  <tr>
                    <th>{th ? 'รายละเอียด' : 'Description'}</th>
                    <th>{th ? 'จำนวน' : 'Qty'}</th>
                    <th>{th ? 'ราคา' : 'Unit'}</th>
                    <th>{th ? 'รวม' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((line) => (
                    <tr key={line.id}>
                      <td>{line.description}</td>
                      <td>{line.quantity}</td>
                      <td>{formatTHB(line.unitPriceTHB, language)}</td>
                      <td>{formatTHB(line.totalTHB, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="bo-muted">{th ? 'ไม่มีรายการแยก — ดูในเอกสารพิมพ์' : 'No line breakdown — see printable document'}</p>
            )}
            <dl className="bo-summary-rows invoice-totals-inline">
              <div className="bo-summary-row"><dt>{th ? 'Subtotal' : 'Subtotal'}</dt><dd>{formatTHB(invoice.subtotalAmount, language)}</dd></div>
              {invoice.vatEnabled && <div className="bo-summary-row"><dt>VAT ({invoice.vatRatePercent}%)</dt><dd>{formatTHB(invoice.vatAmount, language)}</dd></div>}
              <div className="bo-summary-row"><dt>{th ? 'รวม' : 'Total'}</dt><dd className="strong">{formatTHB(invoice.amount, language)}</dd></div>
            </dl>
          </SectionCard>

          {paymentFormOpen && (
            <SectionCard title={th ? 'บันทึกรับชำระ' : 'Record payment'}>
              <div className="payment-entry-form payment-entry-form-with-slip">
                <label className="field"><span>{th ? 'จำนวนเงิน' : 'Amount'}</span><input type="number" min="0" step="0.01" value={paymentDraft.amount} onChange={(e) => setPaymentDraft({ ...paymentDraft, amount: Number(e.target.value) })}/></label>
                <label className="field"><span>{th ? 'วันที่รับชำระ' : 'Paid date'}</span><input type="date" value={paymentDraft.paidAt} onChange={(e) => setPaymentDraft({ ...paymentDraft, paidAt: e.target.value })}/></label>
                <label className="field"><span>{th ? 'อ้างอิง' : 'Reference'}</span><input value={paymentDraft.reference} onChange={(e) => setPaymentDraft({ ...paymentDraft, reference: e.target.value })}/></label>
                <label className="field payment-note"><span>{th ? 'หมายเหตุ' : 'Note'}</span><input value={paymentDraft.note} onChange={(e) => setPaymentDraft({ ...paymentDraft, note: e.target.value })}/></label>
                <label className={`payment-slip-picker ${paymentDraft.slipFile ? 'selected' : ''}`}>
                  <input key={slipInputKey} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(e) => setPaymentDraft({ ...paymentDraft, slipFile: e.target.files?.[0] || null })}/>
                  <span><Paperclip/></span>
                  <div><b>{paymentDraft.slipFile ? paymentDraft.slipFile.name : (th ? 'แนบสลิป' : 'Attach slip')}</b></div>
                </label>
                <button type="button" className="primary-button payment-add-button" disabled={paymentDraft.amount <= 0 || paymentBusy} onClick={() => { void recordPayment(); }}>
                  {paymentBusy ? <LoaderCircle className="spin"/> : <Plus/>}{th ? 'บันทึกรับชำระ' : 'Save payment'}
                </button>
              </div>
            </SectionCard>
          )}

          <SectionCard title={th ? 'การรับชำระของใบนี้' : 'Payments for this invoice'}>
            {invoicePayments.length ? (
              <table className="bo-simple-table">
                <thead>
                  <tr>
                    <th>{th ? 'ใบเสร็จ' : 'Receipt'}</th>
                    <th>{th ? 'วันที่' : 'Date'}</th>
                    <th>{th ? 'อ้างอิง' : 'Reference'}</th>
                    <th>{th ? 'ยอด' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicePayments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <button type="button" className="bo-breadcrumb-link mono" onClick={() => onOpenPayment(p.id)}>
                          {p.receiptNo || '—'}
                        </button>
                      </td>
                      <td>{formatDate(p.paidAt, language)}</td>
                      <td>{p.reference || p.note || '—'}</td>
                      <td>{formatTHB(p.amount, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="bo-muted">{th ? 'ยังไม่มีการรับชำระ' : 'No payments yet'}</p>
            )}
          </SectionCard>
        </div>

        <aside className="bo-detail-rail">
          <SummaryCard
            title={th ? 'ยอด' : 'Amounts'}
            rows={[
              { label: th ? 'ยอด Invoice' : 'Invoice total', value: formatTHB(invoice.amount, language) },
              { label: th ? 'รับแล้ว' : 'Paid', value: formatTHB(paid, language) },
              { label: th ? 'คงเหลือ' : 'Outstanding', value: formatTHB(outstanding, language), strong: true },
              { label: th ? 'ครบกำหนด' : 'Due date', value: invoice.dueDate ? formatDate(invoice.dueDate, language) : '—' },
            ]}
          />
          <SummaryCard
            title={th ? 'เอกสารที่เกี่ยวข้อง' : 'Related documents'}
            rows={[
              {
                label: 'BK',
                value: (
                  <button type="button" className="bo-breadcrumb-link mono" onClick={() => onOpenBooking(tracking.id)}>
                    {tracking.bookingNo || '—'}
                  </button>
                ),
              },
              ...(tracking.sourceQuotationNo ? [{ label: 'QT', value: tracking.sourceQuotationNo }] : []),
              ...(linkedMainInvoice ? [{
                label: th ? 'INV หลัก' : 'Main INV',
                value: (
                  <button type="button" className="bo-breadcrumb-link mono" onClick={() => onOpenLinkedInvoice?.(linkedMainInvoice.id)}>
                    {linkedMainInvoice.invoiceNo}
                  </button>
                ),
              }] : []),
              ...(linkedServiceInvoice ? [{
                label: th ? 'INV ค่าบริการ' : 'Service INV',
                value: (
                  <button type="button" className="bo-breadcrumb-link mono" onClick={() => onOpenLinkedInvoice?.(linkedServiceInvoice.id)}>
                    {linkedServiceInvoice.invoiceNo}
                  </button>
                ),
              }] : []),
            ]}
          />
        </aside>
      </div>

      <InvoicePreview
        value={previewOpen ? { tracking, invoice } : null}
        settings={settings}
        language={language}
        payments={bookingPayments}
        invoices={bookingInvoices}
        onClose={() => setPreviewOpen(false)}
        onOpenInvoice={(inv) => onOpenLinkedInvoice?.(inv.id)}
        onSaveInvoice={onSaveInvoice}
        onSaveTracking={onSaveTracking}
      />
    </div>
  );
}
