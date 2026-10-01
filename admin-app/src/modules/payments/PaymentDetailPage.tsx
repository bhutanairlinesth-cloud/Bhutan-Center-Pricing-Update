import React, { useMemo } from 'react';
import { ExternalLink, LoaderCircle } from 'lucide-react';
import { invoiceForPayment, paymentTypeLabel } from '../../components/CustomerTracking';
import { DetailHeader } from '../../shared/DetailHeader';
import { SectionCard, SummaryCard } from '../../shared/ui';
import { CustomerTracking, PaymentInvoice, PaymentTransaction } from '../../types';
import { formatDate, formatTHB } from '../../utils/format';
import { useI18n } from '../../i18n';

interface Props {
  payment: PaymentTransaction;
  tracking: CustomerTracking;
  invoices: PaymentInvoice[];
  onBack: () => void;
  onOpenBooking: (id: string) => void;
  onOpenInvoice: (id: string) => void;
  onGetPaymentSlipUrl: (path: string) => Promise<string>;
}

export function PaymentDetailPage({
  payment,
  tracking,
  invoices,
  onBack,
  onOpenBooking,
  onOpenInvoice,
  onGetPaymentSlipUrl,
}: Props) {
  const { language } = useI18n();
  const th = language === 'th';
  const bookingInvoices = useMemo(() => invoices.filter((inv) => inv.trackingId === tracking.id), [invoices, tracking.id]);
  const linkedInvoice = invoiceForPayment(payment, bookingInvoices);
  const [slipBusy, setSlipBusy] = React.useState(false);

  async function viewSlip() {
    if (!payment.slipPath || slipBusy) return;
    setSlipBusy(true);
    try {
      const url = await onGetPaymentSlipUrl(payment.slipPath);
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.opener = null;
        previewWindow.location.href = url;
      } else {
        window.alert(th ? 'เบราว์เซอร์บล็อกหน้าต่างดูสลิป' : 'Pop-up blocked — allow pop-ups to view the slip.');
      }
    } finally {
      setSlipBusy(false);
    }
  }

  return (
    <div className="module-detail-page bo-detail-page">
      <DetailHeader
        breadcrumb={[
          { label: th ? 'รับชำระเงิน' : 'Payments', onClick: onBack },
          { label: payment.receiptNo || payment.id.slice(0, 8) },
        ]}
        docNo={payment.receiptNo || '—'}
        title={paymentTypeLabel(payment.type, th)}
        subtitle={tracking.customerName || '—'}
        onBack={onBack}
      />

      <div className="bo-detail-grid">
        <div className="bo-detail-main">
          <SectionCard title={th ? 'รายละเอียดการรับชำระ' : 'Payment details'}>
            <dl className="bo-summary-rows">
              <div className="bo-summary-row"><dt>{th ? 'ยอด' : 'Amount'}</dt><dd className="strong">{formatTHB(payment.amount, language)}</dd></div>
              <div className="bo-summary-row"><dt>{th ? 'วันที่' : 'Date'}</dt><dd>{formatDate(payment.paidAt, language)}</dd></div>
              <div className="bo-summary-row"><dt>{th ? 'อ้างอิง' : 'Reference'}</dt><dd>{payment.reference || '—'}</dd></div>
              <div className="bo-summary-row"><dt>{th ? 'หมายเหตุ' : 'Note'}</dt><dd>{payment.note || '—'}</dd></div>
            </dl>
            {payment.slipPath ? (
              <button type="button" className="secondary-btn" disabled={slipBusy} onClick={() => { void viewSlip(); }}>
                {slipBusy ? <LoaderCircle className="spin" size={16} /> : <ExternalLink size={16} />}
                {th ? 'ดูสลิป' : 'View slip'}
                {payment.slipFileName ? ` · ${payment.slipFileName}` : ''}
              </button>
            ) : (
              <p className="bo-muted">{th ? 'ยังไม่มีสลิปแนบ' : 'No slip attached'}</p>
            )}
          </SectionCard>
        </div>

        <aside className="bo-detail-rail">
          <SummaryCard
            title={th ? 'เอกสารที่เกี่ยวข้อง' : 'Related documents'}
            rows={[
              {
                label: 'BK',
                value: (
                  <button type="button" className="bo-breadcrumb-link mono" onClick={() => onOpenBooking(tracking.id)}>
                    {tracking.bookingNo || tracking.id.slice(0, 8)}
                  </button>
                ),
              },
              ...(linkedInvoice ? [{
                label: 'INV',
                value: (
                  <button type="button" className="bo-breadcrumb-link mono" onClick={() => onOpenInvoice(linkedInvoice.id)}>
                    {linkedInvoice.invoiceNo}
                  </button>
                ),
              }] : []),
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
